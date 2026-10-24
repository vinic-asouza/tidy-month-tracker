import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  completeOnboarding,
  getOnboardingState,
  hasPriorProductUsage,
  saveOnboardingStep,
} from '@/services/onboarding';
import {
  ONBOARDING_LAST_STEP,
  ONBOARDING_STEPS,
  clampOnboardingStep,
  shouldOfferOnboarding,
} from '@/utils/onboarding';

export function useOnboarding(enabled: boolean) {
  const [ready, setReady] = useState(false);
  const [offer, setOffer] = useState(false);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled || loaded.current) return;
    let cancelled = false;

    (async () => {
      try {
        const [state, usage] = await Promise.all([
          getOnboardingState(),
          hasPriorProductUsage(),
        ]);
        if (cancelled) return;
        loaded.current = true;
        const show = shouldOfferOnboarding({
          completedAt: state.completedAt,
          step: state.step,
          hasFinancialRule: usage.hasFinancialRule,
          hasLancamento: usage.hasLancamento,
        });
        setOffer(show);
        setStep(clampOnboardingStep(state.step));
        setOpen(show);
        setPaused(false);
      } catch {
        if (cancelled) return;
        loaded.current = true;
        setOffer(false);
        setOpen(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const pause = useCallback(() => {
    setOpen(false);
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (!offer) return;
    setPaused(false);
    setOpen(true);
  }, [offer]);

  const finish = useCallback(async (dismissed: boolean) => {
    setSaving(true);
    try {
      await completeOnboarding(dismissed);
      setOffer(false);
      setOpen(false);
      setPaused(false);
    } catch {
      toast.error('Não foi possível encerrar a introdução. Tente de novo.');
    } finally {
      setSaving(false);
    }
  }, []);

  const skip = useCallback(async () => {
    if (step >= ONBOARDING_LAST_STEP) {
      await finish(true);
      return;
    }
    const next = clampOnboardingStep(step + 1);
    setSaving(true);
    try {
      await saveOnboardingStep(next);
      setStep(next);
    } catch {
      toast.error('Não foi possível pular este passo. Tente de novo.');
    } finally {
      setSaving(false);
    }
  }, [finish, step]);

  const runPrimary = useCallback(
    async (actions: { openRule: () => void; openExpenses: () => void }) => {
      const current = ONBOARDING_STEPS[clampOnboardingStep(step)];
      if (current.primaryAction === 'open-rule') {
        actions.openRule();
        pause();
        return;
      }
      if (current.primaryAction === 'open-expenses') {
        actions.openExpenses();
        pause();
        return;
      }
      if (current.primaryAction === 'complete') {
        await finish(false);
        return;
      }
      await skip();
    },
    [finish, pause, skip, step]
  );

  return {
    ready,
    offer,
    step,
    open: enabled && open,
    paused: enabled && paused && offer,
    saving,
    pause,
    resume,
    skip,
    dismiss: () => finish(true),
    runPrimary,
  };
}
