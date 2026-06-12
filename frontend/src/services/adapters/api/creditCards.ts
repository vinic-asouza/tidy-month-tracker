import { apiClient } from '@/api/client';
import type { CreditCard, CreditCardMonthlyStatus } from '@/types/domain';
import type {
  CreateCreditCardParams,
  UpdateCreditCardParams,
} from '@/services/params';

export async function getCreditCards(_userId: string): Promise<CreditCard[]> {
  return apiClient.get<CreditCard[]>('/api/credit-cards');
}

export async function createCreditCard(params: CreateCreditCardParams): Promise<CreditCard> {
  const { userId: _userId, displayOrder: _displayOrder, ...cardData } = params;
  return apiClient.post<CreditCard>('/api/credit-cards', cardData);
}

export async function updateCreditCard(params: UpdateCreditCardParams): Promise<void> {
  const { id, userId: _userId, updates } = params;
  await apiClient.put(`/api/credit-cards/${id}`, updates);
}

export async function deleteCreditCard(id: string, _userId: string): Promise<void> {
  await apiClient.delete(`/api/credit-cards/${id}`);
}

export async function canDeleteCreditCard(
  _cardName: string,
  _userId: string
): Promise<boolean> {
  return true;
}

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

export async function getAllCardMonthlyStatuses(
  userId: string,
  yearMonth: string,
  creditCards: CreditCard[]
): Promise<Record<string, boolean>> {
  const statusMap: Record<string, boolean> = {};

  const statusPromises = creditCards.map(async (card) => {
    try {
      const status = await getCardMonthlyStatus(userId, card.id, yearMonth);
      return { cardId: card.id, paid: status?.paid || false };
    } catch {
      return { cardId: card.id, paid: false };
    }
  });

  const results = await Promise.all(statusPromises);
  results.forEach(({ cardId, paid }) => {
    statusMap[cardId] = paid;
  });

  return statusMap;
}

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
