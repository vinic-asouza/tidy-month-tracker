import { useEffect, useMemo, useState } from 'react';
import { CreditCard as CreditCardIcon, LayoutGrid, List } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InvoiceExpensesTable } from '@/components/InvoiceExpensesTable';
import { InvoiceCategorySummaryTable } from '@/components/InvoiceCategorySummaryTable';
import { cn, formatCurrency } from '@/lib/utils';
import type { Account, CreditCard, MonthData } from '@/types/domain';
import { getCardColorTheme, getCardGradientClass } from '@/utils/cardColorTheme';
import {
  getCreditCardInvoiceExpenses,
  getCreditCardInvoiceSummary,
  getCreditCardUsagePercent,
  getInvoicePaymentOperation,
  groupInvoiceExpensesByCategory,
} from '@/utils/business/creditCards';
import { toast } from 'sonner';

type ViewMode = 'general' | 'summary';

interface CreditCardInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CreditCard | null;
  accounts: Account[];
  currentMonth: string;
  monthData: MonthData;
  isPaid: boolean;
  onSetPaid: (paid: boolean) => Promise<boolean>;
}

const formatMonthLabel = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const getColorClass = (colorId: string) => getCardGradientClass(colorId);

const SummaryRow = ({
  label,
  value,
  emphasized = false,
  valueClassName,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
  valueClassName?: string;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span
      className={cn(
        'text-sm tabular-nums shrink-0',
        emphasized ? 'font-semibold text-foreground' : '',
        valueClassName
      )}
    >
      {value}
    </span>
  </div>
);

export const CreditCardInvoiceDialog = ({
  open,
  onOpenChange,
  card,
  accounts,
  currentMonth,
  monthData,
  isPaid,
  onSetPaid,
}: CreditCardInvoiceDialogProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (!open) {
      setViewMode('general');
      setShouldAnimate(false);
    }
  }, [open]);

  useEffect(() => {
    if (viewMode === 'summary') {
      setShouldAnimate(false);
      const timer = setTimeout(() => setShouldAnimate(true), 50);
      return () => clearTimeout(timer);
    }
    setShouldAnimate(false);
  }, [viewMode]);

  const expenses = useMemo(
    () => (card ? getCreditCardInvoiceExpenses(card.name, monthData) : []),
    [card, monthData]
  );

  const summary = useMemo(
    () => (card ? getCreditCardInvoiceSummary(card.name, monthData) : { total: 0, count: 0 }),
    [card, monthData]
  );

  const usagePercent = useMemo(
    () => (card ? getCreditCardUsagePercent(summary.total, card.creditLimit) : null),
    [card, summary.total]
  );

  const categoryGroups = useMemo(
    () => groupInvoiceExpensesByCategory(expenses),
    [expenses]
  );

  const invoicePayment = useMemo(
    () => (card ? getInvoicePaymentOperation(monthData.accountOperations, card.id) : undefined),
    [card, monthData.accountOperations]
  );

  const payingAccountName = useMemo(() => {
    if (!invoicePayment?.sourceAccountId) return null;
    return accounts.find((a) => a.id === invoicePayment.sourceAccountId)?.name ?? null;
  }, [invoicePayment, accounts]);

  const colorTheme = useMemo(
    () => (card ? getCardColorTheme(card.color) : getCardColorTheme('violet')),
    [card]
  );

  const handlePaidChange = async (checked: boolean) => {
    const success = await onSetPaid(checked);
    if (!success) {
      toast.error('Erro ao atualizar status da fatura');
    }
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-lg w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 pr-8">
            {card && (
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br',
                  getColorClass(card.color)
                )}
                aria-hidden
              >
                <CreditCardIcon className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="truncate">{card?.name ?? 'Cartão'}</span>
          </DialogTitle>
          <DialogDescription>
            Fatura de {formatMonthLabel(currentMonth)} — valor comprometido neste mês.
          </DialogDescription>
        </DialogHeader>

        {card && (
          <div className="py-2 min-w-0 space-y-4">
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 space-y-1.5">
              <SummaryRow
                label="Total comprometido"
                value={formatCurrency(summary.total)}
                emphasized
              />
              <SummaryRow label="Lançamentos" value={String(summary.count)} />
              {card.creditLimit != null && card.creditLimit > 0 && (
                <SummaryRow
                  label="Limite"
                  value={`${formatCurrency(card.creditLimit)}${usagePercent != null ? ` · ${usagePercent}%` : ''}`}
                />
              )}
              <div className="border-t border-border/60 pt-1.5 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Status</span>
                <label
                  htmlFor={`invoice-paid-${card.id}`}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    id={`invoice-paid-${card.id}`}
                    checked={isPaid}
                    onCheckedChange={(checked) => void handlePaidChange(!!checked)}
                  />
                  <span className={isPaid ? 'text-income font-medium' : 'text-foreground'}>
                    {isPaid ? 'Fatura paga' : 'Fatura pendente'}
                  </span>
                </label>
              </div>
              {isPaid && payingAccountName && (
                <SummaryRow
                  label="Pago com"
                  value={payingAccountName}
                />
              )}
            </div>

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
              className={cn('rounded-lg p-0.5 w-fit', colorTheme.toggleTrack)}
            >
              <ToggleGroupItem
                value="general"
                aria-label="Visualização geral"
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs data-[state=on]:shadow-sm',
                  colorTheme.toggleItem,
                  colorTheme.toggleItemActive
                )}
              >
                <List className="h-3 w-3 mr-1" />
                Geral
              </ToggleGroupItem>
              <ToggleGroupItem
                value="summary"
                aria-label="Visualização resumida"
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs data-[state=on]:shadow-sm',
                  colorTheme.toggleItem,
                  colorTheme.toggleItemActive
                )}
              >
                <LayoutGrid className="h-3 w-3 mr-1" />
                Resumo
              </ToggleGroupItem>
            </ToggleGroup>

            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum gasto neste cartão neste mês.
              </p>
            ) : viewMode === 'general' ? (
              <InvoiceExpensesTable expenses={expenses} />
            ) : (
              <InvoiceCategorySummaryTable
                groups={categoryGroups}
                total={summary.total}
                shouldAnimate={shouldAnimate}
                colorTheme={colorTheme}
              />
            )}
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          <p className="text-xs text-muted-foreground text-left">
            Para editar um lançamento, use a seção Gastos.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
