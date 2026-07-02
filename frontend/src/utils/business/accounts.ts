import type { AccountBalance, CreditCard, MonthData } from '@/types/domain';
import { isExpenseEffectivelyPaid } from './monthTotals';

const EMPTY_MONTH: MonthData = { incomes: [], expenses: [], investments: [] };

export interface AccountMonthTotals {
  inflow: number;
  outflow: number;
  invested: number;
}

/** Retorna o mês anterior em formato YYYY-MM. */
export function getPreviousYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** Retorna o mês seguinte em formato YYYY-MM. */
export function getNextYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

/** Lista de yearMonths entre `from` e `to` (inclusive). */
export function getMonthsInRange(from: string, to: string): string[] {
  if (from > to) return [];
  const months: string[] = [];
  let current = from;
  while (current <= to) {
    months.push(current);
    current = getNextYearMonth(current);
  }
  return months;
}

/**
 * Intervalo de meses históricos a buscar para calcular carry-forward até `currentMonth`.
 * Retorna null quando não há meses anteriores a carregar.
 */
export function getAccountHistoryFetchRange(
  accountIds: string[],
  accountBalances: AccountBalance[],
  currentMonth: string,
  earliestMovementMonth?: string | null
): { from: string; to: string } | null {
  if (accountIds.length === 0) return null;

  const to = getPreviousYearMonth(currentMonth);

  let earliestAnchor: string | null = null;
  for (const accountId of accountIds) {
    const anchor = getAccountLastKnownBalance(accountId, currentMonth, accountBalances);
    if (anchor && (!earliestAnchor || anchor.yearMonth < earliestAnchor)) {
      earliestAnchor = anchor.yearMonth;
    }
  }

  const yearStart = `${currentMonth.split('-')[0]}-01`;
  const from =
    earliestAnchor ??
    (earliestMovementMonth && earliestMovementMonth < yearStart
      ? earliestMovementMonth
      : yearStart);
  if (from > to) return null;

  return { from, to };
}

/**
 * Calcula totais efetivados do mês por carteira.
 * Alinhado ao resumo mensal: received / paid (ou fatura paga) / invested.
 */
export function getAccountMonthTotals(
  accountId: string,
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): AccountMonthTotals {
  const statuses = cardMonthlyStatuses ?? monthData.cardMonthlyStatuses;

  const inflow = monthData.incomes
    .filter((i) => i.accountId === accountId && i.received)
    .reduce((sum, i) => sum + i.value, 0);

  const outflow = monthData.expenses
    .filter(
      (e) =>
        e.accountId === accountId &&
        isExpenseEffectivelyPaid(e, creditCards, statuses)
    )
    .reduce((sum, e) => sum + e.value, 0);

  const invested = monthData.investments
    .filter((inv) => inv.accountId === accountId && inv.invested)
    .reduce((sum, inv) => sum + inv.value, 0);

  return { inflow, outflow, invested };
}

export interface UnlinkedMovement {
  id: string;
  kind: 'income' | 'expense';
  description: string;
  value: number;
  date: string | null;
}

/**
 * Totais efetivados do mês sem carteira vinculada (entradas e gastos apenas).
 */
export function getUnlinkedMonthTotals(
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): AccountMonthTotals {
  const statuses = cardMonthlyStatuses ?? monthData.cardMonthlyStatuses;

  const inflow = monthData.incomes
    .filter((i) => !i.accountId && i.received)
    .reduce((sum, i) => sum + i.value, 0);

  const outflow = monthData.expenses
    .filter(
      (e) =>
        !e.accountId &&
        isExpenseEffectivelyPaid(e, creditCards, statuses)
    )
    .reduce((sum, e) => sum + e.value, 0);

  return { inflow, outflow, invested: 0 };
}

/**
 * Lista movimentos efetivados do mês sem carteira vinculada.
 */
export function getUnlinkedMovements(
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): UnlinkedMovement[] {
  const statuses = cardMonthlyStatuses ?? monthData.cardMonthlyStatuses;

  const incomes: UnlinkedMovement[] = monthData.incomes
    .filter((i) => !i.accountId && i.received)
    .map((i) => ({
      id: i.id,
      kind: 'income' as const,
      description: i.description,
      value: i.value,
      date: i.date,
    }));

  const expenses: UnlinkedMovement[] = monthData.expenses
    .filter(
      (e) =>
        !e.accountId &&
        isExpenseEffectivelyPaid(e, creditCards, statuses)
    )
    .map((e) => ({
      id: e.id,
      kind: 'expense' as const,
      description: e.description,
      value: e.value,
      date: e.date,
    }));

  return [...incomes, ...expenses];
}

/**
 * Retorna o saldo declarado exatamente para o mês informado, ou null se não declarado.
 */
export function getAccountDeclaredBalance(
  accountId: string,
  yearMonth: string,
  balances: AccountBalance[]
): AccountBalance | null {
  return balances.find((b) => b.accountId === accountId && b.yearMonth === yearMonth) ?? null;
}

/**
 * Retorna o saldo declarado mais recente ANTES do mês informado (para exibição "desatualizado").
 * Útil quando o usuário não declarou saldo no mês atual mas declarou em meses anteriores.
 */
export function getAccountLastKnownBalance(
  accountId: string,
  yearMonth: string,
  balances: AccountBalance[]
): AccountBalance | null {
  const prior = balances
    .filter((b) => b.accountId === accountId && b.yearMonth < yearMonth)
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
  return prior[0] ?? null;
}

/**
 * Variação líquida efetiva do mês: inflow − outflow + invested.
 * Aporte entra na carteira de destino (soma), não subtrai.
 */
export function getAccountNetVariation(
  accountId: string,
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): number {
  const { inflow, outflow, invested } = getAccountMonthTotals(
    accountId,
    monthData,
    creditCards,
    cardMonthlyStatuses
  );
  return inflow - outflow + invested;
}

/**
 * Saldo estimado: saldo declarado + variação líquida efetiva do mês.
 * @deprecated Preferir getAccountClosingBalance com contexto completo de meses.
 */
export function getAccountProjectedBalance(
  baseBalance: number,
  accountId: string,
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): number {
  return (
    baseBalance +
    getAccountNetVariation(accountId, monthData, creditCards, cardMonthlyStatuses)
  );
}

/**
 * Saldo no início do mês: declaração manual ou carry-forward do mês anterior.
 */
export function getAccountOpeningBalance(
  accountId: string,
  yearMonth: string,
  balances: AccountBalance[],
  monthDataByMonth: Record<string, MonthData>,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): number {
  const declared = getAccountDeclaredBalance(accountId, yearMonth, balances);
  if (declared) return declared.balance;

  const anchor = getAccountLastKnownBalance(accountId, yearMonth, balances);
  const prevMonth = getPreviousYearMonth(yearMonth);

  if (anchor) {
    const from = anchor.yearMonth;
    const to = prevMonth;
    if (from > to) return anchor.balance;

    let total = anchor.balance;
    for (const m of getMonthsInRange(from, to)) {
      const data = monthDataByMonth[m] ?? EMPTY_MONTH;
      const statuses = data.cardMonthlyStatuses ?? cardMonthlyStatuses;
      total += getAccountNetVariation(accountId, data, creditCards, statuses);
    }
    return total;
  }

  const monthsBefore = Object.keys(monthDataByMonth)
    .filter((m) => m < yearMonth)
    .sort();

  return monthsBefore.reduce((sum, m) => {
    const data = monthDataByMonth[m] ?? EMPTY_MONTH;
    const statuses = data.cardMonthlyStatuses ?? cardMonthlyStatuses;
    return sum + getAccountNetVariation(accountId, data, creditCards, statuses);
  }, 0);
}

/**
 * Saldo ao fim do mês: saldo inicial + variação líquida efetiva do mês.
 */
export function getAccountClosingBalance(
  accountId: string,
  yearMonth: string,
  balances: AccountBalance[],
  monthDataByMonth: Record<string, MonthData>,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): number {
  const monthData = monthDataByMonth[yearMonth] ?? EMPTY_MONTH;
  const statuses = monthData.cardMonthlyStatuses ?? cardMonthlyStatuses;
  const opening = getAccountOpeningBalance(
    accountId,
    yearMonth,
    balances,
    monthDataByMonth,
    creditCards,
    cardMonthlyStatuses
  );
  return opening + getAccountNetVariation(accountId, monthData, creditCards, statuses);
}

/**
 * Retorna true se algum movimento efetivado do mês está vinculado à carteira.
 */
export function accountHasMovementsInMonth(
  accountId: string,
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): boolean {
  const totals = getAccountMonthTotals(
    accountId,
    monthData,
    creditCards,
    cardMonthlyStatuses
  );
  return totals.inflow > 0 || totals.outflow > 0 || totals.invested > 0;
}

export type BalanceDeclarationWarning =
  | { kind: 'replace_carry_forward'; calculatedOpening: number; monthVariation: number }
  | { kind: 'update_declaration'; previousDeclared: number; monthVariation: number };

/**
 * Aviso contextual ao declarar saldo quando há movimentações efetivadas no mês.
 */
export function getBalanceDeclarationWarning(
  accountId: string,
  yearMonth: string,
  balances: AccountBalance[],
  monthData: MonthData,
  monthDataByMonth: Record<string, MonthData>,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): BalanceDeclarationWarning | null {
  if (!accountHasMovementsInMonth(accountId, monthData, creditCards, cardMonthlyStatuses)) {
    return null;
  }

  const monthVariation = getAccountNetVariation(
    accountId,
    monthData,
    creditCards,
    cardMonthlyStatuses
  );

  const declared = getAccountDeclaredBalance(accountId, yearMonth, balances);
  if (declared) {
    return {
      kind: 'update_declaration',
      previousDeclared: declared.balance,
      monthVariation,
    };
  }

  const calculatedOpening = getAccountOpeningBalance(
    accountId,
    yearMonth,
    balances,
    monthDataByMonth,
    creditCards,
    cardMonthlyStatuses
  );

  if (calculatedOpening !== 0) {
    return {
      kind: 'replace_carry_forward',
      calculatedOpening,
      monthVariation,
    };
  }

  return null;
}
