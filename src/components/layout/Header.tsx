import { useEffect, useRef, useState } from 'react';
import { Download, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CommandMenu } from './CommandMenu';
import { ScrollProgress } from './ScrollProgress';
import { RESUME_URL, navItems, site } from '@/config/site';
import { useActiveSection, useMediaQuery, useScrollLock } from '@/hooks';
import { cn } from '@/utils/cn';

const SECTION_IDS = navItems.map((item) => item.id);
const DESKTOP_ITEMS = navItems.filter((item) => !item.navHidden);

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeSection = useActiveSection(SECTION_IDS);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useScrollLock(menuOpen);

  // Measure the active link so the indicator can track it. Re-measured on resize
  // because the label widths depend on the font, which may load late.
  useEffect(() => {
    if (!isDesktop) return;

    const measure = () => {
      const list = listRef.current;
      if (!list) return;
      const target = activeSection
        ? list.querySelector<HTMLElement>(`[data-nav-id="${activeSection}"]`)
        : null;
      if (!target) {
        setIndicator((current) => ({ ...current, width: 0 }));
        return;
      }
      setIndicator({
        left: target.offsetLeft + 14,
        width: Math.max(target.offsetWidth - 28, 0),
      });
    };

    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener('resize', measure);
  }, [activeSection, isDesktop]);

  // Solidify the header background only once the page has moved, so the hero
  // reads as full-bleed at rest.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A resize past the breakpoint must not leave an invisible open sheet behind.
  useEffect(() => {
    if (isDesktop) setMenuOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!menuOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled
          ? 'border-b border-line bg-bg/80 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <nav aria-label="Primary" className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Wordmark */}
          <a
            href="#work"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label={`${site.name} — back to top`}
          >
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-md border border-line bg-surface font-mono text-[0.6875rem] font-medium text-accent transition-colors duration-200 group-hover:border-accent-line"
            >
              AT
            </span>
            <span className="hidden text-[0.9375rem] font-semibold tracking-tight sm:block">
              Akash Tiwary
            </span>
          </a>

          {/*
            Desktop nav. The active indicator is one absolutely-positioned element
            whose left/width are measured from the active link and animated by CSS
            transition — no shared-layout animation, so motion's layout feature
            bundle never has to ship.
          */}
          <ul ref={listRef} className="relative hidden items-center lg:flex">
            {DESKTOP_ITEMS.map((item) => {
              const active = activeSection === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    data-nav-id={item.id}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'inline-flex h-9 items-center px-3.5 text-[0.875rem] transition-colors duration-200',
                      active ? 'text-fg' : 'text-fg-muted hover:text-fg',
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute -bottom-1 h-px bg-accent',
                !reduceMotion && 'transition-[left,width,opacity] duration-300 ease-out-expo',
              )}
              style={{
                left: indicator.left,
                width: indicator.width,
                opacity: indicator.width > 0 ? 1 : 0,
              }}
            />
          </ul>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">
              <CommandMenu />
            </div>
            <ThemeToggle />
            <a
              href={RESUME_URL}
              download
              className="hidden h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-[0.8125rem] font-semibold text-accent-ink transition-colors duration-200 hover:bg-accent-hover sm:inline-flex"
            >
              <Download size={14} strokeWidth={2} aria-hidden="true" />
              Resume
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-fg-muted transition-colors duration-200 hover:text-fg lg:hidden"
            >
              <Menu size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      <ScrollProgress />

      {/*
        Mobile navigation as a full-height sheet rather than a shrunk desktop bar:
        large tap targets, one column, and the primary actions repeated at the
        bottom where a thumb actually reaches.

        Enter is animated; dismissal is immediate. Waiting out an exit animation
        before a nav sheet closes reads as lag, not polish.
      */}
      {menuOpen && (
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className={cn(
              'fixed inset-0 z-50 flex flex-col bg-bg lg:hidden',
              !reduceMotion && 'animate-sheet-in',
            )}
          >
            <div className="container-page flex h-16 shrink-0 items-center justify-between">
              <span className="mono-label text-fg-subtle">Navigation</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-fg-muted transition-colors hover:text-fg"
              >
                <X size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <ul className="container-page flex-1 overflow-y-auto pt-4">
              {navItems.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={activeSection === item.id ? 'true' : undefined}
                    className="flex items-baseline gap-4 border-b border-line py-5 text-2xl font-medium tracking-tight"
                  >
                    <span className="font-mono text-[0.6875rem] text-accent">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={activeSection === item.id ? 'text-accent' : 'text-fg'}>
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="container-page shrink-0 border-t border-line py-5">
              <a
                href={RESUME_URL}
                download
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-ink"
              >
                <Download size={16} strokeWidth={2} aria-hidden="true" />
                Download resume
              </a>
            </div>
          </div>
        )}
    </header>
  );
}
