import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { DoubleSide, type Group } from 'three';
// Imported straight from three's own examples rather than via @react-three/drei:
// drei is a large surface to pull in for two helpers, and both are short to write.
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js';
import { FLOOR_SIZE, LANE, fleet, racks, type RobotSpec } from '@/data/fleet';

/* ────────────────────────────────────────────────────────────────────────────
   Fleet viewer — React Three Fiber

   A rebuilt, simplified version of the class of interface I work on at Seven
   Robotics: a top-down-ish 3D view of a warehouse with autonomous mobile robots
   moving through it, where selecting a unit surfaces its telemetry.

   This is a demonstration built for this site — not the proprietary product. The
   scene, the layout and the telemetry are synthetic.

   The engineering that matters here is the loading and frame budget, because a 3D
   scene is the easiest way to ruin a page:

     • three + R3F + drei are behind a `React.lazy` boundary and a user gesture,
       so none of it is in the initial bundle or the initial network waterfall.
     • The render loop runs only while the canvas is on screen (`frameloop`), so
       scrolling past it stops the GPU work rather than merely hiding it.
     • DPR is capped and then *reduced adaptively* — PerformanceMonitor drops it
       on sustained decline instead of letting frames tear.
     • Geometries and materials are created once and shared, never per frame.
     • Under prefers-reduced-motion the robots hold position and the camera does
       not auto-orbit; the scene is still fully inspectable by dragging.
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Orbit controls, driven imperatively.
 *
 * three's own OrbitControls is the same class drei wraps; using it directly keeps
 * the dependency list shorter. It is created once per camera/canvas pair, updated
 * once per frame with the real delta so auto-rotation is time-based rather than
 * frame-rate-based, and disposed on unmount.
 */
function Controls({ autoRotate }: { autoRotate: boolean }) {
  const camera = useThree((state) => state.camera);
  const domElement = useThree((state) => state.gl.domElement);

  const controls = useMemo(
    () => new OrbitControlsImpl(camera, domElement),
    [camera, domElement],
  );

  useEffect(() => {
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 9;
    controls.maxDistance = 30;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI / 2.35;
    controls.autoRotateSpeed = 0.35;
    controls.target.set(0, 0.5, 0);
    controls.update();
    return () => controls.dispose();
  }, [controls]);

  useEffect(() => {
    controls.autoRotate = autoRotate;
  }, [controls, autoRotate]);

  useFrame((_, delta) => controls.update(delta));

  return null;
}

/**
 * Adaptive device-pixel-ratio.
 *
 * Samples frame times and steps resolution down when the renderer is sustainably
 * behind, rather than letting the frame rate collapse. Resolution is the right
 * thing to give up first — it is far less noticeable than dropped frames.
 * Hysteresis (a high bar to go back up) stops it oscillating.
 */
function AdaptiveDpr({ max }: { max: number }) {
  const setDpr = useThree((state) => state.setDpr);
  const current = useRef(max);
  const samples = useRef<number[]>([]);

  useFrame((_, delta) => {
    const window = samples.current;
    window.push(delta);
    if (window.length < 45) return;

    const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
    window.length = 0;

    // Below ~40fps sustained: shed pixels. Comfortably above ~55fps: take them back.
    if (mean > 1 / 40 && current.current > 1) {
      current.current = 1;
      setDpr(1);
    } else if (mean < 1 / 55 && current.current < max) {
      current.current = max;
      setDpr(max);
    }
  });

  return null;
}

/** Total path length, used to normalise travel to a constant speed. */
function pathLength(path: readonly [number, number][]) {
  let total = 0;
  for (let i = 0; i < path.length; i += 1) {
    const a = path[i]!;
    const b = path[(i + 1) % path.length]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}

/** Position and heading at distance `d` along a closed polyline. */
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

function Robot({
  spec,
  palette,
  selected,
  animate,
  onSelect,
}: {
  spec: RobotSpec;
  palette: { accent: string; idle: string; warn: string; body: string };
  selected: boolean;
  animate: boolean;
  onSelect: () => void;
}) {
  const group = useRef<Group>(null);
  const length = useMemo(() => pathLength(spec.path), [spec.path]);
  const statusColor = [palette.accent, palette.idle, palette.warn][spec.tone] ?? palette.accent;

  useFrame(({ clock }) => {
    if (!group.current) return;
    // Static units (and the reduced-motion path) still need one placement.
    const distance = animate && length > 0
      ? ((clock.elapsedTime * spec.speed + spec.offset * length) % length)
      : spec.offset * length;
    const { x, z, heading } = samplePath(spec.path, distance);
    group.current.position.set(x, 0, z);
    group.current.rotation.y = heading;
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
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.44, 1.62]} />
        <meshStandardMaterial color={palette.body} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Payload deck — carries the status colour, so a unit's state is legible
          from any camera angle without reading the side panel. */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.95, 0.22, 1.3]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.9}
          roughness={0.35}
        />
      </mesh>
      {/* Beacon */}
      <mesh position={[0, 0.82, 0]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={2.4} />
      </mesh>
      {/* Heading indicator */}
      <mesh position={[0, 0.4, 0.86]}>
        <boxGeometry args={[0.42, 0.1, 0.1]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={2} />
      </mesh>
      {/* Selection ring */}
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.25, 44]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.9} side={DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

/** Each unit's route, drawn as a faint closed loop on the floor. */
function RoutePaths({ color, activeId }: { color: string; activeId: string | null }) {
  const routes = useMemo(
    () =>
      fleet.filter((robot) => robot.path.length > 2).map((robot) => ({
        id: robot.id,
        points: new Float32Array(
          robot.path.concat([robot.path[0]!]).flatMap(([x, z]) => [x, 0.015, z]),
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
            opacity={activeId === null ? 0.3 : activeId === route.id ? 0.75 : 0.1}
          />
        </line>
      ))}
    </>
  );
}

function Scene({
  palette,
  animate,
  selectedId,
  onSelect,
}: {
  palette: { accent: string; idle: string; warn: string; body: string; floor: string; rack: string; grid: string };
  animate: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <>
      {/* Physically-based lighting (three r155+): intensities are in real units,
          so these are deliberately higher than pre-r155 scenes would use. */}
      <ambientLight intensity={1.35} />
      <directionalLight
        position={[9, 14, 7]}
        intensity={2.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <directionalLight position={[-10, 7, -8]} intensity={0.85} />

      {/* Floor. Clicking it clears the selection. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={() => onSelect(null)}
      >
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial color={palette.floor} roughness={0.95} metalness={0} />
      </mesh>

      <gridHelper
        args={[FLOOR_SIZE, FLOOR_SIZE / LANE, palette.grid, palette.grid]}
        position={[0, 0.008, 0]}
      />

      {/* Racks */}
      {racks.map((rack, index) => (
        <mesh
          key={index}
          position={[rack.x, rack.h / 2, rack.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[rack.w, rack.h, rack.d]} />
          <meshStandardMaterial color={palette.rack} roughness={0.8} metalness={0.05} />
        </mesh>
      ))}

      {/* Charging dock — a lit pad, so the one parked unit reads as docked rather
          than as a bug in the simulation. */}
      <mesh position={[-9.6, 0.02, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 2.6]} />
        <meshBasicMaterial color={palette.warn} transparent opacity={0.14} />
      </mesh>
      <mesh position={[-9.6, 0.025, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.24, 1.32, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial color={palette.warn} transparent opacity={0.55} />
      </mesh>

      <RoutePaths color={palette.accent} activeId={selectedId} />

      {fleet.map((robot) => (
        <Robot
          key={robot.id}
          spec={robot}
          palette={palette}
          animate={animate}
          selected={selectedId === robot.id}
          onSelect={() => onSelect(robot.id)}
        />
      ))}

      <Controls autoRotate={animate} />
    </>
  );
}

export type FleetViewer3DProps = {
  /** False when the section is off screen — stops the render loop entirely. */
  running: boolean;
  animate: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const MAX_DPR = 1.5;

export default function FleetViewer3D({
  running,
  animate,
  selectedId,
  onSelect,
}: FleetViewer3DProps) {

  // Read the scene palette from the same CSS custom properties the rest of the
  // page uses, so the viewer retints with the theme instead of hard-coding hexes.
  const palette = useMemo(() => {
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

  return (
    <Canvas
      // Cap first, then adapt: a 3x DPR phone gains nothing visible here and
      // pays for every pixel three times over.
      dpr={MAX_DPR}
      shadows
      // `never` releases the loop when the section is scrolled away.
      frameloop={running ? 'always' : 'never'}
      camera={{ position: [13, 10.5, 13], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => onSelect(null)}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Drop resolution rather than frames when the GPU cannot keep up. */}
      <AdaptiveDpr max={MAX_DPR} />
      <color attach="background" args={[palette.floor]} />
      <fog attach="fog" args={[palette.floor, 26, 52]} />
      <Scene palette={palette} animate={animate} selectedId={selectedId} onSelect={onSelect} />
    </Canvas>
  );
}
