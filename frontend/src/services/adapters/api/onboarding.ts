import { clampOnboardingStep } from '@/utils/onboarding';
import type { OnboardingRecord, PriorProductUsage } from '../supabase/onboarding';

let memory: OnboardingRecord = {
  step: 0,
  completedAt: null,
  dismissed: false,
};

export async function getOnboardingState(): Promise<OnboardingRecord> {
  return { ...memory };
}

export async function hasPriorProductUsage(): Promise<PriorProductUsage> {
  return { hasFinancialRule: false, hasLancamento: false };
}

export async function saveOnboardingStep(step: number): Promise<void> {
  memory = { ...memory, step: clampOnboardingStep(step) };
}

export async function completeOnboarding(dismissed: boolean): Promise<void> {
  memory = {
    ...memory,
    completedAt: new Date().toISOString(),
    dismissed,
  };
}
