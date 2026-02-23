/**
 * Serviço de Investimentos (Investments)
 */

import { pool } from '../infra/database';
import { calculateRemainingMonths } from '../utils/repeatMonths';

export interface Investment {
  id: string;
  description: string;
  value: number;
  tag: string;
  date: string | null;
  invested: boolean;
  repeatAllMonths?: boolean;
  baseInvestmentId?: string;
  createdAt?: string;
}

export interface CreateInvestmentInput {
  description: string;
  value: number;
  tag: string;
  date: string;
  repeatAllMonths?: boolean;
}

export interface UpdateInvestmentInput {
  description?: string;
  value?: number;
  tag?: string;
  date?: string | null;
  invested?: boolean;
  repeatAllMonths?: boolean;
}

export async function getInvestments(userId: string, yearMonth: string): Promise<Investment[]> {
  const result = await pool.query(
    `SELECT id, description, value, tag, date, invested, repeat_all_months, base_investment_id, created_at
     FROM investments
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
    invested: row.invested || false,
    repeatAllMonths: row.repeat_all_months,
    baseInvestmentId: row.base_investment_id || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  }));
}

export async function createInvestment(
  userId: string,
  yearMonth: string,
  data: CreateInvestmentInput
): Promise<Investment> {
  const countResult = await pool.query(
    'SELECT COUNT(*)::int as count FROM investments WHERE user_id = $1 AND year_month = $2',
    [userId, yearMonth]
  );
  const displayOrder = countResult.rows[0].count;

  const itemDate = data.date ?? new Date().toISOString().slice(0, 10);
  const result = await pool.query(
    `INSERT INTO investments (user_id, year_month, description, value, tag, date, invested, repeat_all_months, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, description, value, tag, date, invested, repeat_all_months, base_investment_id`,
    [userId, yearMonth, data.description, data.value, data.tag, itemDate, false, data.repeatAllMonths || false, displayOrder]
  );

  const createdInvestment = {
    id: result.rows[0].id,
    description: result.rows[0].description,
    value: Number(result.rows[0].value),
    tag: result.rows[0].tag,
    date: result.rows[0].date,
    invested: result.rows[0].invested || false,
    repeatAllMonths: result.rows[0].repeat_all_months,
    baseInvestmentId: result.rows[0].base_investment_id || undefined,
  };

  // Se deve repetir para todos os meses, cria as repetições
  if (data.repeatAllMonths) {
    const remainingMonths = calculateRemainingMonths(yearMonth);

    for (const month of remainingMonths) {
      await pool.query(
        `INSERT INTO investments (user_id, year_month, description, value, tag, date, invested, repeat_all_months, base_investment_id, display_order)
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
          createdInvestment.id, // base_investment_id
          0, // display_order
        ]
      );
    }
  }

  return createdInvestment;
}

export async function updateInvestment(
  userId: string,
  id: string,
  data: UpdateInvestmentInput,
  applyToAllMonths = false
): Promise<void> {
  // Busca o item atual para verificar estado anterior
  const investmentResult = await pool.query(
    'SELECT id, base_investment_id, repeat_all_months, year_month, description, value, tag, date, invested FROM investments WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (investmentResult.rows.length === 0) {
    throw new Error('Investimento não encontrado');
  }

  const currentInvestment = investmentResult.rows[0];
  const wasRepeatAllMonths = currentInvestment.repeat_all_months;
  const willBeRepeatAllMonths = data.repeatAllMonths !== undefined ? data.repeatAllMonths : wasRepeatAllMonths;
  const isChangingRepeatStatus = data.repeatAllMonths !== undefined && data.repeatAllMonths !== wasRepeatAllMonths;

  // Se está mudando de não-recorrente para recorrente, cria as repetições
  if (isChangingRepeatStatus && willBeRepeatAllMonths && !currentInvestment.base_investment_id) {
    // É um item original que está sendo marcado como recorrente
    const remainingMonths = calculateRemainingMonths(currentInvestment.year_month);
    
    for (const month of remainingMonths) {
      await pool.query(
        `INSERT INTO investments (user_id, year_month, description, value, tag, date, invested, repeat_all_months, base_investment_id, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          month,
          data.description !== undefined ? data.description : currentInvestment.description,
          data.value !== undefined ? data.value : Number(currentInvestment.value),
          data.tag !== undefined ? data.tag : currentInvestment.tag,
          currentInvestment.date,
          false, // invested sempre inicia como false
          true, // repeat_all_months
          id, // base_investment_id aponta para o original
          0, // display_order
        ]
      );
    }
  }

  // Se está mudando de recorrente para não-recorrente, remove todas as cópias
  if (isChangingRepeatStatus && !willBeRepeatAllMonths) {
    if (currentInvestment.base_investment_id) {
      // Se é uma cópia, remove todas as cópias do original
      await pool.query(
        'DELETE FROM investments WHERE base_investment_id = $1 AND user_id = $2',
        [currentInvestment.base_investment_id, userId]
      );
    } else {
      // Se é o original, remove todas as cópias
      await pool.query(
        'DELETE FROM investments WHERE base_investment_id = $1 AND user_id = $2',
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
  if (data.invested !== undefined) {
    updates.push(`invested = $${paramIndex++}`);
    values.push(data.invested);
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
    const investment = investmentResult.rows[0];
    const baseId = investment.base_investment_id || id;
    const currentYearMonth = investment.year_month;

    // Apenas mês atual e meses seguintes: original + cópias com year_month >= atual
    const targetResult = await pool.query(
      'SELECT id FROM investments WHERE user_id = $1 AND (id = $2 OR base_investment_id = $2) AND year_month >= $3',
      [userId, baseId, currentYearMonth]
    );
    const targetIds = targetResult.rows.map((row: { id: string }) => row.id);
    if (targetIds.length === 0) return;

    // Atualiza todos os itens relacionados (mês atual e seguintes)
    values.push(userId);
    const userIdParam = paramIndex;
    await pool.query(
      `UPDATE investments
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
      `UPDATE investments
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${idParam} AND user_id = $${userIdParam}`,
      values
    );
  }
}

export async function deleteInvestment(userId: string, id: string, applyToAllMonths = false): Promise<void> {
  if (applyToAllMonths) {
    const investmentResult = await pool.query(
      'SELECT id, base_investment_id, repeat_all_months, year_month FROM investments WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (investmentResult.rows.length === 0) {
      throw new Error('Investimento não encontrado');
    }

    const investment = investmentResult.rows[0];
    const baseId = investment.base_investment_id || id;
    const currentYearMonth = investment.year_month;

    // Apenas mês atual e meses seguintes
    const targetResult = await pool.query(
      'SELECT id FROM investments WHERE user_id = $1 AND (id = $2 OR base_investment_id = $2) AND year_month >= $3',
      [userId, baseId, currentYearMonth]
    );
    const targetIds = targetResult.rows.map((row: { id: string }) => row.id);
    if (targetIds.length === 0) return;

    // Deleta os itens do mês atual e seguintes
    await pool.query(
      'DELETE FROM investments WHERE id = ANY($1::uuid[]) AND user_id = $2',
      [targetIds, userId]
    );
  } else {
    // Deleta apenas o item específico
    await pool.query('DELETE FROM investments WHERE id = $1 AND user_id = $2', [id, userId]);
  }
}

export async function reorderInvestments(
  userId: string,
  investmentIds: string[]
): Promise<void> {
  for (let i = 0; i < investmentIds.length; i++) {
    await pool.query(
      'UPDATE investments SET display_order = $1 WHERE id = $2 AND user_id = $3',
      [i, investmentIds[i], userId]
    );
  }
}
