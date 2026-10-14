/**
 * Quebras da visão anual (categoria, tipo, forma de pagamento, tag).
 * Total soma os 12 meses. A média soma a janela (RN-R04) e divide só pelos
 * meses em que o modo ativo teve entrada, gasto ou investimento.
 * Fica nula quando não há mês na média — não reutiliza averageAmount, que devolve 0.
 * O toggle Total/Média da página não entra aqui.
 */

import type { CreditCard, Expense, MonthData } from '@/types/domain';
import { countActiveAverageMonths } from './annualAverage';
import { calculateMonthTotals, isExpenseEffectivelyPaid, type SummaryViewMode } from './monthTotals';

export const UNCLASSIFIED_INVESTMENT_LABEL = 'Sem classificação';

const EMPTY_CATEGORY_LABEL = 'Sem categoria';
const EMPTY_PAYMENT_LABEL = 'Sem forma de pagamento';

const EXPENSE_TYPE_LABELS: Record<Expense['type'], string> = {
  fixed: 'Fixo',
  variable: 'Variável',
  installment: 'Parcelado',
};

export interface AnnualMoneyRow {
  key: string;
  label: string;
  total: number;
  /** null quando a janela tem 0 meses */
  average: number | null;
  isCard?: boolean;
}

export interface AnnualExpenseBreakdown {
  categories: AnnualMoneyRow[];
  types: AnnualMoneyRow[];
  paymentMethods: AnnualMoneyRow[];
}

interface Bucket {
  label: string;
  total: number;
  windowSum: number;
  isCard: boolean;
}

function averageForWindow(windowSum: number, monthCount: number): number | null {
  if (monthCount <= 0) return null;
  return windowSum / monthCount;
}

function rowsFromBuckets(buckets: Map<string, Bucket>, monthCount: number): AnnualMoneyRow[] {
  return [...buckets.entries()]
    .filter(([, bucket]) => bucket.total !== 0)
    .map(([key, bucket]) => ({
      key,
      label: bucket.label,
      total: bucket.total,
      average: averageForWindow(bucket.windowSum, monthCount),
      ...(bucket.isCard ? { isCard: true as const } : {}),
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, 'pt-BR'));
}

function addAmount(
  buckets: Map<string, Bucket>,
  key: string,
  label: string,
  value: number,
  inWindow: boolean,
  isCard = false
) {
  const current = buckets.get(key) ?? { label, total: 0, windowSum: 0, isCard: false };
  current.total += value;
  if (inWindow) current.windowSum += value;
  if (isCard) current.isCard = true;
  buckets.set(key, current);
}

function expenseIncluded(
  expense: Expense,
  mode: SummaryViewMode,
  creditCards: CreditCard[],
  statuses?: Record<string, boolean>
): boolean {
  if (mode === 'planned') return true;
  return isExpenseEffectivelyPaid(expense, creditCards, statuses);
}

function categoryIdentity(category: string): { key: string; label: string } {
  const trimmed = category.trim();
  if (!trimmed) return { key: '__empty_category__', label: EMPTY_CATEGORY_LABEL };
  return { key: trimmed, label: trimmed };
}

function paymentIdentity(method: string): { key: string; label: string } {
  const trimmed = method.trim();
  if (!trimmed) return { key: '__empty_payment__', label: EMPTY_PAYMENT_LABEL };
  return { key: trimmed, label: trimmed };
}

function isCardPayment(method: string, creditCards: CreditCard[]): boolean {
  const trimmed = method.trim();
  return creditCards.some((card) => card.name === method || card.name === trimmed);
}

function averageDivisor(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  creditCards: CreditCard[],
  windowMonthCount: number
): number {
  const signals = yearData.map((month) => {
    const totals = calculateMonthTotals(mode, month, creditCards, month.cardMonthlyStatuses);
    return {
      income: totals.totalIncome,
      expenses: totals.totalExpenses,
      investments: totals.totalInvestments,
    };
  });
  return countActiveAverageMonths(signals, windowMonthCount);
}

function investmentIdentity(tag: string): { key: string; label: string } {
  const trimmed = tag.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') {
    return { key: '__unclassified__', label: UNCLASSIFIED_INVESTMENT_LABEL };
  }
  return { key: trimmed, label: trimmed };
}

export function buildAnnualExpenseBreakdown(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  creditCards: CreditCard[],
  monthCount: number
): AnnualExpenseBreakdown {
  const divisor = averageDivisor(yearData, mode, creditCards, monthCount);
  const categories = new Map<string, Bucket>();
  const types = new Map<string, Bucket>();
  const paymentMethods = new Map<string, Bucket>();

  yearData.forEach((month, index) => {
    const inWindow = index < monthCount;
    const statuses = month.cardMonthlyStatuses;

    for (const expense of month.expenses) {
      if (!expenseIncluded(expense, mode, creditCards, statuses)) continue;

      const category = categoryIdentity(expense.category);
      addAmount(categories, category.key, category.label, expense.value, inWindow);

      const typeLabel = EXPENSE_TYPE_LABELS[expense.type] ?? expense.type;
      addAmount(types, expense.type, typeLabel, expense.value, inWindow);

      const payment = paymentIdentity(expense.paymentMethod);
      addAmount(
        paymentMethods,
        payment.key,
        payment.label,
        expense.value,
        inWindow,
        isCardPayment(expense.paymentMethod, creditCards)
      );
    }
  });

  return {
    categories: rowsFromBuckets(categories, divisor),
    types: rowsFromBuckets(types, divisor),
    paymentMethods: rowsFromBuckets(paymentMethods, divisor),
  };
}

export function buildAnnualInvestmentRows(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  monthCount: number,
  creditCards: CreditCard[] = []
): AnnualMoneyRow[] {
  const divisor = averageDivisor(yearData, mode, creditCards, monthCount);
  const tags = new Map<string, Bucket>();

  yearData.forEach((month, index) => {
    const inWindow = index < monthCount;

    for (const investment of month.investments) {
      if (mode === 'effective' && !investment.invested) continue;
      const identity = investmentIdentity(investment.tag);
      addAmount(tags, identity.key, identity.label, investment.value, inWindow);
    }
  });

  return rowsFromBuckets(tags, divisor);
}
