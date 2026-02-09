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
  actionLabel: string; // Ex: "Editar" ou "Excluir"
}

export const ApplyToAllDialog = ({
  open,
  onOpenChange,
  onApplyToCurrentMonth,
  onApplyToAllMonths,
  title,
  description,
  actionLabel,
}: ApplyToAllDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:gap-2 w-full">
          <AlertDialogCancel className="rounded-xl w-full sm:w-auto sm:flex-shrink-0">Cancelar</AlertDialogCancel>
          <Button
            variant="outline"
            onClick={onApplyToCurrentMonth}
            className="rounded-xl w-full sm:w-auto sm:flex-shrink-0"
          >
            {actionLabel} apenas este mês
          </Button>
          <AlertDialogAction
            onClick={onApplyToAllMonths}
            className="rounded-xl w-full sm:w-auto sm:flex-shrink-0"
          >
            {actionLabel} em todos os meses
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
