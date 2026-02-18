/**
 * Serviço de Receitas (Incomes)
 * 
 * Lógica de negócio para operações de receitas
 */

import { pool } from '../infra/database';
import { calculateRemainingMonths } from '../utils/repeatMonths';

export interface Income {
  id: string;
  description: string;
  value: number;
  tag: string;
  date: string | null;
  received: boolean;
  repeatAllMonths?: boolean;
  baseIncomeId?: string;
  createdAt?: string;
}

export interface CreateIncomeInput {
  description: string;
  value: number;
  tag: string;
  date: string;
  repeatAllMonths?: boolean;
}

export interface UpdateIncomeInput {
  description?: string;
  value?: number;
  tag?: string;
  date?: string | null;
  received?: boolean;
  repeatAllMonths?: boolean;
}

/**
 * Busca receitas de um mês específico
 */
export async function getIncomes(userId: string, yearMonth: string): Promise<Income[]> {
  const result = await pool.query(
    `SELECT id, description, value, tag, date, received, repeat_all_months, base_income_id, created_at
     FROM incomes
     WHERE user_id = $1 AND year_month = $2
     ORDER BY display_order`,
    [userId, yearMonth]
  );

  return result.rows.map((row) => ({
    id: row.id,
    description: row.description,
    value: Number(row.value),
    tag: row.tag,
    date: row.date,
    received: row.received || false,
    repeatAllMonths: row.repeat_all_months,
    baseIncomeId: row.base_income_id || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  }));
}

/**
 * Cria uma nova receita
 */
export async function createIncome(
  userId: string,
  yearMonth: string,
  data: CreateIncomeInput
): Promise<Income> {
  // Busca próximo display_order
  const countResult = await pool.query(
    'SELECT COUNT(*)::int as count FROM incomes WHERE user_id = $1 AND year_month = $2',
    [userId, yearMonth]
  );
  const displayOrder = countResult.rows[0].count;

  const itemDate = data.date ?? new Date().toISOString().slice(0, 10);
  const result = await pool.query(
    `INSERT INTO incomes (user_id, year_month, description, value, tag, date, received, repeat_all_months, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, description, value, tag, date, received, repeat_all_months, base_income_id`,
    [
      userId,
      yearMonth,
      data.description,
      data.value,
      data.tag,
      itemDate,
      false, // received sempre inicia como false
      data.repeatAllMonths || false,
      displayOrder,
    ]
  );

  const createdIncome = {
    id: result.rows[0].id,
    description: result.rows[0].description,
    value: Number(result.rows[0].value),
    tag: result.rows[0].tag,
    date: result.rows[0].date,
    received: result.rows[0].received || false,
    repeatAllMonths: result.rows[0].repeat_all_months,
    baseIncomeId: result.rows[0].base_income_id || undefined,
  };

  // Se deve repetir para todos os meses, cria as repetições
  if (data.repeatAllMonths) {
    const remainingMonths = calculateRemainingMonths(yearMonth);

    for (const month of remainingMonths) {
      await pool.query(
        `INSERT INTO incomes (user_id, year_month, description, value, tag, date, received, repeat_all_months, base_income_id, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          month,
          data.description,
          data.value,
          data.tag,
          itemDate,
          false,
          true, // repeat_all_months
          createdIncome.id, // base_income_id
          0, // display_order
        ]
      );
    }
  }

  return createdIncome;
}

/**
 * Atualiza uma receita existente
 */
export async function updateIncome(
  userId: string,
  id: string,
  data: UpdateIncomeInput,
  applyToAllMonths = false
): Promise<void> {
  // Busca o item atual para verificar estado anterior
  const incomeResult = await pool.query(
    'SELECT id, base_income_id, repeat_all_months, year_month, description, value, tag, date FROM incomes WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (incomeResult.rows.length === 0) {
    throw new Error('Receita não encontrada');
  }

  const currentIncome = incomeResult.rows[0];
  const wasRepeatAllMonths = currentIncome.repeat_all_months;
  const willBeRepeatAllMonths = data.repeatAllMonths !== undefined ? data.repeatAllMonths : wasRepeatAllMonths;
  const isChangingRepeatStatus = data.repeatAllMonths !== undefined && data.repeatAllMonths !== wasRepeatAllMonths;

  // Se está mudando de não-recorrente para recorrente, cria as repetições
  if (isChangingRepeatStatus && willBeRepeatAllMonths && !currentIncome.base_income_id) {
    // É um item original que está sendo marcado como recorrente
    const remainingMonths = calculateRemainingMonths(currentIncome.year_month);
    
    for (const month of remainingMonths) {
      await pool.query(
        `INSERT INTO incomes (user_id, year_month, description, value, tag, date, received, repeat_all_months, base_income_id, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          month,
          data.description !== undefined ? data.description : currentIncome.description,
          data.value !== undefined ? data.value : Number(currentIncome.value),
          data.tag !== undefined ? data.tag : currentIncome.tag,
          currentIncome.date,
          false, // received sempre inicia como false
          true, // repeat_all_months
          id, // base_income_id aponta para o original
          0, // display_order
        ]
      );
    }
  }

  // Se está mudando de recorrente para não-recorrente, remove todas as cópias
  if (isChangingRepeatStatus && !willBeRepeatAllMonths) {
    if (currentIncome.base_income_id) {
      // Se é uma cópia, remove todas as cópias do original
      await pool.query(
        'DELETE FROM incomes WHERE base_income_id = $1 AND user_id = $2',
        [currentIncome.base_income_id, userId]
      );
    } else {
      // Se é o original, remove todas as cópias
      await pool.query(
        'DELETE FROM incomes WHERE base_income_id = $1 AND user_id = $2',
        [id, userId]
      );
    }
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.value !== undefined) {
    updates.push(`value = $${paramIndex++}`);
    values.push(data.value);
  }
  if (data.tag !== undefined) {
    updates.push(`tag = $${paramIndex++}`);
    values.push(data.tag);
  }
  if (data.received !== undefined) {
    updates.push(`received = $${paramIndex++}`);
    values.push(data.received);
  }
  if (data.repeatAllMonths !== undefined) {
    updates.push(`repeat_all_months = $${paramIndex++}`);
    values.push(data.repeatAllMonths);
  }
  if (data.date !== undefined) {
    updates.push(`date = $${paramIndex++}`);
    values.push(data.date);
  }

  if (updates.length === 0) {
    return; // Nada para atualizar
  }

  if (applyToAllMonths) {
    const income = incomeResult.rows[0];
    let targetIds: string[] = [id];

    // Se é uma cópia (tem base_income_id), atualiza o original e todas as cópias (incluindo esta)
    if (income.base_income_id) {
      targetIds = [income.base_income_id];
      // Busca todas as cópias (incluindo esta)
      const copiesResult = await pool.query(
        'SELECT id FROM incomes WHERE base_income_id = $1 AND user_id = $2',
        [income.base_income_id, userId]
      );
      targetIds.push(...copiesResult.rows.map((row: { id: string }) => row.id));
    } else if (income.repeat_all_months) {
      // Se é o original (repeat_all_months = true), atualiza todas as cópias também
      const copiesResult = await pool.query(
        'SELECT id FROM incomes WHERE base_income_id = $1 AND user_id = $2',
        [id, userId]
      );
      targetIds.push(...copiesResult.rows.map((row: { id: string }) => row.id));
    }

    // Atualiza todos os itens relacionados
    values.push(userId);
    const userIdParam = paramIndex;
    await pool.query(
      `UPDATE incomes
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
      `UPDATE incomes
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${idParam} AND user_id = $${userIdParam}`,
      values
    );
  }
}

/**
 * Deleta uma receita
 */
export async function deleteIncome(userId: string, id: string, applyToAllMonths = false): Promise<void> {
  if (applyToAllMonths) {
    // Busca o item para verificar se é fixo
    const incomeResult = await pool.query(
      'SELECT id, base_income_id, repeat_all_months FROM incomes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (incomeResult.rows.length === 0) {
      throw new Error('Receita não encontrada');
    }

    const income = incomeResult.rows[0];
    let targetIds: string[] = [id];

    // Se é uma cópia (tem base_income_id), deleta o original e todas as cópias (incluindo esta)
    if (income.base_income_id) {
      targetIds = [income.base_income_id];
      // Busca todas as cópias (incluindo esta)
      const copiesResult = await pool.query(
        'SELECT id FROM incomes WHERE base_income_id = $1 AND user_id = $2',
        [income.base_income_id, userId]
      );
      targetIds.push(...copiesResult.rows.map((row: { id: string }) => row.id));
    } else if (income.repeat_all_months) {
      // Se é o original (repeat_all_months = true), deleta todas as cópias também
      const copiesResult = await pool.query(
        'SELECT id FROM incomes WHERE base_income_id = $1 AND user_id = $2',
        [id, userId]
      );
      targetIds.push(...copiesResult.rows.map((row: { id: string }) => row.id));
    }

    // Deleta todos os itens relacionados
    await pool.query(
      'DELETE FROM incomes WHERE id = ANY($1::uuid[]) AND user_id = $2',
      [targetIds, userId]
    );
  } else {
    // Deleta apenas o item específico
    await pool.query('DELETE FROM incomes WHERE id = $1 AND user_id = $2', [id, userId]);
  }
}

/**
 * Reordena receitas
 */
export async function reorderIncomes(
  userId: string,
  yearMonth: string,
  incomeIds: string[]
): Promise<void> {
  // Valida que todas as receitas pertencem ao mês especificado
  // (opcional, mas garante integridade)
  const checkResult = await pool.query(
    'SELECT COUNT(*)::int as count FROM incomes WHERE user_id = $1 AND year_month = $2 AND id = ANY($3::uuid[])',
    [userId, yearMonth, incomeIds]
  );

  if (checkResult.rows[0].count !== incomeIds.length) {
    throw new Error('Algumas receitas não pertencem ao mês especificado');
  }

  // Atualiza display_order para cada receita
  for (let i = 0; i < incomeIds.length; i++) {
    await pool.query(
      'UPDATE incomes SET display_order = $1 WHERE id = $2 AND user_id = $3',
      [i, incomeIds[i], userId]
    );
  }
}
