/**
 * Synthetic fleet data for the 3D viewer.
 *
 * Kept in `data/` rather than inside the viewer component so the section can
 * render the telemetry list without importing anything from three.js — the whole
 * 3D stack stays behind its lazy boundary until someone actually looks at it.
 *
 * This is demonstration data. The scene, the units and the telemetry are
 * invented for this site; it is not Seven Robotics data.
 */

export type RobotStatus = 'Hauling' | 'Idle' | 'Charging';

export type RobotTelemetry = {
  id: string;
  status: RobotStatus;
  /** Percentage. */
  battery: number;
  task: string;
  /** Index into the viewer's status palette: 0 accent, 1 violet, 2 amber. */
  tone: 0 | 1 | 2;
};

export type RobotSpec = RobotTelemetry & {
  /** Closed patrol route in world space, as [x, z] waypoints. */
  path: readonly [number, number][];
  /** World units per second. 0 parks the unit. */
  speed: number;
  /** 0–1 starting offset along the route, so units do not travel in lockstep. */
  offset: number;
};

export const fleet: readonly RobotSpec[] = [
  {
    id: 'AMR-01',
    status: 'Hauling',
    battery: 82,
    task: 'Pick → Aisle C · tote 4471',
    tone: 0,
    path: [
      [-7.2, -7.2],
      [-7.2, 7.2],
      [2.4, 7.2],
      [2.4, -2.4],
      [-7.2, -2.4],
    ],
    speed: 1.5,
    offset: 0,
  },
  {
    id: 'AMR-02',
    status: 'Hauling',
    battery: 64,
    task: 'Transfer → Outbound dock 2',
    tone: 0,
    path: [
      [7.2, 7.2],
      [7.2, -7.2],
      [-2.4, -7.2],
      [-2.4, 4.8],
      [7.2, 4.8],
    ],
    speed: 1.25,
    offset: 0.35,
  },
  {
    id: 'AMR-03',
    status: 'Idle',
    battery: 91,
    task: 'Awaiting assignment',
    tone: 1,
    path: [
      [-2.4, 7.2],
      [4.8, 7.2],
      [4.8, 2.4],
      [-2.4, 2.4],
    ],
    speed: 0.85,
    offset: 0.6,
  },
  {
    id: 'AMR-04',
    status: 'Charging',
    battery: 23,
    task: 'Dock 1 · 18 min to 80%',
    tone: 2,
    path: [[-9.6, 2.4]],
    speed: 0,
    offset: 0,
  },
];

/** Storage racks, laid out as three aisles of three bays. */
export const racks: readonly { x: number; z: number; w: number; d: number; h: number }[] =
  Array.from({ length: 9 }, (_, index) => {
    const aisle = Math.floor(index / 3);
    const bay = index % 3;
    return {
      x: -4.8 + aisle * 4.8,
      z: -4.8 + bay * 4.8,
      w: 1.7,
      d: 3.4,
      h: 1.05 + ((aisle + bay) % 3) * 0.35,
    };
  });

export const FLOOR_SIZE = 22;
export const LANE = 2.4;
