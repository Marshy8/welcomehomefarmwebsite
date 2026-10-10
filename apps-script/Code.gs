/**
 * Welcome Home Farm website: the Google Apps Script web app behind the site.
 *
 * This file is the record of what is deployed. The live copy runs inside a
 * Google account, not from this repo: after changing it here, paste it into the
 * Apps Script editor and publish a NEW VERSION of the EXISTING deployment
 * (Deploy > Manage deployments > edit > Version: New version > Deploy).
 * Saving alone does not change what the /exec URL runs.
 *
 * Deployment settings this code assumes:
 *   Execute as:      Me (the account that owns the script)
 *   Who has access:  Anyone (no Google sign-in, because site visitors are anonymous)
 *
 * What is built so far: the contact form (POST). The site-side contract is
 * `sendContactMessage` in src/lib/farmApi.ts.
 *
 * Where the mail goes: to the Google account the script runs as. No address is
 * written in this file, because the repo is public. To send somewhere else, add
 * a Script Property named CONTACT_RECIPIENT (Project Settings > Script
 * Properties). Nothing in a request can change the recipient.
 *
 * Scopes are listed explicitly in appsscript.json, so a new Google service
 * (Calendar, Sheets, Forms) needs its scope added there before it will run.
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

/* ------------------------------------------------------------------ GET --
 *
 * doGet(e) will go here: the farm's live status (CSA seasons with capacity and
 * signups taken, upcoming events from the public calendar) as JSON matching
 * `FarmStatus` in src/types.ts.
 *
 * Do not add a partial or placeholder doGet. The site casts whatever JSON a GET
 * returns straight to FarmStatus, so a 200 with the wrong shape breaks the
 * engage and calendar sections. With no doGet the request fails and those
 * sections show their fallback text and link.
 */

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

/* --------------------------------------------------------------- Set-up -- */

/**
 * Run this once from the editor (pick `sendTestEmail` in the toolbar, then Run).
 * It makes Google ask for the two permissions the script needs, then sends a
 * test email to the same recipient the contact form will use, so the mail can
 * be checked before anything is deployed. It does not count against the cap.
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
