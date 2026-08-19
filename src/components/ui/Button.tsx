import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink font-semibold hover:bg-accent-hover ' +
    'shadow-[0_0_0_1px_var(--raw-accent),0_8px_30px_-12px_var(--raw-accent)] ' +
    'hover:shadow-[0_0_0_1px_var(--raw-accent-hover),0_10px_36px_-10px_var(--raw-accent)]',
  secondary:
    'bg-surface text-fg font-medium ring-1 ring-line-strong hover:bg-surface-2 ' +
    'hover:ring-accent-line',
  ghost:
    'text-fg-muted font-medium hover:text-fg hover:bg-surface-2 ring-1 ring-transparent ' +
    'hover:ring-line',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[0.8125rem] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-[0.9375rem] gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
};

const BASE =
  'group relative inline-flex select-none items-center justify-center whitespace-nowrap ' +
  'transition-[background-color,color,box-shadow,transform,opacity] duration-200 ' +
  'ease-out-expo active:translate-y-px ' +
  'disabled:pointer-events-none disabled:opacity-45 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent';

const styles = (variant: Variant, size: Size, className?: string) =>
  cn(BASE, VARIANTS[variant], SIZES[size], className);

type Shared = { variant?: Variant; size?: Size; children: ReactNode };

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: Shared & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={styles(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

/**
 * Anchor-flavoured button. A separate component rather than a polymorphic `as`
 * prop: the two elements have genuinely different attributes and accessibility
 * semantics, and keeping them apart means neither needs a type escape hatch.
 */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  external,
  ...rest
}: Shared & AnchorHTMLAttributes<HTMLAnchorElement> & { external?: boolean }) {
  const externalAttrs = external
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};

  return (
    <a className={styles(variant, size, className)} {...externalAttrs} {...rest}>
      {children}
    </a>
  );
}
