import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusToggleVariant = 'income' | 'expense' | 'investment' | 'wish';
export type StatusToggleSurface = 'onRow' | 'onGradient';

interface StatusToggleBadgeProps {
  checked: boolean;
  checkedLabel: string;
  uncheckedLabel: string;
  onToggle?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  variant?: StatusToggleVariant;
  surface?: StatusToggleSurface;
  size?: 'row' | 'full';
  className?: string;
}

const ROW_VARIANT_STYLES: Record<
  StatusToggleVariant,
  { checked: string; unchecked: string; focusRing: string }
> = {
  income: {
    checked: 'bg-income/15 text-income border-income/40',
    unchecked: 'border-income/30 bg-muted/40 text-income/80 hover:bg-muted/50',
    focusRing: 'focus-visible:ring-income/50',
  },
  expense: {
    checked: 'bg-expense/15 text-expense border-expense/40',
    unchecked: 'border-expense/30 bg-muted/40 text-expense/80 hover:bg-muted/50',
    focusRing: 'focus-visible:ring-expense/50',
  },
  investment: {
    checked: 'bg-investment/15 text-investment border-investment/40',
    unchecked: 'border-investment/30 bg-muted/40 text-investment/80 hover:bg-muted/50',
    focusRing: 'focus-visible:ring-investment/50',
  },
  wish: {
    checked:
      'bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:text-emerald-400',
    unchecked: 'border-primary/30 bg-muted/40 text-primary/80 hover:bg-muted/50',
    focusRing: 'focus-visible:ring-primary/50',
  },
};

export const StatusToggleBadge = ({
  checked,
  checkedLabel,
  uncheckedLabel,
  onToggle,
  disabled = false,
  ariaLabel,
  variant = 'expense',
  surface = 'onRow',
  size = 'row',
  className,
}: StatusToggleBadgeProps) => {
  const isInteractive = !disabled && !!onToggle;
  const label = checked ? checkedLabel : uncheckedLabel;

  const sizeClasses =
    size === 'full'
      ? 'w-full py-1.5 px-2.5 text-xs gap-1.5'
      : 'w-full py-1 px-1.5 text-[10px] gap-1 leading-tight';

  const iconSize = size === 'full' ? 'h-3.5 w-3.5' : 'h-3 w-3';

  const surfaceClasses =
    surface === 'onGradient'
      ? cn(
          checked
            ? 'bg-white/25 text-white hover:bg-white/30'
            : 'bg-white/10 text-white/85 border border-white/25 hover:bg-white/15',
          'focus-visible:ring-white/50'
        )
      : cn(
          'border',
          checked
            ? ROW_VARIANT_STYLES[variant].checked
            : ROW_VARIANT_STYLES[variant].unchecked,
          disabled && 'opacity-60 cursor-default',
          ROW_VARIANT_STYLES[variant].focusRing
        );

  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={ariaLabel ?? label}
      disabled={disabled || !onToggle}
      onClick={
        isInteractive
          ? (e) => {
              e.stopPropagation();
              onToggle();
            }
          : undefined
      }
      className={cn(
        'inline-flex items-center justify-center rounded-md font-semibold uppercase tracking-wide transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        sizeClasses,
        surfaceClasses,
        isInteractive ? 'cursor-pointer' : 'cursor-default',
        className
      )}
    >
      {checked ? (
        <CheckCircle2 className={cn(iconSize, 'shrink-0')} aria-hidden />
      ) : (
        <Circle className={cn(iconSize, 'shrink-0 opacity-80')} aria-hidden />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
};
