/**
 * Serviço de Receitas (Incomes)
 * 
 * Usa API REST para operações de receitas
 */

import { apiClient } from '@/api/client';
import type { Income } from '@/types/domain';

export interface CreateIncomeParams extends Omit<Income, 'id'> {
  userId?: string; // Mantido para compatibilidade, mas não usado (backend obtém do token)
  yearMonth: string;
  displayOrder?: number; // Mantido para compatibilidade, mas não usado (backend calcula)
}

export interface UpdateIncomeParams {
  id: string;
  userId?: string; // Mantido para compatibilidade, mas não usado (backend obtém do token)
  updates: Partial<Omit<Income, 'id'>>;
  applyToAllMonths?: boolean;
}

/**
 * Busca receitas de um mês específico
 */
export async function getIncomes(_userId: string, yearMonth: string): Promise<Income[]> {
  return apiClient.get<Income[]>('/api/incomes', { month: yearMonth });
}

/**
 * Cria uma nova receita
 */
export async function createIncome(params: CreateIncomeParams): Promise<Income> {
  const { userId: _userId, yearMonth, displayOrder: _displayOrder, ...incomeData } = params;
  return apiClient.post<Income>(
    '/api/incomes',
    incomeData,
    { month: yearMonth }
  );
}

/**
 * Atualiza uma receita existente
 */
export async function updateIncome(params: UpdateIncomeParams): Promise<void> {
  const { id, userId: _userId, updates, applyToAllMonths } = params;
  await apiClient.put(`/api/incomes/${id}`, { ...updates, applyToAllMonths });
}

/**
 * Deleta uma receita
 */
export async function deleteIncome(id: string, _userId: string, applyToAllMonths = false): Promise<void> {
  await apiClient.delete(`/api/incomes/${id}`, { applyToAllMonths: applyToAllMonths.toString() });
}

/**
 * Reordena receitas atualizando display_order
 */
export async function reorderIncomes(
  incomes: Income[],
  _userId: string,
  yearMonth: string
): Promise<void> {
  const incomeIds = incomes.map((income) => income.id);
  await apiClient.post('/api/incomes/reorder', {
    month: yearMonth,
    incomeIds,
  });
}
