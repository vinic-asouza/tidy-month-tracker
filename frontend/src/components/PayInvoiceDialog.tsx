import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CreditCard } from '@/types/domain';
import { formatCurrency } from '@/lib/utils';

interface PayInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CreditCard | null;
  invoiceTotal: number;
  onConfirm: () => Promise<boolean>;
}

export const PayInvoiceDialog = ({
  open,
  onOpenChange,
  card,
  invoiceTotal,
  onConfirm,
}: PayInvoiceDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!card) return;

    setIsSubmitting(true);
    try {
      const ok = await onConfirm();
      if (ok) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar fatura — {card?.name ?? 'Cartão'}</DialogTitle>
          <DialogDescription>
            Marque a fatura deste mês como paga. Os lançamentos individuais do cartão continuam
            na fatura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total da fatura</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(invoiceTotal)}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="rounded-md"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            className="rounded-md"
            onClick={() => void handleSubmit()}
            disabled={!card || isSubmitting}
          >
            {isSubmitting ? 'Salvando…' : 'Confirmar pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
