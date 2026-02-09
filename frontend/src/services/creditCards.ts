/**
 * Serviço de Cartões de Crédito (Credit Cards)
 * 
 * Usa API REST para operações de cartões de crédito
 */

import { apiClient } from '@/api/client';
import type { CreditCard, CreditCardMonthlyStatus } from '@/types/domain';

export interface CreateCreditCardParams extends Omit<CreditCard, 'id'> {
  userId?: string; // Mantido para compatibilidade, mas não usado (backend obtém do token)
  displayOrder?: number; // Mantido para compatibilidade, mas não usado (backend calcula)
}

export interface UpdateCreditCardParams {
  id: string;
  userId?: string; // Mantido para compatibilidade, mas não usado (backend obtém do token)
  updates: Partial<Omit<CreditCard, 'id'>>;
}

/**
 * Busca todos os cartões de crédito do usuário (globais)
 */
export async function getCreditCards(_userId: string): Promise<CreditCard[]> {
  return apiClient.get<CreditCard[]>('/api/credit-cards');
}

/**
 * Cria um novo cartão de crédito
 */
export async function createCreditCard(params: CreateCreditCardParams): Promise<CreditCard> {
  const { userId: _userId, displayOrder: _displayOrder, ...cardData } = params;
  return apiClient.post<CreditCard>('/api/credit-cards', cardData);
}

/**
 * Atualiza um cartão de crédito existente
 */
export async function updateCreditCard(params: UpdateCreditCardParams): Promise<void> {
  const { id, userId: _userId, updates } = params;
  await apiClient.put(`/api/credit-cards/${id}`, updates);
}

/**
 * Deleta um cartão de crédito
 */
export async function deleteCreditCard(id: string, _userId: string): Promise<void> {
  await apiClient.delete(`/api/credit-cards/${id}`);
}

/**
 * Verifica se um cartão pode ser deletado (não tem despesas associadas)
 * 
 * Nota: Esta verificação precisa ser feita no frontend por enquanto,
 * pois não há endpoint específico no backend. Pode ser melhorado no futuro.
 */
export async function canDeleteCreditCard(
  _cardName: string,
  _userId: string
): Promise<boolean> {
  // Por enquanto, retorna true e deixa o backend validar
  // Isso pode ser melhorado com um endpoint específico no futuro
  return true;
}

/**
 * Busca o status mensal de um cartão
 */
export async function getCardMonthlyStatus(
  _userId: string,
  creditCardId: string,
  yearMonth: string
): Promise<CreditCardMonthlyStatus | null> {
  const result = await apiClient.get<{ paid: boolean }>(
    `/api/credit-cards/${creditCardId}/status`,
    { month: yearMonth }
  );

  return {
    creditCardId,
    yearMonth,
    paid: result.paid,
  };
}

/**
 * Busca todos os status mensais de cartões para um mês específico
 * 
 * Nota: Por enquanto busca individualmente cada cartão.
 * Pode ser otimizado no futuro com um endpoint específico.
 */
export async function getAllCardMonthlyStatuses(
  _userId: string,
  yearMonth: string,
  creditCards: CreditCard[]
): Promise<Record<string, boolean>> {
  const statusMap: Record<string, boolean> = {};

  // Busca status de cada cartão
  for (const card of creditCards) {
    try {
      const status = await getCardMonthlyStatus(_userId, card.id, yearMonth);
      if (status) {
        statusMap[card.id] = status.paid;
      }
    } catch (error) {
      console.error(`Error fetching status for card ${card.id}:`, error);
      statusMap[card.id] = false;
    }
  }

  return statusMap;
}

/**
 * Atualiza ou cria o status mensal de um cartão
 */
export async function setCardMonthlyStatus(
  _userId: string,
  creditCardId: string,
  yearMonth: string,
  paid: boolean
): Promise<void> {
  await apiClient.put(`/api/credit-cards/${creditCardId}/status`, {
    month: yearMonth,
    paid,
  });
}
