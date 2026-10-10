import { useState } from "react";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import heroPoster from "../assets/hero-poster.webp";
import heroMp4 from "../assets/hero-loop.mp4";
import heroWebm from "../assets/hero-loop.webm";

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
          {/* The still above shows until the video's first frame, and on its
              own for visitors who ask for reduced motion. */}
          {!reducedMotion && (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={heroWebm} type="video/webm" />
              <source src={heroMp4} type="video/mp4" />
            </video>
          )}
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
            Bentonville, Arkansas
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="text-[clamp(2.75rem,10vw,6.5rem)] leading-[0.95]">
            Welcome Home Farm
          </h1>
        </Reveal>
        <Reveal delay={160}>
          {/* TODO: one-line tagline from the farm */}
          <p className="max-w-xl text-lg">
            U-Pick, CSA, and Education for the community.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#engage"
              className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-6 text-sm font-medium text-[var(--accent-ink)] transition-transform duration-[var(--dur)] hover:-translate-y-0.5"
            >
              Get involved
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
