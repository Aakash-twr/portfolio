import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { principles, pullQuote } from '@/data/principles';

/**
 * Engineering mindset. Kept short and specific — a long values manifesto reads as
 * padding, but five concrete positions tell a reviewer how someone works.
 */
export function Approach() {
  return (
    <Section id="approach" className="container-page py-24 sm:py-32">
      <SectionHeading
        id="approach"
        eyebrow="07 / Approach"
        title="How I think about building things."
      />

      {/* The one editorial moment on the page: a serif pull-quote, used once. */}
      <Reveal className="mt-14">
        <blockquote className="max-w-4xl">
          <p className="font-editorial text-[clamp(1.75rem,4.5vw,3.25rem)] leading-[1.12] tracking-[-0.01em] italic">
            {pullQuote}
          </p>
          <p className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-fg-muted">
            How fast is it? How does it behave under load? What happens when the
            connection drops? And can another engineer maintain it without me?
          </p>
        </blockquote>
      </Reveal>

      <ol className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {principles.map((principle, index) => (
          <Reveal
            as="li"
            key={principle.id}
            delay={Math.min(index * 0.04, 0.16)}
            className="border-t border-line pt-5"
          >
            <span className="font-mono text-[0.6875rem] text-accent">{principle.index}</span>
            <h3 className="mt-3 text-[1.0625rem] leading-snug font-medium">{principle.title}</h3>
            <p className="mt-2.5 text-[0.875rem] leading-relaxed text-fg-muted">
              {principle.body}
            </p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
