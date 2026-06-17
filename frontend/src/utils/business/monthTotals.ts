/**
 * Cálculos de totais efetivados do mês (recebido / pago / investido).
 * Alinha resumo mensal, regra financeira, seleção e estatísticas anuais.
 */

import type { CreditCard, Expense, MonthData } from '@/types/domain';

export function isExpenseEffectivelyPaid(
  expense: Expense,
  creditCards: CreditCard[],
  cardMonthlyStatuses?: Record<string, boolean>
): boolean {
  const linkedCard = creditCards.find((c) => c.name === expense.paymentMethod);
  if (linkedCard && cardMonthlyStatuses) {
    return cardMonthlyStatuses[linkedCard.id] || false;
  }
  return expense.paid;
}

export interface EffectiveMonthTotals {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  balance: number;
}

export function calculateEffectiveMonthTotals(
  monthData: MonthData,
  creditCards: CreditCard[],
  cardMonthlyStatuses?: Record<string, boolean>
): EffectiveMonthTotals {
  const statuses = cardMonthlyStatuses ?? monthData.cardMonthlyStatuses;

  const totalIncome = monthData.incomes
    .filter((i) => i.received)
    .reduce((sum, i) => sum + i.value, 0);

  const totalExpenses = monthData.expenses
    .filter((e) => isExpenseEffectivelyPaid(e, creditCards, statuses))
    .reduce((sum, e) => sum + e.value, 0);

  const totalInvestments = monthData.investments
    .filter((i) => i.invested)
    .reduce((sum, i) => sum + i.value, 0);

  return {
    totalIncome,
    totalExpenses,
    totalInvestments,
    balance: totalIncome - totalExpenses - totalInvestments,
  };
}
