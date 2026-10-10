import type { ReactNode } from "react";
import type { Offering } from "../types";

interface OfferingCardProps {
  offering: Offering;
  href: string | null;
  /** Replaces the button label and turns the button off, e.g. "All seasons full". */
  unavailable?: string;
  children?: ReactNode;
}

const BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium";

export function OfferingCard({
  offering,
  href,
  unavailable,
  children,
}: OfferingCardProps) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="text-2xl">{offering.title}</h3>
      <p>{offering.description}</p>

      <div className="flex flex-1 flex-col gap-3">
        {children}
        {offering.note && (
          <p className="text-sm text-[var(--muted)]">{offering.note}</p>
        )}
      </div>

      {href && !unavailable ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={`${BUTTON} bg-[var(--accent)] text-[var(--accent-ink)] transition-transform duration-[var(--dur)] hover:-translate-y-0.5`}
        >
          {offering.cta}
        </a>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span
            aria-disabled="true"
            className={`${BUTTON} border border-[var(--border)] text-[var(--muted)]`}
          >
            {unavailable ?? offering.cta}
          </span>
          {!href && (
            <p className="text-center text-xs text-[var(--muted)]">
              Link not set up yet
            </p>
          )}
        </div>
      )}
    </article>
  );
}
