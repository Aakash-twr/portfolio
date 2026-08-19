import { useEffect, useState } from 'react';

/**
 * Scroll-spy for the header indicator.
 *
 * Uses a single IntersectionObserver over all sections instead of a scroll
 * listener: no per-frame work, no layout reads during scroll. The rootMargin
 * biases the "active" band toward the upper third of the viewport, which matches
 * where a reader's attention actually sits.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }

        // Nothing in the active band — e.g. back at the hero, which is not a nav
        // target. Clearing beats leaving a stale section underlined.
        if (visible.size === 0) {
          setActive(null);
          return;
        }

        // Pick the most-visible section, tie-broken by document order.
        let best: string | null = null;
        let bestRatio = -1;
        for (const el of elements) {
          const ratio = visible.get(el.id);
          if (ratio !== undefined && ratio > bestRatio) {
            best = el.id;
            bestRatio = ratio;
          }
        }
        if (best) setActive(best);
      },
      {
        rootMargin: '-12% 0px -55% 0px',
        threshold: [0, 0.15, 0.4, 0.75, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
