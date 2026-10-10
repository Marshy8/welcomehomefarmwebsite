import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { SampleBadge } from "../components/SampleBadge";
import { PUBLIC_CALENDAR_URL } from "../data/integrations";
import { eventDateParts, eventTimeLabel } from "../lib/dates";
import type { FarmEvent, FarmStatusState } from "../types";

interface CalendarProps {
  farm: FarmStatusState;
}

const MAX_EVENTS = 5;

function EventRow({ event }: { event: FarmEvent }) {
  const date = eventDateParts(event);
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:gap-6 sm:p-5">
      <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-[var(--accent-bg)] py-2 leading-tight">
        <span className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
          {date.month}
        </span>
        <span className="font-[family-name:var(--heading)] text-2xl font-semibold text-[var(--text-h)]">
          {date.day}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="text-lg">{event.title}</h3>
        <p className="text-sm text-[var(--muted)]">
          {date.weekday}, {eventTimeLabel(event)}
          {event.location && ` · ${event.location}`}
        </p>
      </div>
    </div>
  );
}

function CalendarLink({ children }: { children: string }) {
  if (!PUBLIC_CALENDAR_URL) return null;
  return (
    <a
      href={PUBLIC_CALENDAR_URL}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--accent)] underline underline-offset-4"
    >
      {children}
    </a>
  );
}

function Events({ farm }: CalendarProps) {
  if (farm.phase === "loading") {
    return (
      <p className="text-[var(--muted)]" role="status">
        Loading the calendar…
      </p>
    );
  }
  if (farm.phase === "error") {
    return (
      <div className="flex flex-col items-start gap-2">
        <p>The calendar is not loading right now.</p>
        <CalendarLink>Open the farm's Google Calendar</CalendarLink>
      </div>
    );
  }

  const events = farm.status.events.slice(0, MAX_EVENTS);
  if (events.length === 0) {
    return <p>Nothing on the calendar right now. Check back soon.</p>;
  }
  return (
    <>
      <ul className="flex flex-col gap-3">
        {events.map((event, i) => (
          <li key={event.id}>
            <Reveal delay={i * 60}>
              <EventRow event={event} />
            </Reveal>
          </li>
        ))}
      </ul>
      <CalendarLink>See the full calendar</CalendarLink>
    </>
  );
}

export function Calendar({ farm }: CalendarProps) {
  return (
    <Section id="calendar" tone="cream">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 sm:gap-8">
        <Reveal>
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)]">Calendar</h2>
            {farm.phase === "ready" && farm.isSample && <SampleBadge />}
          </div>
        </Reveal>
        <Events farm={farm} />
      </div>
    </Section>
  );
}
