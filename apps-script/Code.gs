/**
 * Welcome Home Farm website: the Google Apps Script web app behind the site.
 *
 * This file is the record of what is deployed. The live copy runs inside a
 * Google account, not from this repo: after changing it here, paste it into the
 * Apps Script editor and publish a NEW VERSION of the EXISTING deployment
 * (Deploy > Manage deployments > edit > Version: New version > Deploy).
 * Saving alone does not change what the /exec URL runs. Triggers are different:
 * they always run the code as last saved.
 *
 * Deployment settings this code assumes:
 *   Execute as:      Me (the account that owns the script)
 *   Who has access:  Anyone (no Google sign-in, because site visitors are anonymous)
 *
 * What is built so far:
 *   GET   the farm's live status. `FarmStatus` in src/types.ts is the contract.
 *         The CSA half is real; the events list is always empty because the
 *         public calendar is not connected yet.
 *   POST  the contact form. `sendContactMessage` in src/lib/farmApi.ts is the
 *         contract.
 *   CSA   keeps the sign-up form's season choices in step with the seasons tab
 *         and the signups so far, so a full season cannot be picked.
 *
 * Nothing from the Google account is written in this file, because the repo is
 * public. The CSA's form and spreadsheet are found through Script Properties
 * that `setUpMockCsa` writes (Project Settings > Script Properties, all named
 * CSA_...). Contact mail goes to the account the script runs as; to send it
 * somewhere else, add a Script Property named CONTACT_RECIPIENT. Nothing in a
 * request can change the recipient.
 *
 * Privacy: the only thing that leaves the response sheet is a count per season.
 * The script reads one column of it, the season answers, and never the columns
 * holding a name or contact details. Nothing a signer typed is returned or
 * logged.
 *
 * Scopes are listed explicitly in appsscript.json, so a new Google service
 * (Calendar, for the events) needs its scope added there before it will run.
 * Forms and Sheets need the full `forms` and `spreadsheets` scopes because this
 * is a standalone script; the narrower `.currentonly` ones only work for a
 * script attached to a single file.
 */

const SITE_NAME = 'Welcome Home Farm website';
const TIME_ZONE = 'America/Chicago';

/** Script Property that overrides the recipient. Optional. */
const PROP_RECIPIENT = 'CONTACT_RECIPIENT';
/** Script Property the script writes to count the day's messages. */
const PROP_COUNTER = 'CONTACT_COUNTER';

/** Longest accepted values, in characters. Anything longer is rejected, not cut. */
const LIMITS = { body: 10000, name: 100, contact: 200, message: 5000 };

/**
 * Most contact emails sent per calendar day (America/Chicago).
 *
 * Apps Script allows a free Gmail account 100 email recipients a day and a
 * Workspace account 1,500, shared by every script the account runs. This
 * endpoint is public, so without a cap one bot could spend the whole allowance
 * and flood the inbox. Google's allowance resets on a rolling 24 hours, not at
 * midnight, so the worst case across a midnight is two days' worth: 80, still
 * under the free limit. Apps Script does not reveal a caller's IP address, so
 * the cap is for everyone together and cannot be per visitor.
 */
const DAILY_CAP = 40;

/** Deliberately strict. An unusual address still reaches the owner in the body. */
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

/**
 * Script Properties that say where the CSA lives. `setUpMockCsa` writes them and
 * `tearDownCsa` deletes them. They hold Google file IDs, which is why they are
 * kept in the account and not in this file.
 */
const CSA_PROPS = {
  form: 'CSA_FORM_ID',
  /** The "which seasons" question, by its ID, so the owner can reword it. */
  question: 'CSA_SEASON_QUESTION_ID',
  /** That question's current wording, which heads its column in the responses tab. */
  header: 'CSA_SEASON_HEADER',
  sheet: 'CSA_SHEET_ID',
  /** The two tabs, by ID and not by name, so the owner can rename them. */
  seasonsTab: 'CSA_SEASONS_TAB_ID',
  responsesTab: 'CSA_RESPONSES_TAB_ID',
  /** "true" while the form is closed because this script closed it. */
  closed: 'CSA_CLOSED_BY_SCRIPT',
};

/** The properties that must all be present for the CSA to count as set up. */
const CSA_REQUIRED = ['form', 'question', 'header', 'sheet', 'seasonsTab', 'responsesTab'];

/** The function both CSA triggers call. Triggers find it by name. */
const CSA_TRIGGER_HANDLER = 'syncCsa';

/**
 * How Google Sheets joins the boxes one person ticked into a single cell. This
 * is Google's format, not a choice made here.
 */
const CHOICE_JOIN = ', ';

/**
 * How long a built status is reused, in seconds. Every page view is a GET, and
 * building the answer means opening the spreadsheet, so without this a burst of
 * visitors would each wait on Sheets. `syncCsa` throws the stored copy away
 * whenever a signup arrives or the spreadsheet changes, so this is only the
 * longest the site can lag if a trigger fails to run.
 */
const STATUS_CACHE_SECONDS = 60;
const STATUS_CACHE_KEY = 'farm-status-v1';

/** What a GET answers when the status cannot be built. Deliberately not JSON. */
const STATUS_UNAVAILABLE = 'The farm status is unavailable. The reason is in the script log.';

/**
 * Everything `setUpMockCsa` creates. All of it is stand-in content, marked as a
 * test wherever a visitor could see it. None of it is real farm information:
 * the owner replaces the wording in Google Forms and the seasons in the
 * spreadsheet, and the script does not write over either afterwards.
 */
const MOCK_CSA = {
  formTitle: 'TEST FORM: CSA sign-up (not a real sign-up)',
  formDescription:
    'This is a test form for the ' +
    SITE_NAME +
    '. Nothing sent through it is a real sign-up and nothing is reserved.',
  confirmation: 'Test response recorded. This is a test form, so nothing has been reserved.',
  closedMessage: 'Every season is full or closed right now. Please check back later.',
  nameQuestion: 'Your name',
  contactQuestion: 'Best way to reach you (email or phone)',
  seasonQuestion: 'Which seasons would you like to join?',
  sheetTitle: 'TEST: CSA sign-ups (not real)',
  seasonsTabName: 'Seasons',
  seasonsHeader: ['Season name', 'Places', 'Open for sign-up'],
  seasonsHint:
    'One row per season. Keep columns A to C in this order. The sign-up form and the website follow a change here within about a minute.',
  /** Small on purpose, so filling one by hand takes a minute. The third starts closed. */
  seasons: [
    ['Sample season 1', 2, true],
    ['Sample season 2', 3, true],
    ['Sample season 3', 2, false],
  ],
  /** Rows given a ready-made tick box in the "open" column. */
  seasonRows: 30,
};

/* ------------------------------------------------------------------ GET -- */

/**
 * Entry point for every GET to the web app: the farm's live status as JSON,
 * matching `FarmStatus` in src/types.ts.
 *
 * The site casts whatever JSON a GET returns straight to FarmStatus, so a 200
 * with the wrong shape breaks the engage and calendar sections. This therefore
 * answers with the whole, correct shape or with no JSON at all. When the status
 * cannot be built (the CSA is not set up, a tab was deleted, Sheets is having a
 * bad minute) the answer is one line of plain text. The site fails to parse it
 * and shows its fallback text and link, exactly as it does when the request
 * itself fails.
 *
 * An empty season list would be valid JSON and would be wrong: the site would
 * announce "All seasons full". An uncaught error would be wrong too: Google
 * would answer with an HTML error page, which the site's cross-origin fetch
 * cannot read. So nothing may escape from here.
 */
function doGet() {
  let body = null;
  try {
    body = farmStatusJson_();
  } catch (err) {
    console.error('doGet failed: ' + (err && err.message ? err.message : err));
  }
  if (body === null) {
    return ContentService.createTextOutput(STATUS_UNAVAILABLE).setMimeType(
      ContentService.MimeType.TEXT,
    );
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

/** The status as a JSON string, from the cache when a recent copy exists. */
function farmStatusJson_() {
  const cached = cacheGet_(STATUS_CACHE_KEY);
  if (cached) return cached;

  const status = {
    updatedAt: new Date().toISOString(),
    csa: { seasons: readCsaSeasons_(getCsaConfig_()) },
    // The public events calendar is not connected yet. The contract has no way
    // to say "unknown", so the site shows its "nothing on the calendar" line.
    events: [],
  };
  const body = JSON.stringify(status);
  cachePut_(STATUS_CACHE_KEY, body, STATUS_CACHE_SECONDS);
  return body;
}

/**
 * The cache only saves time, so a failure in it must never fail the request.
 */
function cacheGet_(key) {
  try {
    return CacheService.getScriptCache().get(key);
  } catch (err) {
    return null;
  }
}

function cachePut_(key, value, seconds) {
  try {
    CacheService.getScriptCache().put(key, value, seconds);
  } catch (err) {
    console.warn('Could not store the status in the cache');
  }
}

function cacheRemove_(key) {
  try {
    CacheService.getScriptCache().remove(key);
  } catch (err) {
    console.warn('Could not clear the cached status');
  }
}

/* ----------------------------------------------------------------- POST -- */

/**
 * Entry point for every POST to the web app.
 *
 * Always answers JSON, `{ "ok": true }` or `{ "ok": false }`. Apps Script
 * cannot set an HTTP status, so that body is the only signal the site gets.
 * Nothing may escape as an uncaught error: Google would answer with an HTML
 * error page, which the site's cross-origin fetch cannot read.
 */
function doPost(e) {
  let ok = false;
  try {
    ok = handlePost_(e);
  } catch (err) {
    console.error('doPost failed: ' + (err && err.message ? err.message : err));
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: ok })).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** Returns true when the request was accepted. */
function handlePost_(e) {
  // The site sends JSON as a plain string (text/plain) to avoid a CORS
  // preflight, which Apps Script cannot answer. Parse the raw body.
  const raw = e && e.postData ? e.postData.contents : null;
  if (typeof raw !== 'string' || raw === '') return reject_('no body');
  if (raw.length > LIMITS.body) return reject_('body too long');

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return reject_('body is not JSON');
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return reject_('body is not an object');
  }

  switch (data.type) {
    case 'contact':
      return handleContact_(data);
    default:
      return reject_('unknown type');
  }
}

function handleContact_(data) {
  // Honeypot: the site hides this field from people, so a value means a bot.
  // Report success so the bot learns nothing, and send nothing.
  if (data.website != null && String(data.website).trim() !== '') {
    console.warn('Contact dropped: honeypot filled');
    return true;
  }

  if (
    typeof data.name !== 'string' ||
    typeof data.contact !== 'string' ||
    typeof data.message !== 'string'
  ) {
    return reject_('a field is missing or is not text');
  }

  const name = oneLine_(data.name);
  const contact = oneLine_(data.contact);
  const message = multiLine_(data.message);

  if (!name || !contact || !message) return reject_('a required field is empty');
  if (
    name.length > LIMITS.name ||
    contact.length > LIMITS.contact ||
    message.length > LIMITS.message
  ) {
    return reject_('a field is too long');
  }

  const recipient = getRecipient_();
  if (!takeDailySlot_()) return reject_('daily cap reached or counter busy');

  const options = { name: SITE_NAME };
  // When the visitor left an email address, the owner can just hit reply.
  if (EMAIL_PATTERN.test(contact)) options.replyTo = contact;

  MailApp.sendEmail(
    recipient,
    'Website message from ' + name,
    emailBody_(name, contact, message),
    options,
  );
  return true;
}

/**
 * The only place a recipient is chosen. It reads the script's own settings and
 * the account the script runs as, never the request.
 */
function getRecipient_() {
  const override = (
    PropertiesService.getScriptProperties().getProperty(PROP_RECIPIENT) || ''
  ).trim();
  if (override) {
    if (!EMAIL_PATTERN.test(override)) {
      throw new Error('Script Property ' + PROP_RECIPIENT + ' is not an email address');
    }
    return override;
  }
  const owner = Session.getEffectiveUser().getEmail();
  if (!owner) throw new Error('Could not read the email of the account running the script');
  return owner;
}

/**
 * Counts one message against today's cap. Returns false when the cap is spent.
 *
 * The count is a Script Property, not CacheService, because a cache entry lasts
 * six hours at most and can be evicted early. The lock stops two requests that
 * arrive together from both reading the same count.
 */
function takeDailySlot_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return false;
  try {
    const props = PropertiesService.getScriptProperties();
    const today = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');
    // Stored as "2026-10-10:7". A new day starts the count again.
    const stored = (props.getProperty(PROP_COUNTER) || '').split(':');
    const used = stored[0] === today ? Number(stored[1]) || 0 : 0;
    if (used >= DAILY_CAP) return false;
    props.setProperty(PROP_COUNTER, today + ':' + (used + 1));
    return true;
  } finally {
    lock.releaseLock();
  }
}

/** Plain text only, so nothing a visitor types is ever treated as HTML. */
function emailBody_(name, contact, message) {
  const sent = Utilities.formatDate(new Date(), TIME_ZONE, "EEE, MMM d, yyyy 'at' h:mm a");
  const replyNote = EMAIL_PATTERN.test(contact)
    ? 'Reply to this email to answer ' + name + ' directly.'
    : 'The sender did not leave an email address, so replying to this email will not reach them. Use the contact details above.';
  return [
    'A new message from the contact form on the ' + SITE_NAME + '.',
    '',
    'Name: ' + name,
    'Email or phone: ' + contact,
    'Sent: ' + sent + ' Central time',
    '',
    'Message:',
    message,
    '',
    '--',
    replyNote,
  ].join('\n');
}

/** For one-line fields: no line breaks or control characters, so nothing can break out of the subject line. */
function oneLine_(value) {
  return value.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').trim();
}

/** For the message: keep line breaks and tabs, drop other control characters. */
function multiLine_(value) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .trim();
}

/**
 * Logs why a request was refused and returns false. The reason goes to the
 * script's own log (Executions, in the Apps Script editor) and never to the
 * caller. Nothing a visitor typed is logged.
 */
function reject_(reason) {
  console.warn('Request rejected: ' + reason);
  return false;
}

/* ------------------------------------------------------------------ CSA --
 *
 * One spreadsheet holds everything. Its seasons tab is the owner's control
 * panel: one row per season with a name, a number of places and a tick for
 * whether it is open. Its responses tab is where Google Forms writes each
 * signup.
 *
 * Signups are counted from the responses tab, not from the form's own store of
 * responses. That is what lets the owner free a place by deleting a row when
 * someone drops out, from the Sheets app on a phone. The cost is that a signup
 * is matched to a season by the season's name, so renaming a season that
 * already has signups orphans them (see `countSignups_`).
 */

/**
 * Runs when a signup lands in the responses tab and whenever the spreadsheet
 * changes (a new season row, a different number of places, a tick, a deleted
 * signup). It recounts, then makes the form offer only the seasons that are
 * open and have a place left. It can also be run by hand from the editor.
 *
 * Triggers hand this function an event that includes the submitted answers. It
 * takes no argument so that it cannot read them.
 *
 * What this cannot do: Google Forms has no idea of capacity and accepts every
 * submission it is sent. This runs a few seconds after a signup, and a visitor
 * who already had the form open still sees the choices it had when it loaded.
 * So two people can both take the last place, and the season ends up one over.
 * The site then shows it as full and the extra row is there for the owner to
 * see. Closing that gap needs sign-ups to go through something that can refuse
 * them, which a Google Form cannot.
 */
function syncCsa() {
  // The user lock, not the script lock the contact counter holds, so a contact
  // message never queues behind a sync. Triggers and the web app all run as the
  // owner, so one user's lock still makes syncs take turns. Without it two
  // signups arriving together could each count, and the slower one could put
  // back a season the faster one had just removed.
  const lock = LockService.getUserLock();
  lock.waitLock(30000);
  try {
    syncCsaForm_();
  } finally {
    lock.releaseLock();
  }
}

/** The work of `syncCsa`. The caller holds the lock. */
function syncCsaForm_() {
  const props = PropertiesService.getScriptProperties();
  const config = getCsaConfig_();
  const form = FormApp.openById(config.form);

  const item = form.getItemById(Number(config.question));
  if (!item || item.getType() !== FormApp.ItemType.CHECKBOX) {
    throw new Error('The season question is gone from the form or is no longer a checkbox question');
  }
  // The owner may have reworded the question. Its column in the responses tab
  // is headed with the wording, so keep the stored copy current for doGet,
  // which does not open the form.
  const header = String(item.getTitle()).trim();
  if (header !== config.header) {
    props.setProperty(CSA_PROPS.header, header);
    config.header = header;
  }

  const seasons = readCsaSeasons_(config);
  const offered = seasons.filter(isOffered_).map((season) => season.name);

  if (offered.length > 0) {
    const question = item.asCheckboxItem();
    const listed = question.getChoices().map((choice) => choice.getValue());
    if (listed.join('\n') !== offered.join('\n')) question.setChoiceValues(offered);
    reopenCsaForm_(form, props);
  } else {
    // A checkbox question cannot have zero choices, so with nothing to offer
    // the whole form closes and the stale choices are left where they are.
    closeCsaForm_(form, props);
  }

  cacheRemove_(STATUS_CACHE_KEY);
  console.log('CSA synced: ' + seasons.length + ' seasons, ' + offered.length + ' offered on the form');
}

function isOffered_(season) {
  return season.open && season.taken < season.capacity;
}

function closeCsaForm_(form, props) {
  // Already closed, by the owner or by an earlier run. The flag is right either
  // way: setting it here would make the script reopen a form the owner shut on
  // purpose.
  if (!form.isAcceptingResponses()) return;
  form.setAcceptingResponses(false);
  props.setProperty(CSA_PROPS.closed, 'true');
  console.log('CSA form closed: no season is open with a place left');
}

/** Reopens the form only if this script was what closed it. */
function reopenCsaForm_(form, props) {
  if (props.getProperty(CSA_PROPS.closed) !== 'true') return;
  props.deleteProperty(CSA_PROPS.closed);
  if (form.isAcceptingResponses()) return;
  // Turning responses on throws for an unpublished form. Unpublishing is the
  // owner's doing, so leave it be.
  if (form.supportsAdvancedResponderPermissions() && !form.isPublished()) {
    console.warn('CSA form left closed: it has been unpublished');
    return;
  }
  form.setAcceptingResponses(true);
  console.log('CSA form reopened: a season has a place again');
}

/** Reads the CSA's Script Properties. Throws when any is missing. */
function getCsaConfig_() {
  const stored = PropertiesService.getScriptProperties().getProperties();
  const config = {};
  CSA_REQUIRED.forEach((key) => {
    const value = stored[CSA_PROPS[key]];
    if (!value) throw new Error('The CSA is not set up. Run setUpMockCsa from the editor.');
    config[key] = value;
  });
  return config;
}

/**
 * The seasons as the site wants them: `CsaSeason[]` in src/types.ts. Both
 * doGet and the sync use this, so the form and the site can never disagree
 * about which seasons are full.
 */
function readCsaSeasons_(config) {
  const book = SpreadsheetApp.openById(config.sheet);
  const parsed = parseSeasons_(readSeasonRows_(tabById_(book, config.seasonsTab)));
  if (parsed.skipped > 0) {
    console.warn(parsed.skipped + ' row(s) in the seasons tab were left out: no whole number of places, or a repeated name');
  }

  const names = parsed.seasons.map((season) => season.name);
  const answers = readSeasonAnswers_(tabById_(book, config.responsesTab), config.header);
  const counted = countSignups_(answers, names);
  if (counted.unmatched > 0) {
    console.warn(counted.unmatched + ' season choice(s) in the responses tab match no row in the seasons tab and were not counted');
  }

  return parsed.seasons.map((season) => ({
    id: season.id,
    name: season.name,
    capacity: season.capacity,
    taken: counted.taken.get(season.name),
    open: season.open,
  }));
}

function tabById_(book, id) {
  const tab = book.getSheets().find((sheet) => String(sheet.getSheetId()) === String(id));
  if (!tab) throw new Error('A tab the CSA needs has been deleted from the spreadsheet');
  return tab;
}

/**
 * Columns A to C of the seasons tab, below the header row. The name is read as
 * displayed, so that a name Sheets has decided is a date or a number comes back
 * as the text the owner sees.
 */
function readSeasonRows_(tab) {
  const last = tab.getLastRow();
  if (last < 2) return [];
  const range = tab.getRange(2, 1, last - 1, 3);
  const shown = range.getDisplayValues();
  const raw = range.getValues();
  return shown.map((row, i) => ({ name: row[0], capacity: raw[i][1], open: raw[i][2] }));
}

/**
 * The season answers, one string per signup. This is the only part of the
 * responses tab the script reads besides the header row: the columns holding a
 * name and contact details are never fetched.
 */
function readSeasonAnswers_(tab, header) {
  const last = tab.getLastRow();
  if (last < 2) return [];
  const headers = tab.getRange(1, 1, 1, tab.getLastColumn()).getDisplayValues()[0];
  const column = headers.findIndex((cell) => cell.trim() === header);
  // Counting nothing here would report every season as empty and oversell
  // them all. Failing sends the site to its fallback instead.
  if (column === -1) {
    throw new Error('No column in the responses tab is headed with the season question');
  }
  return tab
    .getRange(2, column + 1, last - 1, 1)
    .getDisplayValues()
    .map((row) => row[0]);
}

/**
 * Turns the rows of the seasons tab into seasons. A row counts once it has a
 * name and a whole number of places, 1 or more, so a row the owner is halfway
 * through typing is simply not on the site or the form yet. A second row with
 * a name already used is left out, because signups are matched by name.
 *
 * The site needs an `id` for each season and the owner should not have to make
 * one up, so it is built from the name.
 */
function parseSeasons_(rows) {
  const seasons = [];
  const names = new Set();
  const ids = new Set();
  let skipped = 0;
  rows.forEach((row) => {
    const name = String(row.name == null ? '' : row.name).trim();
    if (!name) return;
    const capacity = toCapacity_(row.capacity);
    if (capacity === null || names.has(name)) {
      skipped += 1;
      return;
    }
    names.add(name);
    seasons.push({ id: uniqueId_(slug_(name), ids), name: name, capacity: capacity, open: toOpen_(row.open) });
  });
  return { seasons: seasons, skipped: skipped };
}

/** A whole number of places, 1 or more, or null. Zero would make the site divide by zero. */
function toCapacity_(value) {
  const number =
    typeof value === 'string' && /^\s*\d+\s*$/.test(value) ? Number(value) : value;
  return typeof number === 'number' && Number.isSafeInteger(number) && number >= 1 ? number : null;
}

/** A ticked box, or a typed yes. Anything else, a blank included, means closed. */
function toOpen_(value) {
  return value === true || /^(true|yes|y|open)$/i.test(String(value).trim());
}

function slug_(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'season'
  );
}

function uniqueId_(base, used) {
  let id = base;
  for (let n = 2; used.has(id); n += 1) id = base + '-' + n;
  used.add(id);
  return id;
}

/**
 * Counts signups per season from the season column of the responses tab.
 *
 * `taken` is a Map from every season name to its count. `unmatched` is how many
 * choices matched no season: signups for a season that has since been renamed
 * or removed. Those are not counted towards anything, so a renamed season looks
 * empty again. To rename a season that has signups, change the name in the
 * responses tab too (Edit > Find and replace).
 */
function countSignups_(cells, names) {
  const longestFirst = names.slice().sort((a, b) => b.length - a.length);
  const taken = new Map(names.map((name) => [name, 0]));
  let unmatched = 0;
  cells.forEach((cell) => {
    const picked = splitChoices_(cell, longestFirst);
    unmatched += picked.unknown;
    picked.names.forEach((name) => taken.set(name, taken.get(name) + 1));
  });
  return { taken: taken, unmatched: unmatched };
}

/**
 * Splits one cell into the seasons that were ticked.
 *
 * Sheets joins the ticked choices with ", ", so splitting on that would cut a
 * season named "Season 1, early" in two and count neither half. Instead this
 * walks the cell and, at each point where a choice can start, looks for a known
 * season name that runs to the next ", " or to the end. Longest first, so that
 * "Season 1, early" wins over a season named just "Season 1". Text that is no
 * known season is skipped up to the next ", ".
 */
function splitChoices_(cell, longestFirst) {
  const text = String(cell == null ? '' : cell).trim();
  const names = [];
  let unknown = 0;
  let at = 0;
  while (at < text.length) {
    const hit = longestFirst.find((name) => {
      const end = at + name.length;
      return text.startsWith(name, at) && (end === text.length || text.startsWith(CHOICE_JOIN, end));
    });
    if (hit !== undefined) {
      names.push(hit);
      at += hit.length + CHOICE_JOIN.length;
      continue;
    }
    unknown += 1;
    const next = text.indexOf(CHOICE_JOIN, at);
    if (next === -1) break;
    at = next + CHOICE_JOIN.length;
  }
  return { names: names, unknown: unknown };
}

/* --------------------------------------------------------------- Set-up -- */

/**
 * Run this once from the editor (pick `sendTestEmail` in the toolbar, then Run).
 * It makes Google ask for the permissions the script needs, then sends a test
 * email to the same recipient the contact form will use, so the mail can be
 * checked before anything is deployed. It does not count against the cap.
 */
function sendTestEmail() {
  const recipient = getRecipient_();
  MailApp.sendEmail(
    recipient,
    'Test from the ' + SITE_NAME + ' script',
    emailBody_('Script editor test', 'no reply address', 'If you can read this, the script can send mail.'),
    { name: SITE_NAME },
  );
  console.log('Test email sent to ' + recipient);
  console.log('Emails this account can still send today: ' + MailApp.getRemainingDailyQuota());
}

/**
 * Run this once from the editor to stand up a throwaway CSA: a test sign-up
 * form, a spreadsheet with a seasons tab and a responses tab, and the two
 * triggers that keep the form in step. When it finishes, the links to all of it
 * are in the execution log below the editor.
 *
 * It is safe to run again. Each step looks for what an earlier run made before
 * making anything, so a second run repairs a half-finished first one and
 * otherwise only prints the links again. To start over with new files, run
 * `tearDownCsa` first.
 *
 * Nothing here is specific to a test except the wording in MOCK_CSA. The owner
 * can turn this form into the real one by rewording it in Google Forms and
 * replacing the rows in the seasons tab.
 */
function setUpMockCsa() {
  // Google's consent screen lets each permission be unticked. A trigger that
  // later needs a missing one fails with nobody watching, so ask for the rest now.
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);

  const lock = LockService.getUserLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    const form = ensureCsaForm_(props);
    const sheetId = ensureCsaSheet_(props);
    ensureCsaResponsesTab_(props, form, sheetId);
    ensureCsaTriggers_(sheetId);
    syncCsaForm_();

    console.log('CSA set-up finished. Sample seasons only: nothing here is real farm information.');
    console.log('Sign-up form, the link for visitors (OFFERING_URLS.csa): ' + form.getPublishedUrl());
    console.log('Sign-up form, to edit it: ' + form.getEditUrl());
    console.log('Spreadsheet, with the seasons tab and the responses: ' + SpreadsheetApp.openById(sheetId).getUrl());
    console.log(
      'Form is accepting responses: ' +
        form.isAcceptingResponses() +
        '. Open the visitor link in a private window to check that it does not ask for a sign-in.',
    );
  } finally {
    lock.releaseLock();
  }
}

/**
 * Returns the CSA form, creating it on the first run. The form's ID and the
 * season question's ID are stored together once the form is complete, so a run
 * that fails partway leaves nothing half-recorded.
 */
function ensureCsaForm_(props) {
  const formId = props.getProperty(CSA_PROPS.form);
  if (formId) {
    try {
      return FormApp.openById(formId);
    } catch (err) {
      throw new Error('The form from an earlier set-up cannot be opened. Run tearDownCsa, then setUpMockCsa again.');
    }
  }

  const form = FormApp.create(MOCK_CSA.formTitle);
  console.log('Created the form: ' + form.getEditUrl());
  form
    .setDescription(MOCK_CSA.formDescription)
    .setConfirmationMessage(MOCK_CSA.confirmation)
    // Set once, here. The owner can reword it in Google Forms and the script
    // will not write over it.
    .setCustomClosedFormMessage(MOCK_CSA.closedMessage)
    // Only what the farm needs: a name, a way to reach the person, the seasons.
    .setCollectEmail(false);

  form.addTextItem().setTitle(MOCK_CSA.nameQuestion).setRequired(true);
  form.addTextItem().setTitle(MOCK_CSA.contactQuestion).setRequired(true);
  // The choices are filled in by the first sync, from the seasons tab.
  const question = form.addCheckboxItem().setTitle(MOCK_CSA.seasonQuestion).setRequired(true);

  // A form made by a script has been published from the start, but Google has
  // been changing that default for forms made other ways. Check, do not assume.
  if (form.supportsAdvancedResponderPermissions() && !form.isPublished()) form.setPublished(true);

  const stored = {};
  stored[CSA_PROPS.form] = form.getId();
  stored[CSA_PROPS.question] = String(question.getId());
  stored[CSA_PROPS.header] = MOCK_CSA.seasonQuestion;
  props.setProperties(stored);
  return form;
}

/** Returns the spreadsheet's ID, creating it and its seasons tab on the first run. */
function ensureCsaSheet_(props) {
  const sheetId = props.getProperty(CSA_PROPS.sheet);
  if (sheetId) return sheetId;

  const book = SpreadsheetApp.create(MOCK_CSA.sheetTitle);
  console.log('Created the spreadsheet: ' + book.getUrl());
  const tab = book.getSheets()[0].setName(MOCK_CSA.seasonsTabName);
  const rows = MOCK_CSA.seasonRows;

  tab.getRange(1, 1, 1, 3).setValues([MOCK_CSA.seasonsHeader]).setFontWeight('bold');
  tab.getRange(1, 5).setValue(MOCK_CSA.seasonsHint);
  // Plain text, so Sheets does not turn a season name into a date or a number.
  tab.getRange(2, 1, rows, 1).setNumberFormat('@');
  // Tick boxes ready for rows the owner has not added yet. An unticked or
  // blank cell means closed, so a new season is not on sale until it is ticked.
  tab.getRange(2, 3, rows, 1).insertCheckboxes();
  tab.getRange(2, 1, MOCK_CSA.seasons.length, 3).setValues(MOCK_CSA.seasons);
  tab.setFrozenRows(1);
  tab.setColumnWidth(1, 220);
  SpreadsheetApp.flush();

  const stored = {};
  stored[CSA_PROPS.sheet] = book.getId();
  stored[CSA_PROPS.seasonsTab] = String(tab.getSheetId());
  props.setProperties(stored);
  return book.getId();
}

/**
 * Points the form's responses at the spreadsheet and records which tab Google
 * made for them. The stored tab ID doubles as the mark that this step is done:
 * linking a form twice would add a second responses tab.
 */
function ensureCsaResponsesTab_(props, form, sheetId) {
  if (props.getProperty(CSA_PROPS.responsesTab)) return;

  let linked = false;
  try {
    linked = form.getDestinationId() === sheetId;
  } catch (err) {
    // No destination yet.
  }
  if (!linked) form.setDestination(FormApp.DestinationType.SPREADSHEET, sheetId);

  // Google adds the tab a moment after the link is made. A responses tab is the
  // one that knows which form feeds it, whatever language its name is in.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const fed = SpreadsheetApp.openById(sheetId)
      .getSheets()
      .filter((sheet) => sheet.getFormUrl() !== null);
    if (fed.length > 1) throw new Error('More than one form writes to this spreadsheet');
    if (fed.length === 1) {
      props.setProperty(CSA_PROPS.responsesTab, String(fed[0].getSheetId()));
      return;
    }
    Utilities.sleep(2000);
  }
  throw new Error('Google has not added the responses tab yet. Wait a minute and run setUpMockCsa again.');
}

/**
 * Makes sure the spreadsheet has exactly one of each trigger, both calling
 * `syncCsa`, and removes any left pointing at a spreadsheet from an earlier
 * set-up. Both are on the spreadsheet and not the form: the count is taken from
 * the sheet, and only the spreadsheet's submit trigger is tied to the new row
 * being there. Nothing promises that the form's own trigger waits for it.
 *
 * "Change" covers what "edit" does not: a deleted signup row is a change.
 */
function ensureCsaTriggers_(sheetId) {
  const wanted = [ScriptApp.EventType.ON_FORM_SUBMIT, ScriptApp.EventType.ON_CHANGE];
  const kept = [];
  csaTriggers_().forEach((trigger) => {
    const type = trigger.getEventType();
    const keep =
      trigger.getTriggerSourceId() === sheetId &&
      wanted.indexOf(type) !== -1 &&
      kept.indexOf(type) === -1;
    if (keep) kept.push(type);
    else ScriptApp.deleteTrigger(trigger);
  });
  wanted.forEach((type) => {
    if (kept.indexOf(type) !== -1) return;
    const builder = ScriptApp.newTrigger(CSA_TRIGGER_HANDLER).forSpreadsheet(sheetId);
    (type === ScriptApp.EventType.ON_CHANGE ? builder.onChange() : builder.onFormSubmit()).create();
  });
}

/** This account's triggers in this project that call `syncCsa`. */
function csaTriggers_() {
  return ScriptApp.getProjectTriggers().filter(
    (trigger) => trigger.getHandlerFunction() === CSA_TRIGGER_HANDLER,
  );
}

/**
 * Disconnects the CSA: removes the triggers, stops the form taking responses,
 * and forgets where the form and spreadsheet are. After this a GET answers
 * "unavailable" until `setUpMockCsa` is run again, which makes new files.
 *
 * It does not delete the form or the spreadsheet, because that would need
 * permission over the whole of the account's Drive. Their links are printed so
 * they can be put in the bin by hand.
 */
function tearDownCsa() {
  const lock = LockService.getUserLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    csaTriggers_().forEach((trigger) => ScriptApp.deleteTrigger(trigger));

    const formId = props.getProperty(CSA_PROPS.form);
    if (formId) {
      try {
        const form = FormApp.openById(formId);
        // Nothing counts signups from here on, so do not leave it taking them.
        if (form.isAcceptingResponses()) form.setAcceptingResponses(false);
        console.log('Form closed. Delete it here if it is no longer wanted: ' + form.getEditUrl());
      } catch (err) {
        console.warn('Could not open the form to close it. It may already be deleted.');
      }
    }
    const sheetId = props.getProperty(CSA_PROPS.sheet);
    if (sheetId) {
      console.log(
        'Spreadsheet, with any test signups in it. Delete it here if it is no longer wanted: https://docs.google.com/spreadsheets/d/' +
          sheetId,
      );
    }

    Object.keys(CSA_PROPS).forEach((key) => props.deleteProperty(CSA_PROPS[key]));
    cacheRemove_(STATUS_CACHE_KEY);
    console.log('CSA disconnected.');
  } finally {
    lock.releaseLock();
  }
}
