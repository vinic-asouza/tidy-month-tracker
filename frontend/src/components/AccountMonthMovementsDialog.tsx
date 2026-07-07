import { useMemo, useState } from 'react';
import { Banknote, Building2, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { WalletMovementsTable } from '@/components/WalletMovementsTable';
import { cn, formatCurrency } from '@/lib/utils';
import type { Account, AccountBalance, AccountType, CreditCard, MonthData } from '@/types/domain';
import { resolveAccountRole } from '@/utils/business/accountRoles';
import { CARD_COLORS } from '@/types/finance';
import {
  getAccountClosingBalance,
  getAccountMonthMovements,
  getAccountMonthTotals,
  getAccountOpeningBalanceContext,
} from '@/utils/business/accounts';
import { toast } from 'sonner';

interface AccountMonthMovementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  accounts: Account[];
  currentMonth: string;
  monthData: MonthData;
  accountBalances: AccountBalance[];
  accountHistoryMonths: Record<string, MonthData>;
  creditCards: CreditCard[];
  cardMonthlyStatuses: Record<string, boolean>;
  onDeleteOperation: (id: string) => Promise<boolean>;
}

const openingBalanceLabel: Record<'declared' | 'carried_forward', string> = {
  declared: 'Saldo declarado no início do mês',
  carried_forward: 'Saldo estimado do mês anterior',
};

const TYPE_ICONS: Record<AccountType, React.ElementType> = {
  checking: Building2,
  savings: PiggyBank,
  investment: TrendingUp,
  cash: Banknote,
  other: Wallet,
};

const getAccountColorClass = (colorId: string | null) =>
  CARD_COLORS.find((c) => c.id === colorId)?.class || CARD_COLORS[0].class;

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

export const AccountMonthMovementsDialog = ({
  open,
  onOpenChange,
  account,
  accounts,
  currentMonth,
  monthData,
  accountBalances,
  accountHistoryMonths,
  creditCards,
  cardMonthlyStatuses,
  onDeleteOperation,
}: AccountMonthMovementsDialogProps) => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const movements = useMemo(
    () =>
      account
        ? getAccountMonthMovements(
            account.id,
            monthData,
            creditCards,
            cardMonthlyStatuses,
            accounts
          )
        : [],
    [account, monthData, creditCards, cardMonthlyStatuses, accounts]
  );

  const openingBalance = useMemo(
    () =>
      account
        ? getAccountOpeningBalanceContext(
            account.id,
            currentMonth,
            accountBalances,
            accountHistoryMonths,
            creditCards,
            cardMonthlyStatuses
          )
        : null,
    [
      account,
      currentMonth,
      accountBalances,
      accountHistoryMonths,
      creditCards,
      cardMonthlyStatuses,
    ]
  );

  const monthTotals = useMemo(
    () =>
      account
        ? getAccountMonthTotals(
            account.id,
            monthData,
            creditCards,
            cardMonthlyStatuses,
            resolveAccountRole(account)
          )
        : { inflow: 0, outflow: 0, invested: 0 },
    [account, monthData, creditCards, cardMonthlyStatuses]
  );

  const closingBalance = useMemo(
    () =>
      account
        ? getAccountClosingBalance(
            account.id,
            currentMonth,
            accountBalances,
            accountHistoryMonths,
            creditCards,
            cardMonthlyStatuses,
            resolveAccountRole(account)
          )
        : 0,
    [
      account,
      currentMonth,
      accountBalances,
      accountHistoryMonths,
      creditCards,
      cardMonthlyStatuses,
    ]
  );

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const ok = await onDeleteOperation(deleteTargetId);
      if (ok) {
        toast.success('Operação excluída');
        setDeleteTargetId(null);
        if (movements.length <= 1) onOpenChange(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const AccountIcon = account ? (TYPE_ICONS[account.type] ?? Wallet) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-lg w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 pr-8">
              {account && AccountIcon && (
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br',
                    getAccountColorClass(account.color)
                  )}
                  aria-hidden
                >
                  <AccountIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="truncate">{account?.name ?? 'Carteira'}</span>
            </DialogTitle>
            <DialogDescription>Detalhes da Carteira</DialogDescription>
          </DialogHeader>
          <div className="py-2 min-w-0 space-y-4">
            {account && (
              <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 space-y-1.5">
                {openingBalance && (
                  <SummaryRow
                    label={openingBalanceLabel[openingBalance.source]}
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
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Histórico de Movimentações
              </h3>
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma movimentação efetivada nesta carteira neste mês.
                </p>
              ) : (
                <WalletMovementsTable
                  rows={movements}
                  onDelete={(id) => setDeleteTargetId(id)}
                  isDeleting={isDeleting}
                />
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <p className="text-xs text-muted-foreground text-left">
              Para editar entradas, gastos ou aportes, use as seções do mês.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(next) => !next && setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir operação"
        description="Remove a operação do mês e reverte os saldos das carteiras envolvidas."
      />
    </>
  );
};
