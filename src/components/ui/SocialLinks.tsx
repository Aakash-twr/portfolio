import { Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import { socialLinks, isPlaceholder, type SocialLink } from '@/config/site';
import { GitHubIcon, LeetCodeIcon, LinkedInIcon } from './BrandIcons';
import { cn } from '@/utils/cn';

const ICONS: Record<SocialLink['id'], ReactNode> = {
  github: <GitHubIcon size={16} />,
  linkedin: <LinkedInIcon size={16} />,
  leetcode: <LeetCodeIcon size={16} />,
  email: <Mail size={16} strokeWidth={1.75} aria-hidden="true" />,
};

type SocialLinksProps = {
  /** `icon` for compact rows, `row` for labelled links. */
  variant?: 'icon' | 'row';
  /** Restrict and order which links render. */
  only?: readonly SocialLink['id'][];
  className?: string;
};

export function SocialLinks({ variant = 'icon', only, className }: SocialLinksProps) {
  const links = only
    ? only
        .map((id) => socialLinks.find((link) => link.id === id))
        .filter((link): link is SocialLink => Boolean(link))
    : socialLinks;

  return (
    <ul className={cn('flex flex-wrap items-center', variant === 'icon' ? 'gap-2' : 'gap-3', className)}>
      {links.map((link) => {
        // A placeholder URL is rendered as a non-navigating element rather than a
        // dead link, so the page never advertises a destination it cannot reach.
        const unresolved = isPlaceholder(link.href);

        return (
          <li key={link.id}>
            <a
              href={unresolved ? undefined : link.href}
              aria-disabled={unresolved || undefined}
              title={unresolved ? `${link.label} — add your URL in src/config/site.ts` : link.label}
              {...(link.external && !unresolved
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-line bg-surface text-fg-muted transition-colors duration-200',
                variant === 'icon' ? 'size-9 justify-center' : 'h-9 px-3 text-[0.8125rem]',
                unresolved
                  ? 'cursor-not-allowed opacity-45'
                  : 'hover:border-accent-line hover:text-accent',
              )}
            >
              {ICONS[link.id]}
              {variant === 'row' && <span className="font-medium">{link.label}</span>}
              {variant === 'icon' && <span className="sr-only">{link.label}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
