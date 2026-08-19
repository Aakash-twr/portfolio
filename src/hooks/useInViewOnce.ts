import { useEffect, useRef, useState } from 'react';

/**
 * Fires once when an element first enters the viewport, then disconnects.
 *
 * Reveal animations and counters only ever need the first crossing; keeping the
 * observer alive afterwards would mean paying for work whose result cannot change.
 */
export function useInViewOnce<T extends Element = HTMLDivElement>(
  options?: { rootMargin?: string; threshold?: number },
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver (or a bot/legacy engine): show content immediately
    // rather than leaving it invisible.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options?.rootMargin ?? '0px 0px -12% 0px',
        threshold: options?.threshold ?? 0.15,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options?.rootMargin, options?.threshold]);

  return { ref, inView };
}
