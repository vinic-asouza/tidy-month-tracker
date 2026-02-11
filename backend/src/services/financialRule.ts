/**
 * Serviço de Regra Financeira (Financial Rule)
 */

import { pool } from '../infra/database';

export interface FinancialRule {
  id: string;
  userId: string;
  essentialsPercentage: number;
  lifestylePercentage: number;
  investmentsPercentage: number;
  categoryMapping: Record<string, 'essentials' | 'lifestyle'>;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinancialRuleInput {
  essentialsPercentage: number;
  lifestylePercentage: number;
  investmentsPercentage: number;
  categoryMapping: Record<string, 'essentials' | 'lifestyle'>;
  isCustom: boolean;
}

export interface UpdateFinancialRuleInput {
  essentialsPercentage?: number;
  lifestylePercentage?: number;
  investmentsPercentage?: number;
  categoryMapping?: Record<string, 'essentials' | 'lifestyle'>;
  isCustom?: boolean;
}

/**
 * Valida se a soma dos percentuais é igual a 100
 */
function validatePercentages(
  essentials: number,
  lifestyle: number,
  investments: number
): void {
  const sum = essentials + lifestyle + investments;
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error(
      `A soma dos percentuais deve ser 100%. Atual: ${sum.toFixed(2)}%`
    );
  }
}

/**
 * Valida se todas as categorias estão mapeadas
 */
function validateCategoryMapping(
  categoryMapping: Record<string, 'essentials' | 'lifestyle'>,
  allCategories: string[]
): void {
  const mappedCategories = Object.keys(categoryMapping);
  const unmappedCategories = allCategories.filter(
    (cat) => !mappedCategories.includes(cat)
  );

  if (unmappedCategories.length > 0) {
    throw new Error(
      `Todas as categorias devem estar mapeadas. Categorias não mapeadas: ${unmappedCategories.join(', ')}`
    );
  }

  // Valida que os valores são válidos
  for (const [category, type] of Object.entries(categoryMapping)) {
    if (type !== 'essentials' && type !== 'lifestyle') {
      throw new Error(
        `Tipo inválido para categoria "${category}": ${type}. Deve ser "essentials" ou "lifestyle"`
      );
    }
  }
}

/**
 * Obtém a regra financeira do usuário
 */
export async function getFinancialRule(
  userId: string
): Promise<FinancialRule | null> {
  const result = await pool.query(
    `SELECT 
      id,
      user_id,
      essentials_percentage,
      lifestyle_percentage,
      investments_percentage,
      category_mapping,
      is_custom,
      created_at,
      updated_at
     FROM financial_rule
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    essentialsPercentage: parseFloat(row.essentials_percentage),
    lifestylePercentage: parseFloat(row.lifestyle_percentage),
    investmentsPercentage: parseFloat(row.investments_percentage),
    categoryMapping: row.category_mapping || {},
    isCustom: row.is_custom,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Cria uma nova regra financeira
 */
export async function createFinancialRule(
  userId: string,
  data: CreateFinancialRuleInput
): Promise<FinancialRule> {
  // Validações
  validatePercentages(
    data.essentialsPercentage,
    data.lifestylePercentage,
    data.investmentsPercentage
  );

  // Buscar todas as categorias do usuário para validar mapeamento
  const settingsResult = await pool.query(
    `SELECT expense_categories FROM finance_settings WHERE user_id = $1`,
    [userId]
  );

  if (settingsResult.rows.length > 0) {
    const categories = settingsResult.rows[0].expense_categories || [];
    validateCategoryMapping(data.categoryMapping, categories);
  }

  const result = await pool.query(
    `INSERT INTO financial_rule (
      user_id,
      essentials_percentage,
      lifestyle_percentage,
      investments_percentage,
      category_mapping,
      is_custom
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING 
      id,
      user_id,
      essentials_percentage,
      lifestyle_percentage,
      investments_percentage,
      category_mapping,
      is_custom,
      created_at,
      updated_at`,
    [
      userId,
      data.essentialsPercentage,
      data.lifestylePercentage,
      data.investmentsPercentage,
      JSON.stringify(data.categoryMapping),
      data.isCustom,
    ]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    essentialsPercentage: parseFloat(row.essentials_percentage),
    lifestylePercentage: parseFloat(row.lifestyle_percentage),
    investmentsPercentage: parseFloat(row.investments_percentage),
    categoryMapping: row.category_mapping || {},
    isCustom: row.is_custom,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Atualiza a regra financeira do usuário
 */
export async function updateFinancialRule(
  userId: string,
  data: UpdateFinancialRuleInput
): Promise<FinancialRule> {
  // Buscar regra atual
  const currentRule = await getFinancialRule(userId);
  if (!currentRule) {
    throw new Error('Regra financeira não encontrada');
  }

  // Mesclar dados
  const updatedData: CreateFinancialRuleInput = {
    essentialsPercentage:
      data.essentialsPercentage ?? currentRule.essentialsPercentage,
    lifestylePercentage:
      data.lifestylePercentage ?? currentRule.lifestylePercentage,
    investmentsPercentage:
      data.investmentsPercentage ?? currentRule.investmentsPercentage,
    categoryMapping: data.categoryMapping ?? currentRule.categoryMapping,
    isCustom: data.isCustom ?? currentRule.isCustom,
  };

  // Validações
  validatePercentages(
    updatedData.essentialsPercentage,
    updatedData.lifestylePercentage,
    updatedData.investmentsPercentage
  );

  // Se categoryMapping foi atualizado, validar
  if (data.categoryMapping) {
    const settingsResult = await pool.query(
      `SELECT expense_categories FROM finance_settings WHERE user_id = $1`,
      [userId]
    );

    if (settingsResult.rows.length > 0) {
      const categories = settingsResult.rows[0].expense_categories || [];
      validateCategoryMapping(updatedData.categoryMapping, categories);
    }
  }

  const result = await pool.query(
    `UPDATE financial_rule
     SET 
      essentials_percentage = $1,
      lifestyle_percentage = $2,
      investments_percentage = $3,
      category_mapping = $4,
      is_custom = $5,
      updated_at = NOW()
     WHERE user_id = $6
     RETURNING 
      id,
      user_id,
      essentials_percentage,
      lifestyle_percentage,
      investments_percentage,
      category_mapping,
      is_custom,
      created_at,
      updated_at`,
    [
      updatedData.essentialsPercentage,
      updatedData.lifestylePercentage,
      updatedData.investmentsPercentage,
      JSON.stringify(updatedData.categoryMapping),
      updatedData.isCustom,
      userId,
    ]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    essentialsPercentage: parseFloat(row.essentials_percentage),
    lifestylePercentage: parseFloat(row.lifestyle_percentage),
    investmentsPercentage: parseFloat(row.investments_percentage),
    categoryMapping: row.category_mapping || {},
    isCustom: row.is_custom,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Deleta a regra financeira do usuário
 */
export async function deleteFinancialRule(userId: string): Promise<void> {
  const result = await pool.query(
    `DELETE FROM financial_rule WHERE user_id = $1`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new Error('Regra financeira não encontrada');
  }
}
