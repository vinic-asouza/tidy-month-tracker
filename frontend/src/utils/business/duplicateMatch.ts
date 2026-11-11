/**
 * Detecção conservadora de possível duplicata no mesmo mês (DEV-184).
 * Quatro campos: descrição normalizada + categoria/tag + valor (±0,01) + data.
 */

import type { Expense, Income, Investment } from '@/types/domain';
import { normalizeDescription } from './csvNormalize';

export function valueClose(a: number, b: number, tolerance = 0.01): boolean {
  return Math.abs(a - b) <= tolerance;
}

export function labelsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? '').trim() === (b ?? '').trim();
}

export function descriptionsMatch(a: string, b: string): boolean {
  const na = normalizeDescription(a);
  const nb = normalizeDescription(b);
  return Boolean(na) && na === nb;
}

export interface DuplicateFingerprint {
  description: string;
  /** Gasto: category; entrada/investimento: tag */
  label: string;
  value: number;
  date: string | null | undefined;
}

export function matchesDuplicateFingerprint(
  candidate: DuplicateFingerprint,
  existing: DuplicateFingerprint
): boolean {
  if (!candidate.date || !existing.date) return false;
  if (candidate.date !== existing.date) return false;
  if (!descriptionsMatch(candidate.description, existing.description)) return false;
  if (!labelsEqual(candidate.label, existing.label)) return false;
  if (!valueClose(candidate.value, existing.value)) return false;
  return true;
}

export interface FindDuplicateOptions {
  excludeId?: string;
}

export function findDuplicateExpense(
  candidate: {
    description: string;
    category: string;
    value: number;
    date: string | null | undefined;
  },
  expenses: Expense[],
  options: FindDuplicateOptions & { types?: Array<Expense['type']> } = {}
): Expense | null {
  const types = options.types ?? ['variable'];
  const fp: DuplicateFingerprint = {
    description: candidate.description,
    label: candidate.category,
    value: candidate.value,
    date: candidate.date,
  };

  for (const expense of expenses) {
    if (options.excludeId && expense.id === options.excludeId) continue;
    if (!types.includes(expense.type)) continue;
    if (
      matchesDuplicateFingerprint(fp, {
        description: expense.description,
        label: expense.category,
        value: expense.value,
        date: expense.date,
      })
    ) {
      return expense;
    }
  }
  return null;
}

export function findDuplicateIncome(
  candidate: {
    description: string;
    tag: string;
    value: number;
    date: string | null | undefined;
  },
  incomes: Income[],
  options: FindDuplicateOptions = {}
): Income | null {
  const fp: DuplicateFingerprint = {
    description: candidate.description,
    label: candidate.tag,
    value: candidate.value,
    date: candidate.date,
  };

  for (const income of incomes) {
    if (options.excludeId && income.id === options.excludeId) continue;
    if (
      matchesDuplicateFingerprint(fp, {
        description: income.description,
        label: income.tag,
        value: income.value,
        date: income.date,
      })
    ) {
      return income;
    }
  }
  return null;
}

export function findDuplicateInvestment(
  candidate: {
    description: string;
    tag: string;
    value: number;
    date: string | null | undefined;
  },
  investments: Investment[],
  options: FindDuplicateOptions = {}
): Investment | null {
  const fp: DuplicateFingerprint = {
    description: candidate.description,
    label: candidate.tag,
    value: candidate.value,
    date: candidate.date,
  };

  for (const investment of investments) {
    if (options.excludeId && investment.id === options.excludeId) continue;
    if (
      matchesDuplicateFingerprint(fp, {
        description: investment.description,
        label: investment.tag,
        value: investment.value,
        date: investment.date,
      })
    ) {
      return investment;
    }
  }
  return null;
}

export function formatDuplicateSummary(item: {
  description: string;
  label: string;
  value: number;
  date: string | null | undefined;
}): string {
  const value = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(item.value);
  const date = item.date ?? '—';
  return `${item.description} · ${item.label || '—'} · ${value} · ${date}`;
}
