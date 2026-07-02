import { useState, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Gift,
  Loader2,
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { MonthPicker } from '@/components/ui/month-picker';
import { SectionTotalsHeader } from '@/components/layout/SectionTotalsHeader';
import { sectionSurfaceClass } from '@/components/layout/SectionSurface';
import type { WishItem, WishUrgency, CreateWishItemInput } from '@/types/domain';
import {
  WISH_URGENCY_LABELS,
  formatShortYearMonth,
  isWishExpiringInMonth,
  compareYearMonth,
  filterWishesForMonthDisplay,
  sortWishesForDisplay,
  type WishSortOption,
  type ConqueredWishScope,
} from '@/utils/business/wishItems';
import { cn, formatCurrency } from '@/lib/utils';

interface WishSectionProps {
  currentMonth: string;
  wishes: WishItem[];
  realizedTotal?: number;
  realizedCount?: number;
  loading?: boolean;
  isRefetching?: boolean;
  onAdd: (data: CreateWishItemInput) => Promise<WishItem | null>;
  onUpdate: (id: string, data: Partial<CreateWishItemInput>) => Promise<WishItem | null>;
  onRemove: (id: string) => Promise<boolean>;
  onConquer: (wish: WishItem, options: { createExpense: boolean }) => void;
  onRenew: (id: string, newTargetMonth: string) => Promise<WishItem | null>;
  openAddDialog?: boolean;
  onAddDialogClose?: () => void;
  variant?: 'default' | 'embedded';
}

const SORT_OPTIONS: { value: WishSortOption; label: string }[] = [
  { value: 'urgency', label: 'Urgência' },
  { value: 'deadline', label: 'Prazo' },
  { value: 'highest', label: 'Maior Valor' },
  { value: 'lowest', label: 'Menor Valor' },
  { value: 'alphabetic', label: 'Ordem Alfabética' },
];

const formatValueForInput = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const INITIAL_ITEMS_LIMIT = 10;

const WishListItem = ({
  wish,
  currentMonth,
  onConquer,
  onEdit,
  onDelete,
  onRenew,
  className,
  style,
}: {
  wish: WishItem;
  currentMonth: string;
  onConquer: (wish: WishItem) => void;
  onEdit: (wish: WishItem) => void;
  onDelete: (wish: WishItem) => void;
  onRenew: (wish: WishItem) => void;
  className?: string;
  style?: CSSProperties;
}) => {
  const isConquered = wish.status === 'conquered';
  const isExpired = wish.status === 'expired';
  const isExpiring = isWishExpiringInMonth(wish, currentMonth);
  const fromPreviousMonth = wish.startMonth !== currentMonth;

  const deadlineLabel = isConquered && wish.conqueredMonth
    ? `Conquistado em ${formatShortYearMonth(wish.conqueredMonth)}`
    : fromPreviousMonth && !isExpired
      ? `Desde ${formatShortYearMonth(wish.startMonth)} · até ${formatShortYearMonth(wish.targetMonth)}`
      : formatShortYearMonth(wish.targetMonth);

  const deleteOnlyAction = (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 rounded-md hover:bg-muted shrink-0"
      onClick={() => onDelete(wish)}
    >
      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  );

  const expiredActions = (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs rounded-md"
        onClick={() => onRenew(wish)}
      >
        Renovar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-destructive rounded-md"
        onClick={() => onDelete(wish)}
      >
        Remover
      </Button>
    </div>
  );

  const actionButtons = (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md hover:bg-muted shrink-0"
        onClick={() => onEdit(wish)}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md hover:bg-muted shrink-0"
        onClick={() => onDelete(wish)}
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </>
  );

  return (
    <div
      className={cn(
        'group flex items-stretch gap-3 py-2 px-2.5 rounded-lg transition-all duration-200 border-2',
        isConquered
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : isExpired
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-transparent bg-muted/30 hover:bg-muted/50',
        className
      )}
      style={style}
    >
      {!isExpired && (
        <div className="flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isConquered}
            disabled={isConquered}
            onCheckedChange={isConquered ? undefined : () => onConquer(wish)}
            title={isConquered ? 'Desejo conquistado' : 'Marcar como conquistado'}
            aria-label={isConquered ? `${wish.description} conquistado` : `Conquistar ${wish.description}`}
            className="h-4 w-4 rounded border-2 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground disabled:opacity-100"
          />
        </div>
      )}

      {/* Desktop */}
      <div className="hidden sm:flex flex-1 min-w-0 flex-col justify-center gap-0.5">
        <span className={cn('text-xs font-medium', isConquered ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary')}>
          {isConquered ? 'Conquistado' : WISH_URGENCY_LABELS[wish.urgency]}
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn('text-sm font-medium truncate', isConquered ? 'text-muted-foreground' : 'text-foreground')}>
            {wish.description}
          </span>
          {isConquered && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shrink-0">
              Conquistado
            </Badge>
          )}
          {isExpiring && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-xs">
                Expira neste mês. Renove o prazo ou remova se não for mais relevante.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end justify-center gap-0.5 shrink-0">
        <span className={cn(
          'text-xs tabular-nums',
          isConquered
            ? 'text-emerald-600 dark:text-emerald-400'
            : isExpiring
              ? 'text-amber-600 dark:text-amber-400 font-medium'
              : 'text-muted-foreground'
        )}>
          {deadlineLabel}
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn(
            'font-bold whitespace-nowrap text-sm tabular-nums shrink-0',
            isConquered ? 'text-muted-foreground' : 'text-primary'
          )}>
            {formatCurrency(wish.value)}
          </span>
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {isConquered ? (
              deleteOnlyAction
            ) : isExpired ? (
              expiredActions
            ) : (
              <div className="flex justify-end opacity-100 sm:opacity-60 sm:group-hover:opacity-100 sm:w-0 sm:min-w-0 sm:overflow-hidden sm:group-hover:w-[3.75rem] transition-[width,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shrink-0">
                <div className="flex gap-0.5 shrink-0 sm:translate-x-full sm:group-hover:translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  {actionButtons}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex sm:hidden flex-1 min-w-0 flex-col justify-center gap-0.5">
        <span className={cn('text-xs font-medium', isConquered ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary')}>
          {isConquered ? 'Conquistado' : WISH_URGENCY_LABELS[wish.urgency]}
        </span>
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className={cn('text-sm font-medium truncate', isConquered ? 'text-muted-foreground' : 'text-foreground')}>
              {wish.description}
            </span>
            {isConquered && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shrink-0">
                Conquistado
              </Badge>
            )}
            {isExpiring && (
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
          </div>
          <span className={cn(
            'text-xs tabular-nums shrink-0',
            isConquered
              ? 'text-emerald-600 dark:text-emerald-400'
              : isExpiring
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
          )}>
            {deadlineLabel}
          </span>
        </div>
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className={cn(
            'font-bold whitespace-nowrap text-sm tabular-nums shrink-0',
            isConquered ? 'text-muted-foreground' : 'text-primary'
          )}>
            {formatCurrency(wish.value)}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            {isConquered ? deleteOnlyAction : isExpired ? expiredActions : actionButtons}
          </div>
        </div>
      </div>
    </div>
  );
};

export const WishSection = ({
  currentMonth,
  wishes,
  realizedTotal = 0,
  realizedCount = 0,
  loading = false,
  isRefetching = false,
  onAdd,
  onUpdate,
  onRemove,
  onConquer,
  onRenew,
  openAddDialog,
  onAddDialogClose,
  variant = 'embedded',
}: WishSectionProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);
  const [deleteWish, setDeleteWish] = useState<WishItem | null>(null);
  const [conquerWish, setConquerWish] = useState<WishItem | null>(null);
  const [renewWish, setRenewWish] = useState<WishItem | null>(null);
  const [sortOption, setSortOption] = useState<WishSortOption>('urgency');
  const [conqueredScope, setConqueredScope] = useState<ConqueredWishScope>('currentMonth');

  const viewingYear = currentMonth.slice(0, 4);

  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [urgency, setUrgency] = useState<WishUrgency>('medium');
  const [targetMonth, setTargetMonth] = useState(currentMonth);
  const [renewTargetMonth, setRenewTargetMonth] = useState(currentMonth);
  const [saving, setSaving] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [targetMonthError, setTargetMonthError] = useState<string | null>(null);

  const minTargetMonth = editingWish ? editingWish.startMonth : currentMonth;
  const parsedFormValue = parseCurrencyToNumber(value);
  const isTargetMonthValid = compareYearMonth(targetMonth, minTargetMonth) >= 0;
  const isFormValid =
    description.trim().length > 0 && parsedFormValue > 0 && isTargetMonthValid;

  const [showAll, setShowAll] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const expandAnimationPlayedRef = useRef(false);

  useEffect(() => {
    setConqueredScope('currentMonth');
  }, [currentMonth]);

  useEffect(() => {
    if (openAddDialog) {
      setEditingWish(null);
      setDescription('');
      setValue('');
      setUrgency('medium');
      setTargetMonth(currentMonth);
      setFormOpen(true);
    }
  }, [openAddDialog, currentMonth]);

  const displayedWishesFiltered = useMemo(
    () => filterWishesForMonthDisplay(wishes, currentMonth, conqueredScope),
    [wishes, currentMonth, conqueredScope]
  );

  const plannedTotal = useMemo(
    () => displayedWishesFiltered
      .filter((w) => w.status === 'active')
      .reduce((sum, w) => sum + w.value, 0),
    [displayedWishesFiltered]
  );

  const sortedWishes = useMemo(
    () => sortWishesForDisplay(displayedWishesFiltered, sortOption),
    [displayedWishesFiltered, sortOption]
  );

  const isExpandedOrCollapsing = showAll || isCollapsing;
  const displayedWishes = isExpandedOrCollapsing
    ? sortedWishes
    : sortedWishes.slice(0, INITIAL_ITEMS_LIMIT);
  const hasMore = sortedWishes.length > INITIAL_ITEMS_LIMIT;
  const firstPart = displayedWishes.slice(0, INITIAL_ITEMS_LIMIT);
  const restPart = displayedWishes.slice(INITIAL_ITEMS_LIMIT);
  const shouldPlayExpandAnimation =
    showAll && !isCollapsing && !expandAnimationPlayedRef.current;

  useEffect(() => {
    if (!showAll) {
      expandAnimationPlayedRef.current = false;
      return;
    }
    if (isCollapsing) return;
    const t = setTimeout(() => {
      expandAnimationPlayedRef.current = true;
    }, 500);
    return () => clearTimeout(t);
  }, [showAll, isCollapsing]);

  useEffect(() => {
    if (!isCollapsing) return;
    const t = setTimeout(() => {
      setShowAll(false);
      setIsCollapsing(false);
    }, 300);
    return () => clearTimeout(t);
  }, [isCollapsing]);

  const handleExpandCollapse = () => {
    if (isCollapsing) return;
    if (showAll) setIsCollapsing(true);
    else setShowAll(true);
  };

  const resetForm = () => {
    setEditingWish(null);
    setDescription('');
    setValue('');
    setUrgency('medium');
    setTargetMonth(currentMonth);
    setDescriptionError(null);
    setValueError(null);
    setTargetMonthError(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
    onAddDialogClose?.();
  };

  const openEdit = (wish: WishItem) => {
    setEditingWish(wish);
    setDescription(wish.description);
    setValue(formatValueForInput(wish.value));
    setUrgency(wish.urgency);
    setTargetMonth(wish.targetMonth);
    setFormOpen(true);
  };

  const openRenew = (wish: WishItem) => {
    setRenewTargetMonth(currentMonth);
    setRenewWish(wish);
  };

  const handleSubmit = async () => {
    const trimmed = description.trim();
    const parsedValue = parseCurrencyToNumber(value);
    let hasError = false;

    if (!trimmed) {
      setDescriptionError('Descrição é obrigatória');
      hasError = true;
    }
    if (parsedValue <= 0) {
      setValueError('Valor deve ser maior que zero');
      hasError = true;
    }
    if (compareYearMonth(targetMonth, minTargetMonth) < 0) {
      setTargetMonthError('Prazo inválido');
      hasError = true;
    }

    if (hasError) return;

    setSaving(true);
    try {
      if (editingWish) {
        const updated = await onUpdate(editingWish.id, {
          description: trimmed,
          value: parsedValue,
          urgency,
          targetMonth,
        });
        if (updated) closeForm();
      } else {
        const created = await onAdd({
          description: trimmed,
          value: parsedValue,
          urgency,
          startMonth: currentMonth,
          targetMonth,
        });
        if (created) closeForm();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async () => {
    if (!renewWish) return;
    if (compareYearMonth(renewTargetMonth, currentMonth) < 0) return;
    setSaving(true);
    try {
      const updated = await onRenew(renewWish.id, renewTargetMonth);
      if (updated) setRenewWish(null);
    } finally {
      setSaving(false);
    }
  };

  const shellClass = variant === 'embedded' ? '' : sectionSurfaceClass;

  if (loading && wishes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(shellClass, isRefetching && 'opacity-60 transition-opacity')}>
      <div className="flex items-center justify-between mb-5">
        <SectionTotalsHeader
          title="Desejos"
          plannedTotal={plannedTotal}
          effectiveTotal={realizedTotal}
          effectiveLabel={`Realizado (${realizedCount})`}
          colorClass="text-primary"
        />
        {isRefetching && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" aria-hidden />
        )}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
          else setFormOpen(true);
        }}
      >
        <DialogContent className="rounded-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              {editingWish ? 'Editar desejo' : 'Novo desejo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div>
              <label htmlFor="wish-description" className="text-sm font-medium mb-2 block text-muted-foreground">
                Descrição
              </label>
              <Input
                id="wish-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descriptionError) setDescriptionError(null);
                }}
                placeholder="Ex.: Notebook novo"
                className={cn(
                  'rounded-md h-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  descriptionError && 'border-destructive'
                )}
              />
              {descriptionError && (
                <p className="text-destructive text-sm mt-1">{descriptionError}</p>
              )}
            </div>
            <div>
              <label htmlFor="wish-value" className="text-sm font-medium mb-2 block text-muted-foreground">
                Valor estimado
              </label>
              <CurrencyInput
                id="wish-value"
                value={value}
                onValueChange={(next) => {
                  setValue(next);
                  if (valueError) setValueError(null);
                }}
                className={valueError ? 'border-destructive' : undefined}
              />
              {valueError && <p className="text-destructive text-sm mt-1">{valueError}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">Urgência</label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as WishUrgency)}>
                <SelectTrigger className="rounded-md h-10 focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(WISH_URGENCY_LABELS) as WishUrgency[]).map((key) => (
                    <SelectItem key={key} value={key}>{WISH_URGENCY_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="wish-target" className="text-sm font-medium mb-2 block text-muted-foreground">
                Conquistar até
              </label>
              <MonthPicker
                id="wish-target"
                value={targetMonth}
                onChange={(next) => {
                  setTargetMonth(next);
                  if (targetMonthError) setTargetMonthError(null);
                }}
                min={minTargetMonth}
              />
              {targetMonthError && (
                <p className="text-destructive text-sm mt-1">{targetMonthError}</p>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={saving || !isFormValid}
              className="w-full h-10 rounded-md gradient-primary hover:opacity-90 transition-opacity text-primary-foreground border-0"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingWish ? (
                'Salvar Alterações'
              ) : (
                'Adicionar Desejo'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {(displayedWishesFiltered.length > 0 || wishes.some((w) => w.status === 'conquered')) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <ToggleGroup
              type="single"
              value={conqueredScope}
              onValueChange={(value) => value && setConqueredScope(value as ConqueredWishScope)}
              className="bg-primary/10 rounded-lg p-0.5 w-fit"
            >
              <ToggleGroupItem
                value="currentMonth"
                aria-label="Conquistas deste mês"
                className="rounded-md px-2.5 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm text-primary hover:bg-primary/20"
              >
                Este mês
              </ToggleGroupItem>
              <ToggleGroupItem
                value="yearToDate"
                aria-label="Conquistas do ano até este mês"
                className="rounded-md px-2.5 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm text-primary hover:bg-primary/20"
              >
                Ano até aqui
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-[11px] text-muted-foreground">
              Conquistas exibidas referem-se ao ano de {viewingYear}.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg h-7 px-2.5 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
              >
                <ArrowUpDown className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {SORT_OPTIONS.find((o) => o.value === sortOption)?.label || 'Ordenar'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-md">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortOption(option.value)}
                  className={cn(
                    'rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary',
                    sortOption === option.value && 'bg-primary/10 text-primary'
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {displayedWishesFiltered.length === 0 ? (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-3">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm mb-4">Nenhum desejo neste mês</p>
          <Button
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
            className="gradient-primary text-primary-foreground hover:opacity-90"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar primeiro desejo
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {firstPart.map((wish) => (
            <WishListItem
              key={wish.id}
              wish={wish}
              currentMonth={currentMonth}
              onConquer={setConquerWish}
              onEdit={openEdit}
              onDelete={setDeleteWish}
              onRenew={openRenew}
            />
          ))}
          {restPart.length > 0 && (
            <div className={cn('space-y-1', isCollapsing && 'collapse-out')}>
              {restPart.map((wish, index) => (
                <WishListItem
                  key={wish.id}
                  wish={wish}
                  currentMonth={currentMonth}
                  onConquer={setConquerWish}
                  onEdit={openEdit}
                  onDelete={setDeleteWish}
                  onRenew={openRenew}
                  {...(shouldPlayExpandAnimation
                    ? {
                        className: 'expand-in',
                        style: { animationDelay: `${index * 35}ms` } as CSSProperties,
                      }
                    : {})}
                />
              ))}
            </div>
          )}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1.5 text-primary hover:bg-primary/10 hover:text-primary rounded-lg gap-1.5 disabled:opacity-70 min-h-8 text-xs"
              onClick={handleExpandCollapse}
              disabled={isCollapsing}
            >
              {isCollapsing ? (
                <>Recolhendo...</>
              ) : showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 shrink-0" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                  Visualizar todos ({sortedWishes.length})
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={!!conquerWish} onOpenChange={(open) => { if (!open) setConquerWish(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conquistou este desejo?</AlertDialogTitle>
            <AlertDialogDescription>
              {conquerWish && (
                <>
                  <strong>{conquerWish.description}</strong>. Deseja registrar como gasto deste mês?
                  O desejo só será marcado como conquistado após salvar o gasto.
                  Gastos em débito ou dinheiro serão marcados como pagos; no cartão, o impacto ocorre ao pagar a fatura.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                if (conquerWish) onConquer(conquerWish, { createExpense: false });
                setConquerWish(null);
              }}
            >
              Só marcar conquistado
            </Button>
            <AlertDialogAction
              onClick={() => {
                if (conquerWish) onConquer(conquerWish, { createExpense: true });
                setConquerWish(null);
              }}
            >
              Sim, incluir gasto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!renewWish} onOpenChange={(open) => { if (!open) setRenewWish(null); }}>
        <DialogContent className="rounded-lg sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renovar prazo</DialogTitle>
            <DialogDescription>
              Defina um novo mês limite para &quot;{renewWish?.description}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="renew-target">Novo prazo</Label>
            <MonthPicker
              id="renew-target"
              value={renewTargetMonth}
              onChange={setRenewTargetMonth}
              min={currentMonth}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewWish(null)}>Cancelar</Button>
            <Button onClick={handleRenew} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Renovar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteWish}
        onOpenChange={(open) => { if (!open) setDeleteWish(null); }}
        onConfirm={async () => {
          if (deleteWish) {
            await onRemove(deleteWish.id);
            setDeleteWish(null);
          }
        }}
        title="Remover desejo"
        description="Esta ação não pode ser desfeita."
      />
    </div>
  );
};
