import { Suspense, lazy, useCallback, useState } from 'react';
import { Box, MousePointerClick, Rotate3d, Zap } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { fleet } from '@/data/fleet';
import { useMediaQuery, useVisibility } from '@/hooks';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { cn } from '@/utils/cn';

/*
  three.js and React Three Fiber together are by far the heaviest thing on this
  site. They live behind this one lazy boundary, so nothing about them — download,
  parse or execute — touches the initial page load.
*/
const FleetViewer3D = lazy(() => import('@/components/viz/FleetViewer3D'));

const STATUS_TONE = ['text-viz-a', 'text-viz-b', 'text-viz-c'] as const;
const STATUS_DOT = ['bg-viz-a', 'bg-viz-b', 'bg-viz-c'] as const;

/* Phrased for the input device actually in use — "scroll to zoom" is wrong advice
   on a phone, and telling someone to click when they can only tap reads as careless. */
const HINTS = {
  fine: [
    { icon: Rotate3d, label: 'Drag to orbit' },
    { icon: Box, label: 'Scroll to zoom' },
    { icon: MousePointerClick, label: 'Click a unit' },
  ],
  coarse: [
    { icon: Rotate3d, label: 'Drag to orbit' },
    { icon: Box, label: 'Pinch to zoom' },
    { icon: MousePointerClick, label: 'Tap a unit' },
  ],
} as const;

export function Spatial() {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const coarsePointer = useMediaQuery('(pointer: coarse)');
  const [launched, setLaunched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>('AMR-01');

  // First crossing decides whether to auto-load; `active` then tracks visibility
  // continuously so the render loop can be released on scroll-away.
  const { ref: gateRef, inView } = useInViewOnce<HTMLDivElement>({ threshold: 0.25 });
  const { setRef: setStageRef, active } = useVisibility<HTMLDivElement>();

  /*
    Auto-load on desktop once the section is reached; require an explicit gesture
    on small screens and when the browser has asked for reduced data. A recruiter
    on a laptop should not have to find a button to see the work; someone on a
    metered phone connection should not have a megabyte spent for them.
  */
  const saveData =
    typeof navigator !== 'undefined' &&
    // Not in every browser's typings, hence the narrow cast.
    Boolean((navigator as { connection?: { saveData?: boolean } }).connection?.saveData);

  const shouldLoad = launched || (isDesktop && inView && !saveData);
  const selected = fleet.find((robot) => robot.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string | null) => setSelectedId(id), []);

  return (
    <Section id="spatial" className="container-page py-24 sm:py-32">
      <SectionHeading
        id="spatial"
        eyebrow="03 / Spatial interfaces"
        title="Operators do not think in tables. They think in floor plans."
        lede="A rebuilt, simplified version of the kind of view I build at work — the warehouse, the units in it, and what each one is doing right now."
      />

      <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* Stage */}
        <Reveal>
          <div
            ref={gateRef}
            className="relative overflow-hidden rounded-xl border border-line bg-inset"
          >
            <div
              ref={setStageRef}
              className="relative aspect-4/3 w-full sm:aspect-video lg:aspect-4/3 xl:aspect-video"
            >
              {shouldLoad ? (
                <Suspense
                  fallback={
                    <div className="grid h-full place-items-center">
                      <p className="mono-label animate-pulse text-fg-subtle">
                        Loading renderer…
                      </p>
                    </div>
                  }
                >
                  <FleetViewer3D
                    running={active}
                    animate={!reduceMotion}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                  />
                </Suspense>
              ) : (
                /* Poster state — no 3D code has been fetched at this point. */
                <div className="bg-lattice grid h-full place-items-center p-8 text-center">
                  <div>
                    <p className="mono-label text-fg-subtle">React Three Fiber · three.js</p>
                    <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-fg-muted">
                      An interactive 3D warehouse with four autonomous units on live routes.
                      Loaded on demand so it never taxes the first visit.
                    </p>
                    <Button onClick={() => setLaunched(true)} className="mt-6" size="md">
                      <Zap size={15} strokeWidth={2} aria-hidden="true" />
                      Launch 3D viewer
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Interaction hints, only once there is something to interact with. */}
            {shouldLoad && (
              <ul className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-bg/70 px-4 py-2.5 backdrop-blur-sm">
                {(coarsePointer ? HINTS.coarse : HINTS.fine).map((hint) => (
                  <li key={hint.label} className="flex items-center gap-1.5">
                    <hint.icon
                      size={11}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="text-fg-subtle"
                    />
                    <span className="mono-label text-fg-subtle">{hint.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>

        {/* Telemetry rail. Rendered from plain data, so it works — and is the
            accessible equivalent of the scene — whether or not 3D ever loads. */}
        <Reveal delay={0.05} className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="mono-label text-fg-subtle">Fleet</h3>
              <p className="font-mono text-[0.6875rem] text-fg-subtle">{fleet.length} units</p>
            </div>

            <ul className="mt-4 space-y-1">
              {fleet.map((robot) => {
                const isSelected = robot.id === selectedId;
                return (
                  <li key={robot.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedId(isSelected ? null : robot.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors duration-200',
                        isSelected
                          ? 'border-accent-line bg-accent-soft'
                          : 'border-transparent hover:border-line hover:bg-surface-2',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT[robot.tone])}
                      />
                      <span className="flex-1 font-mono text-[0.8125rem] text-fg">{robot.id}</span>
                      <span className={cn('text-[0.6875rem]', STATUS_TONE[robot.tone])}>
                        {robot.status}
                      </span>
                      <span className="font-mono text-[0.6875rem] text-fg-subtle">
                        {robot.battery}%
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div
              aria-live="polite"
              className="mt-4 border-t border-line pt-4 text-[0.8125rem] leading-relaxed"
            >
              {selected ? (
                <>
                  <p className="font-mono text-[0.6875rem] tracking-widest text-fg-subtle uppercase">
                    Current task
                  </p>
                  <p className="mt-2 text-fg">{selected.task}</p>
                </>
              ) : (
                <p className="text-fg-muted">
                  Select a unit — in the list or in the scene — to see its assignment.
                </p>
              )}
            </div>
          </div>

          {/* The part a reviewing engineer will care about. */}
          <div className="mt-4 rounded-xl border border-line bg-surface p-5">
            <h3 className="mono-label text-fg-subtle">How it is loaded</h3>
            <ul className="mt-3 space-y-2.5 text-[0.8125rem] leading-relaxed text-fg-muted">
              <li>
                <span className="text-fg">Code-split behind one boundary.</span> three.js and
                React Three Fiber are absent from the initial bundle entirely.
              </li>
              <li>
                <span className="text-fg">Loop released, not hidden.</span> Scrolling past sets{' '}
                <code className="font-mono text-[0.75rem] text-fg-muted">frameloop=&quot;never&quot;</code>{' '}
                — the GPU stops rather than rendering invisible frames.
              </li>
              <li>
                <span className="text-fg">Adaptive resolution.</span> DPR is capped, then dropped
                automatically on sustained frame decline instead of tearing.
              </li>
              <li>
                <span className="text-fg">Gesture-gated on mobile and Save-Data.</span> No
                megabyte spent on a metered connection without being asked.
              </li>
            </ul>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.08}>
        <p className="mt-6 max-w-3xl text-[0.8125rem] leading-relaxed text-fg-subtle">
          Built for this site as a demonstration of the technique — the layout, the units and the
          telemetry are synthetic. The production system it refers to, and its data, belong to
          Seven Robotics.
        </p>
      </Reveal>
    </Section>
  );
}
