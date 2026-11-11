/**
 * Exportação CSV linha a linha (DEV-187 / ADR-013).
 * UTF-8 com BOM e separador `;` — alinhado ao export anual.
 */

import type { CreditCard, Expense, Income, Investment } from '@/types/domain';
import { isValidYearMonth } from '@/utils/business/financialIntegrityConstraints';
import { formatYearMonth } from '@/utils/business/repeatMonths';
import { fetchMonthBundle } from '@/services/financeQueries';
import * as creditCardsService from '@/services/creditCards';

export type DataExportEntity =
  | 'incomes'
  | 'expenses'
  | 'investments'
  | 'credit_cards'
  | 'credit_card_monthly_status';

export interface DataExportIncomeRow extends Income {
  yearMonth: string;
}

export interface DataExportExpenseRow extends Expense {
  yearMonth: string;
  creditCardName: string;
}

export interface DataExportInvestmentRow extends Investment {
  yearMonth: string;
}

export interface DataExportCardStatusRow {
  id: string;
  creditCardId: string;
  creditCardName: string;
  yearMonth: string;
  paid: boolean;
}

export interface DataExportPayload {
  from: string;
  to: string;
  incomes: DataExportIncomeRow[];
  expenses: DataExportExpenseRow[];
  investments: DataExportInvestmentRow[];
  creditCards: CreditCard[];
  cardStatuses: DataExportCardStatusRow[];
}

const YEAR_MONTH_FULL =
  /^\d{4}-(0[1-9]|1[0-2])$/;

/** Máximo de meses no intervalo (evita loop acidental enorme). */
export const DATA_EXPORT_MAX_MONTHS = 120;

export function isValidExportYearMonth(yearMonth: string): boolean {
  return isValidYearMonth(yearMonth) && YEAR_MONTH_FULL.test(yearMonth);
}

export function listYearMonthsInRange(from: string, to: string): string[] {
  if (!isValidExportYearMonth(from) || !isValidExportYearMonth(to)) {
    throw new Error('Intervalo inválido: use YYYY-MM.');
  }
  if (from > to) {
    throw new Error('O mês inicial deve ser anterior ou igual ao final.');
  }

  const months: string[] = [];
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(5, 7));
  const endYear = Number(to.slice(0, 4));
  const endMonth = Number(to.slice(5, 7));

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(formatYearMonth(year, month));
    if (months.length > DATA_EXPORT_MAX_MONTHS) {
      throw new Error(`Intervalo máximo de ${DATA_EXPORT_MAX_MONTHS} meses.`);
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

export function dataExportFilenameBase(from: string, to: string, entity: DataExportEntity): string {
  return `finto-dados-${from}-${to}-${entity}`;
}

function escapeCell(value: string): string {
  if (/[;"\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function cell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return String(value);
  }
  return value;
}

function serializeTable(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCell).join(';')];
  for (const row of rows) {
    lines.push(row.map((value) => escapeCell(value)).join(';'));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function serializeIncomesCsv(rows: DataExportIncomeRow[]): string {
  return serializeTable(
    [
      'id',
      'year_month',
      'description',
      'value',
      'tag',
      'date',
      'received',
      'repeat_all_months',
      'base_income_id',
      'display_order',
      'created_at',
      'updated_at',
    ],
    rows.map((row) => [
      cell(row.id),
      cell(row.yearMonth),
      cell(row.description),
      cell(row.value),
      cell(row.tag),
      cell(row.date),
      cell(row.received),
      cell(row.repeatAllMonths ?? false),
      cell(row.baseIncomeId),
      '',
      cell(row.createdAt),
      '',
    ])
  );
}

export function serializeExpensesCsv(rows: DataExportExpenseRow[]): string {
  return serializeTable(
    [
      'id',
      'year_month',
      'type',
      'category',
      'description',
      'payment_method',
      'credit_card_id',
      'credit_card_name',
      'value',
      'paid',
      'date',
      'repeat_all_months',
      'base_expense_id',
      'current_installment',
      'total_installments',
      'display_order',
      'created_at',
      'updated_at',
    ],
    rows.map((row) => [
      cell(row.id),
      cell(row.yearMonth),
      cell(row.type),
      cell(row.category),
      cell(row.description),
      cell(row.paymentMethod),
      cell(row.creditCardId),
      cell(row.creditCardName),
      cell(row.value),
      cell(row.paid),
      cell(row.date),
      cell(row.repeatAllMonths ?? false),
      cell(row.baseExpenseId),
      cell(row.currentInstallment),
      cell(row.totalInstallments),
      '',
      cell(row.createdAt),
      '',
    ])
  );
}

export function serializeInvestmentsCsv(rows: DataExportInvestmentRow[]): string {
  return serializeTable(
    [
      'id',
      'year_month',
      'description',
      'value',
      'tag',
      'date',
      'invested',
      'repeat_all_months',
      'base_investment_id',
      'display_order',
      'created_at',
      'updated_at',
    ],
    rows.map((row) => [
      cell(row.id),
      cell(row.yearMonth),
      cell(row.description),
      cell(row.value),
      cell(row.tag),
      cell(row.date),
      cell(row.invested),
      cell(row.repeatAllMonths ?? false),
      cell(row.baseInvestmentId),
      '',
      cell(row.createdAt),
      '',
    ])
  );
}

export function serializeCreditCardsCsv(cards: CreditCard[]): string {
  return serializeTable(
    [
      'id',
      'name',
      'color',
      'paid',
      'due_day',
      'credit_limit',
      'display_order',
      'hidden',
      'created_at',
      'updated_at',
    ],
    cards.map((card) => [
      cell(card.id),
      cell(card.name),
      cell(card.color),
      cell(card.paid),
      cell(card.dueDay),
      cell(card.creditLimit),
      '',
      cell(card.hidden ?? false),
      '',
      '',
    ])
  );
}

export function serializeCardStatusesCsv(rows: DataExportCardStatusRow[]): string {
  return serializeTable(
    ['id', 'credit_card_id', 'credit_card_name', 'year_month', 'paid', 'created_at', 'updated_at'],
    rows.map((row) => [
      cell(row.id),
      cell(row.creditCardId),
      cell(row.creditCardName),
      cell(row.yearMonth),
      cell(row.paid),
      '',
      '',
    ])
  );
}

export function buildDataExportFiles(payload: DataExportPayload): Array<{
  entity: DataExportEntity;
  filename: string;
  content: string;
}> {
  const { from, to } = payload;
  return [
    {
      entity: 'incomes',
      filename: `${dataExportFilenameBase(from, to, 'incomes')}.csv`,
      content: serializeIncomesCsv(payload.incomes),
    },
    {
      entity: 'expenses',
      filename: `${dataExportFilenameBase(from, to, 'expenses')}.csv`,
      content: serializeExpensesCsv(payload.expenses),
    },
    {
      entity: 'investments',
      filename: `${dataExportFilenameBase(from, to, 'investments')}.csv`,
      content: serializeInvestmentsCsv(payload.investments),
    },
    {
      entity: 'credit_cards',
      filename: `${dataExportFilenameBase(from, to, 'credit_cards')}.csv`,
      content: serializeCreditCardsCsv(payload.creditCards),
    },
    {
      entity: 'credit_card_monthly_status',
      filename: `${dataExportFilenameBase(from, to, 'credit_card_monthly_status')}.csv`,
      content: serializeCardStatusesCsv(payload.cardStatuses),
    },
  ];
}

export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function downloadDataExportFiles(
  files: ReturnType<typeof buildDataExportFiles>,
  gapMs = 350
): Promise<void> {
  for (let index = 0; index < files.length; index += 1) {
    downloadCsvFile(files[index].filename, files[index].content);
    if (index < files.length - 1) await delay(gapMs);
  }
}

export async function collectDataExportPayload(
  userId: string,
  from: string,
  to: string
): Promise<DataExportPayload> {
  const months = listYearMonthsInRange(from, to);
  const creditCards = await creditCardsService.getCreditCards(userId);
  const cardNameById = new Map(creditCards.map((card) => [card.id, card.name]));

  const incomes: DataExportIncomeRow[] = [];
  const expenses: DataExportExpenseRow[] = [];
  const investments: DataExportInvestmentRow[] = [];
  const cardStatuses: DataExportCardStatusRow[] = [];

  for (const yearMonth of months) {
    const bundle = await fetchMonthBundle(userId, yearMonth, creditCards);

    for (const income of bundle.incomes) {
      incomes.push({ ...income, yearMonth });
    }

    for (const expense of bundle.expenses) {
      expenses.push({
        ...expense,
        yearMonth,
        creditCardName: expense.creditCardId
          ? (cardNameById.get(expense.creditCardId) ?? '')
          : '',
      });
    }

    for (const investment of bundle.investments) {
      investments.push({ ...investment, yearMonth });
    }

    for (const card of creditCards) {
      cardStatuses.push({
        id: `${card.id}|${yearMonth}`,
        creditCardId: card.id,
        creditCardName: card.name,
        yearMonth,
        paid: bundle.cardMonthlyStatuses?.[card.id] ?? false,
      });
    }
  }

  return {
    from,
    to,
    incomes,
    expenses,
    investments,
    creditCards,
    cardStatuses,
  };
}
