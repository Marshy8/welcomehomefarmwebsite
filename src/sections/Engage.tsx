import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { OfferingCard } from "../components/OfferingCard";
import { CardButton } from "../components/CardButton";
import { SampleBadge } from "../components/SampleBadge";
import { CSA_SEASONS, OFFERINGS } from "../data/offerings";
import { CSA_FORM_URLS, MAILING_LIST_URL } from "../data/integrations";
import type { FarmStatusState, OfferingId } from "../types";
import engagePhoto from "../assets/engage.webp";

interface EngageProps {
  farm: FarmStatusState;
}

/** Where each card's own button goes. The CSA card has a button per season. */
const CARD_LINKS: Record<OfferingId, string | null> = {
  csa: null,
  mailing: MAILING_LIST_URL,
  event: "#contact",
};

function CsaSeasons({ farm }: EngageProps) {
  return (
    <div className="flex flex-col gap-5">
      {farm.phase === "loading" && (
        <p className="text-sm text-[var(--muted)]" role="status">
          Checking open slots…
        </p>
      )}
      {farm.phase === "error" && (
        <p className="text-sm text-[var(--muted)]">
          Open slots are not loading right now. The sign-up forms still work.
        </p>
      )}

      <ul className="flex flex-col gap-5">
        {CSA_SEASONS.map(({ id, name }) => {
          const live =
            farm.phase === "ready"
              ? farm.status.csa.seasons.find((season) => season.id === id)
              : undefined;
          const left = live ? Math.max(live.capacity - live.taken, 0) : null;
          const full = left === 0;
          return (
            <li key={id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-[var(--text-h)]">{name}</span>
                {left !== null && (
                  <span className={full ? "text-[var(--muted)]" : ""}>
                    {full ? "Full" : `${left} left`}
                  </span>
                )}
              </div>
              {live && (
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-[var(--accent-bg)]"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full rounded-full ${full ? "bg-[var(--muted)]" : "bg-[var(--accent)]"}`}
                    style={{
                      width: `${live.capacity > 0 ? Math.min(live.taken / live.capacity, 1) * 100 : 100}%`,
                    }}
                  />
                </div>
              )}
              {!full && (
                <div className="flex flex-col gap-1.5">
                  <CardButton
                    href={CSA_FORM_URLS[id]}
                    label={`Sign up for the ${name} CSA`}
                  >
                    Sign up
                  </CardButton>
                  {!CSA_FORM_URLS[id] && (
                    <p className="text-center text-xs text-[var(--muted)]">
                      Link not set up yet
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Engage({ farm }: EngageProps) {
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
              <OfferingCard offering={offering} href={CARD_LINKS[offering.id]}>
                {offering.id === "csa" && <CsaSeasons farm={farm} />}
              </OfferingCard>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
