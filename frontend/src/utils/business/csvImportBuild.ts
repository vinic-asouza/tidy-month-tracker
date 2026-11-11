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
import {
  findDuplicateExpense,
  formatDuplicateSummary,
} from './duplicateMatch';

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
  /** Usuário editou a categoria manualmente após a última sync automática. */
  categoryManualOverride: boolean;
  paymentMethod: string;
  /** DEV-144: cartão associado (origem cartão); null para conta/Pix/etc. */
  creditCardId: string | null;
  action: SuggestedImportAction;
  linkExpenseId?: string;
  candidates: MatchCandidate[];
  suggestionReason: string;
  currentInstallment?: number;
  totalInstallments?: number;
  repeatAllMonths: boolean;
  effectuate: boolean;
  /** Linha inelegível (crédito / parse inválido) */
  ineligible: boolean;
  ineligibleReason?: string;
  /** DEV-184: variável com match 4-campos no mês */
  possibleDuplicateOfId?: string;
  possibleDuplicateSummary?: string;
  duplicateConfirmed: boolean;
}

export interface BuildReviewRowsParams {
  mapped: MappedCsvRow[];
  uiYearMonth: string;
  defaultCategory: string;
  defaultPaymentMethod: string;
  /** Cartão da origem (quando importando fatura); omitir/null para conta. */
  defaultCreditCardId?: string | null;
  existingExpenses: Expense[];
}

function clearDuplicateHint(row: ImportReviewRow): ImportReviewRow {
  return {
    ...row,
    possibleDuplicateOfId: undefined,
    possibleDuplicateSummary: undefined,
    duplicateConfirmed: false,
  };
}

/** Recalcula flag de possível duplicata (só create_variable). */
export function withDuplicateHint(
  row: ImportReviewRow,
  existingExpenses: Expense[]
): ImportReviewRow {
  if (row.ineligible || row.action !== 'create_variable') {
    return clearDuplicateHint(row);
  }

  const dup = findDuplicateExpense(
    {
      description: row.description,
      category: row.category,
      value: row.value,
      date: row.date,
    },
    existingExpenses,
    { types: ['variable'] }
  );

  if (!dup) {
    return clearDuplicateHint(row);
  }

  const sameTarget = row.possibleDuplicateOfId === dup.id;
  return {
    ...row,
    possibleDuplicateOfId: dup.id,
    possibleDuplicateSummary: formatDuplicateSummary({
      description: dup.description,
      label: dup.category,
      value: dup.value,
      date: dup.date,
    }),
    duplicateConfirmed: sameTarget ? row.duplicateConfirmed : false,
  };
}

/**
 * Aplica patch de revisão sincronizando categoria na associação (DEV-182)
 * e recalculando possível duplicata (DEV-184).
 */
export function patchImportReviewRow(
  row: ImportReviewRow,
  patch: Partial<ImportReviewRow>,
  opts: { defaultCategory: string; existingExpenses: Expense[] }
): ImportReviewRow {
  let next: ImportReviewRow = { ...row, ...patch };

  if (patch.category !== undefined && patch.category !== row.category) {
    next.categoryManualOverride = true;
  }

  const actionChanged = patch.action !== undefined && patch.action !== row.action;
  const linkChanged =
    patch.linkExpenseId !== undefined && patch.linkExpenseId !== row.linkExpenseId;

  if (actionChanged && patch.action === 'link_existing') {
    if (!next.linkExpenseId && next.candidates[0]) {
      next.linkExpenseId = next.candidates[0].expense.id;
    }
  }

  if (
    (actionChanged || linkChanged) &&
    next.action === 'link_existing' &&
    next.linkExpenseId &&
    !next.categoryManualOverride
  ) {
    const linked =
      next.candidates.find((c) => c.expense.id === next.linkExpenseId)?.expense ??
      opts.existingExpenses.find((e) => e.id === next.linkExpenseId);
    if (linked) {
      next.category = linked.category;
    }
  }

  if (
    actionChanged &&
    row.action === 'link_existing' &&
    patch.action !== 'link_existing' &&
    !next.categoryManualOverride
  ) {
    next.category = opts.defaultCategory;
  }

  // Campos que afetam fingerprint: reset implícito via withDuplicateHint se o alvo mudar
  return withDuplicateHint(next, opts.existingExpenses);
}

export function buildReviewRows(params: BuildReviewRowsParams): ImportReviewRow[] {
  const {
    mapped,
    uiYearMonth,
    defaultCategory,
    defaultPaymentMethod,
    defaultCreditCardId = null,
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
        categoryManualOverride: false,
        paymentMethod: defaultPaymentMethod,
        creditCardId: defaultCreditCardId,
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
        duplicateConfirmed: false,
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
        categoryManualOverride: false,
        paymentMethod: defaultPaymentMethod,
        creditCardId: defaultCreditCardId,
        action: 'ignore',
        candidates: [],
        suggestionReason: 'Crédito ou valor não positivo',
        repeatAllMonths: false,
        effectuate: false,
        ineligible: true,
        ineligibleReason: money.isNegative
          ? 'Parece crédito (valor negativo) — fora do escopo de gastos'
          : 'Valor deve ser maior que zero',
        duplicateConfirmed: false,
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
    const linkExpenseId =
      action === 'link_existing' ? suggestion.candidates[0]?.expense.id : undefined;
    const linkedCategory =
      action === 'link_existing' ? suggestion.candidates[0]?.expense.category : undefined;

    const base: ImportReviewRow = {
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
      category: linkedCategory ?? defaultCategory,
      categoryManualOverride: false,
      paymentMethod: defaultPaymentMethod,
      creditCardId: defaultCreditCardId,
      action,
      linkExpenseId,
      candidates: suggestion.candidates,
      suggestionReason: suggestion.reason,
      currentInstallment: installment?.current,
      totalInstallments: installment?.total,
      repeatAllMonths: false,
      effectuate: false,
      ineligible: false,
      duplicateConfirmed: false,
    };

    return withDuplicateHint(base, existingExpenses);
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
