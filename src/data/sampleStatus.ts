import type { FarmStatus } from "../types";

// Stand-in for the Apps Script response until API_URL is set. None of this is
// real farm information, and the page labels it as sample data.

const DAY = 24 * 60 * 60 * 1000;

function daysFromNow(days: number, utcHour: number, hours: number) {
  const start = new Date(Date.now() + days * DAY);
  start.setUTCHours(utcHour, 0, 0, 0);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function dateFromNow(days: number) {
  return new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
}

export const SAMPLE_STATUS: FarmStatus = {
  updatedAt: new Date().toISOString(),
  csa: {
    seasons: [
      { id: "sample-1", name: "Sample season 1", capacity: 10, taken: 10, open: true },
      { id: "sample-2", name: "Sample season 2", capacity: 10, taken: 7, open: true },
      { id: "sample-3", name: "Sample season 3", capacity: 12, taken: 2, open: true },
    ],
  },
  events: [
    {
      id: "sample-a",
      title: "Sample event",
      ...daysFromNow(3, 15, 2),
      allDay: false,
      location: "Sample location",
    },
    {
      id: "sample-b",
      title: "Sample all-day event",
      start: dateFromNow(9),
      end: dateFromNow(10),
      allDay: true,
    },
    {
      id: "sample-c",
      title: "Sample evening event",
      ...daysFromNow(16, 23, 3),
      allDay: false,
      location: "Sample location",
    },
    {
      id: "sample-d",
      title: "Sample event",
      ...daysFromNow(24, 14, 4),
      allDay: false,
    },
  ],
};
