import type { ReactNode } from "react";
import type { SectionId, Tone } from "../types";

interface SectionProps {
  id: SectionId;
  children: ReactNode;
  tone?: Tone;
  background?: ReactNode;
  overlay?: ReactNode;
  className?: string;
}

export function Section({
  id,
  children,
  tone = "cream",
  background,
  overlay,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`section-frame tone-${tone} bg-[var(--bg)] text-[var(--text)] ${className ?? ""}`}
    >
      {background && (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          {background}
        </div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-24 pb-16 sm:px-8">
        {children}
      </div>

      {overlay}
    </section>
  );
}
