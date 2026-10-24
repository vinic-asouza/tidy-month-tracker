import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_LAST_STEP,
  ONBOARDING_STEPS,
  clampOnboardingStep,
  shouldOfferOnboarding,
} from '@/utils/onboarding';

const fresh = {
  completedAt: null,
  step: 0,
  hasFinancialRule: false,
  hasLancamento: false,
};

describe('shouldOfferOnboarding', () => {
  it('mostra no primeiro acesso sem uso', () => {
    expect(shouldOfferOnboarding(fresh)).toBe(true);
  });

  it('não mostra se o guia já encerrou', () => {
    expect(
      shouldOfferOnboarding({ ...fresh, completedAt: '2026-10-24T00:00:00.000Z' })
    ).toBe(false);
  });

  it('não mostra conta antiga com regra ou lançamento ainda no passo zero', () => {
    expect(shouldOfferOnboarding({ ...fresh, hasFinancialRule: true })).toBe(false);
    expect(shouldOfferOnboarding({ ...fresh, hasLancamento: true })).toBe(false);
  });

  it('continua se a pessoa criou regra ou lançamento no meio do guia', () => {
    expect(
      shouldOfferOnboarding({ ...fresh, step: 1, hasFinancialRule: true })
    ).toBe(true);
    expect(
      shouldOfferOnboarding({ ...fresh, step: 2, hasLancamento: true })
    ).toBe(true);
  });

  it('retoma o passo salvo enquanto não houver fim', () => {
    expect(shouldOfferOnboarding({ ...fresh, step: 3 })).toBe(true);
  });
});

describe('clampOnboardingStep', () => {
  it('prende o passo no intervalo do guia', () => {
    expect(clampOnboardingStep(-1)).toBe(0);
    expect(clampOnboardingStep(1.9)).toBe(1);
    expect(clampOnboardingStep(99)).toBe(ONBOARDING_LAST_STEP);
    expect(clampOnboardingStep(Number.NaN)).toBe(0);
  });
});

describe('ONBOARDING_STEPS', () => {
  it('tem propósito, regra, lançamento e leitura do resumo', () => {
    expect(ONBOARDING_STEPS.map((step) => step.id)).toEqual([
      'purpose',
      'rule',
      'entry',
      'summary',
    ]);
    expect(ONBOARDING_STEPS).toHaveLength(ONBOARDING_LAST_STEP + 1);
    expect(ONBOARDING_STEPS[ONBOARDING_LAST_STEP].primaryAction).toBe('complete');
  });
});
