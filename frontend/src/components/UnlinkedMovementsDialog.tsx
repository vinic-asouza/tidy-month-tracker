import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { UnlinkedMovement } from '@/utils/business/accounts';

interface UnlinkedMovementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movements: UnlinkedMovement[];
}

const formatItemDate = (date: string | null) => {
  if (!date) return null;
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return null;
  return `${d}/${m}/${y}`;
};

export const UnlinkedMovementsDialog = ({
  open,
  onOpenChange,
  movements,
}: UnlinkedMovementsDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="rounded-lg max-w-md max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Movimentos não vinculados</DialogTitle>
        <DialogDescription>
          Estes lançamentos entram no resumo do mês, mas não aparecem em nenhuma carteira.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 py-2">
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum movimento não vinculado neste mês.</p>
        ) : (
          movements.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              className="flex items-start justify-between gap-3 rounded-md border border-border/60 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className={
                      item.kind === 'income'
                        ? 'bg-income-light text-income'
                        : 'bg-expense-light text-expense'
                    }
                  >
                    {item.kind === 'income' ? 'Entrada' : 'Gasto'}
                  </Badge>
                  {formatItemDate(item.date) && (
                    <span className="text-[11px] text-muted-foreground">{formatItemDate(item.date)}</span>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{item.description}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums shrink-0">{formatCurrency(item.value)}</p>
            </div>
          ))
        )}
      </div>
      <DialogFooter className="sm:justify-start">
        <p className="text-xs text-muted-foreground text-left">
          Para vincular, edite o lançamento em Entradas ou Gastos e selecione uma carteira.
        </p>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
