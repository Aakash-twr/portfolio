import { lazy, Suspense } from 'react';
import { ArrowDown, Download, FileText } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { useMediaQuery } from '@/hooks';
import { RESUME_URL, site } from '@/config/site';
import { cn } from '@/utils/cn';

/*
  The canvas backdrop is code-split and only mounted on screens wide enough for it
  to read as anything. On a 390px phone it would be a battery cost with no visual
  payoff, so it is never even downloaded there.
*/
const FleetField = lazy(() =>
  import('@/components/viz/FleetField').then((mod) => ({ default: mod.FleetField })),
);

const QUICK_FACTS: readonly { term: string; detail: string }[] = [
  { term: 'Focus', detail: 'Frontend architecture · real-time systems' },
  { term: 'Experience', detail: `${site.yearsExperience} years, production` },
  { term: 'Currently', detail: `${site.role}, ${site.company}` },
  { term: 'Stack', detail: 'React · TypeScript · Node.js · AWS' },
];

export function Hero() {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const showCanvas = useMediaQuery('(min-width: 768px)');

  /*
    Staggered entrance via one CSS keyframe plus a per-element animation-delay,
    rather than an orchestrated JS timeline. It costs nothing at runtime, and under
    reduced motion no animation class is applied at all — the hero renders settled.
  */
  const rise = (delay: number, className: string) =>
    reduceMotion
      ? { className }
      : { className: cn('animate-rise', className), style: { animationDelay: `${delay}s` } };

  return (
    <section
      id="work"
      aria-label="Introduction"
      className="relative flex min-h-[92svh] items-center overflow-hidden pt-28 pb-20 sm:pt-32"
    >
      {showCanvas && (
        <Suspense fallback={null}>
          <FleetField className="pointer-events-none absolute inset-0 -z-10" />
        </Suspense>
      )}

      {/* Readability scrim + vignette, painted over the canvas so type contrast is
          guaranteed rather than a matter of where the agents happen to be. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 80% at 8% 42%, var(--raw-bg) 8%, color-mix(in oklab, var(--raw-bg) 78%, transparent) 46%, transparent 72%), linear-gradient(to bottom, transparent 55%, var(--raw-bg) 100%)',
        }}
      />

      <div className="container-page relative">
        <div {...rise(0, '')}>
          <p className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/80 py-1.5 pr-4 pl-2.5 backdrop-blur-sm">
            <span className="relative flex size-2 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute size-2 animate-pulse-ring rounded-full bg-accent"
              />
              <span className="size-2 rounded-full bg-accent" />
            </span>
            <span className="mono-label text-fg-muted">{site.availability.label}</span>
          </p>
        </div>

        <h1 {...rise(0.06, 'mt-8 text-display font-semibold text-gradient-fg')}>Akash Tiwary</h1>

        <p {...rise(0.12, 'mt-5 max-w-3xl text-title font-medium text-balance text-fg-muted')}>
          Full Stack Developer building{' '}
          <span className="text-fg">high-performance interfaces</span> and the{' '}
          <span className="text-fg">real-time systems</span> behind them.
        </p>

        <p {...rise(0.18, 'mt-7 max-w-2xl text-lede text-fg-muted')}>
          I work on software for autonomous mobile robots — React and TypeScript
          consoles that hold 60fps under live telemetry, Node.js services moving robot
          events across WebSockets and queues, and the AWS infrastructure they run on.
        </p>

        <div {...rise(0.24, 'mt-10 flex flex-wrap items-center gap-3')}>
          <ButtonLink href="#projects" size="lg">
            View projects
            <ArrowDown
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-y-0.5"
            />
          </ButtonLink>

          <ButtonLink href={RESUME_URL} variant="secondary" size="lg" download>
            <Download size={16} strokeWidth={1.75} aria-hidden="true" />
            Download resume
          </ButtonLink>

          <SocialLinks only={['github', 'linkedin']} className="ml-1" />
        </div>

        {/* Quick facts: the 20-second answer, in scannable form. */}
        <dl
          {...rise(
            0.3,
            'mt-14 grid max-w-4xl grid-cols-1 gap-x-8 gap-y-5 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4',
          )}
        >
          {QUICK_FACTS.map((fact) => (
            <div key={fact.term}>
              <dt className="mono-label text-fg-subtle">{fact.term}</dt>
              <dd className="mt-2 text-sm leading-snug font-medium text-fg">{fact.detail}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Scroll affordance. Decorative — the CTA above already does the job. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 lg:flex"
      >
        <FileText size={11} strokeWidth={1.75} className="text-fg-subtle" />
        <span className="mono-label text-fg-subtle">Scroll for the case studies</span>
      </div>
    </section>
  );
}
