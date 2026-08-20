import { useEffect, useRef } from 'react';
import { useMediaQuery } from '@/hooks';

/**
 * Reading-progress hairline along the top edge of the viewport.
 *
 * It sits on the viewport edge rather than under the header because the header
 * is a floating capsule with rounded ends — there is no straight edge inside it
 * for a full-width bar to sit against.
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
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px">
      <div
        ref={barRef}
        className="h-full w-full origin-left scale-x-0 bg-accent"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
