import type { ReactNode } from "react";

interface CardButtonProps {
  /** A Google link, which opens in a new tab, or a #section of this page.
   *  null draws the button switched off. */
  href: string | null;
  /** Spoken in place of the text, for a button whose text alone is unclear. */
  label?: string;
  children: ReactNode;
}

const BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium";

export function CardButton({ href, label, children }: CardButtonProps) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        className={`${BUTTON} border border-[var(--border)] text-[var(--muted)]`}
      >
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      aria-label={label}
      {...(!href.startsWith("#") && { target: "_blank", rel: "noreferrer" })}
      className={`${BUTTON} bg-[var(--accent)] text-[var(--accent-ink)] transition-transform duration-[var(--dur)] hover:-translate-y-0.5`}
    >
      {children}
    </a>
  );
}
