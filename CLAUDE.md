# Welcome Home Farm website

A landing page for Welcome Home Farm in Bentonville, Arkansas. Buck Harris builds and maintains it. Visitors are mostly local people on their phones who want to know what the farm offers, when they can come, how to get there, and how to book or sign up for something.

## Stack

- Vite, React 19, TypeScript, npm.
- Tailwind CSS v4 through the `@tailwindcss/vite` plugin. There is no `tailwind.config.js`; theme values live in CSS.
- No backend that Buck hosts. The site is static files; everything dynamic comes from the farm's Google account (see "Google integration").
- Hosted on GitHub Pages at `https://welcomehomefarm.org/`, deployed by a GitHub Actions workflow on push to `main`. The repo is `Marshy8/welcomehomefarmwebsite`.

## Commands

```
npm run dev       # dev server, http://localhost:5173/
npm run build     # tsc -b && vite build, output in dist/
npm run preview   # serve the production build, http://localhost:4173/
npm run lint      # eslint
```

Run `npm run build` and `npm run lint` before calling a change done. The build type-checks, and a type error fails the deploy.

## Page design

One page that scrolls top to bottom, with a fixed header whose links jump to each section and highlight the one in view.

| Section | `id` | What it holds |
| --- | --- | --- |
| Hero | `home` | Farm name, location, and buttons into the page. |
| About us | `about` | A short blurb about the farm and its creator, beside professional photo or video. |
| How to engage | `engage` | Three cards, each an action a visitor can take. Two open Google forms and one jumps down to the contact section. |
| Calendar | `calendar` | Upcoming events, mirrored live from the farm's Google Calendar. |
| Contact | `contact` | A message box that emails the farm owner, with a field for how to reach the sender. |

The engage cards so far:

- **Join the CSA.** Explains what the CSA is and what a share offers. There are two seasons, spring and summer, and each has its own sign-up form. The card lists both with their remaining slots, read live from that season's spreadsheet, and a sign-up button for each season that is not full.
- **Join the mailing list.** Links to a Google form that collects the visitor's name and email.
- **Schedule a group event.** Describes group events, and its button scrolls to the contact section. A request, not a booking: the visitor messages the owner, who arranges it from there.

The owner settled on these three. U-Pick booking is not on the site.

Scrolling behaviour:

- The document itself scrolls; there is no inner scroll container. This lets phone browsers collapse their toolbars and lets full-page screenshots work. It differs from `../portfolio_v2`, which scrolls inside `<main>`.
- Each section is at least one screen tall (`min-height: 100svh`) and may grow taller. It is `svh` and not `dvh` because the document scrolls: a phone's toolbar hides and shows mid-scroll, `dvh` follows it, and every section and background would resize with a visible jolt.
- With a mouse or trackpad the page snaps gently to the nearest section (`scroll-snap-type: y proximity`). On touch screens there is no snapping, because the cards, calendar and form stack taller than a phone screen.

Still a rough draft, and Buck decides all of it: the palette and fonts are placeholders, section backgrounds are solid colours until the real photos and video go in, and the copy is placeholder text.

## Code layout

- `src/App.tsx` composes the sections in order and loads the live farm data once.
- `src/sections/` has one component per page section.
- `src/components/` has shared pieces: `Nav`, `Section`, `Reveal`, `OfferingCard`.
- `src/data/` has content and configuration as typed constants. Copy that the farm will change belongs here and not inline in JSX.
- `src/lib/` has code that is neither a component nor a hook: the Google endpoint client and date formatting.
- `src/hooks/` has hooks. `src/types.ts` has shared types.

Design tokens are CSS custom properties in `src/index.css`, used in Tailwind as `text-[var(--accent)]`. Add a token before hard-coding a colour. A `tone-*` class (`tone-cream`, `tone-sage`, `tone-forest`) redefines the tokens for everything inside it, which is how sections get different backgrounds while components stay unaware of them. Pass a `tone` to `Section` to use one.

## Google integration

The requirement is set-and-forget: the farm owner sets things up once, then runs the farm from Google Calendar, Forms and Sheets, and the site follows without a redeploy.

The glue is **one Google Apps Script project in the farm's Google account**, published once as a web app. Buck asked for it to stay small and has cut it back more than once: it sends the contact email, and for the status `GET` it reads the CSA numbers and the public events. It must not create or change any spreadsheet, form or calendar, and it has no triggers. Do not add set-up helpers, form syncing, or anything the owner can do by hand in Google's own tools. Apps Script is JavaScript that runs on Google's servers as the account that owns it. The farm is expected to be on a paid Google Workspace plan. The site knows a single URL, `API_URL` in `src/data/integrations.ts`.

What the script does:

- **Answers `GET`** with the farm's live status as JSON: each CSA season's slots and how many are taken, and upcoming events from the public calendar. `FarmStatus` in `src/types.ts` is the contract.
- **Answers `POST`** with a contact message by emailing the owner. The recipient is fixed inside the script so the endpoint cannot send mail anywhere else. `sendContactMessage` in `src/lib/farmApi.ts` is the contract.

How the pieces fit:

- **CSA.** Two seasons, each with its own Google Form and its own spreadsheet, and the spreadsheet is the source of truth. The form fills the responses tab, where every filled row is one slot taken; the owner types a row for someone who signs up by phone and deletes a row when someone drops out. Cell A1 of a second tab holds the season's number of slots. The script reads those two numbers and nothing else. Slots are a number and not blank rows because Google Forms inserts a row for every response and never fills blank ones. A full season's form stays open unless the owner closes it; the site just stops showing its button.
- **Mailing list.** A Google Form asks for a name and an email and sends them to a spreadsheet of its own, which the owner uses to build a group email list. No code: the script never opens either.
- **Group events.** No form. The request arrives as a contact message through the script's `POST`. Nothing is booked automatically.
- **Calendar.** Two calendars. The owner keeps one calendar just for public events, and putting an event on it is how she marks it public: the script reads that calendar only, by the ID in the Script Property `EVENTS_CALENDAR_ID`, and sends each event's title, times and location. Everything else stays on her own calendar. The public one does not have to be shared publicly for the script to read it, only for the optional `PUBLIC_CALENDAR_URL` fallback link.
- **Privacy.** Neither spreadsheet is shared or published. Only two numbers per season leave the CSA ones, through the script.

Status: the script's source is `apps-script/Code.gs`, with its manifest beside it, and that file is the record of what is deployed.

- Written: the contact `POST` and the whole `GET`, CSA and events. There is no set-up code. The forms, the spreadsheets, the events calendar and the Script Properties `CSA_SPRING_SHEET`, `CSA_SUMMER_SHEET` and `EVENTS_CALENDAR_ID` are made by hand, following the steps at the top of `Code.gs`.
- While `EVENTS_CALENDAR_ID` is not set, a `GET` returns an empty `events` list and the calendar section shows its "nothing on the calendar" line.
- The `GET` has been run only against stand-ins for Google's services, not yet in a Google account.
- A `GET` that cannot build the whole status (a spreadsheet link is not set, for one) answers with a line of plain text and not JSON. The site fails to parse it and shows its fallback, which is the intent: never return JSON of another shape.
- While `API_URL` is `null` the site shows sample data, marked as such on the page, and the contact form reports that it is not connected.

Rules for this code:

- Every value from the farm's Google account that the site is built with (the script URL, form links, calendar link) lives in `src/data/integrations.ts`. Never invent one; `null` means not set up.
- The script takes a second or two to answer. Render the page at once and fill the live parts in after, and never leave a section blank if the request fails: fall back to a link.
- Post to the script with a plain string body. Apps Script cannot answer a CORS preflight, and a JSON content type triggers one.
- All-day events arrive as `YYYY-MM-DD` and timed events as full ISO timestamps. Format them through `src/lib/dates.ts`, which handles both in `America/Chicago`.

## Reference project: `../portfolio_v2`

Buck's portfolio uses the same stack and is the model for conventions here. Read the relevant file there before introducing a new pattern.

Shared with it: the folder structure, content as data, CSS custom property tokens, the `Section` and `Reveal` components, the header that tracks the active section, animation inside `@media (prefers-reduced-motion: no-preference)`, `clamp()` type, and the deploy workflow. When photos arrive, follow its image loading: the hero image is `loading="eager"` with `fetchPriority="high"` and everything else is lazy.

Not shared: its dark navy look, its inner scroll container, its fixed-height sections, and its `dvh` heights (see "Scrolling behaviour").

## Constraints from being a static site on GitHub Pages

- **Everything shipped is public.** `VITE_*` variables are inlined into the bundle, and so is anything a GitHub Actions secret injects at build time. No secrets, tokens or private keys belong in this project. The Apps Script URL is public by design and is not a secret.
- **Base path.** The site's address is `https://welcomehomefarm.org/`. `vite.config.ts` sets `base: "./"`, a relative base, so the same build also works at `https://marshy8.github.io/welcomehomefarmwebsite/` while the domain is being connected. Until the domain is live, root-absolute URLs like `/favicon.svg` will 404 at the old address, so use `import.meta.env.BASE_URL` or imported assets over hard-coded paths. A relative base only works because the site is a single page at the root.
- **Custom domain.** The domain is switched on in the repo's Settings > Pages, not by a file: Pages ignores `public/CNAME` when the site is deployed by an Actions workflow. The file is kept, as in the portfolio, as the record of the domain.
- **No server routing.** A deep link to a client-side route returns a 404. Keep this a single page with `#anchor` sections unless Buck asks for routes.
- **No control over headers.** Caching, compression and redirects cannot be configured, so performance comes from shipping fewer and smaller files.

## Content

Do not invent facts about the farm: hours, address, phone, prices, events, season names, animals, history, or photos. When real content is missing, use an obvious placeholder such as `TODO: farm hours` and list the placeholders in your reply so Buck can fill them in.

Times are in `America/Chicago`.

## Agents

Three project agents live in `.claude/agents/`. Use them when Buck asks for one or when the work plainly belongs to one.

| Agent | Use it for |
| --- | --- |
| `layout` | Checking and fixing how the page looks across phone, tablet and desktop sizes in both orientations, using rendered screenshots. |
| `performance` | Measuring and improving load speed and runtime smoothness: bundle size, images, fonts, third-party embeds. |
| `integration` | Building and changing the Google side: the Apps Script, the forms and sheets it reads, and the calendar feed. |

Their work overlaps wherever Google content appears on the page: `integration` wires it up, `layout` checks it on a phone, and `performance` checks what it costs to load.
