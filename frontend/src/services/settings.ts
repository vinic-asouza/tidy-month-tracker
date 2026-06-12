/**
 * Serviço de Configurações — facade que delega ao adaptador configurado.
 */

import type { FinanceSettings } from '@/types/domain';
import { settingsAdapter } from './adapters/select';

export async function getSettings(userId: string): Promise<FinanceSettings> {
  return settingsAdapter().getSettings(userId);
}

export async function updateInvestmentTags(userId: string, tags: string[]): Promise<void> {
  return settingsAdapter().updateInvestmentTags(userId, tags);
}

export async function updateInvestmentTagInInvestments(
  userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  return settingsAdapter().updateInvestmentTagInInvestments(userId, oldTag, newTag);
}

export async function updateIncomeTags(userId: string, tags: string[]): Promise<void> {
  return settingsAdapter().updateIncomeTags(userId, tags);
}

export async function updateIncomeTagInIncomes(
  userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  return settingsAdapter().updateIncomeTagInIncomes(userId, oldTag, newTag);
}

export async function updateExpenseCategories(
  userId: string,
  categories: string[]
): Promise<void> {
  return settingsAdapter().updateExpenseCategories(userId, categories);
}

export async function updateExpenseCategoryInExpenses(
  userId: string,
  oldCategory: string,
  newCategory: string
): Promise<void> {
  return settingsAdapter().updateExpenseCategoryInExpenses(userId, oldCategory, newCategory);
}
