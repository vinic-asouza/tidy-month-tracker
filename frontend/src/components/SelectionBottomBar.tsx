import { TrendingUp, PiggyBank, TrendingDown, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SelectionSummary {
  incomes: number;
  investments: number;
  expenses: number;
}

interface SelectionBottomBarProps {
  summary: SelectionSummary;
  onClearAll: () => void;
}

export const SelectionBottomBar = ({ summary, onClearAll }: SelectionBottomBarProps) => {
  const hasSelections = summary.incomes > 0 || summary.investments > 0 || summary.expenses > 0;

  if (!hasSelections) return null;

  const total = summary.incomes + summary.investments + summary.expenses;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-semibold text-foreground">Itens selecionados</h3>
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

        {/* Content */}
        <div className="flex items-center justify-between gap-4">
          {/* Section summaries */}
          <div className="flex items-center gap-4 flex-1 overflow-x-auto">
            {summary.incomes > 0 && (
              <div className="flex items-center gap-2 min-w-fit">
                <TrendingUp className="h-4 w-4 text-income" />
                <span className="text-sm text-muted-foreground">Entradas:</span>
                <span className="text-sm font-semibold text-income">
                  {formatCurrency(summary.incomes)}
                </span>
              </div>
            )}
            {summary.investments > 0 && (
              <div className="flex items-center gap-2 min-w-fit">
                <PiggyBank className="h-4 w-4 text-investment" />
                <span className="text-sm text-muted-foreground">Investimentos:</span>
                <span className="text-sm font-semibold text-investment">
                  {formatCurrency(summary.investments)}
                </span>
              </div>
            )}
            {summary.expenses > 0 && (
              <div className="flex items-center gap-2 min-w-fit">
                <TrendingDown className="h-4 w-4 text-expense" />
                <span className="text-sm text-muted-foreground">Gastos:</span>
                <span className="text-sm font-semibold text-expense">
                  {formatCurrency(summary.expenses)}
                </span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center gap-2 border-l border-border pl-4 min-w-fit">
            <span className="text-sm font-medium text-muted-foreground">Total:</span>
            <span className="text-base font-bold text-foreground">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
