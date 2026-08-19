import { useEffect, useRef, useState } from 'react';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { useMediaQuery } from '@/hooks';

type AnimatedCounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Milliseconds for the full count. */
  duration?: number;
  className?: string;
};

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

/**
 * Counts up once, on first scroll into view.
 *
 * Written against requestAnimationFrame rather than a spring so the value is a
 * plain number the whole time: the accessible text stays correct mid-animation,
 * and there is no motion-value subscription per digit. Under reduced motion the
 * final value renders immediately.
 */
export function AnimatedCounter({
  value,
  prefix,
  suffix,
  duration = 1400,
  className,
}: AnimatedCounterProps) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { ref, inView } = useInViewOnce<HTMLSpanElement>({ threshold: 0.4 });
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(easeOutQuint(progress) * value));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [inView, reduceMotion, value, duration]);

  return (
    <span ref={ref} className={className}>
      {/*
        The animating digits are hidden from assistive tech and the settled value
        is exposed once, so a screen reader announces "40%" instead of every
        intermediate number.
      */}
      <span aria-hidden="true" className="tabular-nums">
        {prefix}
        {display.toLocaleString('en-US')}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {value.toLocaleString('en-US')}
        {suffix}
      </span>
    </span>
  );
}
