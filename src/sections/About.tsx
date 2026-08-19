import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Editorial layout rather than a paragraph block: a wide measure for the
 * narrative, a narrow rail for the facts a recruiter scans for. The progression
 * is stated plainly — frontend outward — without inflating three years into more.
 */

const TRAJECTORY: readonly { period: string; title: string; detail: string }[] = [
  {
    period: 'Started',
    title: 'Frontend',
    detail: 'React interfaces, Figma to production, accessibility and state management.',
  },
  {
    period: 'Then',
    title: 'Performance',
    detail: 'Profiling, render boundaries, bundle budgets, holding frame rate under live data.',
  },
  {
    period: 'Then',
    title: 'Backend & real-time',
    detail: 'Layered Node.js services, WebSockets, WebRTC and queue-backed event processing.',
  },
  {
    period: 'Now',
    title: 'Infrastructure & AI',
    detail: 'Docker and AWS networking, plus agent orchestration and retrieval systems.',
  },
];

export function About() {
  return (
    <Section id="about" className="container-page py-24 sm:py-32">
      <SectionHeading
        id="about"
        eyebrow="01 / About"
        title="I started at the interface and kept following the problem down the stack."
        lede="Most of what I have learned came from a system that could not be faked: robots that keep emitting whether or not the UI is ready for it."
      />

      <div className="mt-16 grid gap-x-16 gap-y-12 lg:grid-cols-[1.35fr_1fr]">
        {/* Narrative */}
        <div className="max-w-[62ch]">
          <Reveal>
            <p className="text-lede text-fg">
              I am a Full Stack Developer at{' '}
              <span className="font-medium">Seven Robotics</span>, where I build the
              software that operators use to run fleets of autonomous mobile robots —
              warehouse maps, task management, and live video from machines that are
              moving right now.
            </p>
          </Reveal>

          <div className="mt-6 space-y-5 text-[0.9375rem] leading-relaxed text-fg-muted">
            <Reveal delay={0.05}>
              <p>
                I began in frontend development, and the work pulled me outward. A
                console fed by continuous telemetry does not let you treat performance
                as a finishing step, so I learned to profile properly — which render
                boundaries matter, what actually belongs in a memo, why a canvas needs
                its own frame budget. Then the questions stopped being frontend
                questions: how do these events arrive, what happens when a socket drops,
                what should not be sitting on the request path.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <p>
                So I went further down. I architected the REST layer as
                controller–service–repository so business rules stayed testable. I built
                the real-time transport — Socket.IO and raw WebSockets for events, WebRTC
                for camera feeds, RabbitMQ for anything that should not block a response.
                I containerised it with Docker, deployed it to EC2, and configured the
                VPC, subnets, gateway and route tables underneath rather than treating
                the network as someone else's layer.
              </p>
            </Reveal>
            <Reveal delay={0.11}>
              <p>
                Lately the interesting problems have been in AI systems, and they turn
                out to be systems problems: my multi-agent research pipeline is mostly a
                concurrency and retrieval design question wearing an LLM hat. That is the
                thread through all of it — I like the layer where the abstraction stops
                holding and you have to understand what is really happening.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Trajectory rail */}
        <Reveal delay={0.06} className="lg:pt-2">
          <h3 className="mono-label text-fg-subtle">Trajectory</h3>
          <ol className="mt-6 space-y-0">
            {TRAJECTORY.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 pb-7 last:pb-0">
                {/* Connector, drawn per item so it stops at the last one. */}
                {index < TRAJECTORY.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-4 left-[3.5px] h-full w-px bg-line"
                  />
                )}
                <span
                  aria-hidden="true"
                  className={
                    index === TRAJECTORY.length - 1
                      ? 'mt-1.5 size-2 shrink-0 rounded-full bg-accent ring-3 ring-accent-soft'
                      : 'mt-1.5 size-2 shrink-0 rounded-full bg-line-strong'
                  }
                />
                <div className="-mt-0.5 min-w-0">
                  <p className="font-mono text-[0.6875rem] tracking-widest text-fg-subtle uppercase">
                    {step.period}
                  </p>
                  <p className="mt-1 font-medium text-fg">{step.title}</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </Section>
  );
}
