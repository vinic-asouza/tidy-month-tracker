/**
 * Serviço de Despesas — facade que delega ao adaptador configurado.
 */

export type { CreateExpenseParams, UpdateExpenseParams } from './params';

import type { Expense } from '@/types/domain';
import type { CreateExpenseParams, UpdateExpenseParams } from './params';
import { expensesAdapter } from './adapters/select';

export async function getExpenses(userId: string, yearMonth: string): Promise<Expense[]> {
  return expensesAdapter().getExpenses(userId, yearMonth);
}

export async function createExpense(params: CreateExpenseParams): Promise<Expense> {
  return expensesAdapter().createExpense(params);
}

export async function updateExpense(params: UpdateExpenseParams): Promise<void> {
  return expensesAdapter().updateExpense(params);
}

export async function deleteExpense(
  id: string,
  userId: string,
  applyToAllMonths = false
): Promise<void> {
  return expensesAdapter().deleteExpense(id, userId, applyToAllMonths);
}

export async function deleteInstallmentExpense(
  expense: Expense,
  userId: string
): Promise<void> {
  return expensesAdapter().deleteInstallmentExpense(expense, userId);
}

export async function reorderExpenses(
  expenses: Expense[],
  userId: string
): Promise<void> {
  return expensesAdapter().reorderExpenses(expenses, userId);
}
