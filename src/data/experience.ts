/**
 * Work experience, regrouped by engineering discipline rather than replayed as
 * resume bullets. Every line here maps to real work at Seven Robotics.
 */

export type ExperienceDomain = {
  id: string;
  /** Two-digit index rendered as a monospace marker. */
  index: string;
  title: string;
  /** One sentence a recruiter can read without expanding anything. */
  summary: string;
  /** Collapsed-row label. Authored, not derived — splitting `summary` on '.'
      truncated values like "Node.js". */
  tagline: string;
  /** The concrete work. Kept short so the panel never becomes a wall of text. */
  highlights: readonly string[];
  /** Technologies used in this domain — cross-referenced by the relationship map. */
  stack: readonly string[];
  /** Optional hard number, shown as a badge. Only real, resume-backed values. */
  metric?: { value: string; label: string };
};

export const company = {
  name: 'Seven Robotics',
  role: 'Full Stack Developer',
  period: 'July 2023 — Present',
  periodShort: '2023 — Now',
  context:
    'Software for autonomous mobile robots and the fleet-management systems that operate them: warehouse maps, live robot task management, video streaming, and the services behind them.',
} as const;

export const experienceDomains: readonly ExperienceDomain[] = [
  {
    id: 'frontend',
    index: '01',
    title: 'Frontend Engineering',
    summary:
      'A production single-page application for operating robot fleets, built from Figma to pixel-accurate, accessible interfaces.',
    tagline: 'The operator interface, Figma to production.',
    highlights: [
      'Built a production-grade SPA with React 18 and TypeScript as the primary operator interface for the fleet.',
      'Converted Figma designs into pixel-perfect, accessible components with keyboard and screen-reader support.',
      'Built interactive 3D map visualisations of warehouse environments with Three.js.',
      'Centralised state with Redux Toolkit and RTK Query using normalised entities and optimistic updates, so operator actions feel instant before the server confirms.',
    ],
    stack: ['React 18', 'TypeScript', 'Redux Toolkit', 'RTK Query', 'Three.js', 'Tailwind CSS'],
  },
  {
    id: 'performance',
    index: '02',
    title: 'Performance Engineering',
    summary:
      'Live telemetry means the UI never stops re-rendering. Most of this work was about making a continuously updating interface stay responsive.',
    tagline: 'Keeping a continuously updating UI responsive.',
    highlights: [
      'Cut unnecessary render cycles by ~40% by isolating subscriptions, memoising selectors and splitting components along update boundaries.',
      'Reduced bundle size by ~35% with React.lazy, route-level code splitting and trimming eagerly imported dependencies.',
      'Virtualised long robot and task lists so list length stopped driving frame cost.',
      'Throttled canvas frames and decoupled render loops from state updates to hold 60fps in map and video-heavy views.',
    ],
    stack: ['React.lazy', 'Code splitting', 'Memoisation', 'Virtualisation', 'Canvas throttling'],
    metric: { value: '60fps', label: 'held under live telemetry' },
  },
  {
    id: 'backend',
    index: '03',
    title: 'Backend Architecture',
    summary:
      'REST services in Node.js with explicit layering, so business rules stay testable and transport stays replaceable.',
    tagline: 'REST services in Node.js with explicit layering.',
    highlights: [
      'Architected REST APIs in Node.js and Express with a layered Controller → Service → Repository structure.',
      'Kept HTTP concerns in controllers, business rules in services and data access in repositories, so persistence could change without rewriting logic.',
      'Used Redis for caching hot reads and MySQL and MongoDB for persistence depending on the access pattern.',
    ],
    stack: ['Node.js', 'Express.js', 'REST', 'Controller–Service–Repository', 'Redis', 'MySQL', 'MongoDB'],
  },
  {
    id: 'realtime',
    index: '04',
    title: 'Real-Time Systems',
    summary:
      'Robots emit continuously and operators expect to see it now. This is the part of the stack with no request/response to hide behind.',
    tagline: 'Continuous data, no request/response to hide behind.',
    highlights: [
      'Built real-time backend systems with Socket.IO and raw WebSockets for robot task updates and event processing.',
      'Streamed live robot camera feeds to the operator console over WebRTC.',
      'Moved event processing and asynchronous background jobs through RabbitMQ so slow consumers could not stall the request path.',
      'Designed the event flow so a dropped connection recovers state instead of leaving the UI stale.',
    ],
    stack: ['Socket.IO', 'WebSockets', 'WebRTC', 'RabbitMQ', 'Event-driven'],
  },
  {
    id: 'infra',
    index: '05',
    title: 'Infrastructure & Cloud',
    summary:
      'Containerised the stack and ran it on AWS, including the networking underneath it rather than only the application on top.',
    tagline: 'Containers, EC2, and the VPC underneath.',
    highlights: [
      'Containerised applications with Docker and docker-compose so local and deployed environments matched.',
      'Deployed and operated the production Node.js server on AWS EC2.',
      'Configured AWS networking from the ground up: a VPC with two subnets, an Internet Gateway and route tables.',
      'Ran MongoDB on a dedicated EC2 instance as the database layer, separated from the application host.',
    ],
    stack: ['Docker', 'docker-compose', 'AWS EC2', 'VPC', 'Subnets', 'Internet Gateway', 'MongoDB'],
  },
] as const;
