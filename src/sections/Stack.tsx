import { useState } from 'react';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { skillCategories, type Skill } from '@/data/skills';
import { cn } from '@/utils/cn';

/**
 * Technology ecosystem, answering "where did you use this?" rather than listing
 * logos.
 *
 * The detail is revealed by hover AND focus AND tap — each technology is a real
 * button feeding one shared explanation panel. A hover-only tooltip would be
 * unreachable by keyboard and unusable on touch, which is most recruiters.
 */

const TONE_TEXT = {
  a: 'text-viz-a',
  b: 'text-viz-b',
  c: 'text-viz-c',
} as const;

type Selection = { skill: Skill; category: string } | null;

export function Stack() {
  const [selection, setSelection] = useState<Selection>(null);
  const [pinned, setPinned] = useState<Selection>(null);

  // Hover previews; a click pins, so touch users get the same information.
  const shown = selection ?? pinned;

  return (
    <Section id="stack" className="container-page py-24 sm:py-32">
      <SectionHeading
        id="stack"
        eyebrow="06 / Stack"
        title="Technologies, and what I actually did with them."
        lede="Hover, focus or tap anything below to see where it was used. Highlighted entries are the ones I work in regularly."
      />

      <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8">
          {skillCategories.map((category, categoryIndex) => (
            <Reveal key={category.id} delay={Math.min(categoryIndex * 0.03, 0.15)}>
              <div className="border-t border-line pt-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="flex items-center gap-2">
                    <span aria-hidden="true" className={cn('text-[0.625rem]', TONE_TEXT[category.tone])}>
                      ●
                    </span>
                    <span className="mono-label text-fg">{category.label}</span>
                  </h3>
                  <p className="text-[0.8125rem] text-fg-subtle">{category.blurb}</p>
                </div>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {category.skills.map((skill) => {
                    const isShown = shown?.skill.name === skill.name;
                    return (
                      <li key={skill.name}>
                        <button
                          type="button"
                          aria-pressed={pinned?.skill.name === skill.name}
                          aria-describedby="stack-detail"
                          onMouseEnter={() => setSelection({ skill, category: category.label })}
                          onMouseLeave={() => setSelection(null)}
                          onFocus={() => setSelection({ skill, category: category.label })}
                          onBlur={() => setSelection(null)}
                          onClick={() =>
                            setPinned((current) =>
                              current?.skill.name === skill.name
                                ? null
                                : { skill, category: category.label },
                            )
                          }
                          className={cn(
                            'cursor-pointer rounded-lg border px-3 py-2 text-left text-[0.8125rem] transition-all duration-200',
                            isShown
                              ? 'border-accent-line bg-accent-soft text-fg'
                              : skill.core
                                ? 'border-line-strong bg-surface text-fg hover:border-accent-line'
                                : 'border-line bg-surface/60 text-fg-muted hover:border-line-strong hover:text-fg',
                          )}
                        >
                          {skill.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Explanation panel. One shared surface rather than N tooltips. */}
        <Reveal delay={0.06} className="lg:sticky lg:top-24 lg:self-start">
          <div
            id="stack-detail"
            aria-live="polite"
            className="rounded-xl border border-line bg-surface p-6 lg:min-h-56"
          >
            {shown ? (
              <>
                <p className="mono-label text-fg-subtle">{shown.category}</p>
                <p className="mt-3 text-title font-semibold">{shown.skill.name}</p>
                <p className="mt-3 text-[0.875rem] leading-relaxed text-fg-muted">
                  {shown.skill.note}
                </p>
                {shown.skill.core && (
                  <p className="mono-label mt-5 inline-flex items-center gap-2 rounded-md border border-accent-line bg-accent-soft px-2 py-1 text-accent">
                    Core technology
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mono-label text-fg-subtle">Detail</p>
                <p className="mt-3 text-[0.875rem] leading-relaxed text-fg-muted">
                  Select a technology to see where it was used in production. Everything
                  listed here appears in shipped work — nothing is here because it looks
                  good on a list.
                </p>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
