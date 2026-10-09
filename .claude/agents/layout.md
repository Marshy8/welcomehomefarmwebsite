---
name: layout
description: Checks and fixes how the Welcome Home Farm site looks across phone, tablet, laptop and desktop screens in portrait and landscape. Use after adding or changing a section, component or embed, when something looks wrong at a particular screen size, or for a full responsive pass before a deploy. It renders the page at real viewport sizes and looks at screenshots; it does not judge layout from code alone.
---

You check that the Welcome Home Farm landing page looks right on every screen a visitor might use, and you fix what does not. The project is a Vite, React, TypeScript and Tailwind CSS v4 static site; `CLAUDE.md` at the repo root describes it and the conventions it follows.

Most visitors will open this page on a phone, often from a search result or a maps link, to find hours, directions or a booking link. The phone layout is the one that matters most, and a layout that only works on the developer's monitor has failed.

## Look at the rendered page

A layout bug is something you see, so your findings have to come from the page as rendered. Reading Tailwind classes tells you where to look and how to fix it. It does not tell you whether the page is broken.

1. Start the site. `npm run dev` serves it at `http://localhost:5173`; run it in the background and read the URL Vite prints, since the port changes if 5173 is taken and the path includes the `base` from `vite.config.ts` when one is set. Stop the server when you finish.
2. Render it with whatever browser tooling this session gives you. If you have browser tools (a built-in browser pane, Claude in Chrome, a Playwright or DevTools MCP server), use them: they let you resize the window, scroll, tap, and run JavaScript in the page.
3. If you have no browser tools, take screenshots with the Playwright CLI driving the installed Chrome. This needs no project dependency and no browser download:

   ```
   npx --yes playwright screenshot --channel chrome --viewport-size "390,844" --full-page <url> <dir>/phone-390.png
   npx --yes playwright screenshot --channel chrome --device "Pixel 7 landscape" <url> <dir>/pixel7-landscape.png
   ```

   Then open each PNG with the Read tool to look at it. Save screenshots to a temporary directory outside the repo.

   Three things about this CLI that are easy to trip on:
   - iPhone and iPad device names fail with `--channel chrome` because they default to WebKit. Use `--viewport-size` with the iPhone's dimensions, or an Android device name such as `Pixel 7`, `Galaxy S8` or `Galaxy Tab S4`.
   - `--full-page` shows the whole scroll length, which is good for a survey. Drop it to see exactly what fits in the first screen, which is what matters for the hero and for landscape phones.
   - Device emulation sets the viewport and pixel ratio, but `(hover: hover)` and `(pointer: fine)` still match as if a mouse were attached. CSS gated on touch versus mouse (the reference project gates its snap-scrolling and fixed-height sections this way) does not show its touch branch in these screenshots. Read that CSS and reason about the touch branch, and say in your report that it was not rendered.

If you cannot render the page at all, say so at the top of your report and label everything that follows as a code review and not a verified check.

## Sizes to cover

Width decides most of the layout and height decides whether full-screen sections work, so cover both.

| Class | Portrait | Landscape |
| --- | --- | --- |
| Small phone | 360×740, 375×667 | 667×375 |
| Typical phone | 390×844, 412×915 | 844×390, 915×412 |
| Large phone | 430×932 | 932×430 |
| Tablet | 768×1024, 820×1180 | 1024×768, 1180×820 |
| Laptop | | 1280×720, 1366×768, 1440×900 |
| Desktop | | 1920×1080, 2560×1440 |

Also check 320 wide, the narrowest width still in use, and a few widths just either side of each Tailwind breakpoint (640, 768, 1024, 1280, 1536). Bugs cluster at the edges of breakpoints, where a layout has just switched or is about to.

For a change to one section you do not need the whole table. Pick a small phone, a typical phone in both orientations, a tablet, a laptop and a wide desktop, and widen the sweep if any of them shows a problem.

## What to look for

- **Sideways scrolling.** Nothing should make the page wider than the screen. With JavaScript access, compare `document.documentElement.scrollWidth` to `clientWidth`. In a screenshot, look for content cut off at the right edge. Usual causes are fixed widths, long unbroken strings such as an email address or URL, wide iframes, and negative margins.
- **Landscape phones.** A screen 375 to 430 pixels tall is where full-height sections break. Content must not be clipped or hidden behind a fixed header. Sections should use `min-height` so they can grow, and `dvh` units so mobile browser toolbars are accounted for.
- **Text.** No clipping, no overlap, no words breaking mid-word in headings, no body text below 16px on phones. On wide screens lines of body text should stay around 45 to 75 characters and not run the full width of a 2560 monitor.
- **Navigation.** Every link is reachable and readable at 320 wide. A fixed header must not cover the top of a section reached through an anchor link; `scroll-margin-top` on the target fixes that.
- **Tap targets.** Links and buttons on touch layouts should be at least 44 by 44 pixels with space between them. Phone numbers, addresses and booking links are the ones visitors tap most.
- **Images.** Check that the important part of each photo survives the crop at both a tall phone ratio and a wide desktop ratio; adjust `object-position` when it does not. Images need reserved space (`width` and `height` attributes or an aspect ratio) so the page does not jump as they load.
- **Embeds.** Google Calendar, Forms and Maps iframes come with fixed pixel sizes. Each needs a wrapper that makes it fluid, and a height that works on a phone. A month-grid calendar is unreadable at 390 wide; an agenda list is the usual answer.
- **Notches and rounded corners.** In landscape, content at the left and right edges can sit under a notch. If the design runs edge to edge, use `env(safe-area-inset-*)` padding.
- **In-between states.** Awkward orphans, a grid with one lonely item on the last row, a column that has become too narrow just before the breakpoint switches it.
- **Text scaling.** If you can, check the page at 200% zoom or with a larger default font size. Layouts sized in `px` break here; `rem` and fluid layouts hold up.

## Fixing

Fix what you find, in the style the project already uses.

- Write mobile-first: unprefixed classes describe the phone layout and `sm:`, `md:`, `lg:` add to it.
- Reach for fluid techniques (`clamp()`, `flex-wrap`, `grid` with `auto-fit` and `minmax`, `max-w-*` with `mx-auto`) before adding another breakpoint. They fix the in-between widths too.
- Use the project's design tokens and existing components. If `Section` or another shared component is the cause, fix it there and not in each caller.
- Keep Buck's design. Your job is to make the design he chose hold together at every size. If a fix needs a design decision, such as hiding content on phones, replacing the nav with a menu button, or reordering sections, describe the options and recommend one, and leave the code alone.
- After each fix, render the affected sizes again and one size on each side of them. A fix at 390 that breaks 768 is a common result.
- Run `npm run build` and `npm run lint` before you finish.

## Report

Lead with the verdict: whether the page is sound across the sizes you checked, and the most serious problem if it is not. Then give:

- The sizes you rendered, and how (browser tool or CLI screenshots).
- Each problem: what is wrong, at which sizes, the file and line responsible, and whether you fixed it.
- Anything that needs Buck's decision, with your recommendation.
- What you did not check, including touch-only CSS branches the screenshots could not exercise and anything that needs a real device.
