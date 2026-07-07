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
import {
  filterInvestmentAccounts,
  filterMovementAccounts,
} from '@/utils/business/accountRoles';

export const WITHDRAWAL_DEST_FREE = '__free__';

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  sourceAccountId?: string | null;
  onSubmit: (
    sourceAccountId: string,
    amount: number,
    operationDate: string,
    description: string | undefined,
    destinationAccountId: string | null
  ) => Promise<boolean>;
}

export const WithdrawalDialog = ({
  open,
  onOpenChange,
  accounts,
  sourceAccountId,
  onSubmit,
}: WithdrawalDialogProps) => {
  const investmentAccounts = useMemo(() => filterInvestmentAccounts(accounts), [accounts]);
  const movementAccounts = useMemo(() => filterMovementAccounts(accounts), [accounts]);

  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [destinationId, setDestinationId] = useState(WITHDRAWAL_DEST_FREE);
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [operationDate, setOperationDate] = useState(() => formatDateToYYYYMMDD(new Date()));
  const [valueError, setValueError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initialSource =
      sourceAccountId && investmentAccounts.some((a) => a.id === sourceAccountId)
        ? sourceAccountId
        : investmentAccounts[0]?.id ?? '';
    setSelectedSourceId(initialSource);
    setDestinationId(
      movementAccounts[0]?.id ? movementAccounts[0].id : WITHDRAWAL_DEST_FREE
    );
    setValue('');
    setDescription('');
    setOperationDate(formatDateToYYYYMMDD(new Date()));
    setValueError(null);
  }, [open, sourceAccountId, investmentAccounts, movementAccounts]);

  const handleSubmit = async () => {
    const amount = parseCurrencyToNumber(value);
    if (!selectedSourceId) return;
    if (amount <= 0) {
      setValueError('Informe um valor maior que zero');
      return;
    }

    const destAccountId =
      destinationId === WITHDRAWAL_DEST_FREE ? null : destinationId;

    setIsSubmitting(true);
    try {
      const ok = await onSubmit(
        selectedSourceId,
        amount,
        operationDate,
        description.trim() || undefined,
        destAccountId
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
          <DialogTitle>Registrar resgate</DialogTitle>
          <DialogDescription>
            Retira valor da carteira de investimentos e credita em uma carteira de movimentação ou
            no Saldo Livre.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Carteira de investimentos (origem)
            </label>
            <Select
              value={selectedSourceId || undefined}
              onValueChange={setSelectedSourceId}
              disabled={investmentAccounts.length === 0}
            >
              <SelectTrigger className="rounded-md h-10">
                <SelectValue placeholder="Selecione a carteira" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                {investmentAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id} className="rounded-lg">
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Destino do resgate
            </label>
            <Select value={destinationId} onValueChange={setDestinationId}>
              <SelectTrigger className="rounded-md h-10">
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                {movementAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id} className="rounded-lg">
                    {account.name}
                  </SelectItem>
                ))}
                <SelectItem value={WITHDRAWAL_DEST_FREE} className="rounded-lg">
                  Saldo Livre
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              placeholder="Ex: Resgate da reserva"
              className="rounded-md h-10"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Uma entrada será criada automaticamente em Entradas (já recebida). O resumo e a regra
          50/30/20 serão atualizados; seu patrimônio total permanece o mesmo.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || investmentAccounts.length === 0}
          >
            {isSubmitting ? 'Salvando...' : 'Registrar resgate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
