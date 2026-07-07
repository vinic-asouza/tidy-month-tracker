import { apiClient } from '@/api/client';
import type { Income } from '@/types/domain';
import type { CreateIncomeParams, UpdateIncomeParams } from '@/services/params';

export async function getIncomes(_userId: string, yearMonth: string): Promise<Income[]> {
  return apiClient.get<Income[]>('/api/incomes', { month: yearMonth });
}

export async function createIncome(params: CreateIncomeParams): Promise<Income> {
  const { userId: _userId, yearMonth, displayOrder: _displayOrder, ...incomeData } = params;
  return apiClient.post<Income>('/api/incomes', incomeData, { month: yearMonth });
}

export async function createResgateIncome(
  params: import('../adapters/supabase/incomes').CreateResgateIncomeParams
): Promise<Income> {
  return createIncome({
    userId: params.userId,
    yearMonth: params.yearMonth,
    description: params.description,
    value: params.value,
    tag: 'Resgate de investimentos',
    date: params.date,
    received: true,
    accountId: params.accountId ?? undefined,
    sourceOperationId: params.sourceOperationId,
  });
}

export async function updateIncome(params: UpdateIncomeParams): Promise<void> {
  const { id, userId: _userId, updates, applyToAllMonths } = params;
  await apiClient.put(`/api/incomes/${id}`, { ...updates, applyToAllMonths });
}

export async function deleteIncome(
  id: string,
  _userId: string,
  applyToAllMonths = false
): Promise<void> {
  await apiClient.delete(`/api/incomes/${id}`, {
    applyToAllMonths: applyToAllMonths.toString(),
  });
}

export async function reorderIncomes(
  incomes: Income[],
  _userId: string,
  yearMonth: string
): Promise<void> {
  const incomeIds = incomes.map((income) => income.id);
  await apiClient.post('/api/incomes/reorder', { month: yearMonth, incomeIds });
}
