import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { metrics } from '@/data/metrics';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { cn } from '@/utils/cn';

/**
 * Measured results only — every number here is backed by real work, and no
 * number was added to fill the grid. The bars encode the same value as the
 * figure, so the visual and the text can never disagree.
 */

function MetricCard({ metric, index }: { metric: (typeof metrics)[number]; index: number }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ threshold: 0.3 });
  const featured = index === 0;

  return (
    <Reveal
      delay={index * 0.05}
      className={cn(
        'group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-line bg-surface p-6 transition-colors duration-300 hover:border-line-strong',
        featured && 'lg:col-span-2',
      )}
    >
      <div ref={ref}>
        <p className="font-mono text-5xl leading-none font-medium tracking-tight text-fg sm:text-6xl">
          <AnimatedCounter
            value={metric.value}
            prefix={metric.prefix}
            suffix={metric.suffix}
            duration={1200 + index * 120}
          />
        </p>
        <p className="mt-4 text-[0.9375rem] font-medium text-fg">{metric.label}</p>
        <p className="mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-fg-muted">
          {metric.detail}
        </p>
      </div>

      <div className="mt-7">
        <div
          className="h-[3px] w-full overflow-hidden rounded-full bg-surface-2"
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-[1400ms] ease-out-expo"
            style={{ width: inView ? `${metric.fill * 100}%` : '0%' }}
          />
        </div>
        <p className="mono-label mt-3 text-fg-subtle">{metric.origin}</p>
      </div>
    </Reveal>
  );
}

export function Impact() {
  return (
    <Section id="impact" className="relative py-24 sm:py-32">
      {/* A full-bleed tinted band so the numbers read as a distinct chapter. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 border-y border-line bg-surface-2/40"
      />

      <div className="container-page relative">
        <SectionHeading
          id="impact"
          eyebrow="04 / Measured impact"
          title="Numbers I can account for."
          lede="Each figure came out of profiling a specific problem. Nothing here is an estimate made after the fact."
        />

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => (
            <MetricCard key={metric.id} metric={metric} index={index} />
          ))}
        </div>
      </div>
    </Section>
  );
}
