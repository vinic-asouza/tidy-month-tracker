import { supabase } from '@/integrations/supabase/client';
import type { FinanceSettings } from '@/types/domain';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_TAGS,
  DEFAULT_INVESTMENT_TAGS,
  DEFAULT_PAYMENT_METHODS,
} from '@/types/finance';
import { throwIfError } from './helpers';

function getDefaultSettings(): FinanceSettings {
  return {
    incomeTags: DEFAULT_INCOME_TAGS,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    investmentTags: DEFAULT_INVESTMENT_TAGS,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
  };
}

export async function getSettings(userId: string): Promise<FinanceSettings> {
  const { data, error } = await supabase
    .from('finance_settings')
    .select('income_tags, expense_categories, investment_tags, payment_methods')
    .eq('user_id', userId)
    .maybeSingle();

  throwIfError(error);
  if (!data) return getDefaultSettings();

  return {
    incomeTags: data.income_tags || DEFAULT_INCOME_TAGS,
    expenseCategories: data.expense_categories || DEFAULT_EXPENSE_CATEGORIES,
    investmentTags: data.investment_tags || DEFAULT_INVESTMENT_TAGS,
    paymentMethods: data.payment_methods || DEFAULT_PAYMENT_METHODS,
  };
}

export async function updateInvestmentTags(userId: string, tags: string[]): Promise<void> {
  const { error } = await supabase
    .from('finance_settings')
    .upsert(
      { user_id: userId, investment_tags: tags },
      { onConflict: 'user_id' }
    );

  throwIfError(error);
}

export async function updateInvestmentTagInInvestments(
  userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  const { error } = await supabase
    .from('investments')
    .update({ tag: newTag })
    .eq('user_id', userId)
    .eq('tag', oldTag);

  throwIfError(error);
}

export async function updateIncomeTags(userId: string, tags: string[]): Promise<void> {
  const { error } = await supabase
    .from('finance_settings')
    .upsert(
      { user_id: userId, income_tags: tags },
      { onConflict: 'user_id' }
    );

  throwIfError(error);
}

export async function updateIncomeTagInIncomes(
  userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  const { error } = await supabase
    .from('incomes')
    .update({ tag: newTag })
    .eq('user_id', userId)
    .eq('tag', oldTag);

  throwIfError(error);
}

export async function updateExpenseCategories(
  userId: string,
  categories: string[]
): Promise<void> {
  const { error } = await supabase
    .from('finance_settings')
    .upsert(
      { user_id: userId, expense_categories: categories },
      { onConflict: 'user_id' }
    );

  throwIfError(error);
}

export async function updateExpenseCategoryInExpenses(
  userId: string,
  oldCategory: string,
  newCategory: string
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({ category: newCategory })
    .eq('user_id', userId)
    .eq('category', oldCategory);

  throwIfError(error);
}
