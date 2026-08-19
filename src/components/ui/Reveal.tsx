import type { CSSProperties, ReactNode } from 'react';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { useMediaQuery } from '@/hooks';
import { cn } from '@/utils/cn';

type RevealProps = {
  children: ReactNode;
  /** Seconds of stagger. Keep small — long chains feel like a loading screen. */
  delay?: number;
  className?: string;
  /** Distance travelled in px. 0 fades only. */
  y?: number;
  as?: 'div' | 'li' | 'span';
};

/**
 * Scroll-triggered entrance.
 *
 * Implemented as a CSS transition toggled by a single IntersectionObserver per
 * element, rather than with an animation library. The observed element animates
 * once on its first crossing and the observer disconnects; re-triggering reveals
 * on scroll-back is the fastest way to make a site feel gimmicky.
 *
 * Under prefers-reduced-motion the children render as plain markup with no
 * transition and no observer at all.
 */
export function Reveal({ children, delay = 0, className, y = 14, as: Tag = 'div' }: RevealProps) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { ref, inView } = useInViewOnce<HTMLElement>();

  if (reduceMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      // One ref type covers div/li/span; useInViewOnce only needs an Element.
      ref={ref as never}
      data-reveal=""
      data-visible={inView ? '' : undefined}
      className={cn(className)}
      style={
        {
          '--reveal-y': `${y}px`,
          '--reveal-delay': `${delay}s`,
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
