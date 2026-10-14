import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { SocialLinks } from "../components/SocialLinks";
import { ABOUT_PANELS } from "../data/about";

export function About() {
  return (
    <Section id="about" tone="cream">
      <div className="flex flex-col gap-14 lg:gap-16">
        {ABOUT_PANELS.map((panel, i) => (
          <Reveal key={panel.title} delay={i * 120}>
            <article className="grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr] md:items-center md:gap-x-10 lg:grid-cols-[minmax(0,20rem)_1fr]">
              <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] md:col-span-2">
                {panel.title}
              </h2>
              <div className="aspect-4/5 w-full max-w-sm overflow-hidden rounded-2xl ring-1 ring-[var(--border)]">
                <img
                  src={panel.image}
                  alt={panel.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: panel.imagePosition }}
                />
              </div>
              <p className="max-w-prose text-lg">{panel.text}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={240} className="empty:hidden mt-12">
        <SocialLinks label="See more of Ashley and the farm" />
      </Reveal>
    </Section>
  );
}
