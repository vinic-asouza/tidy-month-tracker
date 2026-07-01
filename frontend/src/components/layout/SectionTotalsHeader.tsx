import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SectionTotalsHeaderProps {
  title: string;
  plannedTotal: number;
  effectiveTotal?: number;
  effectiveLabel?: string;
  secondaryMetric?: { label: string; value: string };
  hideEffective?: boolean;
  colorClass: string;
  className?: string;
}

export const SectionTotalsHeader = ({
  title,
  plannedTotal,
  effectiveTotal = 0,
  effectiveLabel = '',
  secondaryMetric,
  hideEffective = false,
  colorClass,
  className,
}: SectionTotalsHeaderProps) => (
  <div className={cn('min-w-0', className)}>
    <h3 className="text-base sm:text-lg font-semibold tracking-tight">{title}</h3>
    <div className="flex flex-col gap-0.5 mt-0.5">
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground">Planejado:</span>
        <span className={cn('text-sm sm:text-base font-bold tabular-nums', colorClass)}>
          {formatCurrency(plannedTotal)}
        </span>
      </div>
      {secondaryMetric ? (
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">{secondaryMetric.label}:</span>
          <span className={cn('text-sm font-semibold tabular-nums', colorClass)}>
            {secondaryMetric.value}
          </span>
        </div>
      ) : !hideEffective ? (
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">{effectiveLabel}:</span>
          <span className={cn('text-sm font-semibold tabular-nums', colorClass)}>
            {formatCurrency(effectiveTotal)}
          </span>
        </div>
      ) : null}
    </div>
  </div>
);
