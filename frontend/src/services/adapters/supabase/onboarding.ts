import { supabase } from '@/integrations/supabase/client';
import { getAuthUserId, throwIfError } from './helpers';
import { clampOnboardingStep } from '@/utils/onboarding';

export type OnboardingRecord = {
  step: number;
  completedAt: string | null;
  dismissed: boolean;
};

export type PriorProductUsage = {
  hasFinancialRule: boolean;
  hasLancamento: boolean;
};

const EMPTY_RECORD: OnboardingRecord = {
  step: 0,
  completedAt: null,
  dismissed: false,
};

async function countRows(
  table: 'incomes' | 'expenses' | 'investments' | 'financial_rule',
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  throwIfError(error);
  return count ?? 0;
}

export async function getOnboardingState(): Promise<OnboardingRecord> {
  const userId = await getAuthUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_step, onboarding_completed_at, onboarding_dismissed')
    .eq('user_id', userId)
    .maybeSingle();

  throwIfError(error);
  if (!data) return EMPTY_RECORD;

  return {
    step: clampOnboardingStep(data.onboarding_step),
    completedAt: data.onboarding_completed_at,
    dismissed: data.onboarding_dismissed,
  };
}

export async function hasPriorProductUsage(): Promise<PriorProductUsage> {
  const userId = await getAuthUserId();
  const [ruleCount, incomeCount, expenseCount, investmentCount] = await Promise.all([
    countRows('financial_rule', userId),
    countRows('incomes', userId),
    countRows('expenses', userId),
    countRows('investments', userId),
  ]);

  return {
    hasFinancialRule: ruleCount > 0,
    hasLancamento: incomeCount + expenseCount + investmentCount > 0,
  };
}

export async function saveOnboardingStep(step: number): Promise<void> {
  const userId = await getAuthUserId();
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: clampOnboardingStep(step) })
    .eq('user_id', userId);

  throwIfError(error);
}

export async function completeOnboarding(dismissed: boolean): Promise<void> {
  const userId = await getAuthUserId();
  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed_at: new Date().toISOString(),
      onboarding_dismissed: dismissed,
    })
    .eq('user_id', userId);

  throwIfError(error);
}
