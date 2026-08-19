import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { TechBadge } from '@/components/ui/TechBadge';
import { SystemTopology } from '@/components/viz/SystemTopology';
import { company, experienceDomains } from '@/data/experience';
import { useMediaQuery } from '@/hooks';
import { cn } from '@/utils/cn';

/**
 * Experience as five engineering disciplines rather than a bullet list.
 *
 * The domain list is a real tablist: roving-tabindex keyboard support, arrow keys
 * to move, Home/End to jump. Selecting a domain also filters the system topology
 * beside it, so the reader sees where that discipline sits in a running system.
 */
export function Experience() {
  const [activeId, setActiveId] = useState(experienceDomains[0]!.id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const activeIndex = experienceDomains.findIndex((domain) => domain.id === activeId);
  const active = experienceDomains[activeIndex] ?? experienceDomains[0]!;

  const focusTab = (index: number) => {
    const bounded = (index + experienceDomains.length) % experienceDomains.length;
    setActiveId(experienceDomains[bounded]!.id);
    tabRefs.current[bounded]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusTab(index + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusTab(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(experienceDomains.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <Section id="experience" className="container-page py-24 sm:py-32">
      <SectionHeading
        id="experience"
        eyebrow="02 / Experience"
        title="One company, five disciplines, one production system."
        lede="Grouped by the kind of engineering rather than by chronology — three years at one company reads more usefully that way."
      />

      {/* Role header */}
      <Reveal className="mt-14">
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-title font-semibold">{company.name}</h3>
              <span aria-hidden="true" className="hidden h-4 w-px bg-line-strong sm:block" />
              <p className="font-medium text-fg-muted">{company.role}</p>
            </div>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-fg-muted">
              {company.context}
            </p>
          </div>
          <p className="mono-label shrink-0 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-fg-muted">
            {company.period}
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
        {/* Domain tabs + detail */}
        <div>
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Engineering domains"
            className="flex flex-col"
          >
            {experienceDomains.map((domain, index) => {
              const selected = domain.id === activeId;
              return (
                <button
                  key={domain.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${domain.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel-${domain.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(domain.id)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={cn(
                    'group relative flex items-start gap-4 border-b border-line py-4 text-left transition-colors duration-200 first:border-t',
                    selected ? 'text-fg' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  {/* Active rail. Absolutely positioned so it cannot shift the text. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-0 bottom-0 -left-px w-px transition-colors duration-300',
                      selected ? 'bg-accent' : 'bg-transparent',
                    )}
                  />
                  <span
                    className={cn(
                      'mt-1.5 w-6 shrink-0 font-mono text-[0.6875rem] transition-colors duration-200',
                      selected ? 'text-accent' : 'text-fg-subtle',
                    )}
                  >
                    {domain.index}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.0625rem] font-medium">{domain.title}</span>
                    {/* Hidden outright rather than faded: an invisible-but-laid-out
                        line left a phantom gap in the selected row on mobile. */}
                    {!selected && (
                      <span className="mt-0.5 block text-[0.8125rem] leading-snug text-fg-subtle">
                        {domain.tagline}
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    size={15}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className={cn(
                      'mt-1 shrink-0 transition-transform duration-300',
                      selected ? 'rotate-90 text-accent' : 'text-fg-subtle',
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Detail panel. Keying on the active id remounts it, which replays the
              CSS enter animation — no presence library and no exit delay between
              the click and the new content. */}
          <div className="relative mt-7">
            <div
                key={active.id}
                role="tabpanel"
                id={`${baseId}-panel-${active.id}`}
                aria-labelledby={`${baseId}-tab-${active.id}`}
                tabIndex={0}
                className={cn(
                  'rounded-xl border border-line bg-surface p-6',
                  !reduceMotion && 'animate-panel-in',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <p className="max-w-xl text-[0.9375rem] leading-relaxed text-fg">
                    {active.summary}
                  </p>
                  {active.metric && (
                    <p className="shrink-0 rounded-lg border border-accent-line bg-accent-soft px-3 py-2 text-right">
                      <span className="block font-mono text-lg leading-none font-medium text-accent">
                        {active.metric.value}
                      </span>
                      <span className="mt-1 block text-[0.6875rem] text-fg-muted">
                        {active.metric.label}
                      </span>
                    </p>
                  )}
                </div>

                <ul className="mt-6 space-y-3.5">
                  {active.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-[0.4375rem] size-1 shrink-0 rounded-full bg-accent"
                      />
                      <span className="text-[0.875rem] leading-relaxed text-fg-muted">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>

                <ul className="mt-6 flex flex-wrap gap-1.5 border-t border-line pt-5">
                  {active.stack.map((tech) => (
                    <li key={tech}>
                      <TechBadge label={tech} />
                    </li>
                  ))}
                </ul>
              </div>
          </div>
        </div>

        {/* Topology, filtered by the selected domain */}
        <Reveal delay={0.05} className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="mono-label text-fg-subtle">System topology</h3>
            <p className="font-mono text-[0.6875rem] text-fg-subtle">
              highlighting: {active.title.toLowerCase()}
            </p>
          </div>
          <SystemTopology activeDomain={active.id} />
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-fg-subtle">
            The same production system, filtered by the discipline selected on the left.
            Dashed edges are asynchronous.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
