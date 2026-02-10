/**
 * Serviço de Configurações (Settings)
 */

import { pool } from '../infra/database';

export interface FinanceSettings {
  incomeTags: string[];
  expenseCategories: string[];
  investmentTags: string[];
  paymentMethods: string[];
}

const DEFAULT_INCOME_TAGS = [
  'Salário',
  'Benefício',
  'Extra',
  'Bonificação',
  'Pagamento de terceiros',
  'Freelance',
  'Resgate de investimentos',
  'Rendimentos',
  'Presente',
  'Outros',
];

const DEFAULT_EXPENSE_CATEGORIES = [
  'Moradia',
  'Contas pessoais',
  'Compras Gerais',
  'Vestuário',
  'Assinaturas',
  'Trabalho',
  'Serviços Gerais',
  'Mercado',
  'Lanches',
  'Combustível',
  'Transporte',
  'Carro',
  'Presentes',
  'Lazer',
  'Estilo de Vida',
  'Consultas Médicas',
  'Suplementação',
  'Remédios',
  'Educação',
  'Viagem',
  'Empréstimos',
  'Doação',
  'Taxas',
];

const DEFAULT_INVESTMENT_TAGS = ['Banco A', 'Banco B', 'Corretora', 'Outros'];

const DEFAULT_PAYMENT_METHODS = ['Dinheiro', 'Pix', 'Débito', 'Boleto'];

export async function getSettings(userId: string): Promise<FinanceSettings> {
  const result = await pool.query(
    `SELECT income_tags, expense_categories, investment_tags, payment_methods
     FROM finance_settings
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return {
      incomeTags: DEFAULT_INCOME_TAGS,
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      investmentTags: DEFAULT_INVESTMENT_TAGS,
      paymentMethods: DEFAULT_PAYMENT_METHODS,
    };
  }

  return {
    incomeTags: result.rows[0].income_tags || DEFAULT_INCOME_TAGS,
    expenseCategories: result.rows[0].expense_categories || DEFAULT_EXPENSE_CATEGORIES,
    investmentTags: result.rows[0].investment_tags || DEFAULT_INVESTMENT_TAGS,
    paymentMethods: result.rows[0].payment_methods || DEFAULT_PAYMENT_METHODS,
  };
}

export async function updateInvestmentTags(userId: string, tags: string[]): Promise<void> {
  // Usa INSERT ... ON CONFLICT para criar se não existir
  await pool.query(
    `INSERT INTO finance_settings (user_id, investment_tags, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET investment_tags = $2, updated_at = NOW()`,
    [userId, tags]
  );
}

export async function updateInvestmentTagInInvestments(
  userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  await pool.query(
    `UPDATE investments
     SET tag = $1, updated_at = NOW()
     WHERE user_id = $2 AND tag = $3`,
    [newTag, userId, oldTag]
  );
}

/**
 * Atualiza as tags de entrada (incomeTags) nas configurações
 */
export async function updateIncomeTags(userId: string, tags: string[]): Promise<void> {
  await pool.query(
    `INSERT INTO finance_settings (user_id, income_tags, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET income_tags = $2, updated_at = NOW()`,
    [userId, tags]
  );
}

/**
 * Atualiza todas as entradas que usam uma categoria antiga para a nova
 */
export async function updateIncomeTagInIncomes(
  userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  await pool.query(
    `UPDATE incomes
     SET tag = $1, updated_at = NOW()
     WHERE user_id = $2 AND tag = $3`,
    [newTag, userId, oldTag]
  );
}

/**
 * Atualiza as categorias de gastos (expenseCategories) nas configurações
 */
export async function updateExpenseCategories(userId: string, categories: string[]): Promise<void> {
  await pool.query(
    `INSERT INTO finance_settings (user_id, expense_categories, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET expense_categories = $2, updated_at = NOW()`,
    [userId, categories]
  );
}

/**
 * Atualiza todas as despesas que usam uma categoria antiga para a nova
 */
export async function updateExpenseCategoryInExpenses(
  userId: string,
  oldCategory: string,
  newCategory: string
): Promise<void> {
  await pool.query(
    `UPDATE expenses
     SET category = $1, updated_at = NOW()
     WHERE user_id = $2 AND category = $3`,
    [newCategory, userId, oldCategory]
  );
}
