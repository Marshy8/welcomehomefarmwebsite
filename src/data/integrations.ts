import type { OfferingId } from "../types";

// Every value that comes from the farm's Google account lives in this file.
// null means "not set up yet": the site shows sample data and disables the link.

/** The Apps Script web app URL (ends in /exec). */
export const API_URL: string | null =
  "https://script.google.com/macros/s/AKfycbzUa8yK9rym62XMN3F9xevU-mDQYrzoZpNMT0vt7BD3Vx5OBJmoIdaE1kD-LSZcw0wE/exec";

/** Where each engage card sends the visitor. */
export const OFFERING_URLS: Record<OfferingId, string | null> = {
  csa: null, // Google Form
  upick: null, // Google Calendar appointment booking page
  event: null, // Google Form
};

/** Public link to the farm's events calendar, used as a fallback. */
export const PUBLIC_CALENDAR_URL: string | null = null;
