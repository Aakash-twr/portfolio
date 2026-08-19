import { useEffect, useState } from 'react';

/**
 * True while an element is on screen AND the tab is foregrounded.
 *
 * The hero canvas subscribes to this so its animation loop stops entirely when
 * scrolled past or when the tab is hidden — an idle background rAF loop is the
 * most common way a "lightweight" portfolio quietly drains a laptop battery.
 */
export function useVisibility<T extends Element = HTMLElement>() {
  const [ref, setRef] = useState<T | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );

  useEffect(() => {
    if (!ref || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry?.isIntersecting ?? true),
      { threshold: 0 },
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  useEffect(() => {
    const onChange = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return { setRef, active: onScreen && tabVisible };
}
