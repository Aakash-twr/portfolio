import { cn } from '@/utils/cn';

type TechBadgeProps = {
  label: string;
  /** Raises contrast for daily-driver technologies. */
  emphasis?: boolean;
  className?: string;
};

export function TechBadge({ label, emphasis = false, className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-1 font-mono text-[0.6875rem] leading-none tracking-tight whitespace-nowrap transition-colors duration-200',
        emphasis
          ? 'border-accent-line bg-accent-soft text-accent'
          : 'border-line bg-surface-2 text-fg-muted',
        className,
      )}
    >
      {label}
    </span>
  );
}
