import { SECTIONS } from "../data/sections";
import type { SectionId } from "../types";

interface NavProps {
  active: SectionId;
}

export function Nav({ active }: NavProps) {
  return (
    <header className="tone-cream fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)] text-[var(--text)]">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-center px-3 sm:h-16 sm:justify-between sm:px-8">
        <a
          href="#home"
          className="hidden font-[family-name:var(--heading)] text-lg font-semibold text-[var(--text-h)] sm:block"
        >
          Welcome Home Farm
        </a>
        <ul className="flex items-center gap-0.5 sm:gap-2">
          {SECTIONS.filter((s) => s.id !== "home").map((section) => {
            const isActive = active === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex min-h-11 items-center rounded-full px-2.5 text-sm transition-colors duration-[var(--dur)] sm:px-3.5 ${
                    isActive
                      ? "bg-[var(--accent-bg)] font-medium text-[var(--text-h)]"
                      : "text-[var(--muted)] hover:text-[var(--text-h)]"
                  }`}
                >
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
