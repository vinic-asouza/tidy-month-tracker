import type { Expense, Income, Investment, MonthData } from '@/types/domain';

export type BulkDeleteKind = 'income' | 'expense' | 'investment';
export type BulkDeleteScope = 'current' | 'series';
export type BulkBlockingReason = 'fixed' | 'installment' | 'recurring';

export interface BulkDeleteListItem {
  id: string;
  kind: BulkDeleteKind;
  description: string;
  value: number;
  blocking: boolean;
  blockingReason?: BulkBlockingReason;
  expenseType?: Expense['type'];
  /** Parcela atual / total (só parcelados) */
  installmentLabel?: string;
  isResgate?: boolean;
  tagOrCategory?: string;
}

export function formatInstallmentLabel(expense: Expense): string | undefined {
  if (expense.type !== 'installment') return undefined;
  const current = expense.currentInstallment;
  const total = expense.totalInstallments;
  if (current == null || total == null) return undefined;
  return `${current}/${total}`;
}

export function isIncomeBulkBlocking(income: Income): boolean {
  return !!(income.repeatAllMonths || income.baseIncomeId);
}

export function isInvestmentBulkBlocking(investment: Investment): boolean {
  return !!(investment.repeatAllMonths || investment.baseInvestmentId);
}

export function isExpenseBulkBlocking(expense: Expense): boolean {
  const isFixedSeries =
    expense.type === 'fixed' && !!(expense.repeatAllMonths || expense.baseExpenseId);
  return isFixedSeries || expense.type === 'installment';
}

export function getExpenseBlockingReason(expense: Expense): BulkBlockingReason | undefined {
  if (expense.type === 'installment') return 'installment';
  if (expense.type === 'fixed' && (expense.repeatAllMonths || expense.baseExpenseId)) {
    return 'fixed';
  }
  return undefined;
}

export function seriesScopeLabel(reason?: BulkBlockingReason): string {
  if (reason === 'installment') return 'Todas as parcelas';
  return 'Meses seguintes da série';
}

export function buildBulkDeleteList(
  monthData: Pick<MonthData, 'incomes' | 'expenses' | 'investments'>,
  selectedIncomeIds: Set<string>,
  selectedExpenseIds: Set<string>,
  selectedInvestmentIds: Set<string>
): BulkDeleteListItem[] {
  const incomes: BulkDeleteListItem[] = monthData.incomes
    .filter((i) => selectedIncomeIds.has(i.id))
    .map((i) => ({
      id: i.id,
      kind: 'income' as const,
      description: i.description,
      value: i.value,
      blocking: isIncomeBulkBlocking(i),
      blockingReason: isIncomeBulkBlocking(i) ? ('recurring' as const) : undefined,
      isResgate: !!i.sourceOperationId,
      tagOrCategory: i.tag,
    }));

  const expenses: BulkDeleteListItem[] = monthData.expenses
    .filter((e) => selectedExpenseIds.has(e.id))
    .map((e) => {
      const blocking = isExpenseBulkBlocking(e);
      return {
        id: e.id,
        kind: 'expense' as const,
        description: e.description,
        value: e.value,
        blocking,
        blockingReason: blocking ? getExpenseBlockingReason(e) : undefined,
        expenseType: e.type,
        installmentLabel: formatInstallmentLabel(e),
        tagOrCategory: e.category,
      };
    });

  const investments: BulkDeleteListItem[] = monthData.investments
    .filter((i) => selectedInvestmentIds.has(i.id))
    .map((i) => ({
      id: i.id,
      kind: 'investment' as const,
      description: i.description,
      value: i.value,
      blocking: isInvestmentBulkBlocking(i),
      blockingReason: isInvestmentBulkBlocking(i) ? ('recurring' as const) : undefined,
      tagOrCategory: i.tag,
    }));

  return [...incomes, ...expenses, ...investments];
}

export function defaultScopesForItems(
  items: BulkDeleteListItem[]
): Record<string, BulkDeleteScope> {
  const scopes: Record<string, BulkDeleteScope> = {};
  for (const item of items) {
    if (item.blocking) {
      scopes[item.id] = 'current';
    }
  }
  return scopes;
}

export type BulkDeleteHandlers = {
  deleteIncome: (id: string, applyToAllMonths?: boolean) => Promise<boolean> | boolean;
  deleteExpense: (id: string, applyToAllMonths?: boolean) => Promise<boolean> | boolean;
  deleteInstallmentExpense: (expense: Expense) => Promise<boolean> | boolean;
  deleteInvestment: (id: string, applyToAllMonths?: boolean) => Promise<boolean> | boolean;
};

export async function executeBulkDelete(params: {
  items: BulkDeleteListItem[];
  scopes: Record<string, BulkDeleteScope>;
  monthData: Pick<MonthData, 'incomes' | 'expenses' | 'investments'>;
  handlers: BulkDeleteHandlers;
}): Promise<{ succeededIds: string[]; failedIds: string[] }> {
  const { items, scopes, monthData, handlers } = params;
  const succeededIds: string[] = [];
  const failedIds: string[] = [];

  for (const item of items) {
    const scope = item.blocking ? scopes[item.id] ?? 'current' : 'current';
    let ok = false;

    try {
      if (item.kind === 'income') {
        ok = !!(await handlers.deleteIncome(item.id, scope === 'series'));
      } else if (item.kind === 'investment') {
        ok = !!(await handlers.deleteInvestment(item.id, scope === 'series'));
      } else {
        const expense = monthData.expenses.find((e) => e.id === item.id);
        if (!expense) {
          failedIds.push(item.id);
          continue;
        }
        if (scope === 'series' && expense.type === 'installment') {
          ok = !!(await handlers.deleteInstallmentExpense(expense));
        } else {
          ok = !!(await handlers.deleteExpense(item.id, scope === 'series'));
        }
      }
    } catch {
      ok = false;
    }

    if (ok) succeededIds.push(item.id);
    else failedIds.push(item.id);
  }

  return { succeededIds, failedIds };
}
