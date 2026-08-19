import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useMediaQuery } from '@/hooks';
import { DiagramFrame } from './DiagramFrame';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { cn } from '@/utils/cn';

/* ────────────────────────────────────────────────────────────────────────────
   Multi-Agent Research Pipeline — LangGraph fan-out / fan-in

   Rendered as inline SVG driven by a small state machine rather than as an
   image, for three reasons: it stays sharp and themeable, it weighs a few kB,
   and stepping through it communicates the thing that actually matters about the
   architecture — that the two retrieval branches run concurrently.

   Playback is manual-first. It auto-plays once on first view (never on loop),
   and not at all under prefers-reduced-motion, where it renders complete.
   ──────────────────────────────────────────────────────────────────────────── */

type StageId = 'query' | 'decompose' | 'branch' | 'fuse' | 'report';

type Node = {
  id: StageId | 'search' | 'rag';
  label: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  /** Which pipeline stage lights this node up. */
  stage: number;
  tone: 'neutral' | 'a' | 'b';
};

const NODE_H = 46;

/** Layout is authored in a fixed 640×420 viewBox and scaled by the container. */
const NODES: readonly Node[] = [
  { id: 'query', label: 'User query', sub: 'research question', x: 240, y: 12, w: 160, stage: 0, tone: 'neutral' },
  { id: 'decompose', label: 'Query decomposition', sub: 'LangChain · Gemini 2.5 Flash', x: 200, y: 100, w: 240, stage: 1, tone: 'neutral' },
  { id: 'search', label: 'Web search agent', sub: 'Tavily · live results', x: 24, y: 196, w: 200, stage: 2, tone: 'a' },
  { id: 'rag', label: 'RAG agent', sub: 'ChromaDB · embeddings', x: 416, y: 196, w: 200, stage: 2, tone: 'b' },
  { id: 'fuse', label: 'Result fusion', sub: 'dedupe · keep provenance', x: 210, y: 292, w: 220, stage: 3, tone: 'neutral' },
  { id: 'report', label: 'Structured report', sub: 'cited · Markdown export', x: 210, y: 372, w: 220, stage: 4, tone: 'neutral' },
];

type Edge = {
  id: string;
  d: string;
  /** Stage at which this edge carries data. */
  stage: number;
  tone: 'neutral' | 'a' | 'b';
};

const EDGES: readonly Edge[] = [
  { id: 'q-d', d: 'M320 58 L320 100', stage: 1, tone: 'neutral' },
  { id: 'd-s', d: 'M320 146 L320 172 Q320 182 310 182 L134 182 Q124 182 124 192 L124 196', stage: 2, tone: 'a' },
  { id: 'd-r', d: 'M320 146 L320 172 Q320 182 330 182 L506 182 Q516 182 516 192 L516 196', stage: 2, tone: 'b' },
  { id: 's-f', d: 'M124 242 L124 268 Q124 278 134 278 L310 278 Q320 278 320 288 L320 292', stage: 3, tone: 'a' },
  { id: 'r-f', d: 'M516 242 L516 268 Q516 278 506 278 L330 278 Q320 278 320 288 L320 292', stage: 3, tone: 'b' },
  { id: 'f-o', d: 'M320 338 L320 372', stage: 4, tone: 'neutral' },
];

const STAGE_CAPTIONS = [
  'A single research question arrives.',
  'The graph splits it into independent sub-questions.',
  'Both retrieval agents run concurrently — LangGraph fan-out.',
  'Fan-in: fusion waits for every branch, then deduplicates evidence.',
  'A sectioned report with citations attached, exportable as Markdown.',
] as const;

const STAGE_MS = 1500;
const LAST_STAGE = STAGE_CAPTIONS.length - 1;

const TONE_STROKE: Record<Edge['tone'], string> = {
  neutral: 'var(--raw-accent)',
  a: 'var(--raw-viz-a)',
  b: 'var(--raw-viz-b)',
};

export function AgentPipelineDiagram() {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { ref, inView } = useInViewOnce<HTMLDivElement>({ threshold: 0.3 });
  // Unique marker-id prefix; a hard-coded id would collide with any other instance.
  const headId = useId().replace(/:/g, '');

  // Reduced motion starts complete: every stage lit, nothing moving.
  const [stage, setStage] = useState(reduceMotion ? LAST_STAGE : 0);
  const [playing, setPlaying] = useState(false);
  const autoPlayed = useRef(false);

  const play = useCallback(() => {
    setStage(0);
    setPlaying(true);
  }, []);

  // Auto-run exactly once, the first time the diagram is seen.
  useEffect(() => {
    if (!inView || reduceMotion || autoPlayed.current) return;
    autoPlayed.current = true;
    const id = window.setTimeout(() => setPlaying(true), 400);
    return () => window.clearTimeout(id);
  }, [inView, reduceMotion]);

  useEffect(() => {
    if (!playing) return;
    if (stage >= LAST_STAGE) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStage((current) => current + 1), STAGE_MS);
    return () => window.clearTimeout(id);
  }, [playing, stage]);

  const caption = STAGE_CAPTIONS[stage] ?? STAGE_CAPTIONS[0];

  const activeEdges = useMemo(
    () => new Set(EDGES.filter((edge) => edge.stage === stage).map((edge) => edge.id)),
    [stage],
  );

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <DiagramFrame
        minWidth={560}
        label="Research pipeline architecture diagram"
        className="rounded-xl border border-line bg-inset"
      >
        <div className="bg-lattice pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

        <svg
          viewBox="0 0 640 420"
          className="relative w-full"
          role="img"
          aria-label="Architecture: a user query is decomposed into sub-questions, which are researched in parallel by a Tavily web-search agent and a ChromaDB retrieval agent. LangGraph fans the branches back in to a fusion step, which produces a cited, structured report."
        >
          {/* One arrowhead per data-flow tone. Direction has to be readable in the
              static, reduced-motion render where the dash animation is absent. */}
          <defs>
            {(['neutral', 'a', 'b'] as const).map((tone) => (
              <marker
                key={tone}
                id={`${headId}-${tone}`}
                viewBox="0 0 8 8"
                refX={6.5}
                refY={4}
                markerWidth={5}
                markerHeight={5}
                orient="auto-start-reverse"
              >
                <path d="M0 1 L7 4 L0 7 Z" fill={TONE_STROKE[tone]} fillOpacity={0.85} />
              </marker>
            ))}
          </defs>

          {/* Edges first so nodes paint over the joins. */}
          <g fill="none" strokeWidth={1.25}>
            {EDGES.map((edge) => {
              const reached = stage >= edge.stage;
              const flowing = activeEdges.has(edge.id) && !reduceMotion;
              return (
                <g key={edge.id}>
                  <path
                    d={edge.d}
                    stroke="var(--raw-line-strong)"
                    strokeOpacity={reached ? 0 : 1}
                    className="transition-[stroke-opacity] duration-500"
                  />
                  <path
                    d={edge.d}
                    stroke={TONE_STROKE[edge.tone]}
                    strokeOpacity={reached ? 0.85 : 0}
                    strokeDasharray={flowing ? '5 11' : undefined}
                    markerEnd={reached ? `url(#${headId}-${edge.tone})` : undefined}
                    className={cn(
                      'transition-[stroke-opacity] duration-500',
                      flowing && 'animate-dash',
                    )}
                  />
                </g>
              );
            })}
          </g>

          {NODES.map((node) => {
            const lit = stage >= node.stage;
            const isCurrent = stage === node.stage;
            const stroke = node.tone === 'a'
              ? 'var(--raw-viz-a)'
              : node.tone === 'b'
                ? 'var(--raw-viz-b)'
                : 'var(--raw-accent)';

            return (
              <g key={node.id} className="transition-opacity duration-500" opacity={lit ? 1 : 0.32}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={NODE_H}
                  rx={8}
                  fill="var(--raw-surface)"
                  stroke={lit ? stroke : 'var(--raw-line-strong)'}
                  strokeOpacity={lit ? (isCurrent ? 1 : 0.5) : 1}
                  strokeWidth={isCurrent ? 1.5 : 1}
                  className="transition-all duration-500"
                />
                <text
                  x={node.x + node.w / 2}
                  y={node.y + 19}
                  textAnchor="middle"
                  className="fill-fg text-[12.5px] font-medium"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {node.label}
                </text>
                <text
                  x={node.x + node.w / 2}
                  y={node.y + 34}
                  textAnchor="middle"
                  className="fill-fg-subtle text-[10px]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {node.sub}
                </text>
              </g>
            );
          })}

          {/* The label that names the concurrency, since that is the point. */}
          <g opacity={stage >= 2 ? 1 : 0} className="transition-opacity duration-500">
            <text
              x={320}
              y={225}
              textAnchor="middle"
              className="fill-accent text-[9.5px]"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.14em' }}
            >
              PARALLEL
            </text>
            <text
              x={320}
              y={240}
              textAnchor="middle"
              className="fill-fg-subtle text-[9.5px]"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.14em' }}
            >
              FAN-OUT
            </text>
          </g>
        </svg>
      </DiagramFrame>

      {/* Controls + caption. A live region so the caption is announced as it changes. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => (playing ? setPlaying(false) : stage >= LAST_STAGE ? play() : setPlaying(true))}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 font-mono text-[0.6875rem] tracking-wider text-fg-muted uppercase transition-colors hover:border-accent-line hover:text-accent"
          >
            {playing ? <Pause size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
            {playing ? 'Pause' : stage >= LAST_STAGE ? 'Replay' : 'Play'}
          </button>
          <button
            type="button"
            onClick={play}
            aria-label="Restart the pipeline walkthrough"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-fg-muted transition-colors hover:border-accent-line hover:text-accent"
          >
            <RotateCcw size={12} aria-hidden="true" />
          </button>
        </div>

        {/* Stage dots double as direct navigation. */}
        <ol className="flex items-center gap-1.5" aria-label="Pipeline stages">
          {STAGE_CAPTIONS.map((text, index) => (
            <li key={text}>
              <button
                type="button"
                aria-label={`Stage ${index + 1}: ${text}`}
                aria-current={stage === index || undefined}
                onClick={() => {
                  setPlaying(false);
                  setStage(index);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  stage === index ? 'w-6 bg-accent' : 'w-1.5 bg-line-strong hover:bg-fg-subtle',
                )}
              />
            </li>
          ))}
        </ol>

        <p aria-live="polite" className="min-w-0 flex-1 text-[0.8125rem] text-fg-muted">
          <span className="font-mono text-[0.6875rem] text-fg-subtle">
            {String(stage + 1).padStart(2, '0')}/{String(LAST_STAGE + 1).padStart(2, '0')}
          </span>{' '}
          {caption}
        </p>
      </div>
    </div>
  );
}
