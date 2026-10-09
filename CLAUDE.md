# Welcome Home Farm website

A landing page for Welcome Home Farm in Bentonville, Arkansas. Buck Harris builds and maintains it. Visitors are mostly local people on their phones who want to know what the farm offers, when they can come, how to get there, and how to book or sign up for something.

## Stack

- Vite, React 19, TypeScript, npm.
- Tailwind CSS v4 through the `@tailwindcss/vite` plugin. There is no `tailwind.config.js`; theme values live in CSS.
- No backend. The site is static files and nothing else.
- Hosted on GitHub Pages, deployed by a GitHub Actions workflow on push to `main`. The repo is `Marshy8/welcomehomefarmwebsite`.

If there is no `package.json` yet, the app has not been scaffolded. Scaffold it to match the versions and config in `../portfolio_v2` rather than whatever the current Vite template defaults to.

## Commands

```
npm run dev       # dev server, http://localhost:5173
npm run build     # tsc -b && vite build, output in dist/
npm run preview   # serve the production build, http://localhost:4173
npm run lint      # eslint
```

Run `npm run build` and `npm run lint` before calling a change done. The build type-checks, and a type error fails the deploy.

## Reference project: `../portfolio_v2`

Buck's portfolio uses the same stack and is the model for how this project is organised. Read the relevant file there before introducing a new pattern here.

Borrow from it:

- **Structure.** `src/sections/` holds one component per page section, `src/components/` holds shared pieces, `src/data/` holds content as typed constants, `src/hooks/` holds hooks, and `src/types.ts` holds shared types. `App.tsx` composes the sections in order.
- **Content as data.** Copy that the farm will change (hours, events, offerings, contact details) goes in `src/data/` and not inline in JSX.
- **Design tokens.** Colours, fonts, easing and durations are CSS custom properties on `:root` in `src/index.css`, used in Tailwind as `text-[var(--accent)]`. Add a token before hard-coding a colour.
- **`Section` and `Reveal` components.** `Section` handles the background image, scrim and content width. `Reveal` fades content in with an `IntersectionObserver`.
- **Motion and sizing habits.** Animation sits inside `@media (prefers-reduced-motion: no-preference)`, heights use `dvh`, and fluid type uses `clamp()`.
- **Image loading.** The hero image is `loading="eager"` with `fetchPriority="high"`; everything else is lazy.
- **Deploy workflow.** `.github/workflows/deploy.yml` there is the template for this repo.

Do not borrow its look. The portfolio is a dark navy developer site with full-screen snap-scrolling sections. The farm needs its own palette, type and pacing, and Buck decides those.

## Constraints from being a static site on GitHub Pages

- **Everything shipped is public.** `VITE_*` variables are inlined into the bundle, and so is anything a GitHub Actions secret injects at build time. No secrets, tokens or private keys belong in this project.
- **Base path.** Without a custom domain the site is served from `https://marshy8.github.io/welcomehomefarmwebsite/`, so `vite.config.ts` needs `base: "/welcomehomefarmwebsite/"` and root-absolute URLs like `/favicon.svg` will 404. With a custom domain (a `public/CNAME` file, as in the portfolio) the base is `/`. Check which one applies before writing an asset path, and use `import.meta.env.BASE_URL` or imported assets over hard-coded paths.
- **No server routing.** A deep link to a client-side route returns a 404. Keep this a single page with `#anchor` sections unless Buck asks for routes.
- **No control over headers.** Caching, compression and redirects cannot be configured, so performance comes from shipping fewer and smaller files.
- **No form handler.** Anything that collects input goes through a third-party service. Google Workspace is the chosen one; see the `integration` agent.

## Content

Do not invent facts about the farm: hours, address, phone, prices, events, animals, history, or photos. When real content is missing, use an obvious placeholder such as `TODO: farm hours` and list the placeholders in your reply so Buck can fill them in.

Times are in `America/Chicago`.

## Agents

Three project agents live in `.claude/agents/`. Use them when Buck asks for one or when the work plainly belongs to one.

| Agent | Use it for |
| --- | --- |
| `layout` | Checking and fixing how the page looks across phone, tablet and desktop sizes in both orientations, using rendered screenshots. |
| `performance` | Measuring and improving load speed and runtime smoothness: bundle size, images, fonts, third-party embeds. |
| `integration` | Proposing and building Google Workspace integrations (Calendar, Forms, Maps, Sheets, booking) that work with no backend. |

Their work overlaps at Google embeds: `integration` adds one, `layout` checks it on a phone, and `performance` checks what it costs to load.
