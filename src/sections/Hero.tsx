import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";

export function Hero() {
  return (
    <Section
      id="home"
      tone="forest"
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
          <p className="max-w-xl text-lg">TODO: one-line tagline.</p>
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
              See what's on
            </a>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
