import { supabase } from '@/integrations/supabase/client';
import type {
  FinancialRule,
  CreateFinancialRuleInput,
  UpdateFinancialRuleInput,
} from '@/types/domain';
import { DEFAULT_EXPENSE_CATEGORIES } from '@/types/finance';
import {
  getUnmappedCategories,
  mergeMappingWithCategories,
  renameCategoryInMapping as renameMappingKey,
  type CategoryMapping,
} from '@/utils/business/financialRuleMapping';
import { toFinancialRule } from '../mappers';
import { getAuthUserId, throwIfError } from './helpers';

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

function validateBuckets(categoryMapping: CategoryMapping): void {
  for (const [category, type] of Object.entries(categoryMapping)) {
    if (type !== 'essentials' && type !== 'lifestyle') {
      throw new Error(
        `Tipo inválido para categoria "${category}": ${type}. Deve ser "essentials" ou "lifestyle"`
      );
    }
  }
}

function validateCategoryMapping(
  categoryMapping: CategoryMapping,
  allCategories: string[]
): void {
  const unmappedCategories = getUnmappedCategories(categoryMapping, allCategories);

  if (unmappedCategories.length > 0) {
    throw new Error(
      `Todas as categorias devem estar mapeadas. Categorias não mapeadas: ${unmappedCategories.join(', ')}`
    );
  }

  validateBuckets(categoryMapping);
}

async function getExpenseCategories(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('finance_settings')
    .select('expense_categories')
    .eq('user_id', userId)
    .maybeSingle();

  throwIfError(error);
  const categories = data?.expense_categories || [];
  return categories.length > 0 ? categories : [...DEFAULT_EXPENSE_CATEGORIES];
}

export async function getFinancialRule(): Promise<FinancialRule | null> {
  const userId = await getAuthUserId();

  const { data, error } = await supabase
    .from('financial_rule')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  throwIfError(error);
  if (!data) return null;

  return toFinancialRule(data);
}

export async function createFinancialRule(
  data: CreateFinancialRuleInput
): Promise<FinancialRule> {
  const userId = await getAuthUserId();

  validatePercentages(
    data.essentialsPercentage,
    data.lifestylePercentage,
    data.investmentsPercentage
  );

  const categories = await getExpenseCategories(userId);
  validateCategoryMapping(data.categoryMapping, categories);

  const { data: row, error } = await supabase
    .from('financial_rule')
    .insert({
      user_id: userId,
      essentials_percentage: data.essentialsPercentage,
      lifestyle_percentage: data.lifestylePercentage,
      investments_percentage: data.investmentsPercentage,
      category_mapping: data.categoryMapping,
      is_custom: data.isCustom,
    })
    .select('*')
    .single();

  throwIfError(error);
  return toFinancialRule(row!);
}

export async function updateFinancialRule(
  data: UpdateFinancialRuleInput
): Promise<FinancialRule> {
  const userId = await getAuthUserId();
  const currentRule = await getFinancialRule();

  if (!currentRule) {
    throw new Error('Regra financeira não encontrada');
  }

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

  validatePercentages(
    updatedData.essentialsPercentage,
    updatedData.lifestylePercentage,
    updatedData.investmentsPercentage
  );

  // Sempre alinhar o mapping às categorias atuais (remove chaves órfãs).
  // Validação completa (todas mapeadas) só quando o caller envia categoryMapping
  // (ex.: wizard passo 2). Update só de % preserva buckets e deixa novas pendentes.
  const categories = await getExpenseCategories(userId);
  updatedData.categoryMapping = mergeMappingWithCategories(
    updatedData.categoryMapping,
    categories
  );

  if (data.categoryMapping) {
    validateCategoryMapping(updatedData.categoryMapping, categories);
  } else {
    validateBuckets(updatedData.categoryMapping);
  }

  const { data: row, error } = await supabase
    .from('financial_rule')
    .update({
      essentials_percentage: updatedData.essentialsPercentage,
      lifestyle_percentage: updatedData.lifestylePercentage,
      investments_percentage: updatedData.investmentsPercentage,
      category_mapping: updatedData.categoryMapping,
      is_custom: updatedData.isCustom,
    })
    .eq('user_id', userId)
    .select('*')
    .single();

  throwIfError(error);
  return toFinancialRule(row!);
}

/** Renomeia a chave no category_mapping preservando o bucket (DEV-55). */
export async function renameCategoryInMapping(
  oldCategory: string,
  newCategory: string
): Promise<FinancialRule | null> {
  const userId = await getAuthUserId();
  const currentRule = await getFinancialRule();
  if (!currentRule) return null;

  const mapping = renameMappingKey(currentRule.categoryMapping, oldCategory, newCategory);
  if (!mapping) return currentRule;

  const { data: row, error } = await supabase
    .from('financial_rule')
    .update({ category_mapping: mapping })
    .eq('user_id', userId)
    .select('*')
    .single();

  throwIfError(error);
  return toFinancialRule(row!);
}

export async function deleteFinancialRule(): Promise<void> {
  const userId = await getAuthUserId();

  const { data, error } = await supabase
    .from('financial_rule')
    .delete()
    .eq('user_id', userId)
    .select('id');

  throwIfError(error);
  if (!data || data.length === 0) {
    throw new Error('Regra financeira não encontrada');
  }
}
