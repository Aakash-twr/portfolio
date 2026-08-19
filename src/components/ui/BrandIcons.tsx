/**
 * Brand marks, inlined.
 *
 * lucide-react v1 removed its brand icons, and LeetCode never had one. Three
 * hand-authored paths cost ~1kB and avoid pulling in a second icon package.
 * `currentColor` + `aria-hidden` because every use sits next to a text label.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true as const,
  focusable: 'false' as const,
});

export function GitHubIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.55v-1.94c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .3.2.66.8.55A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function LinkedInIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export function LeetCodeIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M13.48 0a1.37 1.37 0 0 0-.98.4L7.2 5.8 2.4 10.7a5.07 5.07 0 0 0 0 7.1l4.8 4.9a5.09 5.09 0 0 0 7.16 0l2.62-2.66a1.37 1.37 0 0 0-1.96-1.93l-2.62 2.67a2.35 2.35 0 0 1-3.28 0l-4.8-4.9a2.33 2.33 0 0 1 0-3.24l4.8-4.9 5.3-5.4a1.37 1.37 0 0 0-.94-2.34Zm-2.9 8.9a1.37 1.37 0 0 0 0 2.74h11.05a1.37 1.37 0 0 0 0-2.74H10.58Z" />
      <path d="M16.4 2.2a1.37 1.37 0 0 0-.96 2.35l3.6 3.53a1.37 1.37 0 0 0 1.92-1.96l-3.6-3.53a1.37 1.37 0 0 0-.96-.39Z" />
    </svg>
  );
}
