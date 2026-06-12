import { apiClient } from '@/api/client';
import type { Expense } from '@/types/domain';
import type { CreateExpenseParams, UpdateExpenseParams } from '@/services/params';

export async function getExpenses(_userId: string, yearMonth: string): Promise<Expense[]> {
  return apiClient.get<Expense[]>('/api/expenses', { month: yearMonth });
}

export async function createExpense(params: CreateExpenseParams): Promise<Expense> {
  const { userId: _userId, yearMonth, displayOrder: _displayOrder, ...expenseData } = params;
  return apiClient.post<Expense>('/api/expenses', expenseData, { month: yearMonth });
}

export async function updateExpense(params: UpdateExpenseParams): Promise<void> {
  const { id, userId: _userId, updates, applyToAllMonths } = params;
  await apiClient.put(`/api/expenses/${id}`, { ...updates, applyToAllMonths });
}

export async function deleteExpense(
  id: string,
  _userId: string,
  applyToAllMonths = false
): Promise<void> {
  await apiClient.delete(`/api/expenses/${id}`, {
    applyToAllMonths: applyToAllMonths.toString(),
  });
}

export async function deleteInstallmentExpense(
  expense: Expense,
  _userId: string
): Promise<void> {
  await apiClient.delete(`/api/expenses/${expense.id}/installments`);
}

export async function reorderExpenses(
  expenses: Expense[],
  _userId: string
): Promise<void> {
  const expenseIds = expenses.map((expense) => expense.id);
  await apiClient.post('/api/expenses/reorder', { expenseIds });
}
