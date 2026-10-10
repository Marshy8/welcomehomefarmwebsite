import type { ReactNode } from "react";
import { SOCIAL_LINKS } from "../data/social";
import type { SocialId } from "../types";

interface SocialLinksProps {
  /** Short lead-in shown above the links, e.g. "Follow the farm". */
  label: string;
  className?: string;
}

const ICONS: Record<SocialId, ReactNode> = {
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  facebook: (
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  ),
};

export function SocialLinks({ label, className }: SocialLinksProps) {
  const links = SOCIAL_LINKS.filter((link) => link.url);
  if (links.length === 0) return null;

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <ul className="flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.url ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--text-h)] transition-colors duration-[var(--dur)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)]"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {ICONS[link.id]}
              </svg>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
