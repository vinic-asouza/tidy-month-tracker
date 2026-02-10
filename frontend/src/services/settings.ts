/**
 * Serviço de Configurações (Settings)
 * 
 * Usa API REST para operações de configurações
 */

import { apiClient } from '@/api/client';
import type { FinanceSettings } from '@/types/domain';

/**
 * Busca as configurações do usuário ou retorna padrões
 */
export async function getSettings(_userId: string): Promise<FinanceSettings> {
  return apiClient.get<FinanceSettings>('/api/settings');
}

/**
 * Atualiza as tags de investimento
 */
export async function updateInvestmentTags(
  _userId: string,
  tags: string[]
): Promise<void> {
  await apiClient.put('/api/settings/investment-tags', { tags });
}

/**
 * Atualiza todas as tags de investimento que usam um nome antigo para um novo
 */
export async function updateInvestmentTagInInvestments(
  _userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  await apiClient.put('/api/settings/investment-tags/update', {
    oldTag,
    newTag,
  });
}

/**
 * Atualiza as categorias de entradas (incomeTags)
 */
export async function updateIncomeTags(
  _userId: string,
  tags: string[]
): Promise<void> {
  await apiClient.put('/api/settings/income-tags', { tags });
}

/**
 * Atualiza todas as entradas que usam uma categoria antiga para a nova
 */
export async function updateIncomeTagInIncomes(
  _userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  await apiClient.put('/api/settings/income-tags/update', {
    oldTag,
    newTag,
  });
}

/**
 * Atualiza as categorias de gastos (expenseCategories)
 */
export async function updateExpenseCategories(
  _userId: string,
  categories: string[]
): Promise<void> {
  await apiClient.put('/api/settings/expense-categories', { categories });
}

/**
 * Atualiza todas as despesas que usam uma categoria antiga para a nova
 */
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
