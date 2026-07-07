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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import type { Account } from '@/types/domain';
import { cn, formatDateToYYYYMMDD } from '@/lib/utils';
import { filterMovementAccounts } from '@/utils/business/accountRoles';
import {
  EFFECTUATE_WALLET_FREE,
  toEffectuateAccountId,
} from '@/utils/effectuateWalletDefaults';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  sourceAccountId?: string | null;
  onSubmit: (
    sourceAccountId: string | null,
    destinationAccountId: string | null,
    amount: number,
    operationDate: string,
    description?: string
  ) => Promise<boolean>;
}

export const TransferDialog = ({
  open,
  onOpenChange,
  accounts,
  sourceAccountId,
  onSubmit,
}: TransferDialogProps) => {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [operationDate, setOperationDate] = useState(() => formatDateToYYYYMMDD(new Date()));
  const [valueError, setValueError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const movementAccounts = useMemo(() => filterMovementAccounts(accounts), [accounts]);

  const sourceOptions = useMemo(
    () => [
      { id: EFFECTUATE_WALLET_FREE, name: 'Saldo Livre' },
      ...movementAccounts.map((a) => ({ id: a.id, name: a.name })),
    ],
    [movementAccounts]
  );

  const destinationOptions = useMemo(
    () => sourceOptions.filter((option) => option.id !== fromAccountId),
    [sourceOptions, fromAccountId]
  );

  const canTransfer = sourceOptions.length >= 2;

  useEffect(() => {
    if (!open) return;
    const defaultFrom =
      sourceAccountId === EFFECTUATE_WALLET_FREE
        ? EFFECTUATE_WALLET_FREE
        : sourceAccountId ?? movementAccounts[0]?.id ?? EFFECTUATE_WALLET_FREE;
    const defaultTo =
      sourceOptions.find((o) => o.id !== defaultFrom)?.id ?? '';
    setFromAccountId(defaultFrom);
    setToAccountId(defaultTo);
    setValue('');
    setDescription('');
    setOperationDate(formatDateToYYYYMMDD(new Date()));
    setValueError(null);
    setAccountError(null);
  }, [open, sourceAccountId, movementAccounts, sourceOptions]);

  useEffect(() => {
    if (!toAccountId || toAccountId === fromAccountId) {
      setToAccountId(destinationOptions[0]?.id ?? '');
    }
  }, [fromAccountId, toAccountId, destinationOptions]);

  const handleSubmit = async () => {
    const amount = parseCurrencyToNumber(value);
    if (!fromAccountId || !toAccountId) return;
    if (fromAccountId === toAccountId) {
      setAccountError('Escolha origens e destinos diferentes');
      return;
    }

    const resolvedSource = toEffectuateAccountId(fromAccountId);
    const resolvedDest = toEffectuateAccountId(toAccountId);
    if (!resolvedSource && !resolvedDest) {
      setAccountError('Informe pelo menos uma carteira');
      return;
    }

    if (amount <= 0) {
      setValueError('Informe um valor maior que zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onSubmit(
        resolvedSource,
        resolvedDest,
        amount,
        operationDate,
        description.trim() || undefined
      );
      if (ok) onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir entre carteiras</DialogTitle>
          <DialogDescription>
            Move valor entre carteiras ou Saldo Livre sem alterar o resumo do mês nem a regra
            50/30/20.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">De</label>
              <Select
                value={fromAccountId || undefined}
                onValueChange={(v) => {
                  setFromAccountId(v);
                  setAccountError(null);
                }}
                disabled={!canTransfer}
              >
                <SelectTrigger
                  className={cn(
                    'rounded-md h-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    accountError && 'border-destructive'
                  )}
                >
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  {sourceOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id} className="rounded-lg">
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">Para</label>
              <Select
                value={toAccountId || undefined}
                onValueChange={(v) => {
                  setToAccountId(v);
                  setAccountError(null);
                }}
                disabled={destinationOptions.length === 0}
              >
                <SelectTrigger
                  className={cn(
                    'rounded-md h-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    accountError && 'border-destructive'
                  )}
                >
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  {destinationOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id} className="rounded-lg">
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {accountError && <p className="text-destructive text-sm">{accountError}</p>}

          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">Data</label>
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
                  selected={operationDate ? new Date(operationDate + 'T12:00:00') : undefined}
                  onSelect={(d) => d && setOperationDate(formatDateToYYYYMMDD(d))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">Valor</label>
            <CurrencyInput
              value={value}
              onValueChange={(v) => {
                setValue(v);
                setValueError(null);
              }}
              className={cn('rounded-md h-10', valueError && 'border-destructive')}
            />
            {valueError && <p className="text-destructive text-sm mt-1">{valueError}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Descrição (opcional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Transferência para conta corrente"
              className="rounded-md h-10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !canTransfer || destinationOptions.length === 0}
          >
            {isSubmitting ? 'Salvando...' : 'Transferir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
