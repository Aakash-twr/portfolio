import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { DiagramFrame } from './DiagramFrame';

/* ────────────────────────────────────────────────────────────────────────────
   System topology

   The production system at Seven Robotics, drawn once. Selecting an engineering
   domain in the experience section dims everything that domain does not touch,
   so the reader sees where each discipline lives in a running system instead of
   reading five disconnected lists.

   Highlighting is derived from the domain id, not duplicated per domain, so the
   diagram and the copy cannot drift apart.
   ──────────────────────────────────────────────────────────────────────────── */

type TopologyNode = {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Experience-domain ids that light this node. */
  domains: readonly string[];
};

type TopologyEdge = {
  from: string;
  to: string;
  d: string;
  label?: string;
  labelX?: number;
  labelY?: number;
  domains: readonly string[];
  /** Dashed = asynchronous / out-of-band. */
  async?: boolean;
};

const NODES: readonly TopologyNode[] = [
  { id: 'spa', label: 'Operator SPA', sub: 'React 18 · TypeScript', x: 14, y: 60, w: 148, h: 56, domains: ['frontend', 'performance'] },
  { id: 'map', label: '3D map + canvas', sub: 'Three.js · 60fps', x: 14, y: 148, w: 148, h: 56, domains: ['frontend', 'performance'] },
  { id: 'store', label: 'RTK Query cache', sub: 'normalised · optimistic', x: 14, y: 236, w: 148, h: 56, domains: ['frontend', 'performance'] },

  { id: 'api', label: 'Express API', sub: 'controller · service · repo', x: 236, y: 60, w: 168, h: 56, domains: ['backend'] },
  { id: 'ws', label: 'Socket.IO / WS', sub: 'task + event stream', x: 236, y: 148, w: 168, h: 56, domains: ['realtime'] },
  { id: 'rtc', label: 'WebRTC', sub: 'live camera feeds', x: 236, y: 236, w: 168, h: 56, domains: ['realtime'] },

  { id: 'queue', label: 'RabbitMQ', sub: 'async jobs · events', x: 470, y: 148, w: 152, h: 56, domains: ['realtime', 'backend'] },
  { id: 'redis', label: 'Redis', sub: 'hot-read cache', x: 470, y: 60, w: 152, h: 56, domains: ['backend', 'infra'] },
  { id: 'db', label: 'MongoDB / MySQL', sub: 'dedicated EC2 instance', x: 470, y: 236, w: 152, h: 56, domains: ['backend', 'infra'] },

  { id: 'robots', label: 'Robot fleet', sub: 'autonomous mobile units', x: 236, y: 324, w: 168, h: 56, domains: ['realtime'] },
];

const EDGES: readonly TopologyEdge[] = [
  { from: 'spa', to: 'api', d: 'M162 88 L236 88', label: 'REST', labelX: 199, labelY: 80, domains: ['frontend', 'backend'] },
  { from: 'store', to: 'api', d: 'M162 264 Q199 264 199 176 Q199 88 236 88', domains: ['frontend', 'performance', 'backend'] },
  { from: 'ws', to: 'spa', d: 'M236 176 Q199 176 199 132 Q199 116 162 116', label: 'push', labelX: 190, labelY: 145, domains: ['realtime', 'frontend'] },
  { from: 'rtc', to: 'map', d: 'M236 264 Q190 264 190 220 Q190 190 162 190', domains: ['realtime', 'frontend'] },
  { from: 'api', to: 'redis', d: 'M404 88 L470 88', label: 'cache', labelX: 437, labelY: 80, domains: ['backend', 'infra'] },
  { from: 'api', to: 'db', d: 'M404 100 Q437 100 437 264 L470 264', domains: ['backend', 'infra'] },
  { from: 'api', to: 'queue', d: 'M404 110 Q430 110 430 176 L470 176', label: 'publish', labelX: 434, labelY: 140, domains: ['backend', 'realtime'], async: true },
  { from: 'ws', to: 'queue', d: 'M404 176 L470 176', domains: ['realtime'], async: true },
  { from: 'robots', to: 'ws', d: 'M320 324 L320 204', label: 'telemetry', labelX: 320, labelY: 268, domains: ['realtime'] },
  { from: 'robots', to: 'rtc', d: 'M290 324 Q290 300 290 292', domains: ['realtime'] },
];

/** Infrastructure is drawn as an enclosure rather than a node — it contains the rest. */
const INFRA_BOX = { x: 216, y: 26, w: 424, h: 372 };

type SystemTopologyProps = {
  /** Experience-domain id currently selected, or null for the whole system. */
  activeDomain: string | null;
  className?: string;
};

export function SystemTopology({ activeDomain, className }: SystemTopologyProps) {
  const { litNodes, litEdges } = useMemo(() => {
    if (!activeDomain) {
      return {
        litNodes: new Set(NODES.map((node) => node.id)),
        litEdges: new Set(EDGES.map((edge) => `${edge.from}-${edge.to}`)),
      };
    }
    return {
      litNodes: new Set(
        NODES.filter((node) => node.domains.includes(activeDomain)).map((node) => node.id),
      ),
      litEdges: new Set(
        EDGES.filter((edge) => edge.domains.includes(activeDomain)).map(
          (edge) => `${edge.from}-${edge.to}`,
        ),
      ),
    };
  }, [activeDomain]);

  const infraLit = !activeDomain || activeDomain === 'infra';

  return (
    <DiagramFrame
      minWidth={580}
      label="System topology diagram"
      className={cn('rounded-xl border border-line bg-inset', className)}
    >
      <div className="bg-lattice pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />

      <svg
        viewBox="0 0 660 412"
        className="relative w-full"
        role="img"
        aria-label="System topology: a React operator SPA talks to an Express API over REST and receives task events over Socket.IO and camera feeds over WebRTC. The API caches hot reads in Redis, persists to MongoDB and MySQL, and publishes asynchronous work to RabbitMQ. The backend services run in Docker containers on AWS EC2 inside a configured VPC. Robots in the fleet stream telemetry into the real-time layer."
      >
        {/* Infra enclosure */}
        <g className="transition-opacity duration-400" opacity={infraLit ? 1 : 0.28}>
          <rect
            x={INFRA_BOX.x}
            y={INFRA_BOX.y}
            width={INFRA_BOX.w}
            height={INFRA_BOX.h}
            rx={12}
            fill="none"
            stroke={activeDomain === 'infra' ? 'var(--raw-viz-c)' : 'var(--raw-line-strong)'}
            strokeDasharray="3 5"
          />
          <text
            x={INFRA_BOX.x + 12}
            y={INFRA_BOX.y + 16}
            className={activeDomain === 'infra' ? 'fill-viz-c' : 'fill-fg-subtle'}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.12em' }}
          >
            DOCKER · AWS EC2 · VPC
          </text>
        </g>

        {/* Edges */}
        <g fill="none" strokeWidth={1.25}>
          {EDGES.map((edge) => {
            const key = `${edge.from}-${edge.to}`;
            const lit = litEdges.has(key);
            return (
              <g key={key} className="transition-opacity duration-400" opacity={lit ? 1 : 0.16}>
                <path
                  d={edge.d}
                  stroke={lit ? 'var(--raw-accent)' : 'var(--raw-line-strong)'}
                  strokeOpacity={lit ? 0.7 : 1}
                  strokeDasharray={edge.async ? '4 4' : undefined}
                />
                {edge.label && (
                  <text
                    x={edge.labelX}
                    y={edge.labelY}
                    textAnchor="middle"
                    className="fill-fg-subtle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.06em' }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        {NODES.map((node) => {
          const lit = litNodes.has(node.id);
          return (
            <g key={node.id} className="transition-opacity duration-400" opacity={lit ? 1 : 0.26}>
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx={9}
                fill="var(--raw-surface)"
                stroke={lit && activeDomain ? 'var(--raw-accent)' : 'var(--raw-line-strong)'}
                strokeOpacity={lit && activeDomain ? 0.8 : 1}
                className="transition-[stroke,stroke-opacity] duration-400"
              />
              <text
                x={node.x + node.w / 2}
                y={node.y + 24}
                textAnchor="middle"
                className="fill-fg"
                style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500 }}
              >
                {node.label}
              </text>
              <text
                x={node.x + node.w / 2}
                y={node.y + 39}
                textAnchor="middle"
                className="fill-fg-subtle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px' }}
              >
                {node.sub}
              </text>
            </g>
          );
        })}
      </svg>
    </DiagramFrame>
  );
}
