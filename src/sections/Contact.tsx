import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Download, FileText, Mail } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { GitHubIcon, LeetCodeIcon, LinkedInIcon } from '@/components/ui/BrandIcons';
import {
  EMAIL,
  GITHUB_URL,
  LEETCODE_URL,
  LINKEDIN_URL,
  RESUME_URL,
  isPlaceholder,
  site,
} from '@/config/site';
import { cn } from '@/utils/cn';

/** Copy-to-clipboard with a self-resetting confirmation and no toast library. */
function CopyEmailButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context or denied permission): the address is
      // visible next to this button, so there is nothing to recover from.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-fg-muted transition-colors duration-200 hover:border-accent-line hover:text-accent"
      aria-label={copied ? 'Email address copied' : `Copy email address ${EMAIL}`}
    >
      {copied ? (
        <Check size={14} strokeWidth={2} aria-hidden="true" className="text-accent" />
      ) : (
        <Copy size={14} strokeWidth={1.75} aria-hidden="true" />
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  );
}

const CHANNELS = [
  { id: 'linkedin', label: 'LinkedIn', detail: 'Work history and messages', href: LINKEDIN_URL, icon: <LinkedInIcon size={17} /> },
  { id: 'github', label: 'GitHub', detail: 'Source code and side projects', href: GITHUB_URL, icon: <GitHubIcon size={17} /> },
  { id: 'leetcode', label: 'LeetCode', detail: 'Data structures and algorithms', href: LEETCODE_URL, icon: <LeetCodeIcon size={17} /> },
] as const;

export function Contact() {
  return (
    <Section id="contact" className="relative overflow-hidden pt-24 pb-20 sm:pt-32">
      <div aria-hidden="true" className="absolute inset-0 border-t border-line bg-surface-2/40" />
      <div className="bg-lattice absolute inset-0 opacity-70" aria-hidden="true" />

      <div className="container-page relative">
        <Reveal>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-6 bg-accent" />
            <p className="mono-label text-accent">08 / Contact</p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 id="contact-heading" className="mt-6 max-w-3xl text-headline font-semibold">
            Let&rsquo;s build something useful.
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="mt-5 max-w-xl text-lede text-fg-muted">
            {site.availability.openToWork
              ? 'I am open to conversations about frontend architecture, real-time systems and full-stack roles. The fastest way to reach me is email.'
              : 'The fastest way to reach me is email.'}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* Email — the primary channel, given the most weight. */}
          <Reveal className="flex flex-col justify-between rounded-xl border border-line bg-surface p-7">
            <div>
              <p className="mono-label text-fg-subtle">Email</p>
              <div className="mt-4 flex items-start gap-3">
                <a
                  href={`mailto:${EMAIL}`}
                  className="min-w-0 text-[clamp(1.0625rem,2.2vw,1.5rem)] font-medium break-all text-fg transition-colors duration-200 hover:text-accent"
                >
                  {EMAIL}
                </a>
                <CopyEmailButton />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`mailto:${EMAIL}`} size="md">
                <Mail size={15} strokeWidth={1.75} aria-hidden="true" />
                Send an email
              </ButtonLink>
            </div>
          </Reveal>

          {/* Resume CTA */}
          <Reveal delay={0.05} className="rounded-xl border border-line bg-surface p-7">
            <p className="mono-label text-fg-subtle">Resume</p>
            <p className="mt-4 flex items-center gap-2 text-[1.0625rem] font-medium">
              <FileText size={17} strokeWidth={1.75} aria-hidden="true" className="text-accent" />
              Prefer the traditional format?
            </p>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-fg-muted">
              The whole thing on one page — experience, projects and stack, in the layout
              an ATS expects.
            </p>
            <ButtonLink href={RESUME_URL} variant="secondary" size="md" download className="mt-6">
              <Download size={15} strokeWidth={1.75} aria-hidden="true" />
              Download resume (PDF)
            </ButtonLink>
          </Reveal>
        </div>

        {/* Secondary channels */}
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {CHANNELS.map((channel, index) => {
            const unresolved = isPlaceholder(channel.href);
            return (
              <Reveal as="li" key={channel.id} delay={0.04 + index * 0.04}>
                <a
                  href={unresolved ? undefined : channel.href}
                  aria-disabled={unresolved || undefined}
                  title={
                    unresolved
                      ? `Add your ${channel.label} URL in src/config/site.ts`
                      : channel.label
                  }
                  {...(unresolved ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  className={cn(
                    'group flex h-full items-center gap-4 rounded-xl border border-line bg-surface p-5 transition-colors duration-200',
                    unresolved
                      ? 'cursor-not-allowed opacity-55'
                      : 'hover:border-accent-line',
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 transition-colors duration-200',
                      unresolved ? 'text-fg-subtle' : 'text-fg-muted group-hover:text-accent',
                    )}
                  >
                    {channel.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] font-medium text-fg">
                      {channel.label}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] text-fg-muted">
                      {channel.detail}
                    </span>
                  </span>
                  {!unresolved && (
                    <ArrowUpRight
                      size={15}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="shrink-0 text-fg-subtle transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-accent"
                    />
                  )}
                </a>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
