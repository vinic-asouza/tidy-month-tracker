/**
 * Serviço de Investimentos (Investments)
 */

import { pool } from '../infra/database';

export interface Investment {
  id: string;
  description: string;
  value: number;
  tag: string;
  date: string;
}

export interface CreateInvestmentInput {
  description: string;
  value: number;
  tag: string;
  date: string;
}

export interface UpdateInvestmentInput {
  description?: string;
  value?: number;
  tag?: string;
}

export async function getInvestments(userId: string, yearMonth: string): Promise<Investment[]> {
  const result = await pool.query(
    `SELECT id, description, value, tag, date
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

  const result = await pool.query(
    `INSERT INTO investments (user_id, year_month, description, value, tag, date, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, description, value, tag, date`,
    [userId, yearMonth, data.description, data.value, data.tag, data.date, displayOrder]
  );

  return {
    id: result.rows[0].id,
    description: result.rows[0].description,
    value: Number(result.rows[0].value),
    tag: result.rows[0].tag,
    date: result.rows[0].date,
  };
}

export async function updateInvestment(
  userId: string,
  id: string,
  data: UpdateInvestmentInput
): Promise<void> {
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

  if (updates.length === 0) return;

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

export async function deleteInvestment(userId: string, id: string): Promise<void> {
  await pool.query('DELETE FROM investments WHERE id = $1 AND user_id = $2', [id, userId]);
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
