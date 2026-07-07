import { useEffect, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
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
import type { Account } from '@/types/domain';
import { formatCurrency } from '@/lib/utils';
import {
  filterInvestmentAccounts,
  filterMovementAccounts,
} from '@/utils/business/accountRoles';
import {
  getDefaultEffectuateInvestmentAccounts,
  persistEffectuateInvestmentAccounts,
} from '@/utils/effectuateInvestmentDefaults';
import {
  EFFECTUATE_WALLET_FREE,
  toEffectuateAccountId,
} from '@/utils/effectuateWalletDefaults';

interface EffectuateInvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  amount: number;
  accounts: Account[];
  onConfirm: (sourceAccountId: string | null, destinationAccountId: string) => Promise<boolean>;
  onRequestAddMovementAccount?: () => void;
  onRequestAddInvestmentAccount?: () => void;
}

export const EffectuateInvestmentDialog = ({
  open,
  onOpenChange,
  description,
  amount,
  accounts,
  onConfirm,
  onRequestAddMovementAccount,
  onRequestAddInvestmentAccount,
}: EffectuateInvestmentDialogProps) => {
  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const movementAccounts = filterMovementAccounts(accounts);
  const investmentAccounts = filterInvestmentAccounts(accounts);

  const sourceOptions = useMemo(
    () => [
      { id: EFFECTUATE_WALLET_FREE, name: 'Saldo Livre' },
      ...movementAccounts.map((a) => ({ id: a.id, name: a.name })),
    ],
    [movementAccounts]
  );

  useEffect(() => {
    if (!open) return;
    const defaults = getDefaultEffectuateInvestmentAccounts(accounts);
    setSourceId(defaults.sourceId);
    setDestId(defaults.destId);
  }, [open, accounts]);

  const handleSubmit = async () => {
    if (!sourceId || !destId || sourceId === destId) return;

    setIsSubmitting(true);
    try {
      const ok = await onConfirm(toEffectuateAccountId(sourceId), destId);
      if (ok) {
        persistEffectuateInvestmentAccounts(sourceId, destId);
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const missingInvestment = investmentAccounts.length === 0;
  const canConfirm = !missingInvestment && !!sourceId && !!destId && sourceId !== destId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar aporte</DialogTitle>
          <DialogDescription>
            Informe de qual liquidez saiu o valor (carteira ou Saldo Livre) e em qual carteira de
            investimentos registrar a posição.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md bg-muted/50 px-3 py-2.5 space-y-1">
            <p className="text-sm font-medium truncate">{description}</p>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(amount)}</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Origem (liquidez)
            </label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger className="rounded-md h-10">
                <SelectValue placeholder="Origem do aporte" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                {sourceOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id} className="rounded-lg">
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {movementAccounts.length === 0 && onRequestAddMovementAccount && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 mt-1.5 text-xs text-muted-foreground"
                onClick={() => {
                  onOpenChange(false);
                  onRequestAddMovementAccount();
                }}
              >
                <Wallet className="h-3.5 w-3.5 mr-1 inline" />
                Criar carteira de movimentação
              </Button>
            )}
          </div>

          {missingInvestment ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
              Cadastre uma carteira de investimentos para registrar o destino do aporte.
              {onRequestAddInvestmentAccount && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full gap-1.5"
                  onClick={() => {
                    onOpenChange(false);
                    onRequestAddInvestmentAccount();
                  }}
                >
                  <Wallet className="h-4 w-4" />
                  Criar carteira de investimentos
                </Button>
              )}
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Destino (aplicação)
              </label>
              <Select value={destId} onValueChange={setDestId}>
                <SelectTrigger className="rounded-md h-10">
                  <SelectValue placeholder="Carteira de investimentos" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  {investmentAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="rounded-lg">
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canConfirm || isSubmitting}>
            Confirmar aporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
