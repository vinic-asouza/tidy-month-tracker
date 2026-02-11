/**
 * Serviço de Regra Financeira (Financial Rule)
 * 
 * Usa API REST para operações de regra financeira
 */

import { apiClient } from '@/api/client';
import type { FinancialRule, CreateFinancialRuleInput, UpdateFinancialRuleInput } from '@/types/domain';

/**
 * Busca a regra financeira do usuário
 */
export async function getFinancialRule(): Promise<FinancialRule | null> {
  return apiClient.get<FinancialRule | null>('/api/financial-rule');
}

/**
 * Cria uma nova regra financeira
 */
export async function createFinancialRule(data: CreateFinancialRuleInput): Promise<FinancialRule> {
  return apiClient.post<FinancialRule>('/api/financial-rule', data);
}

/**
 * Atualiza a regra financeira do usuário
 */
export async function updateFinancialRule(data: UpdateFinancialRuleInput): Promise<FinancialRule> {
  return apiClient.put<FinancialRule>('/api/financial-rule', data);
}

/**
 * Deleta a regra financeira do usuário
 */
export async function deleteFinancialRule(): Promise<void> {
  await apiClient.delete('/api/financial-rule');
}
