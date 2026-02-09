/**
 * Serviço de Cartões de Crédito (Credit Cards)
 */

import { pool } from '../infra/database';

export interface CreditCard {
  id: string;
  name: string;
  color: string;
  paid: boolean;
}

export interface CreateCreditCardInput {
  name: string;
  color: string;
  paid?: boolean;
}

export interface UpdateCreditCardInput {
  name?: string;
  color?: string;
  paid?: boolean;
}

export async function getCreditCards(userId: string): Promise<CreditCard[]> {
  const result = await pool.query(
    `SELECT id, name, color, paid
     FROM credit_cards
     WHERE user_id = $1
     ORDER BY display_order`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    paid: row.paid,
  }));
}

export async function createCreditCard(
  userId: string,
  data: CreateCreditCardInput
): Promise<CreditCard> {
  const countResult = await pool.query(
    'SELECT COUNT(*)::int as count FROM credit_cards WHERE user_id = $1',
    [userId]
  );
  const displayOrder = countResult.rows[0].count;

  const result = await pool.query(
    `INSERT INTO credit_cards (user_id, name, color, paid, display_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, color, paid`,
    [userId, data.name, data.color, data.paid || false, displayOrder]
  );

  return {
    id: result.rows[0].id,
    name: result.rows[0].name,
    color: result.rows[0].color,
    paid: result.rows[0].paid,
  };
}

export async function updateCreditCard(
  userId: string,
  id: string,
  data: UpdateCreditCardInput
): Promise<void> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.color !== undefined) {
    updates.push(`color = $${paramIndex++}`);
    values.push(data.color);
  }
  if (data.paid !== undefined) {
    updates.push(`paid = $${paramIndex++}`);
    values.push(data.paid);
  }

  if (updates.length === 0) return;

  values.push(id, userId);
  const idParam = paramIndex;
  const userIdParam = paramIndex + 1;

  await pool.query(
    `UPDATE credit_cards
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${idParam} AND user_id = $${userIdParam}`,
    values
  );
}

export async function deleteCreditCard(userId: string, id: string): Promise<void> {
  await pool.query('DELETE FROM credit_cards WHERE id = $1 AND user_id = $2', [id, userId]);
}

export async function getCardMonthlyStatus(
  userId: string,
  creditCardId: string,
  yearMonth: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT paid
     FROM credit_card_monthly_status
     WHERE user_id = $1 AND credit_card_id = $2 AND year_month = $3`,
    [userId, creditCardId, yearMonth]
  );

  return result.rows[0]?.paid || false;
}

export async function setCardMonthlyStatus(
  userId: string,
  creditCardId: string,
  yearMonth: string,
  paid: boolean
): Promise<void> {
  await pool.query(
    `INSERT INTO credit_card_monthly_status (user_id, credit_card_id, year_month, paid)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, credit_card_id, year_month)
     DO UPDATE SET paid = $4, updated_at = NOW()`,
    [userId, creditCardId, yearMonth, paid]
  );
}
