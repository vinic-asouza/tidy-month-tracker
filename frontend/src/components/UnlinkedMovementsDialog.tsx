import { useMemo, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { WalletMovementsTable } from '@/components/WalletMovementsTable';
import { cn, formatCurrency } from '@/lib/utils';
import type { CreditCard, MonthData } from '@/types/domain';
import {
  getUnlinkedClosingBalance,
  getUnlinkedMonthTotals,
  getUnlinkedOpeningBalanceContext,
  type WalletMovementRow,
} from '@/utils/business/accounts';
import { toast } from 'sonner';

interface UnlinkedMovementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movements: WalletMovementRow[];
  currentMonth: string;
  monthData: MonthData;
  accountHistoryMonths: Record<string, MonthData>;
  creditCards: CreditCard[];
  cardMonthlyStatuses: Record<string, boolean>;
  onDeleteOperation?: (id: string) => Promise<boolean>;
  onTransferClick?: () => void;
}

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

export const UnlinkedMovementsDialog = ({
  open,
  onOpenChange,
  movements,
  currentMonth,
  monthData,
  accountHistoryMonths,
  creditCards,
  cardMonthlyStatuses,
  onDeleteOperation,
  onTransferClick,
}: UnlinkedMovementsDialogProps) => {
  const [deleteTarget, setDeleteTarget] = useState<WalletMovementRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openingBalance = useMemo(
    () =>
      getUnlinkedOpeningBalanceContext(
        currentMonth,
        accountHistoryMonths,
        creditCards,
        cardMonthlyStatuses
      ),
    [currentMonth, accountHistoryMonths, creditCards, cardMonthlyStatuses]
  );

  const monthTotals = useMemo(
    () => getUnlinkedMonthTotals(monthData, creditCards, cardMonthlyStatuses),
    [monthData, creditCards, cardMonthlyStatuses]
  );

  const closingBalance = useMemo(
    () =>
      getUnlinkedClosingBalance(
        currentMonth,
        accountHistoryMonths,
        creditCards,
        cardMonthlyStatuses
      ),
    [currentMonth, accountHistoryMonths, creditCards, cardMonthlyStatuses]
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id || !onDeleteOperation) return;
    setIsDeleting(true);
    try {
      const ok = await onDeleteOperation(deleteTarget.id);
      if (ok) {
        const message =
          deleteTarget.kind === 'transfer_out' || deleteTarget.kind === 'transfer_in'
            ? 'Transferência excluída'
            : 'Resgate excluído';
        toast.success(message);
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (id: string) => {
    const row = movements.find((m) => m.id === id);
    if (row) setDeleteTarget(row);
  };

  const deleteTitle =
    deleteTarget?.kind === 'transfer_out' || deleteTarget?.kind === 'transfer_in'
      ? 'Excluir transferência'
      : 'Excluir resgate';

  const deleteDescription =
    deleteTarget?.kind === 'transfer_out' || deleteTarget?.kind === 'transfer_in'
      ? 'Remove a transferência do mês e reverte os saldos do Saldo Livre e da carteira envolvida.'
      : 'Remove o resgate do mês e reverte os saldos da carteira e do Saldo Livre.';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-lg w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saldo Livre</DialogTitle>
            <DialogDescription>
              Saldo estimado cumulativo de movimentos sem carteira vinculada. Entram no resumo, mas
              não nos chips de carteira.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 min-w-0 space-y-4">
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 space-y-1.5">
              {openingBalance && (
                <SummaryRow
                  label="Saldo estimado do mês anterior"
                  value={formatCurrency(openingBalance.amount)}
                />
              )}
              <SummaryRow
                label="Entradas"
                value={formatCurrency(monthTotals.inflow)}
                valueClassName="font-semibold text-income"
              />
              <SummaryRow
                label="Saídas"
                value={formatCurrency(monthTotals.outflow)}
                valueClassName="font-semibold text-expense"
              />
              <div className="border-t border-border/60 pt-1.5">
                <SummaryRow
                  label="Saldo"
                  value={formatCurrency(closingBalance)}
                  emphasized
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Histórico de Movimentações
              </h3>
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum movimento no Saldo Livre neste mês.
                </p>
              ) : (
                <WalletMovementsTable
                  rows={movements}
                  onDelete={onDeleteOperation ? handleDelete : undefined}
                  isDeleting={isDeleting}
                />
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-muted-foreground text-left">
              Para vincular entradas ou gastos, edite o lançamento e selecione uma carteira.
            </p>
            {onTransferClick && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md shrink-0"
                onClick={onTransferClick}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                Transferir para carteira
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTitle}
        description={deleteDescription}
      />
    </>
  );
};
