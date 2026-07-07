/**
 * Serviço de Receitas — facade que delega ao adaptador configurado.
 */

export type { CreateIncomeParams, UpdateIncomeParams } from './params';
export { RESGATE_INCOME_TAG } from '@/types/finance';
export type { CreateResgateIncomeParams } from './adapters/supabase/incomes';

import type { Income } from '@/types/domain';
import type { CreateIncomeParams, UpdateIncomeParams } from './params';
import { incomesAdapter } from './adapters/select';

export async function getIncomes(userId: string, yearMonth: string): Promise<Income[]> {
  return incomesAdapter().getIncomes(userId, yearMonth);
}

export async function createIncome(params: CreateIncomeParams): Promise<Income> {
  return incomesAdapter().createIncome(params);
}

export async function updateIncome(params: UpdateIncomeParams): Promise<void> {
  return incomesAdapter().updateIncome(params);
}

export async function deleteIncome(
  id: string,
  userId: string,
  applyToAllMonths = false
): Promise<void> {
  return incomesAdapter().deleteIncome(id, userId, applyToAllMonths);
}

export async function createResgateIncome(
  params: import('./adapters/supabase/incomes').CreateResgateIncomeParams
): Promise<Income> {
  return incomesAdapter().createResgateIncome(params);
}

export async function reorderIncomes(
  incomes: Income[],
  userId: string,
  yearMonth: string
): Promise<void> {
  return incomesAdapter().reorderIncomes(incomes, userId, yearMonth);
}
