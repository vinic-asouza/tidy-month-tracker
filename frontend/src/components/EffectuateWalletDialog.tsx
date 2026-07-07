import { useEffect, useMemo, useState } from 'react';
import { Link2Off, Wallet } from 'lucide-react';
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
import { filterMovementAccounts } from '@/utils/business/accountRoles';
import {
  EFFECTUATE_WALLET_FREE,
  getDefaultEffectuateAccountId,
  persistEffectuateAccountId,
  toEffectuateAccountId,
} from '@/utils/effectuateWalletDefaults';

export type EffectuateWalletKind = 'income' | 'expense' | 'investment';

const KIND_LABELS: Record<
  EffectuateWalletKind,
  { title: string; description: string; walletLabel: string }
> = {
  income: {
    title: 'Receber entrada',
    description: 'Informe em qual carteira o valor entrou.',
    walletLabel: 'Carteira receptora',
  },
  expense: {
    title: 'Confirmar pagamento',
    description: 'Informe de qual carteira saiu o pagamento.',
    walletLabel: 'Carteira pagadora',
  },
  investment: {
    title: 'Confirmar aporte',
    description: 'Informe em qual carteira registrar o aporte.',
    walletLabel: 'Carteira de destino',
  },
};

const EMPTY_ACCOUNT_LABELS: Record<
  EffectuateWalletKind,
  { title: string; description: string }
> = {
  income: {
    title: 'Receber entrada',
    description:
      'Este valor será registrado no Saldo Livre. Crie uma carteira se preferir organizar por conta.',
  },
  expense: {
    title: 'Confirmar pagamento',
    description:
      'Este valor será registrado no Saldo Livre. Crie uma carteira se preferir organizar por conta.',
  },
  investment: {
    title: 'Confirmar aporte',
    description:
      'Este aporte será registrado no Saldo Livre. Crie uma carteira se preferir organizar por conta.',
  },
};

interface EffectuateWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: EffectuateWalletKind;
  description: string;
  amount: number;
  accounts: Account[];
  paymentMethod?: string;
  onConfirm: (accountId: string | null) => Promise<boolean>;
  onRequestAddAccount?: () => void;
}

export const EffectuateWalletDialog = ({
  open,
  onOpenChange,
  kind,
  description,
  amount,
  accounts,
  paymentMethod,
  onConfirm,
  onRequestAddAccount,
}: EffectuateWalletDialogProps) => {
  const [selectedId, setSelectedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAccounts = accounts.length > 0;
  const movementAccounts = useMemo(() => filterMovementAccounts(accounts), [accounts]);
  const walletAccounts = movementAccounts;
  const labels = hasAccounts ? KIND_LABELS[kind] : EMPTY_ACCOUNT_LABELS[kind];
  const context = kind === 'expense' ? paymentMethod : undefined;

  useEffect(() => {
    if (!open) return;
    setSelectedId(getDefaultEffectuateAccountId(kind, walletAccounts, context));
  }, [open, kind, walletAccounts, context]);

  const handleSubmit = async () => {
    if (!hasAccounts) {
      setIsSubmitting(true);
      try {
        const ok = await onConfirm(null);
        if (ok) {
          persistEffectuateAccountId(kind, null, context);
          onOpenChange(false);
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedId) return;

    setIsSubmitting(true);
    try {
      const accountId = toEffectuateAccountId(selectedId);
      const ok = await onConfirm(accountId);
      if (ok) {
        persistEffectuateAccountId(kind, accountId, context);
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAddAccount = () => {
    onOpenChange(false);
    onRequestAddAccount?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md bg-muted/50 px-3 py-2.5 space-y-1">
            <p className="text-sm font-medium truncate">{description}</p>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(amount)}</p>
          </div>

          {hasAccounts ? (
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                {KIND_LABELS[kind].walletLabel}
              </label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="rounded-md h-10">
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value={EFFECTUATE_WALLET_FREE} className="rounded-lg">
                    Saldo Livre
                  </SelectItem>
                  {walletAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="rounded-lg">
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="rounded-md border-2 border-dashed border-border bg-muted/30 px-3 py-3 flex items-start gap-2.5">
              <Link2Off className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Saldo Livre</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use quando o dinheiro não está em uma conta específica que você quer acompanhar.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          {!hasAccounts && onRequestAddAccount && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRequestAddAccount}
              disabled={isSubmitting}
              className="w-full sm:w-auto sm:mr-auto gap-1.5"
            >
              <Wallet className="h-4 w-4" />
              Criar carteira
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={(hasAccounts && !selectedId) || isSubmitting}
          >
            {hasAccounts ? 'Confirmar' : 'Confirmar no Saldo Livre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
