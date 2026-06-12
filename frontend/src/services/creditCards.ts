/**
 * Serviço de Cartões de Crédito — facade que delega ao adaptador configurado.
 */

export type { CreateCreditCardParams, UpdateCreditCardParams } from './params';

import type { CreditCard } from '@/types/domain';
import type { CreateCreditCardParams, UpdateCreditCardParams } from './params';
import { creditCardsAdapter } from './adapters/select';

export async function getCreditCards(userId: string): Promise<CreditCard[]> {
  return creditCardsAdapter().getCreditCards(userId);
}

export async function createCreditCard(params: CreateCreditCardParams): Promise<CreditCard> {
  return creditCardsAdapter().createCreditCard(params);
}

export async function updateCreditCard(params: UpdateCreditCardParams): Promise<void> {
  return creditCardsAdapter().updateCreditCard(params);
}

export async function deleteCreditCard(id: string, userId: string): Promise<void> {
  return creditCardsAdapter().deleteCreditCard(id, userId);
}

export async function canDeleteCreditCard(
  cardName: string,
  userId: string
): Promise<boolean> {
  return creditCardsAdapter().canDeleteCreditCard(cardName, userId);
}

export async function getCardMonthlyStatus(
  userId: string,
  creditCardId: string,
  yearMonth: string
) {
  return creditCardsAdapter().getCardMonthlyStatus(userId, creditCardId, yearMonth);
}

export async function getAllCardMonthlyStatuses(
  userId: string,
  yearMonth: string,
  creditCards: CreditCard[]
): Promise<Record<string, boolean>> {
  return creditCardsAdapter().getAllCardMonthlyStatuses(userId, yearMonth, creditCards);
}

export async function setCardMonthlyStatus(
  userId: string,
  creditCardId: string,
  yearMonth: string,
  paid: boolean
): Promise<void> {
  return creditCardsAdapter().setCardMonthlyStatus(userId, creditCardId, yearMonth, paid);
}
