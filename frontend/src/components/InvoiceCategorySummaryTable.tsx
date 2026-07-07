import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import type { CardColorTheme } from '@/utils/cardColorTheme';
import type { InvoiceCategoryGroup } from '@/utils/business/creditCards';

interface InvoiceCategorySummaryTableProps {
  groups: InvoiceCategoryGroup[];
  total: number;
  shouldAnimate: boolean;
  colorTheme: CardColorTheme;
}

const CategorySummaryRow = ({
  category,
  total,
  count,
  groupTotal,
  shouldAnimate,
  colorTheme,
}: {
  category: string;
  total: number;
  count: number;
  groupTotal: number;
  shouldAnimate: boolean;
  colorTheme: CardColorTheme;
}) => {
  const percentage = groupTotal > 0 ? (total / groupTotal) * 100 : 0;

  return (
    <tr className="border-b transition-colors last:border-0 hover:bg-muted/50">
      <td colSpan={3} className="p-0">
        <div className="relative flex items-center justify-between py-2 px-2 overflow-hidden min-h-[2.5rem]">
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-sm',
              colorTheme.summaryBar,
              shouldAnimate ? 'progress-bar-animate' : 'transition-all duration-300'
            )}
            style={
              {
                width: shouldAnimate ? undefined : `${percentage}%`,
                '--progress-width': `${percentage}%`,
              } as React.CSSProperties & { '--progress-width'?: string }
            }
          />
          <div className="relative flex items-center justify-between w-full z-10 gap-3 min-w-0">
            <Badge
              variant="secondary"
              className={cn(
                'text-xs rounded-md px-2 py-0.5 bg-transparent border-0 cursor-default min-w-0 max-w-[55%] truncate',
                colorTheme.summaryAccent
              )}
            >
              {category}
              <span className="text-muted-foreground font-normal ml-1">({count})</span>
            </Badge>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {percentage.toFixed(1)}%
              </span>
              <span
                className={cn(
                  'font-bold whitespace-nowrap text-sm tabular-nums',
                  colorTheme.summaryAccent
                )}
              >
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export const InvoiceCategorySummaryTable = ({
  groups,
  total,
  shouldAnimate,
  colorTheme,
}: InvoiceCategorySummaryTableProps) => (
  <div className="w-full min-w-0">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b">
          <th className="h-8 px-2 py-1 text-left align-bottom text-xs font-medium text-muted-foreground">
            Categoria
          </th>
          <th className="h-8 px-2 py-1 text-right align-bottom text-xs font-medium text-muted-foreground whitespace-nowrap w-[1%]">
            %
          </th>
          <th className="h-8 px-2 py-1 text-right align-bottom text-xs font-medium text-muted-foreground whitespace-nowrap w-[1%]">
            Valor
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <CategorySummaryRow
            key={group.category}
            category={group.category}
            total={group.total}
            count={group.count}
            groupTotal={total}
            shouldAnimate={shouldAnimate}
            colorTheme={colorTheme}
          />
        ))}
      </tbody>
    </table>
  </div>
);
