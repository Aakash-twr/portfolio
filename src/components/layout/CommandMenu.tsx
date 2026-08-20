import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpRight,
  CornerDownLeft,
  Download,
  Mail,
  Moon,
  Search,
  Sun,
} from 'lucide-react';
import { GitHubIcon, LeetCodeIcon, LinkedInIcon } from '@/components/ui/BrandIcons';
import {
  EMAIL,
  GITHUB_URL,
  LEETCODE_URL,
  LINKEDIN_URL,
  RESUME_URL,
  isPlaceholder,
  navItems,
} from '@/config/site';
import { useScrollLock, useTheme } from '@/hooks';
import { cn } from '@/utils/cn';

/* ────────────────────────────────────────────────────────────────────────────
   Command menu (⌘K / Ctrl-K)

   Hand-rolled rather than pulled from a library, because the whole value of it
   here is the accessibility work: a real modal dialog with a focus trap, focus
   restored to the trigger on close, arrow-key navigation over a listbox with
   aria-activedescendant, Escape to dismiss, and a scroll lock that does not
   shift the page. That is about 200 lines, and it is the part worth showing.
   ──────────────────────────────────────────────────────────────────────────── */

type Command = {
  id: string;
  label: string;
  group: 'Navigate' | 'Links' | 'Actions';
  hint?: string;
  icon?: ReactNode;
  /** Extra terms matched by the filter but not displayed. */
  keywords?: string;
  run: () => void;
  disabled?: boolean;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Element focused before opening, so focus can be handed back on close. */
  const restoreTo = useRef<HTMLElement | null>(null);

  const { theme, toggle } = useTheme();
  useScrollLock(open);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const go = useCallback(
    (hash: string) => {
      close();
      // Defer so the scroll lock is released before the browser scrolls.
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    [close],
  );

  const openExternal = useCallback(
    (url: string) => {
      close();
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [close],
  );

  const commands = useMemo<Command[]>(() => {
    const navCommands: Command[] = navItems.map((item) => ({
      id: `nav-${item.id}`,
      label: item.label,
      group: 'Navigate',
      hint: `#${item.id}`,
      run: () => go(item.id),
    }));

    const linkCommands: Command[] = [
      {
        id: 'link-github',
        label: 'GitHub',
        group: 'Links',
        icon: <GitHubIcon size={15} />,
        keywords: 'source code repositories',
        disabled: isPlaceholder(GITHUB_URL),
        run: () => openExternal(GITHUB_URL),
      },
      {
        id: 'link-linkedin',
        label: 'LinkedIn',
        group: 'Links',
        icon: <LinkedInIcon size={15} />,
        keywords: 'work history profile',
        disabled: isPlaceholder(LINKEDIN_URL),
        run: () => openExternal(LINKEDIN_URL),
      },
      {
        id: 'link-leetcode',
        label: 'LeetCode',
        group: 'Links',
        icon: <LeetCodeIcon size={15} />,
        keywords: 'algorithms dsa',
        disabled: isPlaceholder(LEETCODE_URL),
        run: () => openExternal(LEETCODE_URL),
      },
    ];

    const actionCommands: Command[] = [
      {
        id: 'action-resume',
        label: 'Download resume',
        group: 'Actions',
        hint: 'PDF',
        icon: <Download size={15} strokeWidth={1.75} aria-hidden="true" />,
        keywords: 'cv pdf',
        run: () => {
          close();
          window.open(RESUME_URL, '_blank', 'noopener,noreferrer');
        },
      },
      {
        id: 'action-email',
        label: 'Copy email address',
        group: 'Actions',
        hint: EMAIL,
        icon: <Mail size={15} strokeWidth={1.75} aria-hidden="true" />,
        keywords: 'contact mail',
        run: () => {
          void navigator.clipboard?.writeText(EMAIL).catch(() => {});
          close();
        },
      },
      {
        id: 'action-theme',
        label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
        group: 'Actions',
        icon:
          theme === 'dark' ? (
            <Sun size={15} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Moon size={15} strokeWidth={1.75} aria-hidden="true" />
          ),
        keywords: 'dark light appearance colour color',
        run: () => {
          toggle();
          close();
        },
      },
    ];

    return [...navCommands, ...linkCommands, ...actionCommands];
  }, [close, go, openExternal, theme, toggle]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.hint ?? ''} ${command.keywords ?? ''}`
        .toLowerCase()
        .includes(needle),
    );
  }, [commands, query]);

  const groups = useMemo(() => {
    const order: Command['group'][] = ['Navigate', 'Links', 'Actions'];
    return order
      .map((group) => ({ group, items: filtered.filter((item) => item.group === group) }))
      .filter((entry) => entry.items.length > 0);
  }, [filtered]);

  /* Global open shortcut ---------------------------------------------------- */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        restoreTo.current = document.activeElement as HTMLElement | null;
        setOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* Focus management ------------------------------------------------------- */
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      return;
    }
    restoreTo.current?.focus?.();
  }, [open]);

  // Keep the highlighted row in view as the selection moves.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  useEffect(() => setActiveIndex(0), [query]);

  const onDialogKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (filtered.length === 0) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => (current + delta + filtered.length) % filtered.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const command = filtered[activeIndex];
      if (command && !command.disabled) command.run();
      return;
    }

    // Focus trap: Tab must not escape the dialog while it is modal.
    if (event.key === 'Tab') {
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const trigger = (
    <button
      type="button"
      onClick={() => {
        restoreTo.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }}
      aria-haspopup="dialog"
      aria-expanded={open}
      className="nav-icon-btn gap-2 pr-2 pl-3"
    >
      <Search size={13} strokeWidth={1.75} aria-hidden="true" />
      <span className="text-[0.8125rem]">Jump to</span>
      <kbd className="ml-1 hidden rounded border border-[var(--raw-nav-line)] px-1.5 py-0.5 font-mono text-[0.625rem] text-fg-subtle sm:inline-block">
        ⌘K
      </kbd>
    </button>
  );

  if (!open) return trigger;

  // Flat index across groups, so arrow keys move linearly through what is visible.
  let flatIndex = -1;

  return (
    <>
      {trigger}
      {createPortal(
        <div
          className="fixed inset-0 z-90 flex items-start justify-center p-4 pt-[12vh] sm:pt-[18vh]"
          onKeyDown={onDialogKeyDown}
        >
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 cursor-default bg-bg/70 backdrop-blur-sm"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line-strong bg-surface shadow-card"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={15} strokeWidth={1.75} aria-hidden="true" className="text-fg-subtle" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jump to a section, link or action…"
                aria-label="Search commands"
                aria-controls="command-list"
                aria-activedescendant={
                  filtered[activeIndex] ? `command-${filtered[activeIndex]!.id}` : undefined
                }
                autoComplete="off"
                spellCheck={false}
                className="h-12 flex-1 bg-transparent text-[0.9375rem] text-fg outline-none placeholder:text-fg-subtle"
              />
              <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.625rem] text-fg-subtle">
                ESC
              </kbd>
            </div>

            <ul
              ref={listRef}
              id="command-list"
              role="listbox"
              aria-label="Commands"
              className="max-h-[min(24rem,50vh)] overflow-y-auto p-2"
            >
              {groups.length === 0 && (
                <li className="px-3 py-6 text-center text-[0.875rem] text-fg-subtle">
                  No matches for &ldquo;{query}&rdquo;
                </li>
              )}

              {groups.map((entry) => (
                <li key={entry.group} role="presentation">
                  <p className="mono-label px-3 pt-3 pb-1.5 text-fg-subtle">{entry.group}</p>
                  <ul role="presentation">
                    {entry.items.map((command) => {
                      flatIndex += 1;
                      const index = flatIndex;
                      const active = index === activeIndex;
                      return (
                        <li key={command.id} role="presentation">
                          <button
                            type="button"
                            role="option"
                            id={`command-${command.id}`}
                            data-index={index}
                            aria-selected={active}
                            aria-disabled={command.disabled || undefined}
                            data-focus-ring="custom"
                            onMouseMove={() => setActiveIndex(index)}
                            onClick={() => !command.disabled && command.run()}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[0.875rem] transition-colors duration-100',
                              command.disabled && 'opacity-40',
                              active ? 'bg-surface-2 text-fg' : 'text-fg-muted',
                            )}
                          >
                            <span className="w-4 shrink-0 text-fg-subtle">{command.icon}</span>
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {command.label}
                            </span>
                            {command.hint && (
                              <span className="hidden shrink-0 font-mono text-[0.6875rem] text-fg-subtle sm:inline">
                                {command.disabled ? 'not set' : command.hint}
                              </span>
                            )}
                            {active &&
                              (command.group === 'Links' ? (
                                <ArrowUpRight size={13} aria-hidden="true" className="shrink-0" />
                              ) : (
                                <CornerDownLeft size={13} aria-hidden="true" className="shrink-0" />
                              ))}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
