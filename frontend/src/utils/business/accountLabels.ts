import type { Account, AccountOperation } from '@/types/domain';
import { getInvoicePaymentOperation } from '@/utils/business/creditCards';

export function resolveAccountDisplayName(
  accountId: string | null | undefined,
  accounts: Account[]
): string {
  if (!accountId) return 'Saldo Livre';
  return accounts.find((a) => a.id === accountId)?.name ?? '—';
}

export function resolveExpenseWalletLabel(
  expense: { paid: boolean; accountId?: string; paymentMethod: string },
  options: {
    isLinkedToCard: boolean;
    isCardPaid: boolean;
    creditCardId: string | null;
    accounts: Account[];
    accountOperations?: AccountOperation[];
  }
): string | null {
  const isPaid = options.isLinkedToCard ? options.isCardPaid : expense.paid;
  if (!isPaid) return null;

  if (options.isLinkedToCard && options.creditCardId) {
    const paymentOp = getInvoicePaymentOperation(
      options.accountOperations,
      options.creditCardId
    );
    return resolveAccountDisplayName(paymentOp?.sourceAccountId, options.accounts);
  }

  return resolveAccountDisplayName(expense.accountId, options.accounts);
}
