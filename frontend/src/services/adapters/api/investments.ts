import { apiClient } from '@/api/client';
import type { Investment } from '@/types/domain';
import type { CreateInvestmentParams, UpdateInvestmentParams } from '@/services/params';

export async function getInvestments(
  _userId: string,
  yearMonth: string
): Promise<Investment[]> {
  return apiClient.get<Investment[]>('/api/investments', { month: yearMonth });
}

export async function createInvestment(params: CreateInvestmentParams): Promise<Investment> {
  const { userId: _userId, yearMonth, displayOrder: _displayOrder, ...investmentData } = params;
  return apiClient.post<Investment>('/api/investments', investmentData, { month: yearMonth });
}

export async function updateInvestment(params: UpdateInvestmentParams): Promise<void> {
  const { id, userId: _userId, updates, applyToAllMonths } = params;
  await apiClient.put(`/api/investments/${id}`, { ...updates, applyToAllMonths });
}

export async function deleteInvestment(
  id: string,
  _userId: string,
  applyToAllMonths = false
): Promise<void> {
  await apiClient.delete(`/api/investments/${id}`, {
    applyToAllMonths: applyToAllMonths.toString(),
  });
}

export async function reorderInvestments(
  investments: Investment[],
  _userId: string
): Promise<void> {
  const investmentIds = investments.map((investment) => investment.id);
  await apiClient.post('/api/investments/reorder', { investmentIds });
}
