import { useCallback, useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CommandMenu } from './CommandMenu';
import { ScrollProgress } from './ScrollProgress';
import { RESUME_URL, navItems, site } from '@/config/site';
import { useActiveSection, useMediaQuery, useScrollLock } from '@/hooks';
import { cn } from '@/utils/cn';

const SECTION_IDS = navItems.map((item) => item.id);
const DESKTOP_ITEMS = navItems.filter((item) => !item.navHidden);

/**
 * The wordmark sits between the two groups, so the split point decides how
 * balanced the capsule looks. Halving the list keeps it even as items change.
 */
const SPLIT = Math.ceil(DESKTOP_ITEMS.length / 2);

/** The wordmark tones the family name back, so it needs the halves separately. */
const [GIVEN_NAME, ...FAMILY_PARTS] = site.name.split(' ');
const FAMILY_NAME = FAMILY_PARTS.join(' ');

const LEFT_ITEMS = DESKTOP_ITEMS.slice(0, SPLIT);
const RIGHT_ITEMS = DESKTOP_ITEMS.slice(SPLIT);

/** Scroll deltas below this are noise; the header should not react to them. */
const SCROLL_THRESHOLD = 5;
/** A jump this large is an anchor navigation, not a reading gesture. */
const JUMP_THRESHOLD = 100;
/** Within this distance of the top the header is always shown. */
const TOP_ZONE = 10;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const activeSection = useActiveSection(SECTION_IDS);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isDesktop = useMediaQuery('(min-width: 1200px)');
  const burgerRef = useRef<HTMLButtonElement>(null);
  const leftListRef = useRef<HTMLUListElement>(null);
  const rightListRef = useRef<HTMLUListElement>(null);

  /*
    Both nav groups are pinned to the width of the wider one. Without this the
    wordmark sits at the centre of the capsule but not at the centre of the
    viewport, because "About Experience 3D" and "Projects Stack Contact" are
    never the same width. Measured rather than hard-coded, since the widths
    depend on a webfont that may load late.
  */
  const [groupWidth, setGroupWidth] = useState(130);

  useScrollLock(menuOpen);

  useEffect(() => {
    const left = leftListRef.current;
    const right = rightListRef.current;
    if (!left || !right) return;

    const measure = () => {
      const widest = Math.max(left.scrollWidth, right.scrollWidth);
      setGroupWidth((current) => (widest > current ? widest : current));
    };

    const observer = new ResizeObserver(measure);
    observer.observe(left);
    observer.observe(right);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [isDesktop]);

  /*
    Hide on the way down, reveal on the way up. The header is only in the way
    while the reader is moving forward, and it should be back the instant they
    reverse — so the reveal is driven by direction, not by a scroll position.
  */
  useEffect(() => {
    let previous = window.scrollY;
    if (previous < TOP_ZONE) setVisible(true);

    const onScroll = () => {
      const current = window.scrollY;
      const delta = current - previous;
      previous = current;

      // Anchor jumps move hundreds of pixels in one event; treating those as a
      // scroll direction makes the header flicker on every in-page link.
      if (Math.abs(delta) >= JUMP_THRESHOLD) return;

      if (delta > SCROLL_THRESHOLD) setVisible(false);
      else if (delta < -SCROLL_THRESHOLD || current < TOP_ZONE) setVisible(true);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A hidden header must not be a keyboard trap: tabbing into it brings it back.
  const revealOnFocus = useCallback(() => setVisible(true), []);

  // A resize past the breakpoint must not leave an invisible open sheet behind.
  useEffect(() => {
    if (isDesktop) setMenuOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!menuOpen) return;
    // The burger has become the X, so focusing it puts the close control under
    // the very next keypress.
    burgerRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // The burger doubles as the sheet's close control, so the capsule has to stay
  // on screen for as long as the sheet is open.
  const shown = visible || menuOpen;

  /*
    Opacity and the backdrop blur are animated together: fading in a capsule
    that is already blurring the page behind it looks like two separate events.
    Appearing is slower than leaving — a reveal wants to feel unhurried, a
    dismissal wants to be out of the way.
  */
  const pillMotion = reduceMotion
    ? { opacity: shown ? 1 : 0 }
    : {
        opacity: shown ? 1 : 0,
        backdropFilter: shown ? 'blur(14px)' : 'blur(0px)',
        WebkitBackdropFilter: shown ? 'blur(14px)' : 'blur(0px)',
        transition: `opacity ${shown ? 0.67 : 0.35}s ease, backdrop-filter ${
          shown ? 0.67 : 0.35
        }s ease`,
      };

  return (
    <>
      <ScrollProgress />

      {/* Centre capsule: navigation and the wordmark, nothing else. */}
      <header
        onFocus={revealOnFocus}
        className={cn(
          'nav-pill nav-pill-nav fixed left-1/2 top-5 z-50 w-max',
          'max-w-[calc(100vw-1.5rem)] -translate-x-1/2',
          !shown && 'pointer-events-none',
        )}
        style={pillMotion}
      >
        {/* Mobile: the theme control takes the slot the burger balances against. */}
        <div className="shrink-0 navbar:hidden">
          <ThemeToggle />
        </div>

        <nav aria-label="Primary" className="nav-group">
          <ul ref={leftListRef} className="nav-list" style={{ minWidth: groupWidth }}>
            {LEFT_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={activeSection === item.id ? 'true' : undefined}
                  className="nav-link"
                >
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/*
          Wordmark. Text only, as in the reference — a badge alongside it would
          read as a second element competing with the nav groups.

          The given name carries the mark at full weight and contrast; the family
          name steps back to the muted tone, and an accent period closes it.
          Hover resolves the muted half to full contrast so the whole name still
          reads as one hit target.

          The anchor is deliberately NOT a flex container: flex layout discards
          whitespace-only children, which would eat the space between the two
          names and force a hand-tuned margin in its place. Inline flow keeps a
          real word space, correctly sized by the font.
        */}
        <a
          href="#main"
          className="group shrink-0 whitespace-nowrap text-[0.9375rem] font-semibold tracking-tight"
          aria-label={`${site.name} — back to top`}
        >
          <span className="text-fg">{GIVEN_NAME}</span>
          {FAMILY_NAME && (
            <>
              {' '}
              <span className="font-normal text-fg-muted transition-colors duration-200 group-hover:text-fg">
                {FAMILY_NAME}
              </span>
            </>
          )}
          <span aria-hidden="true" className="text-accent">
            .
          </span>
        </a>

        <nav aria-label="Primary, continued" className="nav-group nav-group-right">
          <ul ref={rightListRef} className="nav-list" style={{ minWidth: groupWidth }}>
            {RIGHT_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={activeSection === item.id ? 'true' : undefined}
                  className="nav-link"
                >
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={burgerRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-haspopup="true"
          className="nav-burger shrink-0 navbar:hidden"
        >
          <span aria-hidden="true" className="nav-burger-inner">
            <span className="nav-burger-bar" />
            <span className="nav-burger-bar" />
          </span>
        </button>
      </header>

      {/*
        The actions live in their own capsule so the centre one keeps its
        symmetry: a resume button on the right would push the wordmark off the
        viewport centre, which is the whole point of the layout.
      */}
      <div
        onFocus={revealOnFocus}
        className={cn(
          'nav-pill nav-pill-actions fixed right-5 top-5 z-50 hidden navbar:flex',
          !shown && 'pointer-events-none',
        )}
        style={pillMotion}
      >
        <CommandMenu />
        <ThemeToggle />
        <a
          href={RESUME_URL}
          download
          className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-[0.8125rem] font-semibold text-accent-ink transition-colors duration-200 hover:bg-accent-hover"
        >
          <Download size={14} strokeWidth={2} aria-hidden="true" />
          Resume
        </a>
      </div>

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
          aria-label="Navigation"
          className={cn(
            'fixed inset-0 z-40 flex flex-col bg-bg pt-24 navbar:hidden',
            !reduceMotion && 'animate-sheet-in',
          )}
        >
          <ul className="container-page flex-1 overflow-y-auto">
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
    </>
  );
}
