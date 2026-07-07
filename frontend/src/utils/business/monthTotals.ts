/**
 * Cálculos de totais efetivados do mês (recebido / pago / investido).
 * Alinha resumo mensal, regra financeira, seleção e estatísticas anuais.
 */

import type { CreditCard, Expense, Income, MonthData } from '@/types/domain';
import { RESGATE_INCOME_TAG } from '@/types/finance';

export type SummaryViewMode = 'effective' | 'planned';

export type MonthTotals = EffectiveMonthTotals;

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

/** Soma entradas efetivadas com tag de resgate (fonte única após vínculo com operação). */
export function getResgateInflowFromIncomes(incomes: Income[]): number {
  return incomes
    .filter((income) => income.received && income.tag === RESGATE_INCOME_TAG)
    .reduce((sum, income) => sum + income.value, 0);
}

export function isResgateIncome(income: Income): boolean {
  return income.sourceOperationId != null || income.tag === RESGATE_INCOME_TAG;
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

export interface PendingMonthTotals {
  pendingIncome: number;
  pendingExpenses: number;
  pendingInvestments: number;
}

export function calculatePendingMonthTotals(
  monthData: MonthData,
  creditCards: CreditCard[],
  cardMonthlyStatuses?: Record<string, boolean>
): PendingMonthTotals {
  const statuses = cardMonthlyStatuses ?? monthData.cardMonthlyStatuses;

  const plannedIncome = monthData.incomes.reduce((sum, i) => sum + i.value, 0);
  const plannedExpenses = monthData.expenses.reduce((sum, e) => sum + e.value, 0);
  const plannedInvestments = monthData.investments.reduce((sum, i) => sum + i.value, 0);

  const receivedIncome = monthData.incomes
    .filter((i) => i.received)
    .reduce((sum, i) => sum + i.value, 0);

  const effective = calculateEffectiveMonthTotals(monthData, creditCards, statuses);

  return {
    pendingIncome: Math.max(0, plannedIncome - receivedIncome),
    pendingExpenses: Math.max(0, plannedExpenses - effective.totalExpenses),
    pendingInvestments: Math.max(0, plannedInvestments - effective.totalInvestments),
  };
}

export function calculatePlannedMonthTotals(monthData: MonthData): EffectiveMonthTotals {
  const totalIncome = monthData.incomes.reduce((sum, i) => sum + i.value, 0);
  const totalExpenses = monthData.expenses.reduce((sum, e) => sum + e.value, 0);
  const totalInvestments = monthData.investments.reduce((sum, i) => sum + i.value, 0);

  return {
    totalIncome,
    totalExpenses,
    totalInvestments,
    balance: totalIncome - totalExpenses - totalInvestments,
  };
}

export function calculateMonthTotals(
  mode: SummaryViewMode,
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): EffectiveMonthTotals {
  if (mode === 'planned') {
    return calculatePlannedMonthTotals(monthData);
  }
  return calculateEffectiveMonthTotals(monthData, creditCards, cardMonthlyStatuses);
}
