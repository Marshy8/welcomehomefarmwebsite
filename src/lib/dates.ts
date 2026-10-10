import type { FarmEvent } from "../types";

const FARM_TZ = "America/Chicago";

// An all-day event is a calendar date with no time, sent as YYYY-MM-DD. Parsing
// that gives midnight UTC, so it has to be formatted in UTC or it shows as the
// previous day in Arkansas.
function zoneFor(event: FarmEvent) {
  return event.allDay ? "UTC" : FARM_TZ;
}

export function eventDateParts(event: FarmEvent) {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: zoneFor(event),
  }).formatToParts(new Date(event.start));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return { weekday: get("weekday"), month: get("month"), day: get("day") };
}

export function eventTimeLabel(event: FarmEvent) {
  if (event.allDay) return "All day";
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: FARM_TZ,
  });
  return `${time.format(new Date(event.start))} to ${time.format(new Date(event.end))}`;
}
