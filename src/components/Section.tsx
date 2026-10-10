import type { ReactNode } from "react";
import type { SectionId, Tone } from "../types";

interface SectionProps {
  id: SectionId;
  children: ReactNode;
  tone?: Tone;
  overlay?: ReactNode;
  className?: string;
}

export function Section({
  id,
  children,
  tone = "cream",
  overlay,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`section-frame tone-${tone} bg-[var(--bg)] text-[var(--text)] ${className ?? ""}`}
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-24 pb-16 sm:px-8">
        {children}
      </div>

      {overlay}
    </section>
  );
}
