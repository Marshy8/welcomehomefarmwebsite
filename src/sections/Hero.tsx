import { useState } from "react";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { VideoCycle } from "../components/VideoCycle";
import { FARM_ADDRESS, FARM_MAP_URL } from "../data/farm";
import type { VideoClip } from "../types";
import heroPoster from "../assets/hero-poster-0.webp";
import loop0Mp4 from "../assets/hero-loop-0.mp4";
import loop0Webm from "../assets/hero-loop-0.webm";
import loop1Mp4 from "../assets/hero-loop-1.mp4";
import loop1Webm from "../assets/hero-loop-1.webm";
import loop2Mp4 from "../assets/hero-loop-2.mp4";
import loop2Webm from "../assets/hero-loop-2.webm";

/* Played in this order, then round again. The poster is the first frame of
   the first clip. */
const HERO_CLIPS: VideoClip[] = [
  { webm: loop0Webm, mp4: loop0Mp4 },
  { webm: loop1Webm, mp4: loop1Mp4 },
  { webm: loop2Webm, mp4: loop2Mp4 },
];

export function Hero() {
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  return (
    <Section
      id="home"
      tone="forest"
      background={
        <>
          <img
            src={heroPoster}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* The still above shows until the first clip's first frame, and on
              its own for visitors who ask for reduced motion. */}
          {!reducedMotion && <VideoCycle clips={HERO_CLIPS} />}
          <div className="scrim absolute inset-0" />
        </>
      }
      overlay={
        <a
          href="#about"
          aria-label="Scroll to About"
          className="absolute inset-x-0 bottom-6 z-20 mx-auto hidden w-max flex-col items-center text-[var(--muted)] [@media(min-height:560px)]:flex"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <span aria-hidden="true">↓</span>
        </a>
      }
    >
      <div className="flex flex-col items-start gap-6">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            <a
              href={FARM_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              {FARM_ADDRESS}
            </a>
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="text-[clamp(2.75rem,10vw,6.5rem)] leading-[0.95]">
            Welcome Home Farm
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="max-w-xl text-lg">
            Stay close to Home. Veg local. Pick native.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#engage"
              className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-6 text-sm font-medium text-[var(--accent-ink)] transition-transform duration-[var(--dur)] hover:-translate-y-0.5"
            >
              Experiences
            </a>
            <a
              href="#calendar"
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-6 text-sm font-medium text-[var(--text-h)] transition-colors duration-[var(--dur)] hover:bg-white/5"
            >
              See Calendar
            </a>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
