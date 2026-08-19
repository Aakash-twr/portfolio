import clsx, { type ClassValue } from 'clsx';

/**
 * Conditional class joining. `clsx` only — no `tailwind-merge`, because nothing
 * here overrides utilities across component boundaries, and the extra ~4kB
 * would buy nothing.
 */
export const cn = (...inputs: ClassValue[]): string => clsx(inputs);
