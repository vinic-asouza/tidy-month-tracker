/**
 * Serviço de Regra Financeira — facade que delega ao adaptador configurado.
 */

import type {
  FinancialRule,
  CreateFinancialRuleInput,
  UpdateFinancialRuleInput,
} from '@/types/domain';
import { financialRuleAdapter } from './adapters/select';

export async function getFinancialRule(): Promise<FinancialRule | null> {
  return financialRuleAdapter().getFinancialRule();
}

export async function createFinancialRule(
  data: CreateFinancialRuleInput
): Promise<FinancialRule> {
  return financialRuleAdapter().createFinancialRule(data);
}

export async function updateFinancialRule(
  data: UpdateFinancialRuleInput
): Promise<FinancialRule> {
  return financialRuleAdapter().updateFinancialRule(data);
}

export async function deleteFinancialRule(): Promise<void> {
  return financialRuleAdapter().deleteFinancialRule();
}

export async function renameCategoryInMapping(
  oldCategory: string,
  newCategory: string
): Promise<FinancialRule | null> {
  return financialRuleAdapter().renameCategoryInMapping(oldCategory, newCategory);
}
