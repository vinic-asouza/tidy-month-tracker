import type {
  Account,
  AccountBalance,
  CreditCard,
  Expense,
  FinanceSettings,
  FinancialRule,
  Income,
  Investment,
  WishItem,
} from '@/types/domain';
import type { Database } from '@/integrations/supabase/types';

type AccountRow = Database['public']['Tables']['accounts']['Row'];
type AccountBalanceRow = Database['public']['Tables']['account_balances']['Row'];
type IncomeRow = Database['public']['Tables']['incomes']['Row'];
type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type InvestmentRow = Database['public']['Tables']['investments']['Row'];
type CreditCardRow = Database['public']['Tables']['credit_cards']['Row'];
type FinanceSettingsRow = Database['public']['Tables']['finance_settings']['Row'];
type FinancialRuleRow = Database['public']['Tables']['financial_rule']['Row'];

export function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Account['type'],
    color: row.color,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAccountBalance(row: AccountBalanceRow): AccountBalance {
  return {
    id: row.id,
    accountId: row.account_id,
    userId: row.user_id,
    yearMonth: row.year_month,
    balance: Number(row.balance),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toIncome(row: IncomeRow): Income {
  return {
    id: row.id,
    description: row.description,
    value: Number(row.value),
    tag: row.tag,
    date: row.date,
    received: row.received || false,
    repeatAllMonths: row.repeat_all_months,
    baseIncomeId: row.base_income_id || undefined,
    accountId: row.account_id ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

export function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    type: row.type as Expense['type'],
    category: row.category,
    description: row.description,
    paymentMethod: row.payment_method,
    value: Number(row.value),
    paid: row.paid,
    date: row.date ?? undefined,
    repeatAllMonths: row.repeat_all_months,
    baseExpenseId: row.base_expense_id || undefined,
    currentInstallment: row.current_installment ?? undefined,
    totalInstallments: row.total_installments ?? undefined,
    accountId: row.account_id ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

export function toInvestment(row: InvestmentRow): Investment {
  return {
    id: row.id,
    description: row.description,
    value: Number(row.value),
    tag: row.tag,
    date: row.date,
    invested: row.invested || false,
    repeatAllMonths: row.repeat_all_months,
    baseInvestmentId: row.base_investment_id || undefined,
    accountId: row.account_id ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

export function toCreditCard(row: CreditCardRow): CreditCard {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    paid: row.paid,
  };
}

export function toFinanceSettings(row: FinanceSettingsRow): FinanceSettings {
  return {
    incomeTags: row.income_tags,
    expenseCategories: row.expense_categories,
    investmentTags: row.investment_tags,
    paymentMethods: row.payment_methods,
  };
}

export function toFinancialRule(row: FinancialRuleRow): FinancialRule {
  const mapping = row.category_mapping as Record<string, 'essentials' | 'lifestyle'> | null;
  return {
    id: row.id,
    userId: row.user_id,
    essentialsPercentage: Number(row.essentials_percentage),
    lifestylePercentage: Number(row.lifestyle_percentage),
    investmentsPercentage: Number(row.investments_percentage),
    categoryMapping: mapping || {},
    isCustom: row.is_custom,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type WishItemRow = Database['public']['Tables']['wish_items']['Row'];

export function toWishItem(row: WishItemRow): WishItem {
  return {
    id: row.id,
    description: row.description,
    value: Number(row.value),
    urgency: row.urgency as WishItem['urgency'],
    startMonth: row.start_month,
    targetMonth: row.target_month,
    status: row.status as WishItem['status'],
    conqueredMonth: row.conquered_month ?? undefined,
    linkedExpenseId: row.linked_expense_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
