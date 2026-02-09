/**
 * Serviço de Investimentos (Investments)
 * 
 * Usa API REST para operações de investimentos
 */

import { apiClient } from '@/api/client';
import type { Investment } from '@/types/domain';

export interface CreateInvestmentParams extends Omit<Investment, 'id'> {
  userId?: string; // Mantido para compatibilidade, mas não usado (backend obtém do token)
  yearMonth: string;
  displayOrder?: number; // Mantido para compatibilidade, mas não usado (backend calcula)
}

export interface UpdateInvestmentParams {
  id: string;
  userId?: string; // Mantido para compatibilidade, mas não usado (backend obtém do token)
  updates: Partial<Omit<Investment, 'id'>>;
  applyToAllMonths?: boolean;
}

/**
 * Busca investimentos de um mês específico
 */
export async function getInvestments(_userId: string, yearMonth: string): Promise<Investment[]> {
  return apiClient.get<Investment[]>('/api/investments', { month: yearMonth });
}

/**
 * Cria um novo investimento
 */
export async function createInvestment(params: CreateInvestmentParams): Promise<Investment> {
  const { userId: _userId, yearMonth, displayOrder: _displayOrder, ...investmentData } = params;
  return apiClient.post<Investment>(
    '/api/investments',
    investmentData,
    { month: yearMonth }
  );
}

/**
 * Atualiza um investimento existente
 */
export async function updateInvestment(params: UpdateInvestmentParams): Promise<void> {
  const { id, userId: _userId, updates, applyToAllMonths } = params;
  await apiClient.put(`/api/investments/${id}`, { ...updates, applyToAllMonths });
}

/**
 * Deleta um investimento
 */
export async function deleteInvestment(id: string, _userId: string, applyToAllMonths = false): Promise<void> {
  await apiClient.delete(`/api/investments/${id}`, { applyToAllMonths: applyToAllMonths.toString() });
}

/**
 * Reordena investimentos atualizando display_order
 */
export async function reorderInvestments(
  investments: Investment[],
  _userId: string
): Promise<void> {
  const investmentIds = investments.map((investment) => investment.id);
  await apiClient.post('/api/investments/reorder', { investmentIds });
}
