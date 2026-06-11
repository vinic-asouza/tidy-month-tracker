import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  variant?: 'default' | 'compact';
}

export const MetricTile = ({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  variant = 'default',
}: MetricTileProps) => {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'rounded-md',
        isCompact ? 'px-2.5 py-2 text-left' : 'px-2.5 py-2.5 sm:px-3 sm:py-3 text-center',
        bgClass
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1 mb-1',
          isCompact ? 'justify-start' : 'justify-center'
        )}
      >
        <Icon className={cn('h-3.5 w-3.5 shrink-0', colorClass)} />
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <p
        className={cn(
          'font-semibold tabular-nums',
          isCompact ? 'text-sm' : 'text-sm sm:text-base',
          colorClass
        )}
      >
        {value}
      </p>
    </div>
  );
};
