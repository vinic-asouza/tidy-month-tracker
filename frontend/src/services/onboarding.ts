import { onboardingAdapter } from './adapters/select';

export function getOnboardingState() {
  return onboardingAdapter().getOnboardingState();
}

export function hasPriorProductUsage() {
  return onboardingAdapter().hasPriorProductUsage();
}

export function saveOnboardingStep(step: number) {
  return onboardingAdapter().saveOnboardingStep(step);
}

export function completeOnboarding(dismissed: boolean) {
  return onboardingAdapter().completeOnboarding(dismissed);
}
