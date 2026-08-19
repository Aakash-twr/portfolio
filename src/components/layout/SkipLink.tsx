/**
 * Visible only on keyboard focus. First tab stop on the page, so a keyboard or
 * screen-reader user can bypass the header instead of walking through it.
 */
export function SkipLink() {
  return (
    <a
      href="#work"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-100 focus-visible:inline-flex focus-visible:h-10 focus-visible:items-center focus-visible:rounded-lg focus-visible:bg-accent focus-visible:px-4 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-accent-ink"
    >
      Skip to content
    </a>
  );
}
