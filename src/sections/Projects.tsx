import { Suspense, lazy, useId, useState } from 'react';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { TechBadge } from '@/components/ui/TechBadge';
import { GitHubIcon } from '@/components/ui/BrandIcons';
import { projects, type CaseStudyChapter, type Project } from '@/data/projects';
import { isPlaceholder } from '@/config/site';
import { useMediaQuery } from '@/hooks';
import { cn } from '@/utils/cn';

/*
  Both diagrams are lazily loaded. They are the heaviest components on the page
  and they live well below the fold, so there is no reason for them to be in the
  initial bundle.
*/
const AgentPipelineDiagram = lazy(() =>
  import('@/components/viz/AgentPipelineDiagram').then((mod) => ({
    default: mod.AgentPipelineDiagram,
  })),
);
const BlogSystemDiagram = lazy(() =>
  import('@/components/viz/BlogSystemDiagram').then((mod) => ({
    default: mod.BlogSystemDiagram,
  })),
);
const InterviewLoopDiagram = lazy(() =>
  import('@/components/viz/InterviewLoopDiagram').then((mod) => ({
    default: mod.InterviewLoopDiagram,
  })),
);

function DiagramSkeleton() {
  return (
    <div
      className="h-80 animate-pulse rounded-xl border border-line bg-inset"
      aria-hidden="true"
    />
  );
}

function Diagram({ kind }: { kind: NonNullable<Project['diagram']> }) {
  return (
    <Suspense fallback={<DiagramSkeleton />}>
      {kind === 'agent-pipeline' && <AgentPipelineDiagram />}
      {kind === 'interview-loop' && <InterviewLoopDiagram />}
      {kind === 'blog-system' && <BlogSystemDiagram />}
    </Suspense>
  );
}

/**
 * Stands in for a diagram on projects that do not warrant one. A backend
 * repository's substance is in its patterns, not in a picture of three boxes.
 */
function PatternsPanel({ patterns }: { patterns: NonNullable<Project['patterns']> }) {
  return (
    <div className="rounded-xl border border-line bg-inset p-5 sm:p-6">
      <h4 className="mono-label text-fg-subtle">Patterns worth pointing at</h4>
      <ul className="mt-5 space-y-5">
        {patterns.map((pattern, index) => (
          <li key={pattern.label} className="flex gap-4">
            <span className="mt-0.5 shrink-0 font-mono text-[0.6875rem] text-accent">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-medium text-fg">{pattern.label}</p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-fg-muted">
                {pattern.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChapterBody({ chapter }: { chapter: CaseStudyChapter }) {
  if (chapter.body) {
    return (
      <div className="max-w-[62ch] space-y-4">
        {chapter.body.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="text-[0.9375rem] leading-relaxed text-fg-muted">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  return (
    <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {chapter.points?.map((point) => (
        <li key={point.title} className="border-l border-line pl-4">
          <p className="text-[0.9375rem] font-medium text-fg">{point.title}</p>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-fg-muted">{point.detail}</p>
        </li>
      ))}
    </ul>
  );
}

function CaseStudy({ project }: { project: Project }) {
  const [chapterId, setChapterId] = useState<CaseStudyChapter['id']>(project.chapters[0]!.id);
  const baseId = useId();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const chapter = project.chapters.find((item) => item.id === chapterId) ?? project.chapters[0]!;
  const repoUnresolved = isPlaceholder(project.repoUrl);

  return (
    <article className="relative border-t border-line pt-12 first:border-t-0 first:pt-0">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-14">
        {/* Left rail: identity, stack, links */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[0.6875rem] text-accent">{project.index}</span>
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
              <span className="mono-label text-fg-subtle">{project.year}</span>
            </div>

            <h3 className="mt-5 text-[clamp(1.5rem,2.6vw,2.125rem)] leading-[1.1] font-semibold tracking-tight">
              {project.title}
            </h3>
            <p className="mono-label mt-3 text-fg-subtle">{project.kind}</p>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-fg-muted">{project.lede}</p>
          </Reveal>

          <Reveal delay={0.05}>
            <ul className="mt-7 flex flex-wrap gap-1.5">
              {project.stack.map((tech) => (
                <li key={tech}>
                  <TechBadge label={tech} />
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <a
                href={repoUnresolved ? undefined : project.repoUrl}
                aria-disabled={repoUnresolved || undefined}
                title={
                  repoUnresolved
                    ? 'Add the repository URL in src/data/projects.ts'
                    : `${project.title} source on GitHub`
                }
                {...(repoUnresolved ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 text-[0.8125rem] font-medium transition-colors duration-200',
                  repoUnresolved
                    ? 'cursor-not-allowed text-fg-subtle opacity-60'
                    : 'text-fg hover:border-accent-line hover:text-accent',
                )}
              >
                <GitHubIcon size={15} />
                Source
                {!repoUnresolved && <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />}
              </a>

              {/* Rendered only when a demo genuinely exists. */}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 text-[0.8125rem] font-medium text-fg transition-colors duration-200 hover:border-accent-line hover:text-accent"
                >
                  <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
                  Live demo
                </a>
              )}
            </div>
          </Reveal>
        </div>

        {/* Right: diagram + case-study chapters */}
        <div>
          <Reveal delay={0.04}>
            {project.diagram ? (
              <Diagram kind={project.diagram} />
            ) : project.patterns ? (
              <PatternsPanel patterns={project.patterns} />
            ) : null}
          </Reveal>

          <Reveal delay={0.06} className="mt-10">
            <div
              role="tablist"
              aria-label={`${project.title} case study`}
              className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line"
            >
              {project.chapters.map((item) => {
                const selected = item.id === chapterId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${item.id}`}
                    aria-selected={selected}
                    aria-controls={`${baseId}-panel-${item.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setChapterId(item.id)}
                    className={cn(
                      'relative -mb-px cursor-pointer border-b-2 pb-3 font-mono text-[0.6875rem] tracking-widest uppercase transition-colors duration-200',
                      selected
                        ? 'border-accent text-accent'
                        : 'border-transparent text-fg-subtle hover:text-fg-muted',
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 min-h-52">
              {/* Keyed so a chapter change remounts and replays the enter animation. */}
              <div
                key={chapter.id}
                role="tabpanel"
                id={`${baseId}-panel-${chapter.id}`}
                aria-labelledby={`${baseId}-tab-${chapter.id}`}
                tabIndex={0}
                className={cn(!reduceMotion && 'animate-panel-in')}
              >
                <ChapterBody chapter={chapter} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </article>
  );
}

export function Projects() {
  return (
    <Section id="projects" className="container-page py-24 sm:py-32">
      <SectionHeading
        id="projects"
        eyebrow="05 / Selected work"
        title="Four systems, documented the way I would document them for a team."
        lede="Problem, architecture, the decisions that were actually contested, and what came out of it. The diagrams are interactive — they explain these designs faster than prose can."
      />

      <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">
        {projects.map((project) => (
          <CaseStudy key={project.id} project={project} />
        ))}
      </div>
    </Section>
  );
}
