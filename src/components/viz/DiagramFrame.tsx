import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

type DiagramFrameProps = {
  /**
   * Width in px below which the diagram must not shrink. An SVG scaled to fit a
   * 350px column renders its labels at 4–6px, which is unreadable — so below this
   * floor the frame pans horizontally instead of scaling down.
   */
  minWidth: number;
  children: ReactNode;
  className?: string;
  label: string;
};

/**
 * Horizontally pannable frame for a fixed-viewBox diagram.
 *
 * Scrollable regions need to be keyboard-reachable, so the container is focusable
 * and labelled; arrow keys then pan it. The hint only appears when the content is
 * genuinely wider than the frame, measured rather than guessed from a breakpoint —
 * the same diagram overflows at different viewport widths depending on which
 * column it lands in.
 */
export function DiagramFrame({ minWidth, children, className, label }: DiagramFrameProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    const measure = () => setOverflowing(node.scrollWidth > node.clientWidth + 1);
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /*
    `min-w-0` on both the wrapper and the scroller is load-bearing, not cosmetic.
    Without it the inner min-width propagates up through every `min-width: auto`
    ancestor as a min-content floor, stretching the grid track and giving the whole
    page a horizontal scrollbar instead of scrolling this frame alone.
  */
  return (
    <div className={cn('relative min-w-0', className)}>
      <div
        ref={scrollerRef}
        // Only focusable while there is actually something to scroll, so the frame
        // does not add an empty tab stop on wide screens.
        tabIndex={overflowing ? 0 : -1}
        role={overflowing ? 'region' : undefined}
        aria-label={overflowing ? `${label} — scrollable` : undefined}
        className="min-w-0 overflow-x-auto overscroll-x-contain"
      >
        <div style={{ minWidth }}>{children}</div>
      </div>

      {overflowing && (
        <p className="mono-label mt-2 text-fg-subtle">Scroll or drag the diagram sideways</p>
      )}
    </div>
  );
}
