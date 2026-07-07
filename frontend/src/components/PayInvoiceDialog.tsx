import { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Account, CreditCard } from '@/types/domain';
import { cn, formatCurrency, formatDateToYYYYMMDD } from '@/lib/utils';
import { filterMovementAccounts } from '@/utils/business/accountRoles';
import {
  EFFECTUATE_WALLET_FREE,
  toEffectuateAccountId,
} from '@/utils/effectuateWalletDefaults';

const lastWalletKey = (cardId: string) => `invoicePaymentAccount:${cardId}`;

export function getDefaultInvoicePaymentAccountId(
  cardId: string,
  movementAccounts: Account[]
): string {
  try {
    const stored = localStorage.getItem(lastWalletKey(cardId));
    if (stored === EFFECTUATE_WALLET_FREE) return EFFECTUATE_WALLET_FREE;
    if (stored && movementAccounts.some((a) => a.id === stored)) return stored;
  } catch {
    // ignore
  }
  return movementAccounts[0]?.id ?? EFFECTUATE_WALLET_FREE;
}

interface PayInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CreditCard | null;
  invoiceTotal: number;
  accounts: Account[];
  onConfirm: (
    paymentAccountId: string | null,
    operationDate: string
  ) => Promise<boolean>;
}

export const PayInvoiceDialog = ({
  open,
  onOpenChange,
  card,
  invoiceTotal,
  accounts,
  onConfirm,
}: PayInvoiceDialogProps) => {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [operationDate, setOperationDate] = useState(() => formatDateToYYYYMMDD(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const movementAccounts = useMemo(() => filterMovementAccounts(accounts), [accounts]);

  useEffect(() => {
    if (!open || !card) return;
    setSelectedAccountId(getDefaultInvoicePaymentAccountId(card.id, movementAccounts));
    setOperationDate(formatDateToYYYYMMDD(new Date()));
  }, [open, card, movementAccounts]);

  const handleSubmit = async () => {
    if (!selectedAccountId || !card) return;

    setIsSubmitting(true);
    try {
      const paymentAccountId = toEffectuateAccountId(selectedAccountId);
      const ok = await onConfirm(paymentAccountId, operationDate);
      if (ok) {
        try {
          localStorage.setItem(lastWalletKey(card.id), selectedAccountId);
        } catch {
          // ignore
        }
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
            Este valor será debitado da carteira escolhida ou do Saldo Livre. Os lançamentos
            individuais do cartão não afetam carteiras separadamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total da fatura</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(invoiceTotal)}</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Pago com
            </label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="rounded-md h-10">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value={EFFECTUATE_WALLET_FREE} className="rounded-lg">
                  Saldo Livre
                </SelectItem>
                {movementAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id} className="rounded-lg">
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Data do pagamento
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal rounded-md h-10',
                    !operationDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {operationDate
                    ? new Date(operationDate + 'T12:00:00').toLocaleDateString('pt-BR')
                    : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    operationDate ? new Date(operationDate + 'T12:00:00') : undefined
                  }
                  onSelect={(d) => d && setOperationDate(formatDateToYYYYMMDD(d))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
            disabled={!selectedAccountId || isSubmitting}
          >
            {isSubmitting ? 'Salvando…' : 'Confirmar pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
