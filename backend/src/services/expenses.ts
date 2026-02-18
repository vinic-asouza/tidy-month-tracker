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
  date?: string | null;
  repeatAllMonths?: boolean;
  baseExpenseId?: string;
  currentInstallment?: number;
  totalInstallments?: number;
  createdAt?: string;
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
  date?: string | null;
  paid?: boolean;
  repeatAllMonths?: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
}

/**
 * Busca despesas de um mês específico
 */
export async function getExpenses(userId: string, yearMonth: string): Promise<Expense[]> {
  const result = await pool.query(
    `SELECT id, type, category, description, payment_method, value, paid, date,
            repeat_all_months, base_expense_id, current_installment, total_installments, created_at
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
    date: row.date ?? undefined,
    repeatAllMonths: row.repeat_all_months,
    baseExpenseId: row.base_expense_id || undefined,
    currentInstallment: row.current_installment || undefined,
    totalInstallments: row.total_installments || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
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

  const itemDate = data.date ?? new Date().toISOString().slice(0, 10);

  const result = await pool.query(
    `INSERT INTO expenses (user_id, year_month, type, category, description, payment_method, value, paid, date,
                          repeat_all_months, current_installment, total_installments, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id, type, category, description, payment_method, value, paid, date,
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
      itemDate,
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
    date: result.rows[0].date ?? undefined,
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
        `INSERT INTO expenses (user_id, year_month, type, category, description, payment_method, value, paid, date,
                              repeat_all_months, base_expense_id, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          userId,
          month,
          data.type,
          data.category,
          data.description,
          data.paymentMethod,
          data.value,
          false,
          itemDate,
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
        `INSERT INTO expenses (user_id, year_month, type, category, description, payment_method, value, paid, date,
                              base_expense_id, current_installment, total_installments, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          userId,
          inst.yearMonth,
          data.type,
          data.category,
          data.description,
          data.paymentMethod,
          data.value,
          false,
          itemDate,
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
  data: UpdateExpenseInput,
  applyToAllMonths = false
): Promise<void> {
  // Busca o item atual para verificar estado anterior
  const expenseResult = await pool.query(
    'SELECT id, base_expense_id, repeat_all_months, type, year_month, category, description, payment_method, value, date FROM expenses WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (expenseResult.rows.length === 0) {
    throw new Error('Despesa não encontrada');
  }

  const currentExpense = expenseResult.rows[0];
  const wasRepeatAllMonths = currentExpense.repeat_all_months;
  const willBeRepeatAllMonths = data.repeatAllMonths !== undefined ? data.repeatAllMonths : wasRepeatAllMonths;
  const isChangingRepeatStatus = data.repeatAllMonths !== undefined && data.repeatAllMonths !== wasRepeatAllMonths;

  // Só processa repetição se for despesa fixa
  if (currentExpense.type === 'fixed') {
    // Se está mudando de não-recorrente para recorrente, cria as repetições
    if (isChangingRepeatStatus && willBeRepeatAllMonths && !currentExpense.base_expense_id) {
      // É um item original que está sendo marcado como recorrente
      const remainingMonths = calculateRemainingMonths(currentExpense.year_month);
      
      const currentDate = currentExpense.date ?? new Date().toISOString().slice(0, 10);
      for (const month of remainingMonths) {
        await pool.query(
          `INSERT INTO expenses (user_id, year_month, type, category, description, payment_method, value, paid, date, repeat_all_months, base_expense_id, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            userId,
            month,
            currentExpense.type,
            data.category !== undefined ? data.category : currentExpense.category,
            data.description !== undefined ? data.description : currentExpense.description,
            data.paymentMethod !== undefined ? data.paymentMethod : currentExpense.payment_method,
            data.value !== undefined ? data.value : Number(currentExpense.value),
            false,
            data.date !== undefined ? data.date : currentDate,
            true,
            id,
            0,
          ]
        );
      }
    }

    // Se está mudando de recorrente para não-recorrente, remove todas as cópias
    if (isChangingRepeatStatus && !willBeRepeatAllMonths) {
      if (currentExpense.base_expense_id) {
        // Se é uma cópia, remove todas as cópias do original
        await pool.query(
          'DELETE FROM expenses WHERE base_expense_id = $1 AND user_id = $2',
          [currentExpense.base_expense_id, userId]
        );
      } else {
        // Se é o original, remove todas as cópias
        await pool.query(
          'DELETE FROM expenses WHERE base_expense_id = $1 AND user_id = $2',
          [id, userId]
        );
      }
    }
  }

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
  if (data.date !== undefined) {
    updates.push(`date = $${paramIndex++}`);
    values.push(data.date);
  }
  if (data.currentInstallment !== undefined) {
    updates.push(`current_installment = $${paramIndex++}`);
    values.push(data.currentInstallment);
  }
  if (data.totalInstallments !== undefined) {
    updates.push(`total_installments = $${paramIndex++}`);
    values.push(data.totalInstallments);
  }

  if (updates.length === 0) {
    return;
  }

  if (applyToAllMonths) {
    const expense = expenseResult.rows[0];
    let targetIds: string[] = [id];

    if (expense.type === 'fixed') {
      // Para despesas fixas: atualiza o original e todas as cópias em todos os meses
      if (expense.base_expense_id) {
        targetIds = [expense.base_expense_id];
        // Busca todas as cópias (incluindo esta)
        const copiesResult = await pool.query(
          'SELECT id FROM expenses WHERE base_expense_id = $1 AND user_id = $2',
          [expense.base_expense_id, userId]
        );
        targetIds.push(...copiesResult.rows.map((row: { id: string }) => row.id));
      } else if (expense.repeat_all_months) {
        // Se é o original (repeat_all_months = true), atualiza todas as cópias também
        const copiesResult = await pool.query(
          'SELECT id FROM expenses WHERE base_expense_id = $1 AND user_id = $2',
          [id, userId]
        );
        targetIds.push(...copiesResult.rows.map((row: { id: string }) => row.id));
      }
    } else if (expense.type === 'installment') {
      // Para parcelas: atualiza todas as parcelas relacionadas (mesmo base_expense_id)
      const baseIdResult = await pool.query(
        'SELECT base_expense_id FROM expenses WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (baseIdResult.rows.length > 0) {
        const baseId = baseIdResult.rows[0].base_expense_id || id;
        // Busca todas as parcelas relacionadas (incluindo esta)
        const installmentsResult = await pool.query(
          'SELECT id FROM expenses WHERE user_id = $1 AND (id = $2 OR base_expense_id = $2)',
          [userId, baseId]
        );
        targetIds = installmentsResult.rows.map((row: { id: string }) => row.id);
      }
    }

    // Atualiza todos os itens relacionados
    values.push(userId);
    const userIdParam = paramIndex;
    await pool.query(
      `UPDATE expenses
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = ANY($${userIdParam + 1}::uuid[]) AND user_id = $${userIdParam}`,
      [...values, targetIds]
    );
  } else {
    // Atualiza apenas o item específico
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
}

/**
 * Deleta uma despesa
 */
export async function deleteExpense(userId: string, id: string, applyToAllMonths = false): Promise<void> {
  if (applyToAllMonths) {
    // Busca o item para verificar se é fixo
    const expenseResult = await pool.query(
      'SELECT id, base_expense_id, repeat_all_months, type FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (expenseResult.rows.length === 0) {
      throw new Error('Despesa não encontrada');
    }

    const expense = expenseResult.rows[0];
    let targetIds: string[] = [id];

    // Só aplica em todos os meses se for despesa fixa
    if (expense.type === 'fixed') {
      // Se é uma cópia (tem base_expense_id), deleta o original e todas as cópias (incluindo esta)
      if (expense.base_expense_id) {
        targetIds = [expense.base_expense_id];
        // Busca todas as cópias (incluindo esta)
        const copiesResult = await pool.query(
          'SELECT id FROM expenses WHERE base_expense_id = $1 AND user_id = $2',
          [expense.base_expense_id, userId]
        );
        targetIds.push(...copiesResult.rows.map((row: { id: string }) => row.id));
      } else if (expense.repeat_all_months) {
        // Se é o original (repeat_all_months = true), deleta todas as cópias também
        const copiesResult = await pool.query(
          'SELECT id FROM expenses WHERE base_expense_id = $1 AND user_id = $2',
          [id, userId]
        );
        targetIds.push(...copiesResult.rows.map((row: { id: string }) => row.id));
      }
    }

    // Deleta todos os itens relacionados
    await pool.query(
      'DELETE FROM expenses WHERE id = ANY($1::uuid[]) AND user_id = $2',
      [targetIds, userId]
    );
  } else {
    // Deleta apenas o item específico
    await pool.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
  }
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
