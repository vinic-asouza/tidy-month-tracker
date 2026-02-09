/**
 * Serviço de Despesas (Expenses)
 * 
 * Lógica de negócio para operações de despesas
 */

import { pool } from '../infra/database';
import { calculateRemainingMonths } from '../utils/repeatMonths';
import {
  calculateRemainingInstallments,
  isValidInstallmentExpense,
} from '../utils/installments';

export interface Expense {
  id: string;
  type: 'fixed' | 'variable' | 'installment';
  category: string;
  description: string;
  paymentMethod: string;
  value: number;
  paid: boolean;
  repeatAllMonths?: boolean;
  baseExpenseId?: string;
  currentInstallment?: number;
  totalInstallments?: number;
}

export interface CreateExpenseInput {
  type: 'fixed' | 'variable' | 'installment';
  category: string;
  description: string;
  paymentMethod: string;
  value: number;
  paid?: boolean;
  repeatAllMonths?: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
}

export interface UpdateExpenseInput {
  category?: string;
  description?: string;
  paymentMethod?: string;
  value?: number;
  paid?: boolean;
  repeatAllMonths?: boolean;
}

/**
 * Busca despesas de um mês específico
 */
export async function getExpenses(userId: string, yearMonth: string): Promise<Expense[]> {
  const result = await pool.query(
    `SELECT id, type, category, description, payment_method, value, paid,
            repeat_all_months, base_expense_id, current_installment, total_installments
     FROM expenses
     WHERE user_id = $1 AND year_month = $2
     ORDER BY display_order`,
    [userId, yearMonth]
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    category: row.category,
    description: row.description,
    paymentMethod: row.payment_method,
    value: Number(row.value),
    paid: row.paid,
    repeatAllMonths: row.repeat_all_months,
    baseExpenseId: row.base_expense_id || undefined,
    currentInstallment: row.current_installment || undefined,
    totalInstallments: row.total_installments || undefined,
  }));
}

/**
 * Cria uma nova despesa
 */
export async function createExpense(
  userId: string,
  yearMonth: string,
  data: CreateExpenseInput
): Promise<Expense> {
  // Busca próximo display_order
  const countResult = await pool.query(
    'SELECT COUNT(*)::int as count FROM expenses WHERE user_id = $1 AND year_month = $2',
    [userId, yearMonth]
  );
  const displayOrder = countResult.rows[0].count;

  // Insere despesa principal
  const result = await pool.query(
    `INSERT INTO expenses (user_id, year_month, type, category, description, payment_method, value, paid,
                          repeat_all_months, current_installment, total_installments, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, type, category, description, payment_method, value, paid,
               repeat_all_months, base_expense_id, current_installment, total_installments`,
    [
      userId,
      yearMonth,
      data.type,
      data.category,
      data.description,
      data.paymentMethod,
      data.value,
      data.paid || false,
      data.repeatAllMonths || false,
      data.currentInstallment || null,
      data.totalInstallments || null,
      displayOrder,
    ]
  );

  const createdExpense = {
    id: result.rows[0].id,
    type: result.rows[0].type,
    category: result.rows[0].category,
    description: result.rows[0].description,
    paymentMethod: result.rows[0].payment_method,
    value: Number(result.rows[0].value),
    paid: result.rows[0].paid,
    repeatAllMonths: result.rows[0].repeat_all_months,
    baseExpenseId: result.rows[0].base_expense_id || undefined,
    currentInstallment: result.rows[0].current_installment || undefined,
    totalInstallments: result.rows[0].total_installments || undefined,
  };

  // Lógica de repetição para despesas fixas
  if (data.type === 'fixed' && data.repeatAllMonths) {
    const remainingMonths = calculateRemainingMonths(yearMonth);

    for (const month of remainingMonths) {
      await pool.query(
        `INSERT INTO expenses (user_id, year_month, type, category, description, payment_method, value, paid,
                              repeat_all_months, base_expense_id, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          userId,
          month,
          data.type,
          data.category,
          data.description,
          data.paymentMethod,
          data.value,
          false, // Repetições começam como não pagas
          true,
          createdExpense.id,
          0,
        ]
      );
    }
  }

  // Lógica de parcelas para despesas parceladas
  if (isValidInstallmentExpense(data.type, data.currentInstallment, data.totalInstallments)) {
    const installments = calculateRemainingInstallments(
      yearMonth,
      data.currentInstallment!,
      data.totalInstallments!
    );

    for (const inst of installments) {
      await pool.query(
        `INSERT INTO expenses (user_id, year_month, type, category, description, payment_method, value, paid,
                              base_expense_id, current_installment, total_installments, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          userId,
          inst.yearMonth,
          data.type,
          data.category,
          data.description,
          data.paymentMethod,
          data.value,
          false, // Parcelas futuras começam como não pagas
          createdExpense.id,
          inst.installmentNumber,
          data.totalInstallments,
          0,
        ]
      );
    }
  }

  return createdExpense;
}

/**
 * Atualiza uma despesa existente
 */
export async function updateExpense(
  userId: string,
  id: string,
  data: UpdateExpenseInput
): Promise<void> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.category !== undefined) {
    updates.push(`category = $${paramIndex++}`);
    values.push(data.category);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.paymentMethod !== undefined) {
    updates.push(`payment_method = $${paramIndex++}`);
    values.push(data.paymentMethod);
  }
  if (data.value !== undefined) {
    updates.push(`value = $${paramIndex++}`);
    values.push(data.value);
  }
  if (data.paid !== undefined) {
    updates.push(`paid = $${paramIndex++}`);
    values.push(data.paid);
  }
  if (data.repeatAllMonths !== undefined) {
    updates.push(`repeat_all_months = $${paramIndex++}`);
    values.push(data.repeatAllMonths);
  }

  if (updates.length === 0) {
    return;
  }

  values.push(id, userId);
  const idParam = paramIndex;
  const userIdParam = paramIndex + 1;

  await pool.query(
    `UPDATE expenses
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${idParam} AND user_id = $${userIdParam}`,
    values
  );
}

/**
 * Deleta uma despesa
 */
export async function deleteExpense(userId: string, id: string): Promise<void> {
  await pool.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
}

/**
 * Deleta todas as parcelas relacionadas a uma despesa parcelada
 */
export async function deleteInstallmentExpense(userId: string, expenseId: string): Promise<void> {
  // Busca o base_expense_id
  const expenseResult = await pool.query(
    'SELECT base_expense_id, id FROM expenses WHERE id = $1 AND user_id = $2',
    [expenseId, userId]
  );

  if (expenseResult.rows.length === 0) {
    return;
  }

  const baseId = expenseResult.rows[0].base_expense_id || expenseResult.rows[0].id;

  // Deleta todas as parcelas relacionadas
  await pool.query(
    'DELETE FROM expenses WHERE user_id = $1 AND (id = $2 OR base_expense_id = $2)',
    [userId, baseId]
  );
}

/**
 * Reordena despesas
 */
export async function reorderExpenses(
  userId: string,
  expenseIds: string[]
): Promise<void> {
  for (let i = 0; i < expenseIds.length; i++) {
    await pool.query(
      'UPDATE expenses SET display_order = $1 WHERE id = $2 AND user_id = $3',
      [i, expenseIds[i], userId]
    );
  }
}
