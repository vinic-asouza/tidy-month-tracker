import type { Account, AccountBalance, AccountRole, CreditCard, MonthData } from '@/types/domain';
import { isCreditCardExpense } from './creditCards';
import { isExpenseEffectivelyPaid } from './monthTotals';

const EMPTY_MONTH: MonthData = {
  incomes: [],
  expenses: [],
  investments: [],
  accountOperations: [],
};

function getAccountOperations(monthData: MonthData) {
  return monthData.accountOperations ?? [];
}

/** Operações já espelhadas em entradas (fluxo resgate completo). */
function getIncomeMirroredOperationIds(monthData: MonthData): Set<string> {
  const ids = new Set<string>();
  for (const income of monthData.incomes) {
    if (income.sourceOperationId) ids.add(income.sourceOperationId);
  }
  return ids;
}

function isOperationMirroredByIncome(opId: string, monthData: MonthData): boolean {
  return getIncomeMirroredOperationIds(monthData).has(opId);
}

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
  cardMonthlyStatuses?: Record<string, boolean>,
  accountRole: AccountRole = 'movement'
): AccountMonthTotals {
  const statuses = cardMonthlyStatuses ?? monthData.cardMonthlyStatuses;

  const incomeInflow = monthData.incomes
    .filter((i) => i.accountId === accountId && i.received)
    .reduce((sum, i) => sum + i.value, 0);

  const expenseOutflow = monthData.expenses
    .filter(
      (e) =>
        e.accountId === accountId &&
        !isCreditCardExpense(e, creditCards) &&
        isExpenseEffectivelyPaid(e, creditCards, statuses)
    )
    .reduce((sum, e) => sum + e.value, 0);

  const aportesReceived = monthData.investments
    .filter((inv) => inv.accountId === accountId && inv.invested)
    .reduce((sum, inv) => sum + inv.value, 0);

  const aportesSent = monthData.investments
    .filter((inv) => inv.sourceAccountId === accountId && inv.invested)
    .reduce((sum, inv) => sum + inv.value, 0);

  const operations = getAccountOperations(monthData);
  const mirroredOperationIds = getIncomeMirroredOperationIds(monthData);
  const withdrawalOut = operations
    .filter((op) => op.type === 'withdrawal' && op.sourceAccountId === accountId)
    .reduce((sum, op) => sum + op.amount, 0);
  const transferOut = operations
    .filter((op) => op.type === 'transfer_out' && op.sourceAccountId === accountId)
    .reduce((sum, op) => sum + op.amount, 0);
  const transferIn = operations
    .filter(
      (op) =>
        op.type === 'transfer_in' &&
        op.destinationAccountId === accountId &&
        !mirroredOperationIds.has(op.id)
    )
    .reduce((sum, op) => sum + op.amount, 0);
  const invoicePaymentOut = operations
    .filter((op) => op.type === 'invoice_payment' && op.sourceAccountId === accountId)
    .reduce((sum, op) => sum + op.amount, 0);

  if (accountRole === 'investment') {
    return {
      inflow: transferIn,
      outflow: withdrawalOut + transferOut,
      invested: aportesReceived,
    };
  }

  return {
    inflow: incomeInflow + transferIn,
    outflow: expenseOutflow + withdrawalOut + transferOut + invoicePaymentOut + aportesSent,
    invested: aportesSent,
  };
}

export type WalletMovementKind =
  | 'income'
  | 'expense'
  | 'investment'
  | 'withdrawal'
  | 'transfer_in'
  | 'transfer_out'
  | 'invoice_payment';

export interface WalletMovementRow {
  id: string;
  kind: WalletMovementKind;
  description: string;
  value: number;
  date: string | null;
  detail?: string;
  deletable?: boolean;
}

/** @deprecated Use WalletMovementRow */
export type UnlinkedMovement = WalletMovementRow;

function sortWalletMovements(rows: WalletMovementRow[]): WalletMovementRow[] {
  return [...rows].sort((a, b) => {
    const dateA = a.date ?? '';
    const dateB = b.date ?? '';
    return dateB.localeCompare(dateA);
  });
}

function operationRowDetail(op: AccountMonthOperationView): string | undefined {
  if (op.kind === 'withdrawal') return 'Saldo Livre';
  if (op.kind === 'invoice_payment') return op.label.replace(/^Fatura /, '');
  if (op.kind === 'transfer_out') {
    const match = op.label.match(/^Transferência para (.+)$/);
    return match ? `Para ${match[1]}` : undefined;
  }
  if (op.kind === 'transfer_in') {
    const match = op.label.match(/^Transferência de (.+)$/);
    return match ? `De ${match[1]}` : undefined;
  }
  return undefined;
}

export interface AccountMonthOperationView {
  id: string;
  kind: 'withdrawal' | 'transfer_out' | 'transfer_in' | 'invoice_payment';
  label: string;
  amount: number;
  date: string;
  description: string | null;
}

/**
 * Operações patrimoniais do mês visíveis em uma carteira (resgate, transferências e faturas).
 */
export function getAccountMonthOperations(
  accountId: string,
  monthData: MonthData,
  accounts: { id: string; name: string }[] = [],
  creditCards: CreditCard[] = []
): AccountMonthOperationView[] {
  const nameById = new Map(accounts.map((a) => [a.id, a.name]));
  const cardNameById = new Map(creditCards.map((c) => [c.id, c.name]));
  const ops = getAccountOperations(monthData);
  const result: AccountMonthOperationView[] = [];

  for (const op of ops) {
    if (op.type === 'invoice_payment' && op.sourceAccountId === accountId) {
      const cardName = op.creditCardId ? cardNameById.get(op.creditCardId) : undefined;
      result.push({
        id: op.id,
        kind: 'invoice_payment',
        label: cardName ? `Fatura ${cardName}` : 'Fatura de cartão',
        amount: op.amount,
        date: op.operationDate,
        description: op.description,
      });
      continue;
    }

    if (op.type === 'withdrawal' && op.sourceAccountId === accountId) {
      result.push({
        id: op.id,
        kind: 'withdrawal',
        label: 'Resgate',
        amount: op.amount,
        date: op.operationDate,
        description: op.description,
      });
      continue;
    }

    if (op.type === 'transfer_out' && op.sourceAccountId === accountId) {
      const pair = ops.find(
        (p) => p.transferGroupId === op.transferGroupId && p.type === 'transfer_in'
      );
      const destName = pair?.destinationAccountId
        ? nameById.get(pair.destinationAccountId)
        : 'Saldo Livre';
      result.push({
        id: op.id,
        kind: 'transfer_out',
        label: destName ? `Transferência para ${destName}` : 'Transferência enviada',
        amount: op.amount,
        date: op.operationDate,
        description: op.description,
      });
      continue;
    }

    if (op.type === 'transfer_in' && op.destinationAccountId === accountId) {
      const pair = ops.find(
        (p) => p.transferGroupId === op.transferGroupId && p.type === 'transfer_out'
      );
      const sourceName = pair?.sourceAccountId
        ? nameById.get(pair.sourceAccountId)
        : 'Saldo Livre';
      result.push({
        id: op.id,
        kind: 'transfer_in',
        label: sourceName ? `Transferência de ${sourceName}` : 'Transferência recebida',
        amount: op.amount,
        date: op.operationDate,
        description: op.description,
      });
    }
  }

  return result.sort((a, b) => b.date.localeCompare(a.date));
}

export function accountHasMonthOperations(accountId: string, monthData: MonthData): boolean {
  return getAccountMonthOperations(accountId, monthData).length > 0;
}

export function accountHasMonthMovements(
  accountId: string,
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): boolean {
  const totals = getAccountMonthTotals(accountId, monthData, creditCards, cardMonthlyStatuses);
  return totals.inflow > 0 || totals.outflow > 0 || totals.invested > 0;
}

/**
 * Lista movimentos efetivados do mês vinculados a uma carteira.
 */
export function getAccountMonthMovements(
  accountId: string,
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>,
  accounts: { id: string; name: string }[] = []
): WalletMovementRow[] {
  const statuses = cardMonthlyStatuses ?? monthData.cardMonthlyStatuses;

  const incomes: WalletMovementRow[] = monthData.incomes
    .filter((i) => i.accountId === accountId && i.received)
    .map((i) => ({
      id: i.id,
      kind: 'income' as const,
      description: i.description,
      value: i.value,
      date: i.date,
    }));

  const expenses: WalletMovementRow[] = monthData.expenses
    .filter(
      (e) =>
        e.accountId === accountId &&
        !isCreditCardExpense(e, creditCards) &&
        isExpenseEffectivelyPaid(e, creditCards, statuses)
    )
    .map((e) => ({
      id: e.id,
      kind: 'expense' as const,
      description: e.description,
      value: e.value,
      date: e.date,
    }));

  const investments: WalletMovementRow[] = monthData.investments
    .filter((inv) => inv.accountId === accountId && inv.invested)
    .map((inv) => {
      const sourceName = accounts.find((a) => a.id === inv.sourceAccountId)?.name;
      return {
        id: inv.id,
        kind: 'investment' as const,
        description: inv.description,
        value: inv.value,
        date: inv.date,
        detail: sourceName ? `De ${sourceName}` : undefined,
      };
    });

  const outboundInvestments: WalletMovementRow[] = monthData.investments
    .filter((inv) => inv.sourceAccountId === accountId && inv.invested)
    .map((inv) => {
      const destName = accounts.find((a) => a.id === inv.accountId)?.name;
      return {
        id: `${inv.id}-out`,
        kind: 'investment' as const,
        description: inv.description,
        value: inv.value,
        date: inv.date,
        detail: destName ? `Para ${destName}` : 'Aplicação',
      };
    });

  const mirroredOperationIds = getIncomeMirroredOperationIds(monthData);

  const operations: WalletMovementRow[] = getAccountMonthOperations(
    accountId,
    monthData,
    accounts,
    creditCards
  )
    .filter(
      (op) =>
        (op.kind !== 'withdrawal' && op.kind !== 'transfer_in') ||
        !mirroredOperationIds.has(op.id)
    )
    .map((op) => ({
    id: op.id,
    kind: op.kind,
    description:
      op.description?.trim() ||
      (op.kind === 'withdrawal'
        ? 'Resgate'
        : op.kind === 'invoice_payment'
          ? op.label
          : 'Transferência'),
    value: op.amount,
    date: op.date,
    detail: operationRowDetail(op),
    deletable: op.kind !== 'invoice_payment',
  }));

  return sortWalletMovements([...incomes, ...expenses, ...investments, ...outboundInvestments, ...operations]);
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
        !isCreditCardExpense(e, creditCards) &&
        isExpenseEffectivelyPaid(e, creditCards, statuses)
    )
    .reduce((sum, e) => sum + e.value, 0);

  const withdrawalInflow = getAccountOperations(monthData)
    .filter((op) => op.type === 'withdrawal' && !isOperationMirroredByIncome(op.id, monthData))
    .reduce((sum, op) => sum + op.amount, 0);

  const invoicePaymentOut = getAccountOperations(monthData)
    .filter((op) => op.type === 'invoice_payment' && !op.sourceAccountId)
    .reduce((sum, op) => sum + op.amount, 0);

  const mirroredOperationIds = getIncomeMirroredOperationIds(monthData);
  const transferOut = getAccountOperations(monthData)
    .filter((op) => op.type === 'transfer_out' && !op.sourceAccountId)
    .reduce((sum, op) => sum + op.amount, 0);
  const transferIn = getAccountOperations(monthData)
    .filter(
      (op) =>
        op.type === 'transfer_in' &&
        !op.destinationAccountId &&
        !mirroredOperationIds.has(op.id)
    )
    .reduce((sum, op) => sum + op.amount, 0);

  const aportesFromFree = monthData.investments
    .filter((inv) => !inv.sourceAccountId && inv.invested)
    .reduce((sum, inv) => sum + inv.value, 0);

  return {
    inflow: inflow + withdrawalInflow + transferIn,
    outflow: outflow + invoicePaymentOut + transferOut + aportesFromFree,
    invested: 0,
  };
}

/**
 * Lista movimentos efetivados do mês sem carteira vinculada.
 */
export function getUnlinkedMovements(
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>,
  accounts: { id: string; name: string }[] = []
): WalletMovementRow[] {
  const statuses = cardMonthlyStatuses ?? monthData.cardMonthlyStatuses;

  const incomes: WalletMovementRow[] = monthData.incomes
    .filter((i) => !i.accountId && i.received)
    .map((i) => ({
      id: i.id,
      kind: 'income' as const,
      description: i.description,
      value: i.value,
      date: i.date,
    }));

  const expenses: WalletMovementRow[] = monthData.expenses
    .filter(
      (e) =>
        !e.accountId &&
        !isCreditCardExpense(e, creditCards) &&
        isExpenseEffectivelyPaid(e, creditCards, statuses)
    )
    .map((e) => ({
      id: e.id,
      kind: 'expense' as const,
      description: e.description,
      value: e.value,
      date: e.date,
    }));

  const withdrawals: WalletMovementRow[] = getAccountOperations(monthData)
    .filter((op) => op.type === 'withdrawal' && !isOperationMirroredByIncome(op.id, monthData))
    .map((op) => {
      const sourceName = accounts.find((a) => a.id === op.sourceAccountId)?.name;
      return {
        id: op.id,
        kind: 'withdrawal' as const,
        description: op.description?.trim() || 'Resgate',
        value: op.amount,
        date: op.operationDate,
        detail: sourceName ? `De ${sourceName}` : undefined,
        deletable: true,
      };
    });

  const cardNameById = new Map(creditCards.map((c) => [c.id, c.name]));
  const nameById = new Map(accounts.map((a) => [a.id, a.name]));
  const ops = getAccountOperations(monthData);
  const mirroredOperationIds = getIncomeMirroredOperationIds(monthData);

  const invoicePayments: WalletMovementRow[] = ops
    .filter((op) => op.type === 'invoice_payment' && !op.sourceAccountId)
    .map((op) => {
      const cardName = op.creditCardId ? cardNameById.get(op.creditCardId) : undefined;
      return {
        id: op.id,
        kind: 'invoice_payment' as const,
        description: op.description?.trim() || (cardName ? `Fatura ${cardName}` : 'Fatura de cartão'),
        value: op.amount,
        date: op.operationDate,
        detail: cardName,
        deletable: false,
      };
    });

  const transfers: WalletMovementRow[] = ops
    .filter(
      (op) =>
        (op.type === 'transfer_out' && !op.sourceAccountId) ||
        (op.type === 'transfer_in' &&
          !op.destinationAccountId &&
          !mirroredOperationIds.has(op.id))
    )
    .map((op) => {
      const pair = ops.find((p) => p.transferGroupId === op.transferGroupId && p.id !== op.id);
      if (op.type === 'transfer_out') {
        const destName = pair?.destinationAccountId
          ? nameById.get(pair.destinationAccountId)
          : undefined;
        return {
          id: op.id,
          kind: 'transfer_out' as const,
          description: op.description?.trim() || 'Transferência',
          value: op.amount,
          date: op.operationDate,
          detail: destName ? `Para ${destName}` : undefined,
          deletable: true,
        };
      }
      const sourceName = pair?.sourceAccountId
        ? nameById.get(pair.sourceAccountId)
        : undefined;
      return {
        id: op.id,
        kind: 'transfer_in' as const,
        description: op.description?.trim() || 'Transferência',
        value: op.amount,
        date: op.operationDate,
        detail: sourceName ? `De ${sourceName}` : undefined,
        deletable: true,
      };
    });

  const aportes: WalletMovementRow[] = monthData.investments
    .filter((inv) => !inv.sourceAccountId && inv.invested)
    .map((inv) => {
      const destName = inv.accountId ? nameById.get(inv.accountId) : undefined;
      return {
        id: inv.id,
        kind: 'investment' as const,
        description: inv.description,
        value: inv.value,
        date: inv.date,
        detail: destName ? `Para ${destName}` : 'Aplicação',
        deletable: false,
      };
    });

  return sortWalletMovements([
    ...incomes,
    ...expenses,
    ...withdrawals,
    ...invoicePayments,
    ...transfers,
    ...aportes,
  ]);
}

/**
 * Variação líquida efetiva do Saldo Livre no mês: inflow − outflow.
 */
export function getUnlinkedNetVariation(
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): number {
  const { inflow, outflow } = getUnlinkedMonthTotals(
    monthData,
    creditCards,
    cardMonthlyStatuses
  );
  return inflow - outflow;
}

/**
 * Saldo Livre no início do mês: carry-forward dos meses anteriores.
 */
export function getUnlinkedOpeningBalance(
  yearMonth: string,
  monthDataByMonth: Record<string, MonthData>,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): number {
  const monthsBefore = Object.keys(monthDataByMonth)
    .filter((m) => m < yearMonth)
    .sort();

  return monthsBefore.reduce((sum, m) => {
    const data = monthDataByMonth[m] ?? EMPTY_MONTH;
    const statuses = data.cardMonthlyStatuses ?? cardMonthlyStatuses;
    return sum + getUnlinkedNetVariation(data, creditCards, statuses);
  }, 0);
}

/**
 * Saldo Livre ao fim do mês: saldo inicial + variação líquida efetiva do mês.
 */
export function getUnlinkedClosingBalance(
  yearMonth: string,
  monthDataByMonth: Record<string, MonthData>,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): number {
  const monthData = monthDataByMonth[yearMonth] ?? EMPTY_MONTH;
  const statuses = monthData.cardMonthlyStatuses ?? cardMonthlyStatuses;
  const opening = getUnlinkedOpeningBalance(
    yearMonth,
    monthDataByMonth,
    creditCards,
    cardMonthlyStatuses
  );
  return opening + getUnlinkedNetVariation(monthData, creditCards, statuses);
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
 * Variação líquida efetiva do mês por papel da carteira.
 * Movimentação: liquidez (inflow − outflow, inclui aportes enviados).
 * Investimentos: posição (aportes + entradas por transfer − saídas).
 */
export function getAccountNetVariation(
  accountId: string,
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>,
  accountRole: AccountRole = 'movement'
): number {
  const { inflow, outflow, invested } = getAccountMonthTotals(
    accountId,
    monthData,
    creditCards,
    cardMonthlyStatuses,
    accountRole
  );
  if (accountRole === 'investment') {
    return inflow + invested - outflow;
  }
  return inflow - outflow;
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
  cardMonthlyStatuses?: Record<string, boolean>,
  accountRole: AccountRole = 'movement'
): number {
  return (
    baseBalance +
    getAccountNetVariation(accountId, monthData, creditCards, cardMonthlyStatuses, accountRole)
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
  cardMonthlyStatuses?: Record<string, boolean>,
  accountRole: AccountRole = 'movement'
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
      total += getAccountNetVariation(accountId, data, creditCards, statuses, accountRole);
    }
    return total;
  }

  const monthsBefore = Object.keys(monthDataByMonth)
    .filter((m) => m < yearMonth)
    .sort();

  return monthsBefore.reduce((sum, m) => {
    const data = monthDataByMonth[m] ?? EMPTY_MONTH;
    const statuses = data.cardMonthlyStatuses ?? cardMonthlyStatuses;
    return sum + getAccountNetVariation(accountId, data, creditCards, statuses, accountRole);
  }, 0);
}

export type AccountOpeningBalanceSource = 'declared' | 'carried_forward';

export interface AccountOpeningBalanceContext {
  amount: number;
  source: AccountOpeningBalanceSource;
}

/**
 * Contexto do saldo no início do mês para exibição no histórico da carteira.
 */
export function getAccountOpeningBalanceContext(
  accountId: string,
  yearMonth: string,
  balances: AccountBalance[],
  monthDataByMonth: Record<string, MonthData>,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>,
  accountRole: AccountRole = 'movement'
): AccountOpeningBalanceContext | null {
  const declared = getAccountDeclaredBalance(accountId, yearMonth, balances);
  if (declared) {
    return { amount: declared.balance, source: 'declared' };
  }

  const amount = getAccountOpeningBalance(
    accountId,
    yearMonth,
    balances,
    monthDataByMonth,
    creditCards,
    cardMonthlyStatuses,
    accountRole
  );

  if (amount === 0) return null;

  return { amount, source: 'carried_forward' };
}

/**
 * Contexto do Saldo Livre no início do mês para exibição no histórico.
 */
export function getUnlinkedOpeningBalanceContext(
  yearMonth: string,
  monthDataByMonth: Record<string, MonthData>,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): AccountOpeningBalanceContext | null {
  const amount = getUnlinkedOpeningBalance(
    yearMonth,
    monthDataByMonth,
    creditCards,
    cardMonthlyStatuses
  );

  if (amount === 0) return null;

  return { amount, source: 'carried_forward' };
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
  cardMonthlyStatuses?: Record<string, boolean>,
  accountRole: AccountRole = 'movement'
): number {
  const monthData = monthDataByMonth[yearMonth] ?? EMPTY_MONTH;
  const statuses = monthData.cardMonthlyStatuses ?? cardMonthlyStatuses;
  const opening = getAccountOpeningBalance(
    accountId,
    yearMonth,
    balances,
    monthDataByMonth,
    creditCards,
    cardMonthlyStatuses,
    accountRole
  );
  return opening + getAccountNetVariation(accountId, monthData, creditCards, statuses, accountRole);
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
    cardMonthlyStatuses,
    'movement'
  );
  const investmentTotals = getAccountMonthTotals(
    accountId,
    monthData,
    creditCards,
    cardMonthlyStatuses,
    'investment'
  );
  if (
    totals.inflow > 0 ||
    totals.outflow > 0 ||
    totals.invested > 0 ||
    investmentTotals.inflow > 0 ||
    investmentTotals.outflow > 0 ||
    investmentTotals.invested > 0
  ) {
    return true;
  }

  return getAccountOperations(monthData).some(
    (op) =>
      ((op.type === 'withdrawal' || op.type === 'transfer_out') &&
        op.sourceAccountId === accountId) ||
      (op.type === 'transfer_in' && op.destinationAccountId === accountId)
  );
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
  cardMonthlyStatuses?: Record<string, boolean>,
  accountRole: AccountRole = 'movement'
): BalanceDeclarationWarning | null {
  if (!accountHasMovementsInMonth(accountId, monthData, creditCards, cardMonthlyStatuses)) {
    return null;
  }

  const monthVariation = getAccountNetVariation(
    accountId,
    monthData,
    creditCards,
    cardMonthlyStatuses,
    accountRole
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
    cardMonthlyStatuses,
    accountRole
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

/**
 * Patrimônio estimado consolidado: soma dos saldos ao fim do mês de todas as carteiras + Saldo Livre.
 */
export function getTotalEstimatedPatrimony(
  accounts: Account[],
  yearMonth: string,
  balances: AccountBalance[],
  monthDataByMonth: Record<string, MonthData>,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): number {
  const accountsSum = accounts.reduce(
    (sum, account) =>
      sum +
      getAccountClosingBalance(
        account.id,
        yearMonth,
        balances,
        monthDataByMonth,
        creditCards,
        cardMonthlyStatuses,
        account.role
      ),
    0
  );

  const freeBalance = getUnlinkedClosingBalance(
    yearMonth,
    monthDataByMonth,
    creditCards,
    cardMonthlyStatuses
  );

  return accountsSum + freeBalance;
}
