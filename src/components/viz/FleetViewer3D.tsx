import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  ACESFilmicToneMapping,
  Color,
  PCFShadowMap,
  DoubleSide,
  HalfFloatType,
  MathUtils,
  Object3D,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
} from 'three';
// three ships all of these in its own examples, with types. Using them directly is
// why this scene needs no postprocessing or helper library.
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FLOOR_SIZE, LANE, crates, fleet, racks, type RobotSpec } from '@/data/fleet';

/* ────────────────────────────────────────────────────────────────────────────
   Fleet viewer — React Three Fiber

   A rebuilt, simplified version of the class of interface I work on at Seven
   Robotics: a 3D view of a warehouse with autonomous mobile robots moving through
   it, where selecting a unit surfaces its telemetry.

   This is a demonstration built for this site — not the proprietary product. The
   layout and the telemetry are synthetic.

   ── What is actually going on in here ──────────────────────────────────────
   • The floor grid is GLSL injected into MeshStandardMaterial via onBeforeCompile,
     so it keeps three's lighting, shadows and fog while drawing a procedural grid.
     Screen-space derivatives (`fwidth`) hold the lines at a constant ~1px at every
     distance and angle — which line geometry, as in gridHelper, cannot do.
   • Racks and pallets are two InstancedMesh draw calls, not ~50 meshes.
   • Bloom is real HDR postprocessing: an EffectComposer rendering into a
     half-float MSAA target so the emissive beacons bloom from values above 1.0,
     with OutputPass applying tone mapping at the end of the chain.
   • The telemetry labels are DOM, projected from world space every frame by hand.
     No React state is touched while they track — only style transforms.
   • Quality degrades in stages under load: bloom first, then resolution. Frames
     are the last thing to give up.
   • The loop stops entirely when the section scrolls away, and prefers-reduced-
     motion parks the units and disables the camera move.
   ──────────────────────────────────────────────────────────────────────────── */

type Quality = 'high' | 'medium' | 'low';
const DPR_FOR: Record<Quality, number> = { high: 1.5, medium: 1.25, low: 1 };

/*
  Ceiling on any single frame's timestep, in seconds.

  This is not defensive padding — it fixes a real defect. React Three Fiber's loop
  computes the delta as `timestamp - clock.elapsedTime` while `frameloop` is
  "never", but `timestamp` is a requestAnimationFrame value in *milliseconds* and
  `elapsedTime` is in *seconds*. Any `invalidate()` that lands while the section is
  scrolled away — a re-render from selection or quality state is enough — therefore
  produces a delta of tens of thousands of seconds. Fed to OrbitControls' auto-
  rotation that is an enormous instantaneous spin, which is exactly what fast
  scrolling past the section looked like.

  R3F also calls `clock.stop()`/`clock.start()` on every frameloop change, and
  `Clock.start()` resets `elapsedTime` to zero — so absolute clock time is not
  trustworthy across a pause either. Hence the separate simulation clock below.
*/
const MAX_DELTA = 1 / 30;

export type ScenePalette = {
  accent: string;
  idle: string;
  warn: string;
  body: string;
  floor: string;
  rack: string;
  grid: string;
};

/* ── Floor ─────────────────────────────────────────────────────────────────── */

/*
  The floor is a MeshStandardMaterial with the grid injected into its shader via
  onBeforeCompile, rather than a standalone ShaderMaterial.

  That distinction is the whole point: a custom ShaderMaterial would have to
  reimplement lighting, shadow sampling and fog from scratch, and my first pass at
  this did exactly that — which is why the floor rendered flat and the robots
  appeared to float with no contact shadows. Patching the standard material keeps
  three's entire lighting pipeline and only replaces the albedo.
*/

const GRID_CHUNK = /* glsl */ `
  varying vec3 vWorldPos;
  uniform vec3 uLineMinor;
  uniform vec3 uLineMajor;
  uniform float uMinor;
  uniform float uMajor;

  /*
    Anti-aliased procedural grid. Dividing the distance-to-line by fwidth()
    converts it into screen-space pixels, so a line stays ~1px wide whether its
    cell fills the viewport or is vanishing toward the horizon. Line geometry —
    what gridHelper draws — cannot do this, and aliases into moiré at grazing
    angles.
  */
  float gridMask(vec2 p, float cell, float width) {
    vec2 coord = p / cell;
    vec2 d = abs(fract(coord - 0.5) - 0.5) / max(fwidth(coord), vec2(1e-5));
    return 1.0 - clamp(min(d.x, d.y) / width, 0.0, 1.0);
  }
`;

function GridFloor({ palette, onClear }: { palette: ScenePalette; onClear: () => void }) {
  const uniforms = useMemo(
    () => ({
      uLineMinor: { value: new Color(palette.grid) },
      // Major lines are a lifted neutral, not the accent. Accent on the floor grid
      // reads as a sci-fi HUD; this has to read as a floor plan.
      uLineMajor: { value: new Color(palette.grid).lerp(new Color(palette.body), 0.4) },
      uMinor: { value: LANE },
      uMajor: { value: LANE * 4 },
    }),
    [palette],
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClear}>
      <planeGeometry args={[FLOOR_SIZE * 2.8, FLOOR_SIZE * 2.8]} />
      <meshStandardMaterial
        color={palette.floor}
        roughness={0.94}
        metalness={0.02}
        // Remount the material if the theme changes, so the patched program is rebuilt.
        key={palette.floor}
        onBeforeCompile={(shader) => {
          Object.assign(shader.uniforms, uniforms);

          shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
            .replace(
              '#include <project_vertex>',
              'vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#include <project_vertex>',
            );

          shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', '#include <common>\n' + GRID_CHUNK)
            // Injected after the albedo is established and before lighting runs, so
            // the grid is lit and shadowed like any other surface detail.
            .replace(
              '#include <map_fragment>',
              `#include <map_fragment>
               float minorLine = gridMask(vWorldPos.xz, uMinor, 1.0);
               float majorLine = gridMask(vWorldPos.xz, uMajor, 1.35);
               diffuseColor.rgb = mix(diffuseColor.rgb, uLineMinor, minorLine * 0.55);
               diffuseColor.rgb = mix(diffuseColor.rgb, uLineMajor, majorLine * 0.7);`,
            );
        }}
        // Without a distinct cache key three would reuse the unpatched program for
        // any other standard material with the same feature set.
        customProgramCacheKey={() => 'fleet-grid-floor'}
      />
    </mesh>
  );
}

/* ── Racks and pallets, instanced ──────────────────────────────────────────── */

function RackField({ palette }: { palette: ScenePalette }) {
  const rackRef = useRef<InstancedMesh>(null);
  const crateRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const rackMesh = rackRef.current;
    const crateMesh = crateRef.current;
    if (!rackMesh || !crateMesh) return;

    // A single unit box, scaled per instance — one geometry, one draw call.
    racks.forEach((rack, index) => {
      dummy.position.set(rack.x, rack.h / 2, rack.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(rack.w, rack.h, rack.d);
      dummy.updateMatrix();
      rackMesh.setMatrixAt(index, dummy.matrix);
    });
    rackMesh.instanceMatrix.needsUpdate = true;

    /*
      Desaturated toward the rack tone. The raw status amber is a UI signal colour;
      used on 40 pallets it stops reading as cargo and starts reading as a toy.
    */
    const rackColor = new Color(palette.rack);
    const ramp = [
      new Color(palette.body).lerp(rackColor, 0.35),
      rackColor.clone().lerp(new Color(palette.body), 0.25),
      new Color(palette.warn).lerp(rackColor, 0.62),
    ];
    crates.forEach((crate, index) => {
      dummy.position.set(crate.x, crate.y, crate.z);
      dummy.rotation.set(0, crate.rotation, 0);
      dummy.scale.setScalar(crate.size);
      dummy.updateMatrix();
      crateMesh.setMatrixAt(index, dummy.matrix);
      // Per-instance tint, so 40 pallets do not read as 40 identical cubes.
      crateMesh.setColorAt(index, ramp[crate.tint] ?? ramp[0]!);
    });
    crateMesh.instanceMatrix.needsUpdate = true;
    if (crateMesh.instanceColor) crateMesh.instanceColor.needsUpdate = true;
  }, [palette]);

  return (
    <>
      <instancedMesh
        ref={rackRef}
        args={[undefined, undefined, racks.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry />
        <meshStandardMaterial color={palette.rack} roughness={0.78} metalness={0.12} />
      </instancedMesh>

      <instancedMesh
        ref={crateRef}
        args={[undefined, undefined, crates.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry />
        <meshStandardMaterial roughness={0.62} metalness={0.05} />
      </instancedMesh>
    </>
  );
}

/* ── Simulation clock ─────────────────────────────────────────────────────── */

/**
 * The scene's own monotonic time, advanced only by clamped deltas.
 *
 * Everything animated reads this instead of `clock.elapsedTime`, which R3F resets
 * to zero whenever the frameloop is toggled — so units would teleport back to
 * their starting offsets every time the section scrolled out of view and back.
 *
 * Rendered as the first child of the scene so it advances before anything reads it.
 */
function SimulationClock({
  time,
  running,
}: {
  time: RefObject<number>;
  running: boolean;
}) {
  useFrame((_, delta) => {
    if (!running) return;
    time.current += Math.min(delta, MAX_DELTA);
  });
  return null;
}

/* ── Path helpers ──────────────────────────────────────────────────────────── */

function pathLength(path: readonly [number, number][]) {
  let total = 0;
  for (let i = 0; i < path.length; i += 1) {
    const a = path[i]!;
    const b = path[(i + 1) % path.length]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}

function samplePath(path: readonly [number, number][], d: number) {
  let remaining = d;
  for (let i = 0; i < path.length; i += 1) {
    const a = path[i]!;
    const b = path[(i + 1) % path.length]!;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (seg === 0) continue;
    if (remaining <= seg) {
      const t = remaining / seg;
      return {
        x: a[0] + (b[0] - a[0]) * t,
        z: a[1] + (b[1] - a[1]) * t,
        heading: Math.atan2(b[0] - a[0], b[1] - a[1]),
      };
    }
    remaining -= seg;
  }
  const first = path[0]!;
  return { x: first[0], z: first[1], heading: 0 };
}

/** Shortest signed angular difference, so a unit never spins the long way round. */
const deltaAngle = (from: number, to: number) =>
  ((to - from + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

/* ── Robot ────────────────────────────────────────────────────────────────── */

function Robot({
  spec,
  palette,
  selected,
  animate,
  positions,
  time,
  onSelect,
}: {
  spec: RobotSpec;
  palette: ScenePalette;
  selected: boolean;
  animate: boolean;
  positions: RefObject<Map<string, Vector3>>;
  time: RefObject<number>;
  onSelect: () => void;
}) {
  const group = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const length = useMemo(() => pathLength(spec.path), [spec.path]);
  const statusColor = [palette.accent, palette.idle, palette.warn][spec.tone] ?? palette.accent;

  useFrame((_, rawDelta) => {
    const node = group.current;
    if (!node) return;

    // Never let one frame's timestep drive a visible jump. See MAX_DELTA.
    const delta = Math.min(rawDelta, MAX_DELTA);
    const elapsed = time.current;

    const distance =
      animate && length > 0
        ? (elapsed * spec.speed + spec.offset * length) % length
        : spec.offset * length;

    const { x, z, heading } = samplePath(spec.path, distance);
    node.position.set(x, 0, z);

    // Ease the heading rather than snapping it at each waypoint, and bank into the
    // turn — the difference between "a box teleporting round a corner" and a
    // vehicle. Damped, so it is frame-rate independent.
    const turn = deltaAngle(node.rotation.y, heading);
    node.rotation.y += turn * Math.min(1, delta * 7);
    node.rotation.z = MathUtils.damp(
      node.rotation.z,
      MathUtils.clamp(-turn * 0.4, -0.11, 0.11),
      7,
      delta,
    );

    positions.current?.set(spec.id, node.position);

    if (ring.current && selected) {
      const t = (elapsed % 1.8) / 1.8;
      ring.current.scale.setScalar(1 + t * 0.55);
      (ring.current.material as MeshBasicMaterial).opacity = (1 - t) * 0.75;
    }
  });

  return (
    <group
      ref={group}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      {/* Chassis */}
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.12, 0.26, 1.58]} />
        <meshStandardMaterial color={palette.body} roughness={0.42} metalness={0.45} />
      </mesh>
      {/* Skirt — a darker inset band that reads as a seam and grounds the body */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[1.02, 0.1, 1.46]} />
        <meshStandardMaterial color={palette.rack} roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Payload deck — carries the status colour, legible from any camera angle */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.94, 0.2, 1.26]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.7}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      {/* Beacon — pushed well above 1.0 so it is what the bloom threshold catches */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.1, 14, 14]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={3.1}
          toneMapped={false}
        />
      </mesh>
      {/* Forward light bar */}
      <mesh position={[0, 0.28, 0.8]}>
        <boxGeometry args={[0.5, 0.07, 0.05]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>

      {/* Static selection ring plus an expanding pulse */}
      {selected && (
        <>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.02, 1.1, 48]} />
            <meshBasicMaterial
              color={palette.accent}
              transparent
              opacity={0.9}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={ring} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.02, 1.06, 48]} />
            <meshBasicMaterial
              color={palette.accent}
              transparent
              opacity={0.5}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ── Routes ───────────────────────────────────────────────────────────────── */

function RoutePaths({ color, activeId }: { color: string; activeId: string | null }) {
  const routes = useMemo(
    () =>
      fleet
        .filter((robot) => robot.path.length > 2)
        .map((robot) => ({
          id: robot.id,
          points: new Float32Array(
            robot.path.concat([robot.path[0]!]).flatMap(([x, z]) => [x, 0.012, z]),
          ),
        })),
    [],
  );

  return (
    <>
      {routes.map((route) => (
        <line key={route.id}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[route.points, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={color}
            transparent
            toneMapped={false}
            opacity={activeId === null ? 0.32 : activeId === route.id ? 0.85 : 0.08}
          />
        </line>
      ))}
    </>
  );
}

/* ── Camera ───────────────────────────────────────────────────────────────── */

const CAMERA_HOME = new Vector3(15.5, 12, 15.5);
const CAMERA_START = new Vector3(25, 21, 25);

function Controls({ autoRotate, intro }: { autoRotate: boolean; intro: boolean }) {
  const camera = useThree((state) => state.camera);
  const domElement = useThree((state) => state.gl.domElement);
  const progress = useRef(intro ? 0 : 1);

  const controls = useMemo(
    () => new OrbitControlsImpl(camera, domElement),
    [camera, domElement],
  );

  useEffect(() => {
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 10;
    controls.maxDistance = 34;
    controls.minPolarAngle = 0.22;
    controls.maxPolarAngle = Math.PI / 2.35;
    controls.autoRotateSpeed = 0.32;
    controls.target.set(0, 0.5, 0);
    controls.update();
    return () => controls.dispose();
  }, [controls]);

  useEffect(() => {
    controls.autoRotate = autoRotate;
  }, [controls, autoRotate]);

  /*
    The opening camera move is abandoned the instant the viewer grabs the scene.
    OrbitControls fires 'start' on pointer-down, which is exactly the signal.

    Note what this replaces: the intro used to hold `controls.enabled = false` until
    it finished. With per-frame timesteps clamped, "finished" is measured in frames,
    so a device rendering at 3fps left the scene completely uninteractive for
    seventeen seconds. Input must never wait on an animation.
  */
  useEffect(() => {
    const skipIntro = () => {
      progress.current = 1;
    };
    controls.addEventListener('start', skipIntro);
    return () => controls.removeEventListener('start', skipIntro);
  }, [controls]);

  /*
    Wheel zoom is gated behind a deliberate click for mouse users.

    OrbitControls calls preventDefault() on wheel events it handles, so leaving zoom
    on permanently means the page stops scrolling whenever the cursor happens to be
    over the viewer — a scroll trap in the middle of a page someone is trying to
    read. Zoom arms on pointer-down inside the scene and disarms when the pointer
    leaves, so scrolling past is never captured.

    Touch is left alone: pinch needs two fingers, so it cannot be confused with a
    one-finger page scroll, and gating it would break the first pinch.
  */
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (coarse) {
      controls.enableZoom = true;
      return;
    }

    controls.enableZoom = false;
    const arm = () => {
      controls.enableZoom = true;
    };
    const disarm = () => {
      controls.enableZoom = false;
    };

    domElement.addEventListener('pointerdown', arm);
    domElement.addEventListener('pointerleave', disarm);
    return () => {
      domElement.removeEventListener('pointerdown', arm);
      domElement.removeEventListener('pointerleave', disarm);
    };
  }, [controls, domElement]);

  useFrame((_, rawDelta) => {
    /*
      Clamped before it reaches either the intro easing or the controls.
      OrbitControls scales its auto-rotation by this value, so an unclamped spike
      lands as an instant, arbitrarily large spin.
    */
    const delta = Math.min(rawDelta, MAX_DELTA);

    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta / 1.7);
      const eased = 1 - Math.pow(1 - progress.current, 4);
      camera.position.lerpVectors(CAMERA_START, CAMERA_HOME, eased);
    }

    controls.update(delta);
  });

  return null;
}

/* ── Adaptive quality ─────────────────────────────────────────────────────── */

/**
 * Sheds quality in stages when the renderer falls behind: bloom first, then
 * resolution. Resolution and effects are far less noticeable to give up than
 * frame rate, and hysteresis keeps it from oscillating.
 */
function AdaptiveQuality({
  quality,
  onDowngrade,
}: {
  quality: Quality;
  onDowngrade: () => void;
}) {
  const frames = useRef(0);
  const window = useRef(0);
  const cooldown = useRef(1.5);

  useFrame((_, delta) => {
    if (quality === 'low') return;
    if (cooldown.current > 0) {
      cooldown.current -= delta;
      return;
    }

    // A clamped delta also keeps one spike frame from being mistaken for a slow
    // device and triggering a needless downgrade.
    frames.current += 1;
    window.current += Math.min(delta, MAX_DELTA);

    /*
      The window is bounded by time, not by a frame count. Counting 50 frames
      sounds equivalent, but on a device already rendering at 3fps it would take
      seventeen seconds to decide anything — exactly the case where relief is most
      urgent. A second of wall clock, with enough frames in it to be meaningful.
    */
    if (window.current < 1 || frames.current < 8) return;

    const mean = window.current / frames.current;
    frames.current = 0;
    window.current = 0;

    if (mean > 1 / 42) {
      cooldown.current = 2;
      onDowngrade();
    }
  });

  return null;
}

/* ── Telemetry labels ─────────────────────────────────────────────────────── */

/**
 * Projects each unit's world position to screen space and drives the DOM labels
 * directly. Runs at priority 1 so it happens after every unit has moved this
 * frame, and writes only style transforms — a React render per label per frame
 * would be a hundred times the cost for an identical result.
 */
function TelemetryLabels({
  positions,
  labels,
  selectedId,
  showAll,
}: {
  positions: RefObject<Map<string, Vector3>>;
  labels: RefObject<Map<string, HTMLElement>>;
  selectedId: string | null;
  showAll: boolean;
}) {
  const projected = useMemo(() => new Vector3(), []);

  useFrame(({ camera, size }) => {
    const nodes = labels.current;
    const points = positions.current;
    if (!nodes || !points) return;

    for (const [id, element] of nodes) {
      const point = points.get(id);
      const visible = showAll || id === selectedId;
      if (!point || !visible) {
        element.style.opacity = '0';
        continue;
      }

      projected.copy(point);
      projected.y += 1.15;
      projected.project(camera);

      // Behind the camera, or outside the frustum sideways.
      if (projected.z > 1 || Math.abs(projected.x) > 1.15) {
        element.style.opacity = '0';
        continue;
      }

      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      element.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -100%)`;
      element.style.opacity = id === selectedId ? '1' : '0.62';
    }
  }, 1);

  return null;
}

/* ── Renderer instrumentation ─────────────────────────────────────────────── */

/**
 * Reads the renderer's own counters and writes them into DOM nodes owned by the
 * section, at 4Hz.
 *
 * Two details make the numbers correct rather than decorative:
 *
 *  1. `info.autoReset` is turned off. three resets the counters at the start of
 *     every `render()` call, and the composer issues several per frame — left on,
 *     the panel would only ever report the last bloom pass.
 *  2. It runs at priority 2, so it samples *after* the composer has drawn at
 *     priority 1. Reading before the render would report the previous frame.
 *
 * The counters are snapshotted and reset every frame; only the display is
 * throttled. Averaging accumulated counts over fifteen frames would be wrong.
 */
function RendererStats({
  stats,
  bloom,
  quality,
}: {
  stats: RefObject<Map<string, HTMLElement>> | undefined;
  bloom: boolean;
  quality: Quality;
}) {
  const gl = useThree((state) => state.gl);
  const frames = useRef(0);
  const elapsed = useRef(0);
  const lastCalls = useRef(0);
  const lastTriangles = useRef(0);

  useEffect(() => {
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = true;
    };
  }, [gl]);

  useFrame((_, delta) => {
    lastCalls.current = gl.info.render.calls;
    lastTriangles.current = gl.info.render.triangles;
    gl.info.reset();

    frames.current += 1;
    elapsed.current += delta;
    if (elapsed.current < 0.25) return;

    const nodes = stats?.current;
    if (nodes) {
      const write = (key: string, value: string) => {
        const node = nodes.get(key);
        if (node) node.textContent = value;
      };
      write('fps', String(Math.round(frames.current / elapsed.current)));
      write('calls', String(lastCalls.current));
      write('triangles', lastTriangles.current.toLocaleString('en-US'));
      // The renderer's actual pixel ratio, read at sample time. R3F's
      // `viewport.dpr` is a store value that can disagree with what the renderer
      // is really using, and a readout that disagrees with reality is worse than
      // no readout.
      write('dpr', String(Number(gl.getPixelRatio().toFixed(2))));
      write('quality', quality);
      write('effects', bloom ? 'bloom + msaa' : 'none');
    }

    frames.current = 0;
    elapsed.current = 0;
  }, 2);

  return null;
}

/* ── Output: bloom chain, or a plain render ───────────────────────────────── */

function Output({ bloom }: { bloom: boolean }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);

  const composer = useMemo(() => {
    /*
      A half-float target is what makes this HDR: emissive values above 1.0 survive
      into the bloom pass instead of being clipped at the point of rendering.
      `samples` gives MSAA, which the canvas `antialias` option cannot provide once
      drawing goes through a render target.
    */
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
    const instance = new EffectComposer(gl, target);
    instance.addPass(new RenderPass(scene, camera));
    instance.addPass(new UnrealBloomPass(new Vector2(1, 1), 0.52, 0.55, 0.9));
    // OutputPass applies tone mapping and the sRGB conversion at the very end of
    // the chain, which is the only correct place for them.
    instance.addPass(new OutputPass());
    return instance;
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);
  }, [composer, size.width, size.height, dpr]);

  useEffect(() => () => composer.dispose(), [composer]);

  // Priority 1 takes the render loop over from R3F, so this is now the only thing
  // putting pixels on screen — including in the no-bloom branch.
  useFrame(() => {
    if (bloom) composer.render();
    else gl.render(scene, camera);
  }, 1);

  return null;
}

/* ── Scene ────────────────────────────────────────────────────────────────── */

function Scene({
  palette,
  animate,
  running,
  intro,
  bloom,
  quality,
  selectedId,
  positions,
  labels,
  showAllLabels,
  stats,
  onSelect,
  onDowngrade,
}: {
  palette: ScenePalette;
  animate: boolean;
  running: boolean;
  intro: boolean;
  bloom: boolean;
  quality: Quality;
  selectedId: string | null;
  positions: RefObject<Map<string, Vector3>>;
  labels: RefObject<Map<string, HTMLElement>>;
  showAllLabels: boolean;
  stats: RefObject<Map<string, HTMLElement>> | undefined;
  onSelect: (id: string | null) => void;
  onDowngrade: () => void;
}) {
  // One clock for the whole scene, so nothing can drift out of step with anything else.
  const time = useRef(0);

  return (
    <>
      <SimulationClock time={time} running={animate && running} />

      {/* Sky/ground bounce, a shadow-casting key, and a cool rim from behind. */}
      <hemisphereLight args={[palette.grid, palette.floor, 1.25]} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={2.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />
      <directionalLight position={[-12, 7, -10]} intensity={0.75} color={palette.accent} />
      {/* Front fill. Without it every surface facing the camera reads as a
          silhouette, which is what made the racks vanish into the floor. */}
      <directionalLight position={[4, 6, 16]} intensity={0.55} />

      <GridFloor palette={palette} onClear={() => onSelect(null)} />
      <RackField palette={palette} />

      {/* Charging dock — a lit pad, so the one parked unit reads as docked. */}
      <mesh position={[-9.6, 0.014, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 2.7]} />
        <meshBasicMaterial color={palette.warn} transparent opacity={0.12} toneMapped={false} />
      </mesh>
      <mesh position={[-9.6, 0.018, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.26, 1.34, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial color={palette.warn} transparent opacity={0.6} toneMapped={false} />
      </mesh>

      <RoutePaths color={palette.accent} activeId={selectedId} />

      {fleet.map((robot) => (
        <Robot
          key={robot.id}
          spec={robot}
          palette={palette}
          animate={animate}
          positions={positions}
          time={time}
          selected={selectedId === robot.id}
          onSelect={() => onSelect(robot.id)}
        />
      ))}

      <Controls autoRotate={animate} intro={intro} />
      <AdaptiveQuality quality={quality} onDowngrade={onDowngrade} />
      <TelemetryLabels
        positions={positions}
        labels={labels}
        selectedId={selectedId}
        showAll={showAllLabels}
      />
      <Output bloom={bloom} />
      <RendererStats stats={stats} bloom={bloom} quality={quality} />
    </>
  );
}

/* ── Public component ─────────────────────────────────────────────────────── */

export type FleetViewer3DProps = {
  /** False when the section is off screen — stops the render loop entirely. */
  running: boolean;
  animate: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Suppresses all but the selected label where there is no room for four. */
  compactLabels?: boolean;
  /** DOM nodes for the live renderer readout, keyed by metric. */
  stats?: RefObject<Map<string, HTMLElement>>;
};

const TONE_CLASS = ['text-viz-a', 'text-viz-b', 'text-viz-c'] as const;
const DOT_CLASS = ['bg-viz-a', 'bg-viz-b', 'bg-viz-c'] as const;

export default function FleetViewer3D({
  running,
  animate,
  selectedId,
  onSelect,
  compactLabels = false,
  stats,
}: FleetViewer3DProps) {
  const [quality, setQuality] = useState<Quality>(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
      ? 'medium'
      : 'high',
  );

  const positions = useRef<Map<string, Vector3>>(new Map());
  const labels = useRef<Map<string, HTMLElement>>(new Map());

  // The scene reads the same custom properties as the rest of the page, so it
  // retints with the theme instead of hard-coding hexes.
  const palette = useMemo<ScenePalette>(() => {
    const style = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) =>
      style.getPropertyValue(name).trim() || fallback;
    return {
      accent: read('--raw-accent', '#00d3f2'),
      idle: read('--raw-viz-b', '#8b7cff'),
      warn: read('--raw-viz-c', '#ffb257'),
      body: read('--raw-scene-body', '#9aa5b4'),
      floor: read('--raw-scene-floor', '#0e1116'),
      rack: read('--raw-scene-rack', '#2c333d'),
      grid: read('--raw-scene-grid', '#3a424e'),
    };
  }, []);

  /*
    Bloom is a dark-theme affordance. On a light ground there is nothing dark for a
    glow to read against, so it only lifts the black point and washes the image out
    — the correct amount of bloom there is none.
  */
  const isLightTheme =
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light';
  const bloom = quality === 'high' && !isLightTheme;

  return (
    <div className="relative size-full">
      <Canvas
        dpr={DPR_FOR[quality]}
        // Explicit: R3F's default and its "soft" preset both select
        // PCFSoftShadowMap, which three deprecated in r185.
        shadows={{ type: PCFShadowMap }}
        frameloop={running ? 'always' : 'never'}
        camera={{ position: animate ? CAMERA_START.toArray() : CAMERA_HOME.toArray(), fov: 40 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
        }}
        onPointerMissed={() => onSelect(null)}
        style={{ touchAction: 'pan-y' }}
      >
        <color attach="background" args={[palette.floor]} />
        <fog attach="fog" args={[palette.floor, 26, 56]} />
        <Scene
          palette={palette}
          animate={animate}
          running={running}
          intro={animate}
          bloom={bloom}
          quality={quality}
          selectedId={selectedId}
          positions={positions}
          labels={labels}
          showAllLabels={!compactLabels}
          stats={stats}
          onSelect={onSelect}
          onDowngrade={() =>
            setQuality((current) => (current === 'high' ? 'medium' : 'low'))
          }
        />
      </Canvas>

      {/* DOM label layer. Positioned by TelemetryLabels, never by React. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {fleet.map((robot) => (
          <div
            key={robot.id}
            ref={(node) => {
              if (node) labels.current.set(robot.id, node);
              else labels.current.delete(robot.id);
            }}
            className="absolute top-0 left-0 opacity-0 transition-opacity duration-200 will-change-transform"
          >
            <div
              className={
                'flex items-center gap-1.5 rounded-md border bg-bg/85 px-1.5 py-1 backdrop-blur-sm ' +
                (robot.id === selectedId ? 'border-accent-line' : 'border-line')
              }
            >
              <span className={`size-1 rounded-full ${DOT_CLASS[robot.tone]}`} />
              <span className="font-mono text-[0.625rem] leading-none text-fg">{robot.id}</span>
              <span className={`font-mono text-[0.625rem] leading-none ${TONE_CLASS[robot.tone]}`}>
                {robot.battery}%
              </span>
            </div>
            {/* Stem down toward the unit */}
            <div className="mx-auto h-2 w-px bg-line-strong" />
          </div>
        ))}
      </div>
    </div>
  );
}
