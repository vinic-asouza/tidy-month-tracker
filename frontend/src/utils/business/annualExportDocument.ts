/**
 * Documento da exportação anual. Só agrega o que a visão Anual já calcula.
 * Não recebe desejos.
 */

import type { CreditCard, FinancialRule, MonthData } from '@/types/domain';
import { formatCurrency } from '@/lib/utils';
import {
  calculateAnnualFinancialRuleStatsByMode,
  resolveAnnualRuleMoney,
  sumExpensesInCategories,
} from '@/utils/financialRuleCalculations';
import {
  countActiveAverageMonths,
  formatAverageWindowLabel,
  resolveAnnualAverageWindow,
  sliceYearMonths,
} from '@/utils/business/annualAverage';
import {
  buildAnnualExpenseBreakdown,
  buildAnnualInvestmentRows,
  sumCardPaymentRows,
  type AnnualMoneyRow,
} from '@/utils/business/annualBreakdown';
import {
  calculateMonthTotals,
  getResgateInflowFromIncomes,
  type SummaryViewMode,
} from '@/utils/business/monthTotals';

export const ANNUAL_EXPORT_ABSENCE = '—';

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const CONFIGURE_RULE_MESSAGE =
  'Configure sua regra para acompanhar como seus gastos e investimentos se distribuem ao longo do ano.';

export interface AnnualExportTable {
  title: string;
  head: string[];
  body: string[][];
  emptyMessage: string | null;
  notes: string[];
}

export interface AnnualExportDocument {
  title: string;
  year: number;
  mode: SummaryViewMode;
  modeLabel: string;
  windowLabel: string;
  filenameBase: string;
  tables: AnnualExportTable[];
}

export interface BuildAnnualExportDocumentInput {
  year: number;
  mode: SummaryViewMode;
  yearData: readonly MonthData[];
  creditCards: readonly CreditCard[];
  rule: FinancialRule | null;
  expenseCategories: readonly string[];
  today: Date;
}

export function annualExportFilenameBase(year: number, mode: SummaryViewMode): string {
  const modeSlug = mode === 'planned' ? 'planejados' : 'efetivados';
  return `finto-anual-${year}-${modeSlug}`;
}

export function formatExportMoney(value: number | null, signedBalance = false): string {
  if (value == null) return ANNUAL_EXPORT_ABSENCE;
  const formatted = formatCurrency(value);
  if (signedBalance && value > 0) return `+${formatted}`;
  return formatted;
}

function pairTable(title: string, rows: AnnualMoneyRow[], emptyMessage: string): AnnualExportTable {
  return {
    title,
    head: rows.length > 0 ? ['Item', 'Média', 'Total'] : [],
    body: rows.map((row) => [row.label, formatExportMoney(row.average), formatExportMoney(row.total)]),
    emptyMessage: rows.length > 0 ? null : emptyMessage,
    notes: [],
  };
}

function emptyExpensesMessage(mode: SummaryViewMode): string {
  return mode === 'planned'
    ? 'Nenhum gasto registrado neste ano.'
    : 'Nenhum gasto efetivado neste ano.';
}

function emptyInvestmentsMessage(mode: SummaryViewMode): string {
  return mode === 'planned'
    ? 'Nenhum aporte registrado neste ano.'
    : 'Nenhum aporte efetivado neste ano.';
}

function ruleEmptyMessage(mode: SummaryViewMode, averageAbsent: boolean): string {
  if (averageAbsent) {
    return 'Nenhum mês com lançamentos neste período para calcular a média da regra. O total do ano continua abaixo.';
  }
  return mode === 'planned'
    ? 'Registre lançamentos no período da média para ver as barras da regra. O total do ano continua abaixo.'
    : 'Marque lançamentos como recebidos, pagos ou investidos no período da média para ver as barras da regra. O total do ano continua abaixo.';
}

function buildRuleTable(
  input: BuildAnnualExportDocumentInput,
  monthCount: number,
  activeMonthCount: number
): AnnualExportTable {
  const title = `Regra Financeira — ${input.year}`;
  if (!input.rule) {
    return { title, head: [], body: [], emptyMessage: CONFIGURE_RULE_MESSAGE, notes: [] };
  }

  const cards = [...input.creditCards];
  const windowMonths = sliceYearMonths(input.yearData, monthCount);
  const yearStats = calculateAnnualFinancialRuleStatsByMode(
    input.mode,
    input.rule,
    [...input.yearData],
    cards
  );
  const windowStats = calculateAnnualFinancialRuleStatsByMode(
    input.mode,
    input.rule,
    windowMonths,
    cards
  );
  const figures = resolveAnnualRuleMoney(yearStats, windowStats, monthCount, activeMonthCount);
  const average = figures.average;
  const showBars = average != null && average.totalIncome > 0;

  const notes: string[] = [
    input.rule.isCustom
      ? `Personalizada: ${input.rule.essentialsPercentage}% / ${input.rule.lifestylePercentage}% / ${input.rule.investmentsPercentage}%`
      : 'Regra 50/30/20',
  ];

  const mapped = Object.keys(input.rule.categoryMapping || {});
  const unmappedCategories = input.expenseCategories.filter((category) => !mapped.includes(category));
  if (unmappedCategories.length > 0) {
    const yearTotal = sumExpensesInCategories(input.yearData, unmappedCategories, input.mode, cards);
    const unmappedAverage =
      activeMonthCount <= 0
        ? null
        : sumExpensesInCategories(windowMonths, unmappedCategories, input.mode, cards) / activeMonthCount;
    let note = `${unmappedCategories.length} categoria(s) sem mapeamento`;
    if (yearTotal > 0) {
      note += ` — média ${formatExportMoney(unmappedAverage)} (total ${formatCurrency(yearTotal)})`;
    }
    notes.push(note);
  }

  if (input.mode === 'effective') {
    const total = input.yearData.reduce(
      (sum, month) => sum + getResgateInflowFromIncomes(month.incomes),
      0
    );
    if (total > 0) {
      const windowSum = windowMonths.reduce(
        (sum, month) => sum + getResgateInflowFromIncomes(month.incomes),
        0
      );
      const resgateAverage = activeMonthCount > 0 ? windowSum / activeMonthCount : null;
      notes.push(
        `Resgates na renda: média ${formatExportMoney(resgateAverage)}, no ano ${formatCurrency(total)}. Isso dilui os percentuais.`
      );
    }
  }

  if (!showBars) notes.push(ruleEmptyMessage(input.mode, average == null));

  const buckets = [
    { key: 'essentials' as const, label: 'Essenciais', caption: 'Gasto', limitLabel: 'Limite' },
    { key: 'lifestyle' as const, label: 'Estilo de Vida', caption: 'Gasto', limitLabel: 'Limite' },
    { key: 'investments' as const, label: 'Investimentos', caption: 'Aporte', limitLabel: 'Meta' },
  ];

  const body: string[][] = [];
  for (const bucket of buckets) {
    const yearBucket = figures.year[bucket.key];
    const averageBucket = average?.[bucket.key];
    body.push([
      bucket.label,
      bucket.caption,
      formatExportMoney(averageBucket ? averageBucket.currentValue : null),
      formatExportMoney(yearBucket.currentValue),
    ]);
    body.push([
      bucket.label,
      bucket.limitLabel,
      formatExportMoney(averageBucket ? averageBucket.targetValue : null),
      formatExportMoney(yearBucket.targetValue),
    ]);
  }

  const unclassifiedVisible =
    (average?.unclassifiedValue ?? 0) > 0 || figures.year.unclassifiedValue > 0;
  if (unclassifiedVisible) {
    const percent =
      average && average.totalIncome > 0
        ? ` (${((average.unclassifiedValue / average.totalIncome) * 100).toFixed(1)}%)`
        : '';
    body.push([
      `Não classificado${percent}`,
      'Gasto',
      formatExportMoney(average ? average.unclassifiedValue : null),
      formatExportMoney(figures.year.unclassifiedValue),
    ]);
  }

  return {
    title,
    head: ['Item', 'Leitura', 'Média', 'Total'],
    body,
    emptyMessage: null,
    notes,
  };
}

export function buildAnnualExportDocument(
  input: BuildAnnualExportDocumentInput
): AnnualExportDocument {
  const cards = [...input.creditCards];
  const averageWindow = resolveAnnualAverageWindow(input.year, input.today);
  const monthly = input.yearData.map((month) =>
    calculateMonthTotals(input.mode, month, cards, month.cardMonthlyStatuses)
  );
  const totals = monthly.reduce(
    (acc, month) => ({
      income: acc.income + month.totalIncome,
      expenses: acc.expenses + month.totalExpenses,
      investments: acc.investments + month.totalInvestments,
      balance: acc.balance + month.balance,
    }),
    { income: 0, expenses: 0, investments: 0, balance: 0 }
  );
  const activeMonthCount = countActiveAverageMonths(
    monthly.map((month) => ({
      income: month.totalIncome,
      expenses: month.totalExpenses,
      investments: month.totalInvestments,
    })),
    averageWindow.monthCount
  );
  const windowLabel = formatAverageWindowLabel(input.year, input.today, activeMonthCount);
  const windowMonths = sliceYearMonths(monthly, averageWindow.monthCount);
  const windowSum = windowMonths.reduce(
    (acc, month) => ({
      income: acc.income + month.totalIncome,
      expenses: acc.expenses + month.totalExpenses,
      investments: acc.investments + month.totalInvestments,
      balance: acc.balance + month.balance,
    }),
    { income: 0, expenses: 0, investments: 0, balance: 0 }
  );
  const average = activeMonthCount <= 0
    ? null
    : {
        income: windowSum.income / activeMonthCount,
        expenses: windowSum.expenses / activeMonthCount,
        investments: windowSum.investments / activeMonthCount,
        balance: windowSum.balance / activeMonthCount,
      };

  const summaryRows: Array<[string, number | null, number, boolean]> = [
    ['Entradas', average?.income ?? null, totals.income, false],
    ['Gastos', average?.expenses ?? null, totals.expenses, false],
    ['Investimentos', average?.investments ?? null, totals.investments, false],
    ['Saldo', average?.balance ?? null, totals.balance, true],
  ];

  const expenses = buildAnnualExpenseBreakdown(
    input.yearData,
    input.mode,
    cards,
    averageWindow.monthCount
  );
  const investments = buildAnnualInvestmentRows(
    input.yearData,
    input.mode,
    averageWindow.monthCount,
    cards
  );
  const cardTotal = sumCardPaymentRows(expenses.paymentMethods);
  const expenseEmpty = emptyExpensesMessage(input.mode);
  const modeLabel = input.mode === 'planned' ? 'Planejados' : 'Efetivados';

  const tables: AnnualExportTable[] = [
    {
      title: 'Resumo',
      head: ['Item', 'Média', 'Total'],
      body: summaryRows.map(([label, avg, total, signed]) => [
        label,
        formatExportMoney(avg, signed),
        formatExportMoney(total, signed),
      ]),
      emptyMessage: null,
      notes: [],
    },
    {
      title: 'Mês a mês',
      head: ['Mês', 'Entradas', 'Gastos', 'Investimentos', 'Saldo'],
      body: monthly.map((month, index) => [
        MONTH_NAMES[index] ?? String(index + 1),
        formatExportMoney(month.totalIncome),
        formatExportMoney(month.totalExpenses),
        formatExportMoney(month.totalInvestments),
        formatExportMoney(month.balance),
      ]),
      emptyMessage: null,
      notes: [],
    },
    buildRuleTable(input, averageWindow.monthCount, activeMonthCount),
    pairTable('Categorias', expenses.categories, expenseEmpty),
  ];

  if (expenses.categories.length > 0) {
    tables.push(pairTable('Por tipo', expenses.types, expenseEmpty));
  }

  tables.push(pairTable('Método de pagamento', expenses.paymentMethods, expenseEmpty));
  if (cardTotal) {
    tables.push(pairTable('Cartões', [cardTotal], expenseEmpty));
  }
  tables.push(pairTable('Investimentos', investments, emptyInvestmentsMessage(input.mode)));

  return {
    title: `Resumo Anual — ${input.year}`,
    year: input.year,
    mode: input.mode,
    modeLabel,
    windowLabel,
    filenameBase: annualExportFilenameBase(input.year, input.mode),
    tables,
  };
}
