import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';

const readTheme = (): Theme =>
  (document.documentElement.dataset.theme as Theme | undefined) ?? 'dark';

/**
 * Theme state lives on `<html data-theme>`; every colour utility resolves through
 * CSS custom properties, so flipping the attribute retints the whole page with no
 * React re-render below this hook. The initial value is set by an inline script in
 * index.html to avoid a flash of the wrong theme.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const apply = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the choice just will not persist */
    }
  }, []);

  const toggle = useCallback(() => {
    apply(readTheme() === 'dark' ? 'light' : 'dark');
  }, [apply]);

  // Keep the meta theme-color in step so mobile browser chrome matches.
  useEffect(() => {
    const color = theme === 'dark' ? '#07080a' : '#fbfbfa';
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((tag) => {
        tag.content = color;
      });
  }, [theme]);

  return { theme, toggle, setTheme: apply };
}
