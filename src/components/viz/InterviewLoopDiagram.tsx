import { useState } from 'react';
import { cn } from '@/utils/cn';
import { DiagramFrame } from './DiagramFrame';

/* ────────────────────────────────────────────────────────────────────────────
   Prep AI — where each step actually runs

   Drawn as vertical swimlanes rather than a flowchart, because the interesting
   property of this system is not the order of the steps (which is obvious) but
   which tier each one executes on: what stays on the device, what the framework
   guards, what goes to the model, and what gets persisted.

   Lanes are columns and the flow runs downward — vertical space is cheap on a
   scrolling page, horizontal space is not, so four legible columns beat seven
   cramped rows.
   ──────────────────────────────────────────────────────────────────────────── */

type LaneId = 'client' | 'app' | 'model' | 'data';

const LANES: readonly { id: LaneId; label: string; tone: string }[] = [
  { id: 'client', label: 'Browser', tone: 'var(--raw-viz-a)' },
  { id: 'app', label: 'Next.js · Clerk', tone: 'var(--raw-accent)' },
  { id: 'model', label: 'Gemini', tone: 'var(--raw-viz-b)' },
  { id: 'data', label: 'Neon · Drizzle', tone: 'var(--raw-viz-c)' },
];

type Step = {
  n: number;
  lane: LaneId;
  label: string;
  sub: string;
  /** Expanded explanation shown in the trace list. */
  detail: string;
};

const STEPS: readonly Step[] = [
  {
    n: 1,
    lane: 'client',
    label: 'Role brief',
    sub: 'role + experience',
    detail: 'The candidate describes the role they are preparing for, so questions are specific to it rather than drawn from a generic bank.',
  },
  {
    n: 2,
    lane: 'app',
    label: 'Protected route',
    sub: 'route matcher',
    detail: 'Clerk middleware guards everything under /dashboard with a route matcher, so session handling never becomes per-page code.',
  },
  {
    n: 3,
    lane: 'model',
    label: 'Generate questions',
    sub: 'JSON + references',
    detail: 'One Gemini call returns the question set as JSON, each question paired with a reference answer — the reference is what makes grading possible later.',
  },
  {
    n: 4,
    lane: 'data',
    label: 'Persist interview',
    sub: 'mockInterview row',
    detail: 'The set is stored against a generated mock id in Neon Postgres via Drizzle, so a session is a resumable, shareable record rather than component state.',
  },
  {
    n: 5,
    lane: 'client',
    label: 'Capture answer',
    sub: 'webcam + speech',
    detail: 'The webcam previews locally and the spoken answer is transcribed in the browser. No audio is uploaded, stored or transmitted — only the resulting text.',
  },
  {
    n: 6,
    lane: 'model',
    label: 'Grade answer',
    sub: 'rating + feedback',
    detail: 'The transcript and the stored reference answer go back to the model, which returns a rating and three-to-five lines of specific improvement notes as JSON.',
  },
  {
    n: 7,
    lane: 'data',
    label: 'Persist evaluation',
    sub: 'userAnswer row',
    detail: 'Question, reference, transcript, rating and feedback are written as one row, which is what lets the report be revisited long after the session ends.',
  },
  {
    n: 8,
    lane: 'client',
    label: 'Feedback report',
    sub: 'saved per question',
    detail: 'The saved evaluation is replayed as a per-question review — the part that makes practice compounding rather than one-off.',
  },
];

/* Geometry, authored once in viewBox units. */
const LANE_W = 134;
const LANE_GAP = 10;
const NODE_W = 122;
const NODE_H = 40;
const ROW_PITCH = 58;
const ROW_TOP = 54;
const laneX = (id: LaneId) => 8 + LANES.findIndex((lane) => lane.id === id) * (LANE_W + LANE_GAP);
const nodeX = (id: LaneId) => laneX(id) + (LANE_W - NODE_W) / 2;
const nodeY = (index: number) => ROW_TOP + index * ROW_PITCH;
const centreX = (id: LaneId) => laneX(id) + LANE_W / 2;

const LOOP_MARGIN = 26;
const VIEW_W = 8 + LANES.length * (LANE_W + LANE_GAP) + LOOP_MARGIN;
const VIEW_H = nodeY(STEPS.length - 1) + NODE_H + 16;

/** Loop bracket spans the per-question steps (5 → 7). */
const LOOP_FROM = 4;
const LOOP_TO = 6;

export function InterviewLoopDiagram() {
  const [focused, setFocused] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <DiagramFrame
        minWidth={580}
        label="Prep AI architecture diagram"
        className="rounded-xl border border-line bg-inset p-1"
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="relative w-full"
          role="img"
          aria-label="Swimlane architecture. In the browser: the candidate describes a role, and later records a spoken answer that is transcribed on-device. Next.js with Clerk middleware guards the dashboard routes. Gemini generates a question set with reference answers, and later grades each transcript against its reference. Neon Postgres with Drizzle persists the interview and each evaluation. Steps five to seven repeat for every question, and the stored evaluations are replayed as a feedback report."
        >
          <defs>
            <marker
              id="interview-loop-head"
              viewBox="0 0 8 8"
              refX={6.5}
              refY={4}
              markerWidth={5}
              markerHeight={5}
              orient="auto-start-reverse"
            >
              <path d="M0 1 L7 4 L0 7 Z" fill="var(--raw-accent)" fillOpacity={0.7} />
            </marker>
            <marker
              id="interview-head"
              viewBox="0 0 8 8"
              refX={6.5}
              refY={4}
              markerWidth={5}
              markerHeight={5}
              orient="auto-start-reverse"
            >
              <path d="M0 1 L7 4 L0 7 Z" fill="var(--raw-line-strong)" />
            </marker>
          </defs>

          {/* Lane columns */}
          {LANES.map((lane) => (
            <g key={lane.id}>
              <rect
                x={laneX(lane.id)}
                y={8}
                width={LANE_W}
                height={VIEW_H - 16}
                rx={10}
                fill="var(--raw-surface)"
                fillOpacity={0.5}
                stroke="var(--raw-line)"
              />
              <rect
                x={laneX(lane.id)}
                y={8}
                width={LANE_W}
                height={3}
                rx={1.5}
                fill={lane.tone}
                fillOpacity={0.7}
              />
              <text
                x={centreX(lane.id)}
                y={34}
                textAnchor="middle"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9.5px',
                  letterSpacing: '0.1em',
                }}
                className="fill-fg-subtle"
              >
                {lane.label.toUpperCase()}
              </text>
            </g>
          ))}

          {/* Sequence arrows: down out of one node, across, down into the next. */}
          <g fill="none" stroke="var(--raw-line-strong)" strokeWidth={1.15}>
            {STEPS.slice(0, -1).map((step, index) => {
              const next = STEPS[index + 1]!;
              const fromX = centreX(step.lane);
              const toX = centreX(next.lane);
              const y0 = nodeY(index) + NODE_H;
              const y1 = nodeY(index + 1);
              const mid = y0 + (y1 - y0) / 2;
              const d =
                fromX === toX
                  ? `M${fromX} ${y0} L${toX} ${y1}`
                  : `M${fromX} ${y0} L${fromX} ${mid} L${toX} ${mid} L${toX} ${y1}`;
              const active = focused === null || focused === step.n || focused === next.n;
              return (
                <path
                  key={step.n}
                  d={d}
                  markerEnd="url(#interview-head)"
                  strokeOpacity={active ? 0.75 : 0.15}
                  className="transition-[stroke-opacity] duration-300"
                />
              );
            })}
          </g>

          {/* Per-question loop: a return arrow in the reserved right margin, from
              the persist step back up to the capture step. */}
          <g fill="none" stroke="var(--raw-accent)" strokeOpacity={0.5} strokeWidth={1.15}>
            <path
              strokeDasharray="4 4"
              markerEnd="url(#interview-loop-head)"
              d={`M${VIEW_W - LOOP_MARGIN + 4} ${nodeY(LOOP_TO) + NODE_H / 2} L${VIEW_W - 12} ${nodeY(LOOP_TO) + NODE_H / 2} L${VIEW_W - 12} ${nodeY(LOOP_FROM) + NODE_H / 2} L${VIEW_W - LOOP_MARGIN + 4} ${nodeY(LOOP_FROM) + NODE_H / 2}`}
            />
          </g>
          <text
            transform={`rotate(90 ${VIEW_W - 5} ${(nodeY(LOOP_FROM) + nodeY(LOOP_TO) + NODE_H) / 2})`}
            x={VIEW_W - 5}
            y={(nodeY(LOOP_FROM) + nodeY(LOOP_TO) + NODE_H) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.12em' }}
            className="fill-accent"
          >
            PER QUESTION
          </text>

          {/* Step nodes */}
          {STEPS.map((step, index) => {
            const lane = LANES.find((item) => item.id === step.lane)!;
            const dimmed = focused !== null && focused !== step.n;
            return (
              <g
                key={step.n}
                opacity={dimmed ? 0.3 : 1}
                className="transition-opacity duration-300"
              >
                <rect
                  x={nodeX(step.lane)}
                  y={nodeY(index)}
                  width={NODE_W}
                  height={NODE_H}
                  rx={7}
                  fill="var(--raw-surface)"
                  stroke={focused === step.n ? lane.tone : 'var(--raw-line-strong)'}
                  strokeWidth={focused === step.n ? 1.5 : 1}
                />
                <text
                  x={nodeX(step.lane) + NODE_W - 7}
                  y={nodeY(index) + 14}
                  textAnchor="end"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}
                  fill={lane.tone}
                >
                  {String(step.n).padStart(2, '0')}
                </text>
                <text
                  x={nodeX(step.lane) + 8}
                  y={nodeY(index) + 18}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500 }}
                  className="fill-fg"
                >
                  {step.label}
                </text>
                <text
                  x={nodeX(step.lane) + 8}
                  y={nodeY(index) + 32}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px' }}
                  className="fill-fg-subtle"
                >
                  {step.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </DiagramFrame>

      {/* Trace list. The diagram is legible at rest; this is the way to read one
          step closely, and it is what makes the whole thing keyboard-reachable. */}
      <ol className="grid gap-1.5 sm:grid-cols-2">
        {STEPS.map((step) => {
          const isFocused = focused === step.n;
          const lane = LANES.find((item) => item.id === step.lane)!;
          return (
            <li key={step.n}>
              <button
                type="button"
                aria-pressed={isFocused}
                onMouseEnter={() => setFocused(step.n)}
                onMouseLeave={() => setFocused(null)}
                onFocus={() => setFocused(step.n)}
                onBlur={() => setFocused(null)}
                onClick={() => setFocused(isFocused ? null : step.n)}
                className={cn(
                  'flex w-full gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors duration-200',
                  isFocused
                    ? 'border-accent-line bg-accent-soft'
                    : 'border-transparent hover:border-line hover:bg-surface-2',
                )}
              >
                <span
                  className="shrink-0 font-mono text-[0.625rem] leading-5"
                  style={{ color: lane.tone }}
                >
                  {String(step.n).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[0.8125rem] font-medium text-fg">{step.label}</span>
                    <span
                      className="font-mono text-[0.625rem] tracking-wider uppercase"
                      style={{ color: lane.tone }}
                    >
                      {lane.label}
                    </span>
                  </span>
                  {isFocused && (
                    <span className="mt-1 block text-[0.75rem] leading-relaxed text-fg-muted">
                      {step.detail}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
