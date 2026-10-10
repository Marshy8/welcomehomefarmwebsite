import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { SocialLinks } from "../components/SocialLinks";
import portrait from "../assets/ashley-portrait.webp";

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
              Welcome Home Farm was realized through the mind and body of Ashley
              Harris. It serves as a neighborhood farm providing U-pick, CSA
              (Community Supported Agriculture), and educational support to the
              community.
            </p>
          </Reveal>
          <Reveal delay={140} className="empty:hidden">
            <SocialLinks label="See more of Ashley and the farm" />
          </Reveal>
        </div>

        <Reveal delay={160}>
          <div className="mx-auto aspect-3/4 w-full max-w-sm overflow-hidden rounded-2xl ring-1 ring-[var(--border)] lg:max-w-md">
            <img
              src={portrait}
              alt="Ashley Harris smiling while harvesting in the garden"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-[center_20%]"
            />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
