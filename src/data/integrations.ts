import type { CsaSeasonId } from "../types";

// Every value that comes from the farm's Google account lives in this file.
// null means "not set up yet": the site shows sample data and disables the link.

/** The Apps Script web app URL (ends in /exec). */
export const API_URL: string | null =
  "https://script.google.com/macros/s/AKfycbycz6-75RdcQCCOjwMcERyg8EoQ54lRU3ehlq3xdH6NhBxR8e-NoIorQw22s0VSupXc/exec";

/** Each CSA season's own Google sign-up form. */
export const CSA_FORM_URLS: Record<CsaSeasonId, string | null> = {
  spring:
    "https://docs.google.com/forms/d/e/1FAIpQLSezvSDUMOk78pvFpT2uQrKK6QeMkElKibQ-19bjrxTVFZSu3g/viewform?usp=publish-editor",
  summer:
    "https://docs.google.com/forms/d/e/1FAIpQLSci5Xy_65r38N8bDtKK4DCUwWFa_KxAuDkvN78eAkAP_11cyw/viewform?usp=publish-editor",
};

/** The mailing list's Google form. */
export const MAILING_LIST_URL: string | null =
  "https://docs.google.com/forms/d/e/1FAIpQLSefxmL5jDembXkiWMniDsvfqNpruBVxcZXzXKwXXUFw1imiKA/viewform?usp=publish-editor";

/** Public link to the farm's events calendar, used as a fallback. */
export const PUBLIC_CALENDAR_URL: string | null = null;
