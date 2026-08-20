import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks';

/**
 * Dark is the default and the design's native state; light exists because some
 * people need it, and shipping a real second theme is cheaper than shipping an
 * inaccessible one.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="nav-icon-btn w-9"
    >
      {isDark ? (
        <Sun size={15} strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon size={15} strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
