/**
 * Welcome Home Farm website: the Google Apps Script web app behind the site.
 *
 * This file is the record of what is deployed. The live copy runs inside a
 * Google account, not from this repo: after changing it here, paste it into the
 * Apps Script editor and publish a NEW VERSION of the EXISTING deployment
 * (Deploy > Manage deployments > edit > Version: New version > Deploy).
 * Saving alone does not change what the /exec URL runs.
 *
 * What it does:
 *   GET   the farm's live status: the CSA slots and the upcoming public
 *         events. `FarmStatus` in src/types.ts is the contract.
 *   POST  the contact form. `sendContactMessage` in src/lib/farmApi.ts is the
 *         contract.
 *
 * It only reads the CSA spreadsheets and the public events calendar. It never
 * changes a spreadsheet, a form or a calendar, and it has no triggers. The
 * mailing list needs no code at all.
 *
 * Set-up, done once by hand in the farm's Google account:
 *   1. In each CSA spreadsheet, add a second tab and type the season's number
 *      of slots in cell A1.
 *   2. Make a script project at script.google.com and paste in this file and
 *      appsscript.json.
 *   3. Project Settings > Script Properties: add CSA_SPRING_SHEET and
 *      CSA_SUMMER_SHEET, each holding the link to that season's spreadsheet.
 *      For the calendar, add EVENTS_CALENDAR_ID, holding the Calendar ID of
 *      the farm's public events calendar (in Google Calendar: the calendar's
 *      settings > Integrate calendar). Without it the site lists no events.
 *   4. Run `sendTestEmail` from the editor and allow every permission asked for.
 *   5. Deploy > New deployment > Web app, with:
 *        Execute as:      Me (the account that owns the script)
 *        Who has access:  Anyone (no Google sign-in: site visitors are anonymous)
 *      The /exec link it gives is API_URL in src/data/integrations.ts.
 *
 * Nothing from the Google account is written in this file, because the repo is
 * public. Contact mail goes to the account the script runs as; to send it
 * somewhere else, add a Script Property named CONTACT_RECIPIENT. Nothing in a
 * request can change the recipient.
 *
 * Privacy: what leaves a CSA spreadsheet is two numbers, its slots and how
 * many are taken. Nothing a signer typed is returned or logged. What leaves the
 * calendar is each event's title, times and location, and only from the one
 * calendar the owner keeps for public events.
 *
 * Scopes are listed explicitly in appsscript.json, so a new Google service
 * needs its scope added there before it will run.
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
 * The two CSA seasons. `id` is what the site knows the season by, and `sheet`
 * names the Script Property, set by hand, that holds the link to the season's
 * spreadsheet.
 */
const CSA_SEASONS = [
  { id: 'spring', sheet: 'CSA_SPRING_SHEET' },
  { id: 'summer', sheet: 'CSA_SUMMER_SHEET' },
];

/**
 * Script Property, set by hand: the Calendar ID of the public events calendar.
 * Everything on that calendar is shown on the site, so the owner marks an event
 * as public by putting it there and keeps everything else on another calendar.
 */
const PROP_EVENTS_CALENDAR = 'EVENTS_CALENDAR_ID';
/** How far ahead the site looks, and the most events it is sent. */
const EVENTS_DAYS_AHEAD = 90;
const EVENTS_MAX = 20;

/**
 * How long a built status is reused, in seconds. Every page view is a GET, and
 * building the answer means opening the spreadsheets and the calendar, so
 * without this a burst of visitors would each wait on Google. It is also the
 * longest the site can lag behind a spreadsheet or the calendar.
 */
const STATUS_CACHE_SECONDS = 60;
const STATUS_CACHE_KEY = 'farm-status-v5';

/** What a GET answers when the status cannot be built. Deliberately not JSON. */
const STATUS_UNAVAILABLE = 'The farm status is unavailable. The reason is in the script log.';

/* ------------------------------------------------------------------ GET -- */

/**
 * Entry point for every GET to the web app: the farm's live status as JSON,
 * matching `FarmStatus` in src/types.ts.
 *
 * The site casts whatever JSON a GET returns straight to FarmStatus, so a 200
 * with the wrong shape breaks the engage and calendar sections. This therefore
 * answers with the whole, correct shape or with no JSON at all. When the status
 * cannot be built (a spreadsheet link is not set, a slots cell is blank, Sheets
 * is having a bad minute) the answer is one line of plain text. The site fails to
 * parse it and shows its fallback text and link, exactly as it does when the
 * request itself fails.
 *
 * An uncaught error would be wrong: Google would answer with an HTML error
 * page, which the site's cross-origin fetch cannot read. So nothing may escape
 * from here.
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
    csa: { seasons: csaSeasons_() },
    events: farmEvents_(),
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
 * Each season has a sign-up form and a spreadsheet of its own. The script
 * reads two numbers from each spreadsheet:
 *
 *   - Taken: how many rows under the headings have anything in them, in the
 *     tab the form fills. The owner can type a row for someone who phoned and
 *     delete a row when someone drops out.
 *   - Slots: the number in cell A1 of the spreadsheet's other tab.
 *
 * The slots cannot be a number of blank rows left ready in the responses tab.
 * Google Forms inserts a new row for every response and pushes blank rows down
 * instead of filling them, so they would never be used up.
 */

/** The seasons as the site wants them: `CsaSeason[]` in src/types.ts. */
function csaSeasons_() {
  const props = PropertiesService.getScriptProperties();
  return CSA_SEASONS.map((season) => {
    const link = (props.getProperty(season.sheet) || '').trim();
    if (!link) throw new Error('The CSA is not set up: add a Script Property named ' + season.sheet);
    const tabs = SpreadsheetApp.openByUrl(link).getSheets();

    const responses = tabs.find((tab) => tab.getFormUrl() !== null);
    if (!responses) throw new Error('No form fills the ' + season.id + ' spreadsheet');
    const settings = tabs.find((tab) => tab.getFormUrl() === null);
    if (!settings) throw new Error('The ' + season.id + ' spreadsheet has no second tab for the slots');

    const capacity = toCapacity_(settings.getRange(1, 1).getValue());
    // Guessing a number here could oversell the season. Failing sends the site
    // to its fallback instead.
    if (capacity === null) {
      throw new Error('Cell A1 of the second tab in the ' + season.id + ' spreadsheet is not a whole number of slots');
    }
    return { id: season.id, capacity: capacity, taken: countSignups_(responses) };
  });
}

/**
 * How many rows under the headings have anything in them. The cells are read
 * only to see which rows are blank. What is in them goes no further.
 */
function countSignups_(tab) {
  const last = tab.getLastRow();
  if (last < 2) return 0;
  return tab
    .getRange(2, 1, last - 1, tab.getLastColumn())
    .getDisplayValues()
    .filter((row) => row.some((cell) => cell.trim() !== '')).length;
}

/** A whole number of slots, 0 or more, or null. */
function toCapacity_(value) {
  const number =
    typeof value === 'string' && /^\s*\d+\s*$/.test(value) ? Number(value) : value;
  return typeof number === 'number' && Number.isSafeInteger(number) && number >= 0 ? number : null;
}

/* --------------------------------------------------------------- Events -- */

/**
 * The upcoming events on the public events calendar, soonest first, as the
 * site wants them: `FarmEvent[]` in src/types.ts.
 *
 * The script runs as the owner, so the calendar does not have to be shared
 * with anyone for this to read it.
 */
function farmEvents_() {
  const id = (PropertiesService.getScriptProperties().getProperty(PROP_EVENTS_CALENDAR) || '').trim();
  // Not connected yet. The contract has no way to say "unknown", so the site
  // shows its "nothing on the calendar" line.
  if (!id) return [];
  const calendar = CalendarApp.getCalendarById(id);
  // An empty list here would tell visitors nothing is on. Failing sends the
  // site to its fallback instead.
  if (!calendar) throw new Error('No calendar has the ID in ' + PROP_EVENTS_CALENDAR);

  const now = new Date();
  const until = new Date(now.getTime() + EVENTS_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  return calendar
    .getEvents(now, until)
    .sort((a, b) => a.getStartTime().getTime() - b.getStartTime().getTime())
    .slice(0, EVENTS_MAX)
    .map((event) => {
      const allDay = event.isAllDayEvent();
      // An all-day event is a date with no time: YYYY-MM-DD. Google gives it as
      // midnight in the script's time zone, which the manifest sets to TIME_ZONE.
      const start = allDay
        ? Utilities.formatDate(event.getAllDayStartDate(), TIME_ZONE, 'yyyy-MM-dd')
        : event.getStartTime().toISOString();
      const end = allDay
        ? Utilities.formatDate(event.getAllDayEndDate(), TIME_ZONE, 'yyyy-MM-dd')
        : event.getEndTime().toISOString();
      const farmEvent = {
        // Every date of a repeating event has the same ID, so add the start.
        id: event.getId() + '@' + start,
        title: event.getTitle(),
        start: start,
        end: end,
        allDay: allDay,
      };
      const location = event.getLocation().trim();
      if (location) farmEvent.location = location;
      return farmEvent;
    });
}

/* --------------------------------------------------------------- Set-up -- */

/**
 * Run this from the editor (pick `sendTestEmail` in the toolbar, then Run) once
 * at set-up, and again whenever a scope is added to appsscript.json. It makes
 * Google ask for every permission the script needs, then sends a test email to
 * the same recipient the contact form will use, so the mail can be checked
 * before anything is deployed. It does not count against the cap.
 */
function sendTestEmail() {
  // Left to itself the editor only asks for what this function uses, which is
  // mail. This asks for everything in the manifest, the calendar included.
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);

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
