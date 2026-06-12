/**
 * Serviço de Investimentos — facade que delega ao adaptador configurado.
 */

export type { CreateInvestmentParams, UpdateInvestmentParams } from './params';

import type { Investment } from '@/types/domain';
import type { CreateInvestmentParams, UpdateInvestmentParams } from './params';
import { investmentsAdapter } from './adapters/select';

export async function getInvestments(
  userId: string,
  yearMonth: string
): Promise<Investment[]> {
  return investmentsAdapter().getInvestments(userId, yearMonth);
}

export async function createInvestment(params: CreateInvestmentParams): Promise<Investment> {
  return investmentsAdapter().createInvestment(params);
}

export async function updateInvestment(params: UpdateInvestmentParams): Promise<void> {
  return investmentsAdapter().updateInvestment(params);
}

export async function deleteInvestment(
  id: string,
  userId: string,
  applyToAllMonths = false
): Promise<void> {
  return investmentsAdapter().deleteInvestment(id, userId, applyToAllMonths);
}

export async function reorderInvestments(
  investments: Investment[],
  userId: string
): Promise<void> {
  return investmentsAdapter().reorderInvestments(investments, userId);
}
