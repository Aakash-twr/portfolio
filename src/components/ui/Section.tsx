import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type SectionProps = {
  id: string;
  children: ReactNode;
  className?: string;
  /** Set when the section's own heading is not the labelling element. */
  ariaLabel?: string;
};

/**
 * Every content block is a landmark `<section>` labelled by its own heading, so
 * screen-reader users can jump between them via the rotor rather than reading
 * linearly.
 *
 * Header clearance for anchor jumps is handled once by `scroll-padding-top` on
 * `html` (see styles/index.css) rather than per-section scroll-margin — having
 * both stacked two offsets and over-scrolled every jump.
 */
export function Section({ id, children, className, ariaLabel }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabel ? undefined : `${id}-heading`}
      aria-label={ariaLabel}
      className={cn('relative', className)}
    >
      {children}
    </section>
  );
}
