import { ArrowUpRight } from 'lucide-react';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { site } from '@/config/site';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col gap-8 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.9375rem] font-semibold tracking-tight">{site.name}</p>
          <p className="mt-1 text-[0.875rem] text-fg-muted">{site.role}</p>
          <p className="mono-label mt-5 text-fg-subtle">
            © {site.copyrightYear} {site.name}
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 sm:items-end">
          <SocialLinks />
          <a
            href="#work"
            className="group inline-flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-widest text-fg-subtle uppercase transition-colors duration-200 hover:text-accent"
          >
            Back to top
            <ArrowUpRight
              size={12}
              strokeWidth={2}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </div>

      {/*
        A quiet build note. It is here because "how was this made" is the first
        question an engineer asks about a portfolio, and answering it honestly is
        part of the point.
      */}
      <div className="container-page border-t border-line py-5">
        <p className="font-mono text-[0.6875rem] leading-relaxed text-fg-subtle">
          Built with React 19, TypeScript, Vite and Tailwind CSS. Diagrams are
          hand-authored SVG and canvas; the 3D viewer is React Three Fiber, loaded on
          demand. No animation or charting library. Respects{' '}
          <span className="text-fg-muted">prefers-reduced-motion</span>.
        </p>
      </div>
    </footer>
  );
}
