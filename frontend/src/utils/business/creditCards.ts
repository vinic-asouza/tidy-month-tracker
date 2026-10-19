import type { CreditCard, Expense, MonthData } from '@/types/domain';

export const CREDIT_CARD_DUE_ALERT_DAYS = 3;

export type CreditCardDueAlertKind = 'approaching' | 'due_today' | 'overdue';

export interface CreditCardDueAlertContext {
  kind: CreditCardDueAlertKind;
  message: string;
  daysUntilDue?: number;
}

export interface CreditCardInvoiceSummary {
  total: number;
  count: number;
}

export interface InvoiceCategoryGroup {
  category: string;
  total: number;
  count: number;
}

function sortExpensesByDate(a: Expense, b: Expense): number {
  if (!a.date && !b.date) return a.description.localeCompare(b.description, 'pt-BR');
  if (!a.date) return 1;
  if (!b.date) return -1;
  const cmp = b.date.localeCompare(a.date);
  if (cmp !== 0) return cmp;
  return a.description.localeCompare(b.description, 'pt-BR');
}

/** Referência mínima de cartão para associação com gastos (DEV-144). */
export type CreditCardRef = Pick<CreditCard, 'id' | 'name'>;

/**
 * Gasto pertence ao cartão?
 * Fonte de verdade: `creditCardId`. Fallback por nome apenas para registros legados
 * (sem `creditCardId`), preservando o comportamento anterior ao DEV-144.
 */
export function isExpenseOfCard(expense: Expense, card: CreditCardRef): boolean {
  if (expense.creditCardId) return expense.creditCardId === card.id;
  return expense.paymentMethod === card.name;
}

/** Resolve o cartão do gasto: por `creditCardId`; fallback por nome para legados. */
export function getExpenseCreditCard(
  expense: Expense,
  creditCards: CreditCard[]
): CreditCard | undefined {
  if (expense.creditCardId) {
    return creditCards.find((c) => c.id === expense.creditCardId);
  }
  return creditCards.find((c) => c.name === expense.paymentMethod);
}

export function getCreditCardInvoiceExpenses(
  card: CreditCardRef,
  monthData: MonthData
): Expense[] {
  return monthData.expenses
    .filter((e) => isExpenseOfCard(e, card))
    .sort(sortExpensesByDate);
}

export function getCreditCardInvoiceSummary(
  card: CreditCardRef,
  monthData: MonthData
): CreditCardInvoiceSummary {
  const expenses = getCreditCardInvoiceExpenses(card, monthData);
  return {
    total: expenses.reduce((sum, e) => sum + e.value, 0),
    count: expenses.length,
  };
}

export function isCreditCardExpense(expense: Expense, creditCards: CreditCard[]): boolean {
  return getExpenseCreditCard(expense, creditCards) !== undefined;
}

export function getCreditCardByName(
  cardName: string,
  creditCards: CreditCard[]
): CreditCard | undefined {
  return creditCards.find((c) => c.name === cardName);
}

export function getCreditCardInvoicePaymentAmount(
  card: CreditCardRef,
  monthData: MonthData
): number {
  return getCreditCardInvoiceSummary(card, monthData).total;
}

export function getCreditCardUsagePercent(
  invoiceTotal: number,
  creditLimit: number | null | undefined
): number | null {
  if (creditLimit == null || creditLimit <= 0) return null;
  return Math.round((invoiceTotal / creditLimit) * 100);
}

export function groupInvoiceExpensesByCategory(expenses: Expense[]): InvoiceCategoryGroup[] {
  const map = new Map<string, { total: number; count: number }>();

  for (const expense of expenses) {
    const category = expense.category || 'Outros';
    const prev = map.get(category) ?? { total: 0, count: 0 };
    map.set(category, { total: prev.total + expense.value, count: prev.count + 1 });
  }

  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total);
}

export function getEffectiveDueDay(dueDay: number, yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(dueDay, lastDay);
}

export function getCurrentYearMonth(today: Date = new Date()): string {
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getCreditCardDueAlertContext(
  dueDay: number | null | undefined,
  currentMonth: string,
  isPaid: boolean,
  today: Date = new Date()
): CreditCardDueAlertContext | null {
  if (dueDay == null || isPaid) return null;
  if (currentMonth !== getCurrentYearMonth(today)) return null;

  const effectiveDueDay = getEffectiveDueDay(dueDay, currentMonth);
  const todayDay = today.getDate();
  const diff = effectiveDueDay - todayDay;

  if (diff < 0) {
    return { kind: 'overdue', message: 'Fatura vencida' };
  }
  if (diff === 0) {
    return { kind: 'due_today', message: 'Vence hoje' };
  }
  if (diff <= CREDIT_CARD_DUE_ALERT_DAYS) {
    return { kind: 'approaching', message: `Vence em ${diff} dias`, daysUntilDue: diff };
  }

  return null;
}

/** Dias até o vencimento efetivo; null se sem dueDay ou mês diferente do atual. */
export function getDaysUntilDueForSort(
  dueDay: number | null | undefined,
  currentMonth: string,
  today: Date = new Date()
): number | null {
  if (dueDay == null) return null;
  if (currentMonth !== getCurrentYearMonth(today)) return null;
  return getEffectiveDueDay(dueDay, currentMonth) - today.getDate();
}

/**
 * Futuro: retornará false quando enforceLimit=true e fatura+valor > limite.
 * v1: nunca bloqueia lançamentos.
 */
export function canAddExpenseToCreditCard(
  _card: CreditCard,
  _invoiceTotal: number,
  _newExpenseValue: number,
  _options?: { enforceLimit?: boolean }
): boolean {
  return true;
}
