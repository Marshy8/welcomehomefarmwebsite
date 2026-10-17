// Draws every site icon and the link-preview image from the one mark below,
// and writes them to public/. Run `npm run icons` after changing the mark or
// the colours. Needs Google Chrome (to draw) and ffmpeg (for the JPEG).
//
// The mark is a ground cherry in its papery husk, the native fruit in the
// hero, hanging from its stem. Colours are the forest tone's from
// src/index.css, so keep them in step with it.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const CHROME = process.env.CHROME ?? "google-chrome";

const COLOURS = {
  tile: "#24402a", // forest --bg
  husk: "#e9c46a", // forest --accent
  leaf: "#b6c5b0", // forest --muted
  text: "#fbf8f0", // forest --text-h
  muted: "#b6c5b0",
};

// The mark on a 64 × 64 grid, inside the safe zone of a maskable icon.
const MARK = `
  <path d="M32 22C32 16.5 35 12.5 40.5 10" fill="none" stroke="${COLOURS.leaf}" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M32.5 16C29 10.5 22.5 9.5 18 11.5C21 16.5 27 18 32.5 16Z" fill="${COLOURS.leaf}"/>
  <path d="M32 21.5C25 19.5 13 23.5 13 35C13 44 23 51 32 56.5C41 51 51 44 51 35C51 23.5 39 19.5 32 21.5Z" fill="${COLOURS.husk}"/>
  <path d="M32 22.5C21.5 26 19 44 32 55.5M32 22.5C42.5 26 45 44 32 55.5M32 23V55" fill="none" stroke="${COLOURS.tile}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;

/** rounded: a tile with its own corners, for browser tabs and Android.
    square: full bleed, for iOS and maskable icons, which round it themselves. */
function iconSvg(shape) {
  const rx = shape === "rounded" ? 14 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${rx}" fill="${COLOURS.tile}"/>${MARK}
</svg>
`;
}

const tmp = mkdtempSync(join(tmpdir(), "farm-icons-"));

function screenshot(html, width, height, out) {
  const page = join(tmp, "page.html");
  writeFileSync(page, html);
  execFileSync(CHROME, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--default-background-color=00000000",
    `--window-size=${width},${height}`,
    `--screenshot=${out}`,
    `file://${page}`,
  ], { stdio: "ignore" });
}

function png(svg, size, name) {
  const html = `<style>html,body{margin:0}img{display:block}</style>
<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" width="${size}" height="${size}">`;
  screenshot(html, size, size, join(PUBLIC, name));
}

const rounded = iconSvg("rounded");
const square = iconSvg("square");

writeFileSync(join(PUBLIC, "favicon.svg"), rounded);
png(rounded, 32, "favicon-32.png");
png(square, 180, "apple-touch-icon.png");
png(rounded, 192, "icon-192.png");
png(rounded, 512, "icon-512.png");
png(square, 512, "icon-maskable-512.png");

// The link preview shown when the site is shared in a message or post:
// the mark, name, place and tagline beside the hero's ground cherry.
const poster = readFileSync(join(ROOT, "src/assets/hero-poster-0.webp")).toString("base64");
const preview = `<style>
  html, body { margin: 0; }
  body {
    width: 1200px; height: 630px; display: flex;
    background: ${COLOURS.tile}; color: ${COLOURS.text};
    font-family: "Times New Roman", Times, serif;
  }
  .text { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 72px; }
  .text svg { width: 112px; height: 112px; margin-bottom: 36px; }
  h1 { margin: 0; font-size: 84px; line-height: 0.95; font-weight: 600; letter-spacing: -0.01em; }
  .place { margin: 0 0 24px; font-size: 22px; letter-spacing: 0.2em; text-transform: uppercase; color: ${COLOURS.husk}; }
  .tagline { margin: 28px 0 0; font-size: 32px; color: ${COLOURS.muted}; }
  .photo { width: 440px; background: url(data:image/webp;base64,${poster}) center 52% / cover; }
</style>
<div class="text">
  <svg viewBox="0 0 64 64">${MARK}</svg>
  <p class="place">Bentonville, Arkansas</p>
  <h1>Welcome Home Farm</h1>
  <p class="tagline">Stay close to Home. Veg local. Pick native.</p>
</div>
<div class="photo"></div>`;
const previewPng = join(tmp, "og-image.png");
screenshot(preview, 1200, 630, previewPng);
execFileSync("ffmpeg", [
  "-loglevel", "error", "-y", "-i", previewPng, "-q:v", "3", join(PUBLIC, "og-image.jpg"),
]);

rmSync(tmp, { recursive: true });
console.log("Icons and og-image.jpg written to public/");
