import { useEffect, useState } from "react";
import type { SectionId } from "../types";

export function useActiveSection(ids: SectionId[]): SectionId {
  const [active, setActive] = useState<SectionId>(ids[0]);

  useEffect(() => {
    // The root is squeezed to a thin band across the middle of the screen, so
    // the active section is whichever one covers that band. This holds for
    // sections taller than the screen, where a visible-ratio test does not.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
