import type { ReactNode } from "react";
import type { Offering } from "../types";
import { CardButton } from "./CardButton";

interface OfferingCardProps {
  offering: Offering;
  /** Where the card's button goes. Unused by a card with no `cta`. */
  href?: string | null;
  children?: ReactNode;
}

export function OfferingCard({
  offering,
  href = null,
  children,
}: OfferingCardProps) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="text-2xl">{offering.title}</h3>
      <p>{offering.description}</p>
      {offering.includes && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm marker:text-[var(--accent)]">
          {offering.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-1 flex-col gap-3">
        {children}
        {offering.note && (
          <p className="text-sm text-[var(--muted)]">{offering.note}</p>
        )}
      </div>

      {offering.cta && (
        <div className="flex flex-col gap-1.5">
          <CardButton href={href}>{offering.cta}</CardButton>
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
