import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ApplyToAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyToCurrentMonth: () => void;
  onApplyToAllMonths: () => void;
  title: string;
  description: string;
  actionLabel: string;
  applyToAllButtonLabel?: string;
  itemSummary?: string;
  isDestructive?: boolean;
}

export const ApplyToAllDialog = ({
  open,
  onOpenChange,
  onApplyToCurrentMonth,
  onApplyToAllMonths,
  title,
  description,
  actionLabel,
  applyToAllButtonLabel,
  itemSummary,
  isDestructive = false,
}: ApplyToAllDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-lg max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {itemSummary && (
                <p className="text-sm font-medium text-foreground">{itemSummary}</p>
              )}
              <p>{description}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:gap-2 w-full">
          <AlertDialogCancel className="rounded-md w-full sm:w-auto sm:flex-shrink-0">Cancelar</AlertDialogCancel>
          <Button
            variant="outline"
            onClick={onApplyToCurrentMonth}
            className="rounded-md w-full sm:w-auto sm:flex-shrink-0"
          >
            {actionLabel} apenas este mês
          </Button>
          {isDestructive ? (
            <Button
              variant="destructive"
              onClick={onApplyToAllMonths}
              className="rounded-md w-full sm:w-auto sm:flex-shrink-0"
            >
              {applyToAllButtonLabel ?? `${actionLabel} em todos os meses`}
            </Button>
          ) : (
            <AlertDialogAction
              onClick={onApplyToAllMonths}
              className="rounded-md w-full sm:w-auto sm:flex-shrink-0"
            >
              {applyToAllButtonLabel ?? `${actionLabel} em todos os meses`}
            </AlertDialogAction>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
