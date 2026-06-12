import { apiClient } from '@/api/client';
import type {
  FinancialRule,
  CreateFinancialRuleInput,
  UpdateFinancialRuleInput,
} from '@/types/domain';

export async function getFinancialRule(): Promise<FinancialRule | null> {
  return apiClient.get<FinancialRule | null>('/api/financial-rule');
}

export async function createFinancialRule(
  data: CreateFinancialRuleInput
): Promise<FinancialRule> {
  return apiClient.post<FinancialRule>('/api/financial-rule', data);
}

export async function updateFinancialRule(
  data: UpdateFinancialRuleInput
): Promise<FinancialRule> {
  return apiClient.put<FinancialRule>('/api/financial-rule', data);
}

export async function deleteFinancialRule(): Promise<void> {
  await apiClient.delete('/api/financial-rule');
}
