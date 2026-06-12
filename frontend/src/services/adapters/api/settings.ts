import { apiClient } from '@/api/client';
import type { FinanceSettings } from '@/types/domain';

export async function getSettings(_userId: string): Promise<FinanceSettings> {
  return apiClient.get<FinanceSettings>('/api/settings');
}

export async function updateInvestmentTags(_userId: string, tags: string[]): Promise<void> {
  await apiClient.put('/api/settings/investment-tags', { tags });
}

export async function updateInvestmentTagInInvestments(
  _userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  await apiClient.put('/api/settings/investment-tags/update', { oldTag, newTag });
}

export async function updateIncomeTags(_userId: string, tags: string[]): Promise<void> {
  await apiClient.put('/api/settings/income-tags', { tags });
}

export async function updateIncomeTagInIncomes(
  _userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  await apiClient.put('/api/settings/income-tags/update', { oldTag, newTag });
}

export async function updateExpenseCategories(
  _userId: string,
  categories: string[]
): Promise<void> {
  await apiClient.put('/api/settings/expense-categories', { categories });
}

export async function updateExpenseCategoryInExpenses(
  _userId: string,
  oldCategory: string,
  newCategory: string
): Promise<void> {
  await apiClient.put('/api/settings/expense-categories/update', {
    oldCategory,
    newCategory,
  });
}
