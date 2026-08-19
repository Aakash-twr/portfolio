import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Reveal } from './Reveal';

type SectionHeadingProps = {
  /** Matches the parent Section id so aria-labelledby resolves. */
  id: string;
  /** Monospace eyebrow, e.g. "02 / Experience". */
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Right-aligned slot for actions or a supporting note on wide screens. */
  aside?: ReactNode;
  className?: string;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  lede,
  aside,
  className,
}: SectionHeadingProps) {
  return (
    <header className={cn('relative', className)}>
      <Reveal>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-6 bg-accent" />
          <p className="mono-label text-accent">{eyebrow}</p>
        </div>
      </Reveal>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <Reveal delay={0.05}>
          <h2 id={`${id}-heading`} className="max-w-2xl text-headline font-semibold">
            {title}
          </h2>
        </Reveal>

        {(lede || aside) && (
          <Reveal delay={0.1} className="lg:max-w-sm lg:shrink-0">
            {lede && <p className="text-[0.9375rem] leading-relaxed text-fg-muted">{lede}</p>}
            {aside}
          </Reveal>
        )}
      </div>
    </header>
  );
}
