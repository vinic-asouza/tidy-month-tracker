/**
 * Espelha as CHECKs DEV-143 no Postgres (expenses/incomes/investments).
 * Validação de UX continua nos forms; isto documenta/rede de teste do contrato do banco.
 * Listas dinâmicas (categoria ∈ settings, método ∈ defaults∪cards) permanecem só na app.
 */

export const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function isPositiveValue(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isValidYearMonth(yearMonth: string): boolean {
  return YEAR_MONTH_PATTERN.test(yearMonth);
}

export function isInstallmentCoherent(params: {
  type: string;
  currentInstallment?: number | null;
  totalInstallments?: number | null;
}): boolean {
  if (params.type !== 'installment') return true;
  const current = params.currentInstallment;
  const total = params.totalInstallments;
  if (current == null || total == null) return false;
  if (current < 1 || total < 1) return false;
  return current <= total;
}
