/**
 * Monta linhas de revisão a partir do CSV mapeado + despesas existentes.
 */

import type { Expense } from '@/types/domain';
import type { MappedCsvRow } from './csvParse';
import {
  parseCsvDate,
  parseMoneyValue,
  rebaseDateToYearMonth,
  yearMonthFromDate,
} from './csvNormalize';
import { resolveInstallmentFromCsv } from './installmentDetect';
import {
  suggestImportAction,
  type SuggestedImportAction,
  type MatchCandidate,
} from './expenseMatch';

export type MonthResolution = 'csv' | 'ui' | 'pending';

export interface ImportReviewRow {
  id: string;
  sourceIndex: number;
  selected: boolean;
  description: string;
  value: number;
  date: string;
  /** Mês efetivo após resolução */
  yearMonth: string;
  csvYearMonth: string;
  monthResolution: MonthResolution;
  monthDiverges: boolean;
  category: string;
  paymentMethod: string;
  action: SuggestedImportAction;
  linkExpenseId?: string;
  candidates: MatchCandidate[];
  suggestionReason: string;
  currentInstallment?: number;
  totalInstallments?: number;
  repeatAllMonths: boolean;
  effectuate: boolean;
  accountId?: string | null;
  /** Linha inelegível (crédito / parse inválido) */
  ineligible: boolean;
  ineligibleReason?: string;
}

export interface BuildReviewRowsParams {
  mapped: MappedCsvRow[];
  uiYearMonth: string;
  defaultCategory: string;
  defaultPaymentMethod: string;
  existingExpenses: Expense[];
}

export function buildReviewRows(params: BuildReviewRowsParams): ImportReviewRow[] {
  const {
    mapped,
    uiYearMonth,
    defaultCategory,
    defaultPaymentMethod,
    existingExpenses,
  } = params;

  const fixed = existingExpenses.filter((e) => e.type === 'fixed');
  const installments = existingExpenses.filter((e) => e.type === 'installment');

  return mapped.map((row) => {
    const id = `csv-${row.sourceIndex}`;
    const money = parseMoneyValue(row.valueRaw);
    const uiYear = Number(uiYearMonth.slice(0, 4));
    const date = parseCsvDate(row.dateRaw, uiYear);
    const description = row.descriptionRaw.trim();

    if (!money || !date || !description) {
      return {
        id,
        sourceIndex: row.sourceIndex,
        selected: false,
        description: description || row.descriptionRaw,
        value: money?.amount ?? 0,
        date: date ?? '',
        yearMonth: uiYearMonth,
        csvYearMonth: date ? yearMonthFromDate(date) : uiYearMonth,
        monthResolution: 'pending',
        monthDiverges: false,
        category: defaultCategory,
        paymentMethod: defaultPaymentMethod,
        action: 'ignore',
        candidates: [],
        suggestionReason: 'Dados incompletos',
        repeatAllMonths: false,
        effectuate: false,
        ineligible: true,
        ineligibleReason: !description
          ? 'Descrição vazia'
          : !date
            ? 'Data inválida'
            : 'Valor inválido',
      } satisfies ImportReviewRow;
    }

    // Crédito / valor zero → inelegível como gasto
    if (money.isNegative || money.amount <= 0) {
      return {
        id,
        sourceIndex: row.sourceIndex,
        selected: false,
        description,
        value: money.amount,
        date,
        yearMonth: yearMonthFromDate(date),
        csvYearMonth: yearMonthFromDate(date),
        monthResolution: 'csv',
        monthDiverges: yearMonthFromDate(date) !== uiYearMonth,
        category: defaultCategory,
        paymentMethod: defaultPaymentMethod,
        action: 'ignore',
        candidates: [],
        suggestionReason: 'Crédito ou valor não positivo',
        repeatAllMonths: false,
        effectuate: false,
        ineligible: true,
        ineligibleReason: money.isNegative
          ? 'Parece crédito (valor negativo) — fora do escopo de gastos'
          : 'Valor deve ser maior que zero',
      } satisfies ImportReviewRow;
    }

    const csvYm = yearMonthFromDate(date);
    const monthDiverges = csvYm !== uiYearMonth;
    const installment = resolveInstallmentFromCsv(description, row.installmentRaw);
    const suggestion = suggestImportAction(
      {
        description,
        value: money.amount,
        paymentMethod: defaultPaymentMethod,
        installment,
      },
      fixed,
      installments
    );

    const action = suggestion.action;
    const selected = action !== 'review' && action !== 'ignore';

    return {
      id,
      sourceIndex: row.sourceIndex,
      selected,
      description,
      value: money.amount,
      date,
      yearMonth: monthDiverges ? uiYearMonth : csvYm,
      csvYearMonth: csvYm,
      monthResolution: monthDiverges ? 'pending' : 'csv',
      monthDiverges,
      category: defaultCategory,
      paymentMethod: defaultPaymentMethod,
      action,
      linkExpenseId:
        action === 'link_existing' ? suggestion.candidates[0]?.expense.id : undefined,
      candidates: suggestion.candidates,
      suggestionReason: suggestion.reason,
      currentInstallment: installment?.current,
      totalInstallments: installment?.total,
      repeatAllMonths: false,
      effectuate: false,
      ineligible: false,
    } satisfies ImportReviewRow;
  });
}

export function resolveRowMonth(
  row: ImportReviewRow,
  choice: 'csv' | 'ui',
  uiYearMonth: string
): ImportReviewRow {
  if (choice === 'csv') {
    return {
      ...row,
      monthResolution: 'csv',
      yearMonth: row.csvYearMonth,
      date: row.date,
    };
  }
  return {
    ...row,
    monthResolution: 'ui',
    yearMonth: uiYearMonth,
    date: row.date ? rebaseDateToYearMonth(row.date, uiYearMonth) : row.date,
  };
}
