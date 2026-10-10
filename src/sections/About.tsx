import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";

export function About() {
  return (
    <Section id="about" tone="cream">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)]">About us</h2>
          </Reveal>
          <Reveal delay={80}>
            {/* TODO: short blurb about the farm and its creator */}
            <p className="max-w-prose text-lg">
              TODO: a short blurb about the farm and the person who started it.
              Two or three sentences fit this space well.
            </p>
          </Reveal>
        </div>

        <Reveal delay={160}>
          {/* TODO: professional photo or video goes here */}
          <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-[var(--accent-border)] bg-[var(--accent-bg)] text-sm text-[var(--muted)]">
            Photo or video
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
