import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UnpayInvoiceConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName?: string;
  onConfirm: () => void | Promise<void>;
}

export const UnpayInvoiceConfirmDialog = ({
  open,
  onOpenChange,
  cardName,
  onConfirm,
}: UnpayInvoiceConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="rounded-lg">
      <AlertDialogHeader>
        <AlertDialogTitle>Desmarcar fatura como paga?</AlertDialogTitle>
        <AlertDialogDescription>
          {cardName
            ? `A fatura de ${cardName} voltará ao status pendente e o débito na carteira será removido.`
            : 'O débito registrado na carteira será removido.'}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="rounded-md">Cancelar</AlertDialogCancel>
        <AlertDialogAction
          className="rounded-md"
          onClick={() => void onConfirm()}
        >
          Desmarcar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
