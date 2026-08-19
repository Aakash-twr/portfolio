import { useEffect, useRef } from 'react';
import { useMediaQuery } from '@/hooks';

/**
 * Reading-progress hairline under the header.
 *
 * Written against rAF-coalesced scroll events that mutate a transform directly
 * rather than React state: progress changes on every scroll frame, and running a
 * render pass for a 1px bar would put React on the critical path of scrolling for
 * no reason. `scaleX` keeps it on the compositor.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (reduceMotion) return;
    const bar = barRef.current;
    if (!bar) return;

    let queued = false;

    const update = () => {
      queued = false;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px">
      <div
        ref={barRef}
        className="h-full w-full origin-left scale-x-0 bg-accent"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
