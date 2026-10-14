export type SectionId =
  | "home"
  | "about"
  | "engage"
  | "calendar"
  | "gallery"
  | "contact";

export interface SectionMeta {
  id: SectionId;
  label: string;
}

export type Tone = "cream" | "sage" | "forest";

export type OfferingId = "csa" | "mailing" | "event";

export interface Offering {
  id: OfferingId;
  title: string;
  description: string;
  /** What the offering comes with, listed under the description. */
  includes?: string[];
  /** The card's own button. The CSA card has none: each season has its own. */
  cta?: string;
  note?: string;
}

export type SocialId = "instagram" | "facebook";

export interface SocialLink {
  id: SocialId;
  label: string;
  url: string | null;
}

export interface VideoClip {
  webm?: string;
  mp4: string;
}

/* Contract with the farm's Apps Script web app. A GET returns FarmStatus. */

export type CsaSeasonId = "spring" | "summer";

export interface CsaSeason {
  id: CsaSeasonId;
  /** Slots in the season, as the owner set them in its spreadsheet. */
  capacity: number;
  /** Sign-ups in that spreadsheet. Can pass capacity, as the form stays open. */
  taken: number;
}

export interface FarmEvent {
  id: string;
  title: string;
  /** Full ISO timestamp, or YYYY-MM-DD when allDay is true. */
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
}

export interface FarmStatus {
  updatedAt: string;
  csa: { seasons: CsaSeason[] };
  events: FarmEvent[];
}

export interface ContactMessage {
  name: string;
  contact: string;
  message: string;
}

export type FarmStatusState =
  | { phase: "loading" }
  | { phase: "ready"; status: FarmStatus; isSample: boolean }
  | { phase: "error" };
