import { useEffect, useRef } from 'react';
import { useMediaQuery, useTheme, useVisibility } from '@/hooks';

/* ────────────────────────────────────────────────────────────────────────────
   Fleet telemetry field
   ---------------------------------------------------------------------------
   The hero backdrop: agents traversing a warehouse lattice, emitting telemetry
   packets that route back to a fleet hub. It is a deliberate reference to the
   work it sits above — and it is built the way that work had to be built.

   Performance contract, because a decorative canvas that drops frames would
   undercut the whole page:

     • One canvas, one rAF loop, zero React renders per frame.
     • Frames throttled to ~30fps with a time accumulator. Motion this slow
       gains nothing from 60 and halves the paint cost.
     • Device pixel ratio capped at 2 — beyond that the fill rate cost is real
       and the visual difference is not.
     • The loop is torn down completely when the hero scrolls away or the tab is
       hidden, rather than left spinning in the background.
     • prefers-reduced-motion renders a single static frame and never starts a
       loop at all.
   ──────────────────────────────────────────────────────────────────────────── */

const CELL = 58;
const TARGET_FPS = 30;
const FRAME_MS = 1000 / TARGET_FPS;
const MAX_DPR = 2;
const AGENT_COUNT = 7;
const PACKET_INTERVAL_MS = 1150;

type Vec = { x: number; y: number };

type Agent = {
  /** Lane coordinates, in grid cells. */
  col: number;
  row: number;
  /** Cell being travelled toward. */
  toCol: number;
  toRow: number;
  /** 0–1 along the current cell traversal. */
  t: number;
  speed: number;
  /** Rolling emit timer, ms. */
  emitAt: number;
};

type Packet = {
  from: Vec;
  /** L-shaped route: horizontal to the hub column, then vertical to its row. */
  corner: Vec;
  to: Vec;
  t: number;
  speed: number;
};

/** Deterministic pseudo-random so the field looks identical between reloads. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function FleetField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setRef, active } = useVisibility<HTMLDivElement>();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { theme } = useTheme();

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext('2d', { alpha: true });
    if (!context) return;

    // Rebound to non-nullable locals: TypeScript discards narrowing inside the
    // hoisted draw/layout closures below, and `ctx!` on every call would be noise.
    const canvas = canvasEl;
    const ctx = context;

    // Theme colours are read once per effect run from the same custom properties
    // the rest of the page uses, so the canvas can never drift from the palette.
    const rootStyle = getComputedStyle(document.documentElement);
    const readVar = (name: string) => rootStyle.getPropertyValue(name).trim();
    const palette = {
      grid: readVar('--raw-fg'),
      accent: readVar('--raw-accent'),
      viz: readVar('--raw-viz-b'),
      fg: readVar('--raw-fg'),
    };

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let dpr = 1;

    const random = makeRandom(20230701);
    const agents: Agent[] = [];
    const packets: Packet[] = [];
    let hub: Vec = { x: 0, y: 0 };
    let hubCol = 0;
    let hubRow = 0;
    let hubPulse = 0;

    const cellToPx = (col: number, row: number): Vec => ({
      x: col * CELL,
      y: row * CELL,
    });

    /** Rebuilds everything that depends on canvas size. */
    function layout() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = rect.width;
      height = rect.height;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);

      // The hub sits right-of-centre so it never lands behind the headline.
      hubCol = Math.max(2, Math.round(cols * 0.68));
      hubRow = Math.max(2, Math.round(rows * 0.42));
      hub = cellToPx(hubCol, hubRow);

      agents.length = 0;
      for (let i = 0; i < AGENT_COUNT; i += 1) {
        const col = 1 + Math.floor(random() * Math.max(cols - 2, 1));
        const row = 1 + Math.floor(random() * Math.max(rows - 2, 1));
        agents.push({
          col,
          row,
          toCol: col + (random() > 0.5 ? 1 : -1),
          toRow: row,
          t: random(),
          speed: 0.5 + random() * 0.45,
          emitAt: random() * PACKET_INTERVAL_MS,
        });
      }
      packets.length = 0;
    }

    /** Picks the next lane cell, preferring to continue straight. */
    function advance(agent: Agent) {
      const dCol = agent.toCol - agent.col;
      const dRow = agent.toRow - agent.row;
      agent.col = agent.toCol;
      agent.row = agent.toRow;
      agent.t = 0;

      const straight = { col: agent.col + dCol, row: agent.row + dRow };
      const inBounds = (c: number, r: number) => c >= 0 && c <= cols && r >= 0 && r <= rows;

      if (random() < 0.62 && inBounds(straight.col, straight.row)) {
        agent.toCol = straight.col;
        agent.toRow = straight.row;
        return;
      }

      // Turn 90°: swap the axis of travel, choosing a direction that stays on canvas.
      const options: Vec[] = dCol !== 0
        ? [
            { x: agent.col, y: agent.row + 1 },
            { x: agent.col, y: agent.row - 1 },
          ]
        : [
            { x: agent.col + 1, y: agent.row },
            { x: agent.col - 1, y: agent.row },
          ];
      const valid = options.filter((option) => inBounds(option.x, option.y));
      const next = valid.length > 0
        ? valid[Math.floor(random() * valid.length)]!
        : { x: agent.col - dCol, y: agent.row - dRow };

      agent.toCol = next.x;
      agent.toRow = next.y;
    }

    function agentPosition(agent: Agent): Vec {
      const from = cellToPx(agent.col, agent.row);
      const to = cellToPx(agent.toCol, agent.toRow);
      return { x: lerp(from.x, to.x, agent.t), y: lerp(from.y, to.y, agent.t) };
    }

    function emit(agent: Agent) {
      const from = agentPosition(agent);
      packets.push({
        from,
        corner: { x: hub.x, y: from.y },
        to: hub,
        t: 0,
        speed: 0.55 + random() * 0.35,
      });
    }

    function step(deltaMs: number) {
      const dt = deltaMs / 1000;

      for (const agent of agents) {
        agent.t += agent.speed * dt;
        while (agent.t >= 1) {
          agent.t -= 1;
          advance(agent);
        }

        agent.emitAt -= deltaMs;
        if (agent.emitAt <= 0) {
          agent.emitAt = PACKET_INTERVAL_MS + random() * PACKET_INTERVAL_MS * 2;
          if (packets.length < 14) emit(agent);
        }
      }

      for (let i = packets.length - 1; i >= 0; i -= 1) {
        const packet = packets[i]!;
        packet.t += packet.speed * dt;
        if (packet.t >= 1) {
          packets.splice(i, 1);
          hubPulse = 1;
        }
      }

      hubPulse = Math.max(0, hubPulse - dt * 1.6);
    }

    /** Position and current axis along the packet's two-segment route. */
    function packetPosition(packet: Packet): Vec & { axis: 'x' | 'y' } {
      const legOne = Math.abs(packet.corner.x - packet.from.x);
      const legTwo = Math.abs(packet.to.y - packet.corner.y);
      const split = legOne / (legOne + legTwo || 1);

      if (packet.t <= split) {
        const local = split === 0 ? 1 : packet.t / split;
        return {
          x: lerp(packet.from.x, packet.corner.x, local),
          y: packet.from.y,
          axis: 'x',
        };
      }
      const local = split === 1 ? 1 : (packet.t - split) / (1 - split);
      return {
        x: packet.corner.x,
        y: lerp(packet.corner.y, packet.to.y, local),
        axis: 'y',
      };
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      /* Lattice ---------------------------------------------------------- */
      ctx.globalAlpha = 1;
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c <= cols; c += 1) {
        const x = Math.round(c * CELL) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let r = 0; r <= rows; r += 1) {
        const y = Math.round(r * CELL) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.globalAlpha = 0.075;
      ctx.stroke();

      /* Hub tethers — faint links to nearby agents ----------------------- */
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1;
      for (const agent of agents) {
        const position = agentPosition(agent);
        const distance = Math.hypot(position.x - hub.x, position.y - hub.y);
        const reach = CELL * 4.5;
        if (distance > reach) continue;
        ctx.globalAlpha = 0.26 * (1 - distance / reach);
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(hub.x, hub.y);
        ctx.stroke();
      }

      /* Agents ----------------------------------------------------------- */
      for (const agent of agents) {
        const position = agentPosition(agent);
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = palette.fg;
        ctx.fillRect(position.x - 2.5, position.y - 2.5, 5, 5);
        ctx.globalAlpha = 0.26;
        ctx.strokeStyle = palette.fg;
        ctx.beginPath();
        ctx.arc(position.x, position.y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* Packets ---------------------------------------------------------- */
      for (const packet of packets) {
        const position = packetPosition(packet);
        // A short trail reads as direction without needing a motion blur pass.
        const trail = 13;
        ctx.globalAlpha = 0.62;
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        if (position.axis === 'x') {
          const back = packet.corner.x > packet.from.x ? -trail : trail;
          ctx.lineTo(position.x + back, position.y);
        } else {
          const back = packet.to.y > packet.corner.y ? -trail : trail;
          ctx.lineTo(position.x, position.y + back);
        }
        ctx.stroke();

        ctx.globalAlpha = 0.95;
        ctx.fillStyle = palette.accent;
        ctx.beginPath();
        ctx.arc(position.x, position.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Hub -------------------------------------------------------------- */
      ctx.globalAlpha = 0.45 + hubPulse * 0.5;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 11 + hubPulse * 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = palette.viz;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, CELL * 1.6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 1;
    }

    layout();

    const observer = new ResizeObserver(() => {
      layout();
      draw();
    });
    observer.observe(canvas);

    // Reduced motion: one composed frame, no loop, no timers.
    if (reduceMotion) {
      step(900);
      draw();
      return () => observer.disconnect();
    }

    // Scrolled past, or the tab is in the background: paint the current frame and
    // stop there. The effect re-runs and resumes when `active` flips back.
    if (!active) {
      draw();
      return () => observer.disconnect();
    }

    let raf = 0;
    let last = performance.now();
    let accumulator = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const delta = now - last;
      last = now;

      // Clamp so a backgrounded tab returning does not fast-forward the sim.
      accumulator += Math.min(delta, 120);
      if (accumulator < FRAME_MS) return;

      step(accumulator);
      accumulator = 0;
      draw();
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [active, reduceMotion, theme]);

  return (
    <div
      ref={setRef}
      className={className}
      // Purely decorative: the hero's meaning is entirely in its text.
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
