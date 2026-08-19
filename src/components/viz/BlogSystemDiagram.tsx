import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { useMediaQuery } from '@/hooks';
import { DiagramFrame } from './DiagramFrame';

/* ────────────────────────────────────────────────────────────────────────────
   Blogging platform — request path

   A comparison diagram rather than a boxes-and-arrows drawing. The toggle swaps
   between the cache-hit and cache-miss read paths, which is the only honest way
   to show what "~70% faster retrieval" actually means: the same request, two
   different amounts of work.

   The write path is drawn once and stays put, because the point about RabbitMQ is
   that it is the same either way — the interaction returns before fan-out runs.
   ──────────────────────────────────────────────────────────────────────────── */

type Mode = 'hit' | 'miss';

const MODES: Record<Mode, {
  label: string;
  caption: string;
  hops: readonly string[];
  tone: string;
  /** Relative width of the latency bar, 0–1. */
  cost: number;
  costLabel: string;
}> = {
  hit: {
    label: 'Cache hit',
    caption:
      'The post is in the Redis hot set. The request is answered from memory and never reaches MongoDB.',
    hops: ['client', 'api', 'redis'],
    tone: 'var(--raw-viz-a)',
    cost: 0.3,
    costLabel: 'memory read',
  },
  miss: {
    label: 'Cache miss',
    caption:
      'Redis has no entry, so the API queries MongoDB, writes the result back into the hot set, and the next reader gets a hit.',
    hops: ['client', 'api', 'redis', 'mongo', 'redis'],
    tone: 'var(--raw-viz-c)',
    cost: 1,
    costLabel: 'database round trip',
  },
};

type Box = {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const READ_BOXES: readonly Box[] = [
  { id: 'client', label: 'React client', sub: 'search / feed', x: 8, y: 20, w: 124, h: 52 },
  { id: 'api', label: 'Express API', sub: 'controller → service', x: 176, y: 20, w: 138, h: 52 },
  { id: 'redis', label: 'Redis', sub: 'top 100 posts', x: 358, y: 20, w: 118, h: 52 },
  { id: 'mongo', label: 'MongoDB', sub: 'source of truth', x: 358, y: 116, w: 118, h: 52 },
];

const WRITE_BOXES: readonly Box[] = [
  { id: 'write', label: 'Interaction', sub: 'like · comment · follow', x: 8, y: 20, w: 150, h: 52 },
  { id: 'queue', label: 'RabbitMQ', sub: 'returns immediately', x: 202, y: 20, w: 138, h: 52 },
  { id: 'consumer', label: 'Notification worker', sub: 'push fan-out', x: 384, y: 20, w: 158, h: 52 },
];

const MEDIA_BOXES: readonly Box[] = [
  { id: 'upload', label: 'Multer', sub: 'multipart intake', x: 8, y: 20, w: 124, h: 52 },
  { id: 's3', label: 'AWS S3 · Firebase', sub: 'binaries', x: 176, y: 20, w: 174, h: 52 },
  { id: 'db', label: 'MongoDB', sub: 'stores the URL only', x: 394, y: 20, w: 148, h: 52 },
];

function FlowBoxes({
  boxes,
  activeIds,
  tone,
  viewBox,
  label,
  arrows,
  animate,
  minWidth,
}: {
  boxes: readonly Box[];
  activeIds: readonly string[];
  tone: string;
  viewBox: string;
  label: string;
  arrows: readonly { d: string; active: boolean; dashed?: boolean }[];
  animate: boolean;
  minWidth: number;
}) {
  // Marker ids must be unique per instance — three lanes render on the page and a
  // duplicated id would make them all resolve to the first definition.
  const uid = useId().replace(/:/g, '');
  const headActive = `${uid}-head-on`;
  const headIdle = `${uid}-head-off`;

  return (
    <DiagramFrame minWidth={minWidth} label={label}>
    <svg viewBox={viewBox} className="w-full" role="img" aria-label={label}>
      <defs>
        {[
          { id: headActive, fill: tone, opacity: 0.9 },
          { id: headIdle, fill: 'var(--raw-line-strong)', opacity: 0.55 },
        ].map((head) => (
          <marker
            key={head.id}
            id={head.id}
            viewBox="0 0 8 8"
            refX={6.5}
            refY={4}
            markerWidth={5}
            markerHeight={5}
            orient="auto-start-reverse"
          >
            <path d="M0 1 L7 4 L0 7 Z" fill={head.fill} fillOpacity={head.opacity} />
          </marker>
        ))}
      </defs>

      <g fill="none" strokeWidth={1.25}>
        {arrows.map((arrow, index) => (
          <path
            key={index}
            d={arrow.d}
            stroke={arrow.active ? tone : 'var(--raw-line-strong)'}
            strokeOpacity={arrow.active ? 0.9 : 0.55}
            strokeDasharray={arrow.dashed ? '4 4' : arrow.active && animate ? '5 11' : undefined}
            markerEnd={`url(#${arrow.active ? headActive : headIdle})`}
            className={cn(
              'transition-[stroke,stroke-opacity] duration-400',
              arrow.active && animate && !arrow.dashed && 'animate-dash',
            )}
          />
        ))}
      </g>

      {boxes.map((box) => {
        const active = activeIds.includes(box.id);
        return (
          <g key={box.id}>
            <rect
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              rx={8}
              fill="var(--raw-surface)"
              stroke={active ? tone : 'var(--raw-line-strong)'}
              strokeOpacity={active ? 1 : 0.6}
              className="transition-[stroke,stroke-opacity] duration-400"
            />
            <text
              x={box.x + box.w / 2}
              y={box.y + 22}
              textAnchor="middle"
              className="fill-fg text-[12px] font-medium"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {box.label}
            </text>
            <text
              x={box.x + box.w / 2}
              y={box.y + 37}
              textAnchor="middle"
              className="fill-fg-subtle text-[9.5px]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {box.sub}
            </text>
          </g>
        );
      })}
    </svg>
    </DiagramFrame>
  );
}

function Lane({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-inset p-4">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="mono-label text-fg-subtle">{title}</h4>
        <p className="font-mono text-[0.6875rem] text-fg-subtle">{note}</p>
      </div>
      {children}
    </div>
  );
}

export function BlogSystemDiagram() {
  const [mode, setMode] = useState<Mode>('hit');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const config = MODES[mode];
  const isMiss = mode === 'miss';

  return (
    <div className="flex flex-col gap-3">
      {/* Read path — the part the toggle changes. */}
      <div className="rounded-xl border border-line bg-inset p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h4 className="mono-label text-fg-subtle">Read path</h4>

          <div
            role="radiogroup"
            aria-label="Read path scenario"
            className="inline-flex rounded-lg border border-line bg-surface p-0.5"
          >
            {(Object.keys(MODES) as Mode[]).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={mode === key}
                onClick={() => setMode(key)}
                className={cn(
                  'rounded-md px-3 py-1.5 font-mono text-[0.6875rem] tracking-wider uppercase transition-colors duration-200',
                  mode === key
                    ? 'bg-surface-2 text-fg shadow-[0_0_0_1px_var(--raw-line-strong)]'
                    : 'text-fg-subtle hover:text-fg-muted',
                )}
              >
                {MODES[key].label}
              </button>
            ))}
          </div>
        </div>

        <FlowBoxes
          viewBox="0 0 484 188"
          minWidth={460}
          label={`Read path, ${config.label.toLowerCase()}: ${config.caption}`}
          boxes={READ_BOXES}
          activeIds={config.hops}
          tone={config.tone}
          animate={!reduceMotion}
          arrows={[
            { d: 'M132 46 L176 46', active: true },
            { d: 'M314 46 L358 46', active: true },
            // Fall-through to Mongo and the write-back, only on a miss.
            { d: 'M400 72 L400 116', active: isMiss },
            { d: 'M434 116 L434 72', active: isMiss, dashed: true },
          ]}
        />

        {/* Relative cost bar: the honest version of the 70% claim. */}
        <div className="mt-4 flex items-center gap-3">
          <span className="font-mono text-[0.6875rem] text-fg-subtle">cost</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width,background-color] duration-500 ease-out-expo"
              style={{ width: `${config.cost * 100}%`, backgroundColor: config.tone }}
            />
          </div>
          <span className="font-mono text-[0.6875rem] whitespace-nowrap text-fg-muted">
            {config.costLabel}
          </span>
        </div>

        <p aria-live="polite" className="mt-3 text-[0.8125rem] leading-relaxed text-fg-muted">
          {config.caption}{' '}
          {mode === 'hit' && (
            <span className="text-fg">Repeat retrieval measured roughly 70% faster.</span>
          )}
        </p>
      </div>

      {/* Stacked, not side by side: at half-column width these 550-unit viewBoxes
          scaled down far enough to make their labels unreadable. */}
      <div className="grid grid-cols-1 gap-3">
        <Lane title="Write path" note="off the request path">
          <FlowBoxes
            viewBox="0 0 550 92"
            minWidth={520}
            label="Write path: an interaction publishes to RabbitMQ and returns immediately; a separate notification worker handles push fan-out."
            boxes={WRITE_BOXES}
            activeIds={['write', 'queue', 'consumer']}
            tone="var(--raw-viz-b)"
            animate={!reduceMotion}
            arrows={[
              { d: 'M158 46 L202 46', active: true },
              { d: 'M340 46 L384 46', active: true },
            ]}
          />
        </Lane>

        <Lane title="Media path" note="blobs out of the database">
          <FlowBoxes
            viewBox="0 0 550 92"
            minWidth={520}
            label="Media path: Multer handles multipart intake, binaries go to AWS S3 and Firebase, and MongoDB stores only the resulting URL."
            boxes={MEDIA_BOXES}
            activeIds={['upload', 's3', 'db']}
            tone="var(--raw-viz-a)"
            animate={false}
            arrows={[
              { d: 'M132 46 L176 46', active: true },
              { d: 'M350 46 L394 46', active: true },
            ]}
          />
        </Lane>
      </div>
    </div>
  );
}
