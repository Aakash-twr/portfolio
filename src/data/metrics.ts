/**
 * Engineering metrics. Every value here comes from real, resume-backed work.
 * Do not add a metric that is not supported by actual results.
 */

export type Metric = {
  id: string;
  /** Numeric portion, animated by AnimatedCounter. */
  value: number;
  /** Rendered before the number, e.g. '~'. */
  prefix?: string;
  /** Rendered after the number, e.g. '%' or 'fps'. */
  suffix?: string;
  label: string;
  /** The context that makes the number meaningful. */
  detail: string;
  /** Which section the number was earned in. */
  origin: 'Seven Robotics' | 'Blogging Platform';
  /**
   * 0–1 fill used by the inline bar. For "reduction" metrics this is the size of
   * the improvement, not a score.
   */
  fill: number;
};

export const metrics: readonly Metric[] = [
  {
    id: 'renders',
    value: 40,
    prefix: '~',
    suffix: '%',
    label: 'fewer render cycles',
    detail:
      'Isolated subscriptions, memoised selectors and component boundaries drawn along update frequency.',
    origin: 'Seven Robotics',
    fill: 0.4,
  },
  {
    id: 'bundle',
    value: 35,
    prefix: '~',
    suffix: '%',
    label: 'smaller bundle',
    detail: 'Route-level code splitting with React.lazy plus removal of eagerly imported dependencies.',
    origin: 'Seven Robotics',
    fill: 0.35,
  },
  {
    id: 'fps',
    value: 60,
    suffix: 'fps',
    label: 'sustained interaction',
    detail:
      'Canvas frame throttling and render loops decoupled from state updates in map and video views.',
    origin: 'Seven Robotics',
    fill: 1,
  },
  {
    id: 'retrieval',
    value: 70,
    prefix: '~',
    suffix: '%',
    label: 'faster retrieval',
    detail: 'Redis cache in front of the top 100 searched posts, serving repeat reads from memory.',
    origin: 'Blogging Platform',
    fill: 0.7,
  },
  {
    id: 'interactions',
    value: 1000,
    suffix: '+',
    label: 'user interactions supported',
    detail: 'Follows, likes and comments handled across the live blogging platform.',
    origin: 'Blogging Platform',
    fill: 0.85,
  },
] as const;
