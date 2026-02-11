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

  // Busca status de todos os cartões em paralelo para melhor performance
  const statusPromises = creditCards.map(async (card) => {
    try {
      const status = await getCardMonthlyStatus(_userId, card.id, yearMonth);
      return { cardId: card.id, paid: status?.paid || false };
    } catch (_error) {
      // Em caso de erro ao buscar status de um cartão, assumimos "não pago" para o MVP.
      return { cardId: card.id, paid: false };
    }
  });

  // Aguarda todas as requisições em paralelo
  const results = await Promise.all(statusPromises);
  
  // Preenche o mapa de status
  results.forEach(({ cardId, paid }) => {
    statusMap[cardId] = paid;
  });

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
