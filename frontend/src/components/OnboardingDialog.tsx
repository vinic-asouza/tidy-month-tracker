import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ONBOARDING_STEPS, clampOnboardingStep } from '@/utils/onboarding';

type OnboardingDialogProps = {
  open: boolean;
  step: number;
  saving: boolean;
  onPause: () => void;
  onSkip: () => void;
  onDismiss: () => void;
  onPrimary: () => void;
};

export function OnboardingDialog({
  open,
  step,
  saving,
  onPause,
  onSkip,
  onDismiss,
  onPrimary,
}: OnboardingDialogProps) {
  const current = ONBOARDING_STEPS[clampOnboardingStep(step)];
  const position = clampOnboardingStep(step) + 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onPause();
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onPointerDownOutside={(event) => {
          if (saving) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (saving) event.preventDefault();
        }}
      >
        <DialogHeader>
          <p className="text-xs font-medium text-muted-foreground">
            Passo {position} de {ONBOARDING_STEPS.length}
          </p>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription className="text-left text-sm leading-relaxed text-foreground/80">
            {current.body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={onDismiss}
          >
            Agora não
          </Button>
          {current.primaryAction !== 'complete' && (
            <Button type="button" variant="outline" disabled={saving} onClick={onSkip}>
              Pular este passo
            </Button>
          )}
          <Button type="button" disabled={saving} onClick={onPrimary}>
            {current.primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
