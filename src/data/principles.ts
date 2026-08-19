/** Engineering mindset. Short, specific, and grounded in the work above. */

export type Principle = {
  id: string;
  index: string;
  title: string;
  body: string;
};

export const pullQuote =
  'I care about what happens after the demo works.';

export const principles: readonly Principle[] = [
  {
    id: 'after-demo',
    index: '01',
    title: 'The demo is the starting line',
    body: 'A feature that works once on a fast laptop is not finished. How fast is it on the hardware it will actually run on? What happens when the connection drops mid-stream, or the queue backs up?',
  },
  {
    id: 'measure',
    index: '02',
    title: 'Measure before optimising',
    body: 'Every performance number I claim came from profiling first. The React DevTools profiler and bundle analysis decide what to fix — not intuition about what looks slow.',
  },
  {
    id: 'boundaries',
    index: '03',
    title: 'Boundaries are the architecture',
    body: 'Controller, service, repository on the backend. Update-frequency boundaries on the frontend. Most complexity I have removed came from putting a seam in the right place rather than from cleverness inside a layer.',
  },
  {
    id: 'realtime',
    index: '04',
    title: 'Real-time is a reliability problem',
    body: 'Pushing an event is easy. The engineering is in reconnection, ordering, backpressure and making sure a stale UI corrects itself instead of quietly lying to the operator.',
  },
  {
    id: 'handover',
    index: '05',
    title: 'Write for the next engineer',
    body: 'Types that describe intent, naming that survives a year, and structure someone can navigate without me in the room. Maintainability is a feature with a long payback period.',
  },
];
