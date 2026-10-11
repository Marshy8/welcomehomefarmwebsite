import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { OfferingCard } from "../components/OfferingCard";
import { SampleBadge } from "../components/SampleBadge";
import { OFFERINGS } from "../data/offerings";
import { OFFERING_URLS } from "../data/integrations";
import type { CsaSeason, FarmStatusState } from "../types";
import engagePhoto from "../assets/engage.webp";

interface EngageProps {
  farm: FarmStatusState;
}

function slotsLeft(season: CsaSeason) {
  return Math.max(season.capacity - season.taken, 0);
}

function isAvailable(season: CsaSeason) {
  return season.open && slotsLeft(season) > 0;
}

function CsaSeasons({ farm }: EngageProps) {
  if (farm.phase === "loading") {
    return (
      <p className="text-sm text-[var(--muted)]" role="status">
        Checking open slots…
      </p>
    );
  }
  if (farm.phase === "error") {
    return (
      <p className="text-sm text-[var(--muted)]">
        Open slots are not loading right now. The sign-up form has the latest.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {farm.status.csa.seasons.map((season) => {
        const left = slotsLeft(season);
        const available = isAvailable(season);
        const filled = Math.min(season.taken / season.capacity, 1) * 100;
        return (
          <li key={season.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-[var(--text-h)]">
                {season.name}
              </span>
              <span className={available ? "" : "text-[var(--muted)]"}>
                {!season.open
                  ? "Closed"
                  : left === 0
                    ? "Full"
                    : `${left} of ${season.capacity} left`}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-[var(--accent-bg)]"
              aria-hidden="true"
            >
              <div
                className={`h-full rounded-full ${available ? "bg-[var(--accent)]" : "bg-[var(--muted)]"}`}
                style={{ width: `${filled}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Engage({ farm }: EngageProps) {
  const csaSoldOut =
    farm.phase === "ready" && !farm.status.csa.seasons.some(isAvailable);

  return (
    <Section
      id="engage"
      tone="forest"
      background={
        <>
          <img
            src={engagePhoto}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="scrim absolute inset-0" />
        </>
      }
    >
      <div className="flex flex-col gap-6 sm:gap-8">
        <Reveal>
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)]">How to engage</h2>
            {farm.phase === "ready" && farm.isSample && <SampleBadge />}
          </div>
        </Reveal>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-6">
          {OFFERINGS.map((offering, i) => (
            <Reveal key={offering.id} delay={i * 80}>
              <OfferingCard
                offering={offering}
                href={OFFERING_URLS[offering.id]}
                unavailable={
                  offering.id === "csa" && csaSoldOut
                    ? "All seasons full"
                    : undefined
                }
              >
                {offering.id === "csa" && <CsaSeasons farm={farm} />}
              </OfferingCard>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
