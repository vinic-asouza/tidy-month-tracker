import { useEffect, useMemo, useState } from 'react';
import { Loader2, Trash2, TrendingDown, TrendingUp, PiggyBank } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn, formatCurrency } from '@/lib/utils';
import {
  type BulkDeleteListItem,
  type BulkDeleteScope,
  defaultScopesForItems,
  seriesScopeLabel,
} from '@/utils/business/bulkDelete';

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BulkDeleteListItem[];
  onConfirm: (scopes: Record<string, BulkDeleteScope>) => Promise<void>;
}

const sectionMeta: Record<
  BulkDeleteListItem['kind'],
  { title: string; icon: typeof TrendingUp; className: string }
> = {
  income: { title: 'Entradas', icon: TrendingUp, className: 'text-income' },
  expense: { title: 'Gastos', icon: TrendingDown, className: 'text-expense' },
  investment: { title: 'Investimentos', icon: PiggyBank, className: 'text-investment' },
};

function expenseTypeLabel(type?: BulkDeleteListItem['expenseType']): string | null {
  if (type === 'fixed') return 'Fixo';
  if (type === 'variable') return 'Variável';
  if (type === 'installment') return 'Parcelado';
  return null;
}

function BulkDeleteItemRow({
  item,
  scope,
  submitting,
  onScopeChange,
}: {
  item: BulkDeleteListItem;
  scope: BulkDeleteScope;
  submitting: boolean;
  onScopeChange: (scope: BulkDeleteScope) => void;
}) {
  const typeLabel = expenseTypeLabel(item.expenseType);
  const parceladoLabel =
    item.expenseType === 'installment' && item.installmentLabel
      ? `Parcelado ${item.installmentLabel}`
      : typeLabel;

  return (
    <li className="rounded border border-border/50 bg-muted/15 px-2 py-1.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground truncate leading-tight">
            {item.description || 'Sem descrição'}
          </p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {item.tagOrCategory && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-normal leading-none">
                {item.tagOrCategory}
              </Badge>
            )}
            {parceladoLabel && (
              <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-normal leading-none">
                {parceladoLabel}
              </Badge>
            )}
            {item.isResgate && (
              <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-normal leading-none">
                Resgate
              </Badge>
            )}
          </div>
        </div>
        <span className="text-xs font-semibold tabular-nums shrink-0 leading-none">
          {formatCurrency(item.value)}
        </span>
      </div>

      {item.blocking && (
        <RadioGroup
          value={scope}
          onValueChange={(v) => onScopeChange(v as BulkDeleteScope)}
          className="flex flex-wrap gap-x-3 gap-y-0.5"
          disabled={submitting}
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="current" id={`${item.id}-current`} className="h-3 w-3" />
            <Label
              htmlFor={`${item.id}-current`}
              className="text-[10px] font-normal text-muted-foreground cursor-pointer leading-none"
            >
              Só este mês
              {item.blockingReason === 'installment' ? ' / parcela' : ''}
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="series" id={`${item.id}-series`} className="h-3 w-3" />
            <Label
              htmlFor={`${item.id}-series`}
              className="text-[10px] font-normal text-muted-foreground cursor-pointer leading-none"
            >
              {seriesScopeLabel(item.blockingReason)}
            </Label>
          </div>
        </RadioGroup>
      )}
    </li>
  );
}

export function BulkDeleteConfirmDialog({
  open,
  onOpenChange,
  items,
  onConfirm,
}: BulkDeleteConfirmDialogProps) {
  const [scopes, setScopes] = useState<Record<string, BulkDeleteScope>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setScopes(defaultScopesForItems(items));
      setSubmitting(false);
    }
  }, [open, items]);

  const blockingItems = useMemo(() => items.filter((i) => i.blocking), [items]);
  const sections = useMemo(() => {
    const order: BulkDeleteListItem['kind'][] = ['income', 'expense', 'investment'];
    return order
      .map((kind) => ({
        kind,
        items: items.filter((i) => i.kind === kind),
      }))
      .filter((s) => s.items.length > 0);
  }, [items]);

  const multiColumn = sections.length > 1;

  const setAllBlocking = (scope: BulkDeleteScope) => {
    setScopes((prev) => {
      const next = { ...prev };
      for (const item of blockingItems) {
        next[item.id] = scope;
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (submitting || items.length === 0) return;
    setSubmitting(true);
    try {
      await onConfirm(scopes);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className={cn(
          'flex flex-col gap-0 p-0 overflow-hidden max-h-[90vh]',
          multiColumn
            ? sections.length >= 3
              ? 'max-w-5xl sm:max-w-5xl'
              : 'max-w-3xl sm:max-w-3xl'
            : 'max-w-lg'
        )}
      >
        <DialogHeader className="px-5 pt-5 pb-2 shrink-0 pr-12">
          <DialogTitle>Excluir selecionados</DialogTitle>
          <DialogDescription className="text-xs">
            {items.length === 1
              ? '1 item será excluído. Esta ação não pode ser desfeita.'
              : `${items.length} itens serão excluídos. Esta ação não pode ser desfeita.`}
            {blockingItems.length > 0 &&
              ' Para itens com série, escolha se a exclusão vale só neste mês ou na série vinculada.'}
          </DialogDescription>
        </DialogHeader>

        {blockingItems.length > 1 && (
          <div className="px-5 pb-2 flex flex-wrap gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground w-full">
              Atalho para {blockingItems.length} itens com série:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px]"
              disabled={submitting}
              onClick={() => setAllBlocking('current')}
            >
              Todos: só este mês
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px]"
              disabled={submitting}
              onClick={() => setAllBlocking('series')}
            >
              Todos: série vinculada
            </Button>
          </div>
        )}

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2',
            !multiColumn && 'max-h-[min(60vh,32rem)]',
            multiColumn && 'sm:overflow-hidden sm:flex sm:flex-col sm:max-h-[min(60vh,32rem)]'
          )}
        >
          <div
            className={cn(
              multiColumn
                ? 'flex flex-col gap-4 sm:grid sm:gap-3 sm:min-h-0 sm:flex-1 sm:overflow-hidden'
                : 'space-y-3',
              sections.length === 2 && 'sm:grid-cols-2',
              sections.length >= 3 && 'sm:grid-cols-3'
            )}
          >
            {sections.map(({ kind, items: sectionItems }) => {
              const meta = sectionMeta[kind];
              const Icon = meta.icon;
              return (
                <section
                  key={kind}
                  className={cn(
                    'space-y-1.5 min-w-0',
                    multiColumn && 'sm:flex sm:flex-col sm:min-h-0 sm:overflow-hidden'
                  )}
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Icon className={`h-3.5 w-3.5 ${meta.className}`} />
                    <h3 className="text-xs font-semibold text-foreground">{meta.title}</h3>
                    <span className="text-[10px] text-muted-foreground">({sectionItems.length})</span>
                  </div>
                  <ul
                    className={cn(
                      'space-y-1',
                      multiColumn
                        ? 'sm:overflow-y-auto sm:overscroll-contain sm:min-h-0 sm:flex-1 sm:pr-1 sm:max-h-[min(55vh,28rem)]'
                        : undefined
                    )}
                  >
                    {sectionItems.map((item) => (
                      <BulkDeleteItemRow
                        key={`${item.kind}-${item.id}`}
                        item={item}
                        scope={scopes[item.id] ?? 'current'}
                        submitting={submitting}
                        onScopeChange={(scope) =>
                          setScopes((prev) => ({ ...prev, [item.id]: scope }))
                        }
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border shrink-0 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={submitting || items.length === 0}
            onClick={() => void handleConfirm()}
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Excluindo…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Excluir {items.length}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
