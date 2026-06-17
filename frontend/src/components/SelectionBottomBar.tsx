import { TrendingUp, PiggyBank, TrendingDown, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface SelectionSummary {
  incomes: number;
  investments: number;
  expenses: number;
}

interface SelectionBottomBarProps {
  summary: SelectionSummary;
  selectedCount: number;
  plannedTotal: number;
  onClearAll: () => void;
}

export const SelectionBottomBar = ({
  summary,
  selectedCount,
  plannedTotal,
  onClearAll,
}: SelectionBottomBarProps) => {
  if (selectedCount === 0) return null;

  const effectiveTotal = summary.incomes + summary.investments + summary.expenses;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Resumo da seleção</h3>
            <p className="text-xs text-muted-foreground">
              {selectedCount} {selectedCount === 1 ? 'item' : 'itens'} —{' '}
              {formatCurrency(effectiveTotal)} efetivados
              {effectiveTotal === 0 && ' (marque como recebido/pago/investido para somar)'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Desmarcar todos
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 overflow-x-auto">
            {summary.incomes > 0 && (
              <div className="flex items-center gap-2 min-w-fit">
                <TrendingUp className="h-4 w-4 text-income" />
                <span className="text-sm text-muted-foreground">Entradas:</span>
                <span className="text-sm font-semibold text-income tabular-nums">
                  {formatCurrency(summary.incomes)}
                </span>
              </div>
            )}
            {summary.investments > 0 && (
              <div className="flex items-center gap-2 min-w-fit">
                <PiggyBank className="h-4 w-4 text-investment" />
                <span className="text-sm text-muted-foreground">Investimentos:</span>
                <span className="text-sm font-semibold text-investment tabular-nums">
                  {formatCurrency(summary.investments)}
                </span>
              </div>
            )}
            {summary.expenses > 0 && (
              <div className="flex items-center gap-2 min-w-fit">
                <TrendingDown className="h-4 w-4 text-expense" />
                <span className="text-sm text-muted-foreground">Gastos:</span>
                <span className="text-sm font-semibold text-expense tabular-nums">
                  {formatCurrency(summary.expenses)}
                </span>
              </div>
            )}
            {plannedTotal > 0 && effectiveTotal !== plannedTotal && (
              <div className="flex items-center gap-2 min-w-fit">
                <span className="text-sm text-muted-foreground">Planejado:</span>
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {formatCurrency(plannedTotal)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-l border-border pl-4 min-w-fit">
            <span className="text-sm font-medium text-muted-foreground">Total efetivado:</span>
            <span className="text-base font-bold text-foreground tabular-nums">
              {formatCurrency(effectiveTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
