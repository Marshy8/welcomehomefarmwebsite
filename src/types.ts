export type SectionId = "home" | "about" | "engage" | "calendar" | "contact";

export interface SectionMeta {
  id: SectionId;
  label: string;
}

export type Tone = "cream" | "sage" | "forest";

export type OfferingId = "csa" | "upick" | "event";

export interface Offering {
  id: OfferingId;
  title: string;
  description: string;
  cta: string;
  note?: string;
}

/* Contract with the farm's Apps Script web app. A GET returns FarmStatus. */

export interface CsaSeason {
  id: string;
  name: string;
  capacity: number;
  taken: number;
  open: boolean;
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
