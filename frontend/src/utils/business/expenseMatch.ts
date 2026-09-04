/**
 * Scoring de candidatos a gasto fixo / série parcelada para importação CSV.
 */

import type { Expense } from '@/types/domain';
import { normalizeDescription } from './csvNormalize';

export interface MatchCandidate {
  expense: Expense;
  score: number;
  kind: 'fixed' | 'installment';
}

function valueClose(a: number, b: number, tolerance = 0.01): boolean {
  return Math.abs(a - b) <= tolerance;
}

function descriptionScore(a: string, b: string): number {
  const na = normalizeDescription(a);
  const nb = normalizeDescription(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.75;
  // token overlap simples
  const ta = new Set(na.split(' ').filter(Boolean));
  const tb = new Set(nb.split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const union = new Set([...ta, ...tb]).size;
  return inter / union;
}

export interface RowMatchInput {
  description: string;
  value: number;
  paymentMethod?: string;
  installment?: { current: number; total: number } | null;
}

/**
 * Pontua fixos do mês alvo.
 */
export function scoreFixedCandidates(
  row: RowMatchInput,
  fixedInMonth: Expense[]
): MatchCandidate[] {
  return fixedInMonth
    .filter((e) => e.type === 'fixed')
    .map((expense) => {
      let score = 0;
      const desc = descriptionScore(row.description, expense.description);
      score += desc * 0.6;
      if (valueClose(row.value, expense.value)) score += 0.3;
      else if (Math.abs(row.value - expense.value) / Math.max(row.value, expense.value) < 0.05) {
        score += 0.15;
      }
      if (
        row.paymentMethod &&
        expense.paymentMethod &&
        row.paymentMethod.toLowerCase() === expense.paymentMethod.toLowerCase()
      ) {
        score += 0.1;
      }
      return { expense, score, kind: 'fixed' as const };
    })
    .filter((c) => c.score >= 0.35)
    .sort((a, b) => b.score - a.score);
}

/**
 * Pontua linhas parceladas já existentes (mês carregado / série visível).
 */
export function scoreInstallmentCandidates(
  row: RowMatchInput,
  installments: Expense[]
): MatchCandidate[] {
  return installments
    .filter((e) => e.type === 'installment')
    .map((expense) => {
      let score = 0;
      const desc = descriptionScore(row.description, expense.description);
      score += desc * 0.55;
      if (valueClose(row.value, expense.value)) score += 0.25;
      if (
        row.installment &&
        expense.totalInstallments != null &&
        row.installment.total === expense.totalInstallments
      ) {
        score += 0.15;
      }
      if (
        row.installment &&
        expense.currentInstallment != null &&
        row.installment.current === expense.currentInstallment
      ) {
        score += 0.05;
      }
      return { expense, score, kind: 'installment' as const };
    })
    .filter((c) => c.score >= 0.35)
    .sort((a, b) => b.score - a.score);
}

export type SuggestedImportAction =
  | 'create_variable'
  | 'create_installment'
  | 'create_fixed'
  | 'link_existing'
  | 'ignore'
  | 'review';

export interface ActionSuggestion {
  action: SuggestedImportAction;
  candidates: MatchCandidate[];
  reason: string;
}

/**
 * Decide sugestão inicial (nunca auto-aplica vínculo sem UI confirmar).
 * - crédito / inválido → ignore (tratado fora)
 * - candidatos empatados → review
 * - top candidato forte → link_existing (sugestão)
 * - parcela detectada sem série → create_installment
 * - senão → create_variable
 */
export function suggestImportAction(
  row: RowMatchInput,
  fixedInMonth: Expense[],
  installments: Expense[]
): ActionSuggestion {
  const fixed = scoreFixedCandidates(row, fixedInMonth);
  const inst = scoreInstallmentCandidates(row, installments);
  const candidates = [...fixed, ...inst].sort((a, b) => b.score - a.score);

  if (candidates.length >= 2 && Math.abs(candidates[0].score - candidates[1].score) < 0.08) {
    return {
      action: 'review',
      candidates: candidates.slice(0, 5),
      reason: 'Mais de um candidato com score semelhante',
    };
  }

  if (candidates[0] && candidates[0].score >= 0.7) {
    return {
      action: 'link_existing',
      candidates: candidates.slice(0, 5),
      reason: 'Possível duplicata de lançamento existente',
    };
  }

  if (row.installment) {
    return {
      action: 'create_installment',
      candidates: candidates.slice(0, 5),
      reason: 'Padrão de parcela detectado na descrição',
    };
  }

  if (candidates[0] && candidates[0].score >= 0.45) {
    return {
      action: 'review',
      candidates: candidates.slice(0, 5),
      reason: 'Há candidatos — confirme antes de criar novo',
    };
  }

  return {
    action: 'create_variable',
    candidates: [],
    reason: 'Sem match relevante',
  };
}
