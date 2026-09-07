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

type SettingsColumn = 'income_tags' | 'expense_categories' | 'investment_tags' | 'payment_methods';

function normalizeTagList(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (!tag) return false;
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function updateSettingsColumn(
  userId: string,
  column: SettingsColumn,
  value: string[]
): Promise<void> {
  const normalized = normalizeTagList(value);
  const { data, error } = await supabase
    .from('finance_settings')
    .update({ [column]: normalized })
    .eq('user_id', userId)
    .select('user_id');

  throwIfError(error);

  if (!data || data.length === 0) {
    const defaults = getDefaultSettings();
    const { error: insertError } = await supabase.from('finance_settings').insert({
      user_id: userId,
      income_tags: defaults.incomeTags,
      expense_categories: defaults.expenseCategories,
      investment_tags: defaults.investmentTags,
      payment_methods: defaults.paymentMethods,
      [column]: normalized,
    });

    throwIfError(insertError);
  }
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

/**
 * Rename de tag de aporte: grava a lista direto (rename não é exclusão, então
 * não passa pelo guard de uso) e propaga o novo nome para o histórico.
 */
export async function renameInvestmentTag(
  userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  const current = await getSettings(userId);
  const tags = current.investmentTags.map((t) => (t === oldTag ? newTag : t));

  await updateSettingsColumn(userId, 'investment_tags', tags);
  await updateInvestmentTagInInvestments(userId, oldTag, newTag);
}

export async function isIncomeTagInUse(userId: string, tag: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('incomes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tag', tag);

  throwIfError(error);
  return (count ?? 0) > 0;
}

export async function isExpenseCategoryInUse(
  userId: string,
  category: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('category', category);

  throwIfError(error);
  return (count ?? 0) > 0;
}

export async function isInvestmentTagInUse(userId: string, tag: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('investments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tag', tag);

  throwIfError(error);
  return (count ?? 0) > 0;
}

export async function updateIncomeTags(userId: string, tags: string[]): Promise<void> {
  const current = await getSettings(userId);
  const removed = current.incomeTags.filter((t) => !tags.includes(t));
  for (const tag of removed) {
    if (await isIncomeTagInUse(userId, tag)) {
      throw new Error(
        'Não é possível excluir: esta categoria está em uso no histórico de entradas'
      );
    }
  }
  await updateSettingsColumn(userId, 'income_tags', tags);
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

/** Rename de categoria de entrada: sem guard de uso, propagando para o histórico. */
export async function renameIncomeTag(
  userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  const current = await getSettings(userId);
  const tags = current.incomeTags.map((t) => (t === oldTag ? newTag : t));

  await updateSettingsColumn(userId, 'income_tags', tags);
  await updateIncomeTagInIncomes(userId, oldTag, newTag);
}

export async function updateExpenseCategories(
  userId: string,
  categories: string[]
): Promise<void> {
  const current = await getSettings(userId);
  const removed = current.expenseCategories.filter((c) => !categories.includes(c));
  for (const category of removed) {
    if (await isExpenseCategoryInUse(userId, category)) {
      throw new Error(
        'Não é possível excluir: esta categoria está em uso no histórico de gastos'
      );
    }
  }
  await updateSettingsColumn(userId, 'expense_categories', categories);
}

export async function updateInvestmentTags(userId: string, tags: string[]): Promise<void> {
  const current = await getSettings(userId);
  const removed = current.investmentTags.filter((t) => !tags.includes(t));
  for (const tag of removed) {
    if (await isInvestmentTagInUse(userId, tag)) {
      throw new Error(
        'Não é possível excluir: esta tag está em uso no histórico de aportes'
      );
    }
  }
  await updateSettingsColumn(userId, 'investment_tags', tags);
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

/** Rename de categoria de gasto: sem guard de uso, propagando para o histórico. */
export async function renameExpenseCategory(
  userId: string,
  oldCategory: string,
  newCategory: string
): Promise<void> {
  const current = await getSettings(userId);
  const categories = current.expenseCategories.map((c) =>
    c === oldCategory ? newCategory : c
  );

  await updateSettingsColumn(userId, 'expense_categories', categories);
  await updateExpenseCategoryInExpenses(userId, oldCategory, newCategory);
}
