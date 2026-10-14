import { useEffect, useRef, useState } from "react";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { GALLERY_PHOTOS } from "../data/gallery";

/* A row of photo cards that scrolls sideways: by swipe on a phone, and by the
   arrow buttons, a trackpad or the keyboard elsewhere. */
export function Gallery() {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEnds = () => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  };

  useEffect(() => {
    updateEnds();
    window.addEventListener("resize", updateEnds);
    return () => window.removeEventListener("resize", updateEnds);
  }, []);

  const scrollByPage = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <Section id="gallery" tone="sage">
      <div className="flex flex-col gap-8">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)]">Gallery</h2>
            <div className="hidden gap-2 [@media(pointer:fine)]:flex">
              <ArrowButton
                label="Previous photos"
                disabled={atStart}
                onClick={() => scrollByPage(-1)}
              >
                ←
              </ArrowButton>
              <ArrowButton
                label="Next photos"
                disabled={atEnd}
                onClick={() => scrollByPage(1)}
              >
                →
              </ArrowButton>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          {/* Bleeds to the screen edge so cards slide in from off-screen. */}
          <ul
            ref={track}
            onScroll={updateEnds}
            tabIndex={0}
            aria-label="Farm photos"
            className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-[var(--accent)] sm:-mx-8 sm:scroll-px-8 sm:gap-6 sm:px-8"
          >
            {GALLERY_PHOTOS.map((photo) => (
              <li
                key={photo.src}
                className="aspect-4/5 w-[72vw] max-w-80 shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-[var(--border)]"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={640}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}

interface ArrowButtonProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}

function ArrowButton({ label, disabled, onClick, children }: ArrowButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--border)] text-lg text-[var(--text-h)] transition-colors duration-[var(--dur)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)] disabled:pointer-events-none disabled:opacity-35"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
