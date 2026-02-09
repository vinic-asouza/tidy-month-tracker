/**
 * Serviço de Despesas (Expenses)
 * 
 * Usa API REST para operações de despesas
 */

import { apiClient } from '@/api/client';
import type { Expense } from '@/types/domain';

export interface CreateExpenseParams extends Omit<Expense, 'id'> {
  userId?: string; // Mantido para compatibilidade, mas não usado (backend obtém do token)
  yearMonth: string;
  displayOrder?: number; // Mantido para compatibilidade, mas não usado (backend calcula)
}

export interface UpdateExpenseParams {
  id: string;
  userId?: string; // Mantido para compatibilidade, mas não usado (backend obtém do token)
  updates: Partial<Omit<Expense, 'id'>>;
}

/**
 * Busca despesas de um mês específico
 */
export async function getExpenses(_userId: string, yearMonth: string): Promise<Expense[]> {
  return apiClient.get<Expense[]>('/api/expenses', { month: yearMonth });
}

/**
 * Cria uma nova despesa
 */
export async function createExpense(params: CreateExpenseParams): Promise<Expense> {
  const { userId: _userId, yearMonth, displayOrder: _displayOrder, ...expenseData } = params;
  return apiClient.post<Expense>(
    '/api/expenses',
    expenseData,
    { month: yearMonth }
  );
}

/**
 * Atualiza uma despesa existente
 */
export async function updateExpense(params: UpdateExpenseParams): Promise<void> {
  const { id, userId: _userId, updates } = params;
  await apiClient.put(`/api/expenses/${id}`, updates);
}

/**
 * Deleta uma despesa
 */
export async function deleteExpense(id: string, _userId: string): Promise<void> {
  await apiClient.delete(`/api/expenses/${id}`);
}

/**
 * Deleta todas as parcelas relacionadas a uma despesa parcelada
 */
export async function deleteInstallmentExpense(
  expense: Expense,
  _userId: string
): Promise<void> {
  await apiClient.delete(`/api/expenses/${expense.id}/installments`);
}

/**
 * Reordena despesas atualizando display_order
 */
export async function reorderExpenses(
  expenses: Expense[],
  _userId: string
): Promise<void> {
  const expenseIds = expenses.map((expense) => expense.id);
  await apiClient.post('/api/expenses/reorder', { expenseIds });
}
