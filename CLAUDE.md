# Welcome Home Farm website

A landing page for Welcome Home Farm in Bentonville, Arkansas. Buck Harris builds and maintains it. Visitors are mostly local people on their phones who want to know what the farm offers, when they can come, how to get there, and how to book or sign up for something.

## Stack

- Vite, React 19, TypeScript, npm.
- Tailwind CSS v4 through the `@tailwindcss/vite` plugin. There is no `tailwind.config.js`; theme values live in CSS.
- No backend that Buck hosts. The site is static files; everything dynamic comes from the farm's Google account (see "Google integration").
- Hosted on GitHub Pages, deployed by a GitHub Actions workflow on push to `main`. The repo is `Marshy8/welcomehomefarmwebsite`.

## Commands

```
npm run dev       # dev server, http://localhost:5173/welcomehomefarmwebsite/
npm run build     # tsc -b && vite build, output in dist/
npm run preview   # serve the production build, http://localhost:4173/welcomehomefarmwebsite/
npm run lint      # eslint
```

Run `npm run build` and `npm run lint` before calling a change done. The build type-checks, and a type error fails the deploy.

## Page design

One page that scrolls top to bottom, with a fixed header whose links jump to each section and highlight the one in view.

| Section | `id` | What it holds |
| --- | --- | --- |
| Hero | `home` | Farm name, location, and buttons into the page. |
| About us | `about` | A short blurb about the farm and its creator, beside professional photo or video. |
| How to engage | `engage` | Three or more cards, each an action a visitor can take. Each links out to a Google form or booking page and shows live information about it. |
| Calendar | `calendar` | Upcoming events, mirrored live from the farm's Google Calendar. |
| Contact | `contact` | A message box that emails the farm owner, with a field for how to reach the sender. |

The engage cards so far:

- **Join the CSA.** The CSA runs in several seasons and a person signs up for the seasons they want. The card lists each season with its remaining slots and stops offering a season that is full.
- **Schedule U-Pick.** One group per time slot, so a slot that is taken cannot be booked again.
- **Plan a large event.** A request, not a booking. The form goes to the owner, who approves it and puts it on the calendar.

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

The glue is **one Google Apps Script project in the farm's Google account**, published once as a web app. Apps Script is JavaScript that runs on Google's servers as the account that owns it. The farm is expected to be on a paid Google Workspace plan. The site knows a single URL, `API_URL` in `src/data/integrations.ts`.

What the script does:

- **Answers `GET`** with the farm's live status as JSON: CSA seasons with capacity and signups taken, and upcoming events from the public calendar. `FarmStatus` in `src/types.ts` is the contract.
- **Answers `POST`** with a contact message by emailing the owner. The recipient is fixed inside the script so the endpoint cannot send mail anywhere else. `sendContactMessage` in `src/lib/farmApi.ts` is the contract.
- **Runs when the CSA form is submitted**, and removes a season from the form's choices once it is full, so a direct link to the form cannot oversell it either.

How the pieces fit:

- **CSA.** A Google Form writes to a response sheet. A settings tab in that spreadsheet has one row per season: name, capacity, and whether it is open. The script counts signups per season. Starting a new season is one new row for the owner.
- **U-Pick.** A Google Calendar appointment booking page, which offers only free times and creates the calendar event itself.
- **Large events.** A Google Form whose responses notify the owner. Nothing is booked automatically.
- **Calendar.** Two calendars. A public events calendar feeds the site. Bookings that carry customer names stay on a private one.
- **Privacy.** The response sheet is never shared or published. Only counts leave it, through the script.

Status: the script's source is `apps-script/Code.gs`, with its manifest beside it, and that file is the record of what is deployed.

- Written: the contact `POST`, and the CSA half. The CSA half is the `GET`, the sync that runs on each signup and on each change to the spreadsheet, and `setUpMockCsa`, which creates a test sign-up form and a spreadsheet with sample seasons in whichever Google account runs it. `tearDownCsa` disconnects them again.
- Not written: events. A `GET` always returns an empty `events` list, so with `API_URL` set the calendar section shows its "nothing on the calendar" line.
- The CSA half has been run only against stand-ins for Google's services, not yet in a Google account.
- A `GET` that cannot build the whole status (the CSA is not set up, for one) answers with a line of plain text and not JSON. The site fails to parse it and shows its fallback, which is the intent: never return JSON of another shape.
- While `API_URL` is `null` the site shows sample data, marked as such on the page, and the contact form reports that it is not connected.

Rules for this code:

- Every value from the farm's Google account (the script URL, form links, calendar link) lives in `src/data/integrations.ts`. Never invent one; `null` means not set up.
- The script takes a second or two to answer. Render the page at once and fill the live parts in after, and never leave a section blank if the request fails: fall back to a link.
- Post to the script with a plain string body. Apps Script cannot answer a CORS preflight, and a JSON content type triggers one.
- All-day events arrive as `YYYY-MM-DD` and timed events as full ISO timestamps. Format them through `src/lib/dates.ts`, which handles both in `America/Chicago`.

## Reference project: `../portfolio_v2`

Buck's portfolio uses the same stack and is the model for conventions here. Read the relevant file there before introducing a new pattern.

Shared with it: the folder structure, content as data, CSS custom property tokens, the `Section` and `Reveal` components, the header that tracks the active section, animation inside `@media (prefers-reduced-motion: no-preference)`, `clamp()` type, and the deploy workflow. When photos arrive, follow its image loading: the hero image is `loading="eager"` with `fetchPriority="high"` and everything else is lazy.

Not shared: its dark navy look, its inner scroll container, its fixed-height sections, and its `dvh` heights (see "Scrolling behaviour").

## Constraints from being a static site on GitHub Pages

- **Everything shipped is public.** `VITE_*` variables are inlined into the bundle, and so is anything a GitHub Actions secret injects at build time. No secrets, tokens or private keys belong in this project. The Apps Script URL is public by design and is not a secret.
- **Base path.** The site is served from `https://marshy8.github.io/welcomehomefarmwebsite/`, so `vite.config.ts` sets `base: "/welcomehomefarmwebsite/"` and root-absolute URLs like `/favicon.svg` will 404. Use `import.meta.env.BASE_URL` or imported assets over hard-coded paths. If the site moves to a custom domain (a `public/CNAME` file, as in the portfolio) the base becomes `/`.
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
| `integration` | Building and changing the Google side: the Apps Script, the forms and sheets it reads, the calendar feed, and the booking page. |

Their work overlaps wherever Google content appears on the page: `integration` wires it up, `layout` checks it on a phone, and `performance` checks what it costs to load.
