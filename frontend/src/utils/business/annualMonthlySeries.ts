/**
 * Séries mês a mês para os gráficos das seções da visão Anual (DEV-153).
 * Reusa as mesmas regras de inclusão de annualBreakdown / monthTotals / regra financeira.
 */

import type { CreditCard, Expense, FinancialRule, MonthData } from '@/types/domain';
import { calculateFinancialRuleStatsByMode } from '@/utils/financialRuleCalculations';
import {
  UNCLASSIFIED_INCOME_LABEL,
  UNCLASSIFIED_INVESTMENT_LABEL,
  buildAnnualExpenseBreakdown,
  buildAnnualIncomeRows,
  buildAnnualInvestmentRows,
  type AnnualMoneyRow,
} from './annualBreakdown';
import {
  isExpenseEffectivelyPaid,
  isResgateIncome,
  type SummaryViewMode,
} from './monthTotals';

export const MONTH_SHORT_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

export const CARDS_GROUP_KEY = 'cards-grouped';
export const CARDS_GROUP_LABEL = 'Cartões';
export const ALL_SERIES_KEY = '__all__';
export const TOP3_SERIES_KEY = '__top3__';

/** Tons vermelho/rosa — categorias / gastos. */
export const EXPENSE_SERIES_PALETTE = [
  'hsl(350, 89%, 60%)',
  'hsl(330, 75%, 55%)',
  'hsl(10, 80%, 58%)',
  'hsl(340, 65%, 48%)',
  'hsl(355, 70%, 70%)',
  'hsl(320, 60%, 50%)',
  'hsl(0, 72%, 52%)',
  'hsl(345, 55%, 42%)',
] as const;

/** Tons laranja/amarelo/marrom — método de pagamento. */
export const PAYMENT_SERIES_PALETTE = [
  'hsl(25, 90%, 55%)',
  'hsl(45, 93%, 47%)',
  'hsl(35, 80%, 42%)',
  'hsl(18, 70%, 48%)',
  'hsl(40, 85%, 58%)',
  'hsl(28, 55%, 38%)',
  'hsl(50, 90%, 45%)',
  'hsl(15, 65%, 55%)',
] as const;

/** Tons de azul — investimentos. */
export const INVESTMENT_SERIES_PALETTE = [
  'hsl(220, 92%, 60%)',
  'hsl(205, 85%, 48%)',
  'hsl(235, 70%, 55%)',
  'hsl(195, 75%, 42%)',
  'hsl(215, 80%, 70%)',
  'hsl(225, 60%, 45%)',
  'hsl(200, 90%, 55%)',
  'hsl(240, 55%, 58%)',
] as const;

/** Tons de verde — entradas. */
export const INCOME_SERIES_PALETTE = [
  'hsl(160, 84%, 39%)',
  'hsl(150, 70%, 42%)',
  'hsl(170, 65%, 35%)',
  'hsl(140, 60%, 48%)',
  'hsl(155, 55%, 55%)',
  'hsl(165, 75%, 30%)',
  'hsl(145, 80%, 45%)',
  'hsl(175, 50%, 40%)',
] as const;

export const RULE_SERIES = {
  essentials: { key: 'Essenciais', label: 'Essenciais' },
  lifestyle: { key: 'Estilo de vida', label: 'Estilo de vida' },
  investments: { key: 'Investimentos', label: 'Investimentos' },
  unclassified: { key: 'Não classificado', label: 'Não classificado' },
} as const;

export interface AnnualChartSeries {
  key: string;
  label: string;
  color?: string;
}

function colorizeSeries(
  series: AnnualChartSeries[],
  palette: readonly string[]
): AnnualChartSeries[] {
  return series.map((item, index) => ({
    ...item,
    color: item.color ?? palette[index % palette.length],
  }));
}

export interface AnnualMonthlyChartPoint {
  name: string;
  monthIndex: number;
  [seriesKey: string]: string | number;
}

export interface AnnualMonthlyChartModel {
  points: AnnualMonthlyChartPoint[];
  series: AnnualChartSeries[];
  hasData: boolean;
}

export interface AnnualChartSelectOption {
  value: string;
  label: string;
}

const EMPTY_CATEGORY_LABEL = 'Sem categoria';
const EMPTY_PAYMENT_LABEL = 'Sem forma de pagamento';

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

function investmentIdentity(tag: string): { key: string; label: string } {
  const trimmed = tag.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') {
    return { key: '__unclassified__', label: UNCLASSIFIED_INVESTMENT_LABEL };
  }
  return { key: trimmed, label: trimmed };
}

function incomeTagIdentity(tag: string): { key: string; label: string } {
  const trimmed = tag.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') {
    return { key: '__unclassified_income__', label: UNCLASSIFIED_INCOME_LABEL };
  }
  return { key: trimmed, label: trimmed };
}

function incomeIncluded(
  income: { tag: string; value: number; received: boolean },
  mode: SummaryViewMode
): boolean {
  if (mode === 'planned') return !isResgateIncome(income);
  return income.received === true;
}

function emptyPoints(): AnnualMonthlyChartPoint[] {
  return MONTH_SHORT_NAMES.map((name, monthIndex) => ({ name, monthIndex }));
}

function modelHasData(points: AnnualMonthlyChartPoint[], seriesKeys: string[]): boolean {
  return points.some((point) => seriesKeys.some((key) => Number(point[key] ?? 0) !== 0));
}

/** Top N chaves ordenadas pela média (desc), empate por label pt-BR. */
export function topKeysByAverage(rows: readonly AnnualMoneyRow[], n: number): string[] {
  return [...rows]
    .sort(
      (a, b) =>
        (b.average ?? Number.NEGATIVE_INFINITY) - (a.average ?? Number.NEGATIVE_INFINITY) ||
        a.label.localeCompare(b.label, 'pt-BR')
    )
    .slice(0, n)
    .map((row) => row.key);
}

export function buildCategoryChartOptions(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  creditCards: CreditCard[],
  monthCount: number
): AnnualChartSelectOption[] {
  const { categories } = buildAnnualExpenseBreakdown(yearData, mode, creditCards, monthCount);
  return [
    { value: TOP3_SERIES_KEY, label: 'Top 3 (média)' },
    ...categories.map((row) => ({ value: row.key, label: row.label })),
  ];
}

export function buildCategoryMonthlyChart(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  creditCards: CreditCard[],
  monthCount: number,
  selection: string
): AnnualMonthlyChartModel {
  const { categories } = buildAnnualExpenseBreakdown(yearData, mode, creditCards, monthCount);
  const selectedKeys =
    selection === TOP3_SERIES_KEY || !selection
      ? topKeysByAverage(categories, 3)
      : categories.some((row) => row.key === selection)
        ? [selection]
        : topKeysByAverage(categories, 3);

  const labelByKey = new Map(categories.map((row) => [row.key, row.label]));
  const series = colorizeSeries(
    selectedKeys.map((key) => ({
      key,
      label: labelByKey.get(key) ?? key,
    })),
    EXPENSE_SERIES_PALETTE
  );

  const points = emptyPoints();
  yearData.forEach((month, index) => {
    if (index >= points.length) return;
    const totals = new Map<string, number>();
    for (const expense of month.expenses) {
      if (!expenseIncluded(expense, mode, creditCards, month.cardMonthlyStatuses)) continue;
      const identity = categoryIdentity(expense.category);
      if (!selectedKeys.includes(identity.key)) continue;
      totals.set(identity.key, (totals.get(identity.key) ?? 0) + expense.value);
    }
    for (const key of selectedKeys) {
      points[index][key] = totals.get(key) ?? 0;
    }
  });

  return {
    points,
    series,
    hasData: modelHasData(points, selectedKeys),
  };
}

export function buildPaymentChartOptions(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  creditCards: CreditCard[],
  monthCount: number
): AnnualChartSelectOption[] {
  const { paymentMethods } = buildAnnualExpenseBreakdown(yearData, mode, creditCards, monthCount);
  const nonCards = paymentMethods.filter((row) => !row.isCard);
  const cards = paymentMethods.filter((row) => row.isCard);
  const options: AnnualChartSelectOption[] = [{ value: ALL_SERIES_KEY, label: 'Todas' }];
  if (cards.length > 0) {
    options.push({ value: CARDS_GROUP_KEY, label: CARDS_GROUP_LABEL });
  }
  for (const row of nonCards) {
    options.push({ value: row.key, label: row.label });
  }
  for (const row of cards) {
    options.push({ value: row.key, label: row.label });
  }
  return options;
}

export function buildPaymentMonthlyChart(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  creditCards: CreditCard[],
  monthCount: number,
  selection: string
): AnnualMonthlyChartModel {
  const { paymentMethods } = buildAnnualExpenseBreakdown(yearData, mode, creditCards, monthCount);
  const nonCards = paymentMethods.filter((row) => !row.isCard);
  const cards = paymentMethods.filter((row) => row.isCard);
  const hasCards = cards.length > 0;

  let series: AnnualChartSeries[];
  if (selection === ALL_SERIES_KEY || !selection) {
    series = [
      ...nonCards.map((row) => ({ key: row.key, label: row.label })),
      ...(hasCards ? [{ key: CARDS_GROUP_KEY, label: CARDS_GROUP_LABEL }] : []),
    ];
  } else if (selection === CARDS_GROUP_KEY) {
    series = hasCards ? [{ key: CARDS_GROUP_KEY, label: CARDS_GROUP_LABEL }] : [];
  } else {
    const row = paymentMethods.find((item) => item.key === selection);
    series = row ? [{ key: row.key, label: row.label }] : [];
  }
  series = colorizeSeries(series, PAYMENT_SERIES_PALETTE);

  const seriesKeys = series.map((item) => item.key);
  const points = emptyPoints();

  yearData.forEach((month, index) => {
    if (index >= points.length) return;
    const totals = new Map<string, number>();
    for (const expense of month.expenses) {
      if (!expenseIncluded(expense, mode, creditCards, month.cardMonthlyStatuses)) continue;
      const identity = paymentIdentity(expense.paymentMethod);
      const card = isCardPayment(expense.paymentMethod, creditCards);

      if (selection === ALL_SERIES_KEY || !selection) {
        if (card) {
          totals.set(CARDS_GROUP_KEY, (totals.get(CARDS_GROUP_KEY) ?? 0) + expense.value);
        } else if (seriesKeys.includes(identity.key)) {
          totals.set(identity.key, (totals.get(identity.key) ?? 0) + expense.value);
        }
      } else if (selection === CARDS_GROUP_KEY) {
        if (card) {
          totals.set(CARDS_GROUP_KEY, (totals.get(CARDS_GROUP_KEY) ?? 0) + expense.value);
        }
      } else if (identity.key === selection) {
        totals.set(identity.key, (totals.get(identity.key) ?? 0) + expense.value);
      }
    }
    for (const key of seriesKeys) {
      points[index][key] = totals.get(key) ?? 0;
    }
  });

  return {
    points,
    series,
    hasData: modelHasData(points, seriesKeys),
  };
}

export function buildIncomeChartOptions(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  creditCards: CreditCard[],
  monthCount: number
): AnnualChartSelectOption[] {
  const rows = buildAnnualIncomeRows(yearData, mode, monthCount, creditCards);
  return [
    { value: TOP3_SERIES_KEY, label: 'Top 3 (média)' },
    ...rows.map((row) => ({ value: row.key, label: row.label })),
  ];
}

export function buildIncomeMonthlyChart(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  creditCards: CreditCard[],
  monthCount: number,
  selection: string
): AnnualMonthlyChartModel {
  const rows = buildAnnualIncomeRows(yearData, mode, monthCount, creditCards);
  const selectedKeys =
    selection === TOP3_SERIES_KEY || !selection
      ? topKeysByAverage(rows, 3)
      : rows.some((row) => row.key === selection)
        ? [selection]
        : topKeysByAverage(rows, 3);

  const labelByKey = new Map(rows.map((row) => [row.key, row.label]));
  const series = colorizeSeries(
    selectedKeys.map((key) => ({
      key,
      label: labelByKey.get(key) ?? key,
    })),
    INCOME_SERIES_PALETTE
  );

  const points = emptyPoints();
  yearData.forEach((month, index) => {
    if (index >= points.length) return;
    const totals = new Map<string, number>();
    for (const income of month.incomes) {
      if (!incomeIncluded(income, mode)) continue;
      const identity = incomeTagIdentity(income.tag);
      if (!selectedKeys.includes(identity.key)) continue;
      totals.set(identity.key, (totals.get(identity.key) ?? 0) + income.value);
    }
    for (const key of selectedKeys) {
      points[index][key] = totals.get(key) ?? 0;
    }
  });

  return {
    points,
    series,
    hasData: modelHasData(points, selectedKeys),
  };
}

export function buildInvestmentChartOptions(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  monthCount: number,
  creditCards: CreditCard[] = []
): AnnualChartSelectOption[] {
  const rows = buildAnnualInvestmentRows(yearData, mode, monthCount, creditCards);
  return [
    { value: ALL_SERIES_KEY, label: 'Todas' },
    ...rows.map((row) => ({ value: row.key, label: row.label })),
  ];
}

export function buildInvestmentMonthlyChart(
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  monthCount: number,
  selection: string,
  creditCards: CreditCard[] = []
): AnnualMonthlyChartModel {
  const rows = buildAnnualInvestmentRows(yearData, mode, monthCount, creditCards);
  const showAll = selection === ALL_SERIES_KEY || !selection;
  const series = colorizeSeries(
    showAll
      ? rows.map((row) => ({ key: row.key, label: row.label }))
      : rows
          .filter((row) => row.key === selection)
          .map((row) => ({ key: row.key, label: row.label })),
    INVESTMENT_SERIES_PALETTE
  );

  const seriesKeys = series.map((item) => item.key);
  const points = emptyPoints();

  yearData.forEach((month, index) => {
    if (index >= points.length) return;
    const byTag = new Map<string, number>();

    for (const investment of month.investments) {
      if (mode === 'effective' && !investment.invested) continue;
      const identity = investmentIdentity(investment.tag);
      byTag.set(identity.key, (byTag.get(identity.key) ?? 0) + investment.value);
    }

    for (const key of seriesKeys) {
      points[index][key] = byTag.get(key) ?? 0;
    }
  });

  return {
    points,
    series,
    hasData: modelHasData(points, seriesKeys),
  };
}

export function buildFinancialRuleMonthlyChart(
  rule: FinancialRule,
  yearData: readonly MonthData[],
  mode: SummaryViewMode,
  creditCards: CreditCard[] = []
): AnnualMonthlyChartModel {
  const points = emptyPoints();
  let unclassifiedYearTotal = 0;

  yearData.forEach((month, index) => {
    if (index >= points.length) return;
    const stats = calculateFinancialRuleStatsByMode(
      mode,
      rule,
      month,
      creditCards,
      month.cardMonthlyStatuses
    );
    points[index][RULE_SERIES.essentials.key] = stats.essentials.currentValue;
    points[index][RULE_SERIES.lifestyle.key] = stats.lifestyle.currentValue;
    points[index][RULE_SERIES.investments.key] = stats.investments.currentValue;
    points[index][RULE_SERIES.unclassified.key] = stats.unclassifiedValue;
    unclassifiedYearTotal += stats.unclassifiedValue;
  });

  const series: AnnualChartSeries[] = [
    {
      key: RULE_SERIES.essentials.key,
      label: RULE_SERIES.essentials.label,
      color: 'hsl(350, 89%, 60%)',
    },
    {
      key: RULE_SERIES.lifestyle.key,
      label: RULE_SERIES.lifestyle.label,
      color: 'hsl(25, 90%, 55%)',
    },
    {
      key: RULE_SERIES.investments.key,
      label: RULE_SERIES.investments.label,
      color: 'hsl(220, 92%, 60%)',
    },
  ];
  if (unclassifiedYearTotal > 0) {
    series.push({
      key: RULE_SERIES.unclassified.key,
      label: RULE_SERIES.unclassified.label,
      color: 'hsl(215, 14%, 50%)',
    });
  }

  const seriesKeys = series.map((item) => item.key);
  return {
    points,
    series,
    hasData: modelHasData(points, seriesKeys),
  };
}
