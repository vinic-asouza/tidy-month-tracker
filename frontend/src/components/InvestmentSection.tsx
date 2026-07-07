import { useState, useMemo, useEffect, useRef, memo } from 'react';
import { Plus, Pencil, Trash2, PiggyBank, List, LayoutGrid, ArrowUpDown, Repeat, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApplyToAllDialog } from '@/components/ui/apply-to-all-dialog';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { Investment } from '@/types/finance';
import { formatDateToYYYYMMDD, formatItemDayMonth } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sectionSurfaceClass } from '@/components/layout/SectionSurface';
import { SectionTotalsHeader } from '@/components/layout/SectionTotalsHeader';
import { StatusToggleBadge } from '@/components/StatusToggleBadge';
import { SelectionToggle } from '@/components/SelectionToggle';
import { EffectuateInvestmentDialog } from '@/components/EffectuateInvestmentDialog';
import { SectionAddItemButton } from '@/components/SectionAddItemButton';
import { showSelectionHintIfNeeded } from '@/utils/selectionHint';
import type { Account } from '@/types/domain';
import { filterInvestmentAccounts } from '@/utils/business/accountRoles';

type PersistHandler = (data: Omit<Investment, 'id'>) => Promise<boolean> | boolean;
type UpdateHandler = (
  id: string,
  updates: Partial<Investment>,
  applyToAllMonths?: boolean
) => Promise<boolean> | boolean;

interface InvestmentSectionProps {
  investments: Investment[];
  accounts: Account[];
  onAdd: PersistHandler;
  onUpdate: UpdateHandler;
  onDelete: (id: string, applyToAllMonths?: boolean) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  /** Abre o dialog de novo investimento (controlado pelo FAB global) */
  openAddDialog?: boolean;
  /** Chamado quando o dialog de adicionar é fechado */
  onAddDialogClose?: () => void;
  /** Abre o dialog de nova carteira quando não há carteiras cadastradas */
  onRequestAddAccount?: () => void;
  variant?: 'default' | 'embedded';
}

type ViewMode = 'general' | 'summary';
type SortOption = 'date' | 'alphabetic' | 'institution' | 'highest' | 'lowest';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatValueForInput = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date', label: 'Data' },
  { value: 'alphabetic', label: 'Ordem Alfabética' },
  { value: 'institution', label: 'Carteira' },
  { value: 'highest', label: 'Maior Valor' },
  { value: 'lowest', label: 'Menor Valor' },
];

const NO_ACCOUNT = 'none';
const PENDING_INVESTMENT_TAG = '—';

const getAccountLabel = (investment: Investment, accounts: Account[]): string => {
  if (investment.accountId) {
    return accounts.find((a) => a.id === investment.accountId)?.name ?? investment.tag ?? '—';
  }
  return investment.invested ? investment.tag ?? '—' : '—';
};

const sortInvestments = (
  investments: Investment[],
  sortOption: SortOption,
  accounts: Account[]
): Investment[] => {
  const sorted = [...investments];
  const getSortDate = (i: Investment) => i.date ?? (i.createdAt ? i.createdAt.split('T')[0] : '');

  switch (sortOption) {
    case 'alphabetic':
      return sorted.sort((a, b) => a.description.localeCompare(b.description, 'pt-BR'));
    case 'institution':
      return sorted.sort((a, b) =>
        getAccountLabel(a, accounts).localeCompare(getAccountLabel(b, accounts), 'pt-BR')
      );
    case 'date':
      return sorted.sort((a, b) => {
        const dateCmp = getSortDate(b).localeCompare(getSortDate(a));
        if (dateCmp !== 0) return dateCmp;
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      });
    case 'highest':
      return sorted.sort((a, b) => b.value - a.value);
    case 'lowest':
      return sorted.sort((a, b) => a.value - b.value);
  }
  return sorted;
};

const groupByAccount = (
  investments: Investment[],
  sortOption: SortOption,
  accounts: Account[]
): { institution: string; total: number }[] => {
  const grouped = investments.reduce((acc, investment) => {
    const label = getAccountLabel(investment, accounts);
    if (!acc[label]) {
      acc[label] = 0;
    }
    acc[label] += investment.value;
    return acc;
  }, {} as Record<string, number>);

  const result = Object.entries(grouped).map(([institution, total]) => ({ institution, total }));

  switch (sortOption) {
    case 'alphabetic':
    case 'institution':
    case 'date':
      return result.sort((a, b) => a.institution.localeCompare(b.institution, 'pt-BR'));
    case 'highest':
      return result.sort((a, b) => b.total - a.total);
    case 'lowest':
      return result.sort((a, b) => a.total - b.total);
  }
  return result;
};

// Summary item component
const InstitutionSummaryItem = ({
  institution,
  total,
  groupTotal,
  shouldAnimate,
}: {
  institution: string;
  total: number;
  groupTotal: number;
  shouldAnimate: boolean;
}) => {
  const percentage = groupTotal > 0 ? (total / groupTotal) * 100 : 0;
  
  return (
    <div className="relative flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30 overflow-hidden">
      {/* Progress bar background */}
      <div
        className={`absolute inset-y-0 left-0 bg-investment-light rounded-md ${
          shouldAnimate ? 'progress-bar-animate' : 'transition-all duration-300'
        }`}
        style={{ 
          width: shouldAnimate ? undefined : `${percentage}%`,
          '--progress-width': `${percentage}%`
        } as React.CSSProperties & { '--progress-width'?: string }}
      />
      
      {/* Content */}
      <div className="relative flex items-center justify-between w-full z-10">
        <Badge 
          variant="secondary" 
          className="text-xs rounded-md px-2 py-0.5 bg-transparent text-investment border-0 cursor-default"
        >
          {institution}
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {percentage.toFixed(1)}%
          </span>
          <span className="font-bold whitespace-nowrap text-sm text-investment">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
};

const InvestmentListItem = ({
  investment,
  accountLabel,
  isSelected,
  onItemClick,
  onToggleInvested,
  onToggleSelection,
  showSelectionToggle,
  onEdit,
  onDelete,
  className,
  style,
}: {
  investment: Investment;
  accountLabel: string;
  isSelected: boolean;
  onItemClick: (e: React.MouseEvent) => void;
  onToggleInvested: (investment: Investment) => void;
  onToggleSelection: () => void;
  showSelectionToggle: boolean;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const actionButtons = (
    <>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted shrink-0" onClick={() => onEdit(investment)}>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted shrink-0" onClick={() => onDelete(investment.id)}>
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </>
  );

  return (
    <div
      onClick={onItemClick}
      className={cn(
        'group flex items-stretch gap-3 py-2 px-2.5 rounded-lg transition-all duration-200 border-2 cursor-pointer',
        isSelected ? 'border-investment/60' : 'border-transparent',
        investment.invested ? 'bg-investment-light hover:bg-investment-light/80' : 'bg-muted/30 hover:bg-muted/50',
        className
      )}
      style={style}
    >
      <div
        className="flex items-center justify-center shrink-0 w-[5.5rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <StatusToggleBadge
          checked={investment.invested}
          checkedLabel="Investido"
          uncheckedLabel="Pendente"
          onToggle={() => onToggleInvested(investment)}
          variant="investment"
          surface="onRow"
          size="row"
          ariaLabel={
            investment.invested ? 'Desmarcar como investido' : 'Marcar como investido'
          }
        />
      </div>
      {/* Desktop */}
      <div className="hidden sm:flex flex-1 min-w-0 flex-col justify-center gap-0.5">
        <span className="text-xs text-investment font-medium">{accountLabel}</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium truncate text-foreground">{investment.description}</span>
          {investment.repeatAllMonths && <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end justify-center gap-0.5 shrink-0">
        <span className="text-xs text-muted-foreground tabular-nums">{formatItemDayMonth(investment.date, investment.createdAt)}</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-investment whitespace-nowrap text-sm tabular-nums shrink-0">{formatCurrency(investment.value)}</span>
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {showSelectionToggle && (
              <SelectionToggle isSelected={isSelected} onToggle={onToggleSelection} />
            )}
            <div className="flex justify-end opacity-100 sm:opacity-60 sm:group-hover:opacity-100 sm:w-0 sm:min-w-0 sm:overflow-hidden sm:group-hover:w-[3.75rem] transition-[width,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shrink-0">
              <div className="flex gap-0.5 shrink-0 sm:translate-x-full sm:group-hover:translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
                {actionButtons}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile */}
      <div className="flex sm:hidden flex-1 min-w-0 flex-col justify-center gap-0.5">
        <span className="text-xs text-investment font-medium">{accountLabel}</span>
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-sm font-medium truncate text-foreground">{investment.description}</span>
            {investment.repeatAllMonths && <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatItemDayMonth(investment.date, investment.createdAt)}</span>
        </div>
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="font-bold text-investment whitespace-nowrap text-sm tabular-nums shrink-0">{formatCurrency(investment.value)}</span>
          <div className="flex items-center gap-0.5 shrink-0">
            {actionButtons}
          </div>
        </div>
      </div>
    </div>
  );
};

const InvestmentSectionComponent = ({
  investments,
  accounts,
  onAdd,
  onUpdate,
  onDelete,
  selectedIds = new Set(),
  onSelectionChange,
  openAddDialog,
  onAddDialogClose,
  onRequestAddAccount,
  variant = 'default',
}: InvestmentSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(NO_ACCOUNT);

  useEffect(() => {
    if (openAddDialog) setIsOpen(true);
  }, [openAddDialog]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [itemDate, setItemDate] = useState(() => formatDateToYYYYMMDD(new Date()));
  const [repeatAllMonths, setRepeatAllMonths] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [showApplyToAllDialog, setShowApplyToAllDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);
  const [applyToAllMonths, setApplyToAllMonths] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [effectuateTarget, setEffectuateTarget] = useState<Investment | null>(null);

  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  const INITIAL_ITEMS_LIMIT = 10;

  // Apply sorting and grouping
  const sortedInvestments = useMemo(
    () => sortInvestments(investments, sortOption, accounts),
    [investments, sortOption, accounts]
  );
  const groupedByAccount = useMemo(
    () => groupByAccount(investments, sortOption, accounts),
    [investments, sortOption, accounts]
  );

  const [showAllInvestments, setShowAllInvestments] = useState(false);
  const [isCollapsingInvestments, setIsCollapsingInvestments] = useState(false);
  const expandAnimationPlayedRef = useRef(false);
  const isExpandedOrCollapsingInv = showAllInvestments || isCollapsingInvestments;
  const displayedInvestments = isExpandedOrCollapsingInv ? sortedInvestments : sortedInvestments.slice(0, INITIAL_ITEMS_LIMIT);
  const hasMoreInvestments = sortedInvestments.length > INITIAL_ITEMS_LIMIT;
  const firstPartInv = displayedInvestments.slice(0, INITIAL_ITEMS_LIMIT);
  const restPartInv = displayedInvestments.slice(INITIAL_ITEMS_LIMIT);
  const shouldPlayExpandAnimation = showAllInvestments && !isCollapsingInvestments && !expandAnimationPlayedRef.current;

  useEffect(() => {
    if (!showAllInvestments) {
      expandAnimationPlayedRef.current = false;
      return;
    }
    if (isCollapsingInvestments) return;
    const t = setTimeout(() => {
      expandAnimationPlayedRef.current = true;
    }, 500);
    return () => clearTimeout(t);
  }, [showAllInvestments, isCollapsingInvestments]);

  const handleExpandCollapseInvestments = () => {
    if (isCollapsingInvestments) return;
    if (showAllInvestments) setIsCollapsingInvestments(true);
    else setShowAllInvestments(true);
  };

  useEffect(() => {
    if (!isCollapsingInvestments) return;
    const t = setTimeout(() => {
      setShowAllInvestments(false);
      setIsCollapsingInvestments(false);
    }, 300);
    return () => clearTimeout(t);
  }, [isCollapsingInvestments]);
  
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Trigger animation when switching to summary view
  useEffect(() => {
    if (viewMode === 'summary') {
      setShouldAnimate(false);
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [viewMode]);

  const resetForm = () => {
    setDescription('');
    setValue('');
    setItemDate(formatDateToYYYYMMDD(new Date()));
    setRepeatAllMonths(false);
    setEditingId(null);
    setSelectedAccountId(NO_ACCOUNT);
    setDescriptionError(null);
    setValueError(null);
    setAccountError(null);
  };

  const handleSubmit = async () => {
    const numValue = parseCurrencyToNumber(value);
    let hasError = false;

    if (!description.trim()) {
      setDescriptionError('Descrição é obrigatória');
      hasError = true;
    }
    if (numValue <= 0) {
      setValueError('Valor deve ser maior que zero');
      hasError = true;
    }

    if (hasError) return;

    const editingItem = editingId ? investments.find((i) => i.id === editingId) : null;

    setIsSubmitting(true);
    try {
      const success = editingId
        ? await onUpdate(
            editingId,
            editingItem?.invested
              ? {
                  description: description.trim(),
                  value: numValue,
                  tag:
                    accounts.find((a) => a.id === selectedAccountId)?.name ??
                    editingItem.tag,
                  date: itemDate,
                  repeatAllMonths,
                  accountId:
                    selectedAccountId !== NO_ACCOUNT
                      ? selectedAccountId
                      : (null as unknown as string),
                }
              : {
                  description: description.trim(),
                  value: numValue,
                  date: itemDate,
                  repeatAllMonths,
                },
            applyToAllMonths
          )
        : await onAdd({
            description: description.trim(),
            value: numValue,
            tag: PENDING_INVESTMENT_TAG,
            date: itemDate,
            repeatAllMonths,
            invested: false,
          });

      if (success === false) return;

      if (editingId) {
        setApplyToAllMonths(false);
      }
      resetForm();
      setIsOpen(false);
      onAddDialogClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (investment: Investment) => {
    // Verifica se é item fixo (tem repeatAllMonths ou baseInvestmentId)
    const isFixedItem = investment.repeatAllMonths || !!investment.baseInvestmentId;
    
    if (isFixedItem) {
      // Mostra diálogo perguntando se quer editar em todos os meses
      setEditingInvestment(investment);
      setPendingAction('edit');
      setShowApplyToAllDialog(true);
    } else {
      // Item normal, edita diretamente
      setEditingId(investment.id);
      setDescription(investment.description);
      setValue(formatValueForInput(investment.value));
      setItemDate(investment.date ?? formatDateToYYYYMMDD(new Date()));
      setRepeatAllMonths(investment.repeatAllMonths || false);
      setSelectedAccountId(investment.accountId ?? NO_ACCOUNT);
      setIsOpen(true);
    }
  };

  const handleEditCurrentMonth = () => {
    if (editingInvestment) {
      setEditingId(editingInvestment.id);
      setDescription(editingInvestment.description);
      setValue(formatValueForInput(editingInvestment.value));
      setItemDate(editingInvestment.date ?? formatDateToYYYYMMDD(new Date()));
      setRepeatAllMonths(editingInvestment.repeatAllMonths || false);
      setSelectedAccountId(editingInvestment.accountId ?? NO_ACCOUNT);
      setIsOpen(true);
      setEditingInvestment(null);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleEditAllMonths = () => {
    if (editingInvestment) {
      setEditingId(editingInvestment.id);
      setDescription(editingInvestment.description);
      setValue(formatValueForInput(editingInvestment.value));
      setItemDate(editingInvestment.date ?? formatDateToYYYYMMDD(new Date()));
      setRepeatAllMonths(editingInvestment.repeatAllMonths || false);
      setSelectedAccountId(editingInvestment.accountId ?? NO_ACCOUNT);
      setApplyToAllMonths(true);
      setIsOpen(true);
      setEditingInvestment(null);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    const investment = investments.find(i => i.id === id);
    if (investment) {
      const isFixedItem = investment.repeatAllMonths || !!investment.baseInvestmentId;
      if (isFixedItem) {
        setEditingInvestment(investment);
        setPendingAction('delete');
        setShowApplyToAllDialog(true);
      } else {
        setDeleteId(id);
      }
    }
  };

  const handleDeleteCurrentMonth = () => {
    if (editingInvestment) {
      setDeleteId(editingInvestment.id);
      setEditingInvestment(null);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleDeleteAllMonths = () => {
    if (editingInvestment) {
      onDelete(editingInvestment.id, true); // Passa true para aplicar em todos os meses
      setDeleteId(null);
      setEditingInvestment(null);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId, false); // Apenas este mês
      setDeleteId(null);
    }
  };

  const handleToggleInvested = (investment: Investment) => {
    if (investment.invested) {
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;
      onUpdate(investment.id, {
        invested: false,
        accountId: null as unknown as string,
        sourceAccountId: null as unknown as string,
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(scrollLeft, scrollTop);
        });
      });
      return;
    }

    setEffectuateTarget(investment);
  };

  const handleRequestAddAccount = () => {
    setEffectuateTarget(null);
    onRequestAddAccount?.();
  };

  const handleEffectuateConfirm = async (
    sourceAccountId: string | null,
    destinationAccountId: string
  ) => {
    if (!effectuateTarget) return false;

    const destAccount = accounts.find((a) => a.id === destinationAccountId);
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;
    const ok = await onUpdate(effectuateTarget.id, {
      invested: true,
      sourceAccountId,
      accountId: destinationAccountId,
      tag: destAccount?.name ?? PENDING_INVESTMENT_TAG,
    });

    if (ok) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(scrollLeft, scrollTop);
        });
      });
    }
    return ok;
  };
  const total = investments.reduce((sum, i) => sum + i.value, 0);
  const investedTotal = investments
    .filter((i) => i.invested)
    .reduce((sum, i) => sum + i.value, 0);

  const toggleItemSelection = (id: string, isSelected: boolean) => {
    if (!onSelectionChange) return;
    showSelectionHintIfNeeded();
    const newSelection = new Set(selectedIds);
    if (isSelected) newSelection.delete(id);
    else newSelection.add(id);
    onSelectionChange(newSelection);
  };

  const shellClass = variant === 'embedded' ? '' : sectionSurfaceClass;
  const editingItem = editingId ? investments.find((i) => i.id === editingId) : null;

  return (
    <div className={shellClass}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {variant === 'default' && (
            <div className="p-2.5 rounded-md gradient-investment">
              <PiggyBank className="h-4 w-4 text-white" />
            </div>
          )}
          <SectionTotalsHeader
            title="Investimentos"
            plannedTotal={total}
            effectiveTotal={investedTotal}
            effectiveLabel="Investido"
            colorClass="text-investment"
          />
        </div>
      </div>
      <Alert className="mb-4 bg-muted/40 border-border py-2.5">
        <AlertDescription className="text-xs sm:text-sm text-muted-foreground">
          Este espaço registra seus <strong className="font-medium text-foreground">aportes mensais</strong>.
          O saldo total de cada conta está em <strong className="font-medium text-foreground">Carteiras</strong>.
          {accounts.length > 0
            ? ' A carteira de destino é escolhida ao marcar como investido.'
            : ' Sem carteiras cadastradas, o valor vai para o Saldo Livre ao efetivar. Você pode criar uma carteira a qualquer momento.'}
        </AlertDescription>
      </Alert>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            resetForm();
            onAddDialogClose?.();
          }
        }}
      >
        <DialogContent className="rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingId ? 'Editar Investimento' : 'Novo Investimento'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-4">
                {/* Data do item */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    Data
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal rounded-md h-10',
                          !itemDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {itemDate ? new Date(itemDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Selecione a data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={itemDate ? new Date(itemDate + 'T12:00:00') : undefined}
                        onSelect={(d) => d && setItemDate(formatDateToYYYYMMDD(d))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Description and Value on same line */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3">
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">
                      Descrição
                    </label>
                    <Input
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); setDescriptionError(null); }}
                      placeholder="Ex: Tesouro Direto, CDB..."
                      className={`rounded-md h-10 ${descriptionError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-investment focus-visible:ring-offset-2`}
                    />
                    {descriptionError && (
                      <p className="text-destructive text-sm mt-1">{descriptionError}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">
                      Valor
                    </label>
                    <CurrencyInput
                      value={value}
                      onValueChange={(v) => { setValue(v); setValueError(null); }}
                      className={`rounded-md h-10 ${valueError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-investment focus-visible:ring-offset-2`}
                    />
                    {valueError && (
                      <p className="text-destructive text-sm mt-1">{valueError}</p>
                    )}
                  </div>
                </div>

                {/* Carteira — só para itens já investidos */}
                {accounts.length > 0 && editingItem?.invested && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
                      Carteira
                    </label>
                    <Select
                      value={selectedAccountId}
                      onValueChange={(v) => {
                        setSelectedAccountId(v);
                        setAccountError(null);
                      }}
                    >
                      <SelectTrigger
                        className={`rounded-md h-10 ${accountError ? 'border-destructive' : ''} focus:ring-2 focus:ring-investment focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-investment focus-visible:ring-offset-2`}
                      >
                        <SelectValue placeholder="Selecione uma carteira" />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        <SelectItem value={NO_ACCOUNT} className="rounded-lg">
                          Saldo Livre
                        </SelectItem>
                        {filterInvestmentAccounts(accounts).map((acc) => (
                          <SelectItem key={acc.id} value={acc.id} className="rounded-lg">
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {accountError && (
                      <p className="text-destructive text-sm mt-1">{accountError}</p>
                    )}
                  </div>
                )}
                {accounts.length > 0 && !editingItem?.invested && (
                  <p className="text-xs text-muted-foreground">
                    A carteira de destino é escolhida ao marcar como investido.
                  </p>
                )}

                {/* Repeat All Months */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="repeat-all-months" className="text-sm font-medium cursor-pointer">
                      Repetir todos os meses
                    </Label>
                  </div>
                  <Switch
                    id="repeat-all-months"
                    checked={repeatAllMonths}
                    onCheckedChange={setRepeatAllMonths}
                    className="data-[state=checked]:bg-investment focus-visible:ring-investment"
                  />
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                  Cria lançamentos nos demais meses deste ano. Em janeiro, duplique ou crie novamente para o ano seguinte.
                </p>

                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-md gradient-investment hover:opacity-90 transition-opacity text-white border-0"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    'Salvar Alterações'
                  ) : (
                    'Adicionar Investimento'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

      {/* View Controls */}
      <div className="flex items-center justify-between mb-4 gap-2">
        {/* View Mode Toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
          className="bg-investment-light rounded-lg p-0.5"
        >
          <ToggleGroupItem
            value="general"
            aria-label="Visualização geral"
            className="rounded-md px-2.5 py-1 text-xs data-[state=on]:bg-investment data-[state=on]:text-white data-[state=on]:shadow-sm text-investment hover:bg-investment/20 hover:text-investment"
          >
            <List className="h-3 w-3 mr-1" />
            Geral
          </ToggleGroupItem>
          <ToggleGroupItem
            value="summary"
            aria-label="Visualização resumida"
            className="rounded-md px-2.5 py-1 text-xs data-[state=on]:bg-investment data-[state=on]:text-white data-[state=on]:shadow-sm text-investment hover:bg-investment/20 hover:text-investment"
          >
            <LayoutGrid className="h-3 w-3 mr-1" />
            Resumo
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg h-7 px-2.5 text-xs gap-1 text-investment hover:text-investment hover:bg-investment-light"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span className="hidden sm:inline">
                {SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Ordenar'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-md">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortOption(option.value)}
                className={`rounded-lg cursor-pointer hover:bg-investment-light hover:text-investment ${sortOption === option.value ? 'bg-investment-light text-investment' : ''}`}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      {investments.length === 0 ? (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-investment-light mb-3">
            <PiggyBank className="h-6 w-6 text-investment" />
          </div>
          <p className="text-muted-foreground text-sm mb-4">Nenhum investimento registrado</p>
          <Button
            onClick={() => setIsOpen(true)}
            className="gradient-investment text-white hover:opacity-90"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar primeiro investimento
          </Button>
        </div>
      ) : viewMode === 'general' ? (
        <div className="space-y-1">
          <SectionAddItemButton
            onClick={() => {
              resetForm();
              setIsOpen(true);
            }}
            ariaLabel="Adicionar investimento"
          />
          {firstPartInv.map((investment) => {
            const isSelected = selectedIds.has(investment.id);
            const handleItemClick = (e: React.MouseEvent) => {
              const target = e.target as HTMLElement;
              if (target.closest('button') || target.closest('[role="checkbox"]')) return;
              toggleItemSelection(investment.id, isSelected);
            };
            return (
              <InvestmentListItem
                key={investment.id}
                investment={investment}
                accountLabel={getAccountLabel(investment, accounts)}
                isSelected={isSelected}
                onItemClick={handleItemClick}
                onToggleInvested={handleToggleInvested}
                onToggleSelection={() => toggleItemSelection(investment.id, isSelected)}
                showSelectionToggle={!!onSelectionChange}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            );
          })}
          {restPartInv.length > 0 && (
            <div className={cn('space-y-1', isCollapsingInvestments && 'collapse-out')}>
              {restPartInv.map((investment, index) => {
                const isSelected = selectedIds.has(investment.id);
                const isNewlyExpanded = shouldPlayExpandAnimation;
                const handleItemClick = (e: React.MouseEvent) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('[role="checkbox"]')) return;
                  toggleItemSelection(investment.id, isSelected);
                };
                return (
                  <InvestmentListItem
                    key={investment.id}
                    investment={investment}
                    accountLabel={getAccountLabel(investment, accounts)}
                    isSelected={isSelected}
                    onItemClick={handleItemClick}
                    onToggleInvested={handleToggleInvested}
                    onToggleSelection={() => toggleItemSelection(investment.id, isSelected)}
                    showSelectionToggle={!!onSelectionChange}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    className={isNewlyExpanded ? 'expand-in' : undefined}
                    style={isNewlyExpanded ? { animationDelay: `${index * 35}ms` } : undefined}
                  />
                );
              })}
            </div>
          )}
          {viewMode === 'general' && hasMoreInvestments && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1.5 text-investment hover:bg-investment-light hover:text-investment rounded-lg gap-1.5 disabled:opacity-70 min-h-8 text-xs"
              onClick={handleExpandCollapseInvestments}
              disabled={isCollapsingInvestments}
            >
              {isCollapsingInvestments ? (
                <>Recolhendo...</>
              ) : showAllInvestments ? (
                <><ChevronUp className="h-4 w-4 shrink-0" />Recolher</>
              ) : (
                <><ChevronDown className="h-4 w-4 shrink-0" />Visualizar todos ({sortedInvestments.length})</>
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {groupedByAccount.map(({ institution, total: institutionTotal }) => (
            <InstitutionSummaryItem
              key={institution}
              institution={institution}
              total={institutionTotal}
              groupTotal={total}
              shouldAnimate={shouldAnimate}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir investimento"
        description={
          deleteId
            ? (() => {
                const item = investments.find((i) => i.id === deleteId);
                return item
                  ? `Excluir "${item.description}" (${formatCurrency(item.value)})? Esta ação não pode ser desfeita.`
                  : 'Tem certeza que deseja excluir este investimento? Esta ação não pode ser desfeita.';
              })()
            : 'Tem certeza que deseja excluir este investimento? Esta ação não pode ser desfeita.'
        }
      />

      {/* Apply to All Months Dialog */}
      <ApplyToAllDialog
        open={showApplyToAllDialog}
        onOpenChange={setShowApplyToAllDialog}
        onApplyToCurrentMonth={pendingAction === 'edit' ? handleEditCurrentMonth : handleDeleteCurrentMonth}
        onApplyToAllMonths={pendingAction === 'edit' ? handleEditAllMonths : handleDeleteAllMonths}
        title={pendingAction === 'edit' ? 'Editar investimento fixo' : 'Excluir investimento fixo'}
        description={
          pendingAction === 'edit'
            ? 'Este investimento se repete nos meses. Deseja editar apenas este mês ou em todos os meses seguintes?'
            : 'Este investimento se repete nos meses. Deseja excluir apenas este mês ou em todos os meses seguintes?'
        }
        actionLabel={pendingAction === 'edit' ? 'Editar' : 'Excluir'}
        isDestructive={pendingAction === 'delete'}
        itemSummary={
          editingInvestment
            ? `${editingInvestment.description} — ${formatCurrency(editingInvestment.value)}`
            : undefined
        }
        applyToAllButtonLabel={pendingAction === 'edit' ? 'Alterar todos os meses seguintes' : 'Excluir todos os meses seguintes'}
      />

      <EffectuateInvestmentDialog
        open={!!effectuateTarget}
        onOpenChange={(open) => !open && setEffectuateTarget(null)}
        description={effectuateTarget?.description ?? ''}
        amount={effectuateTarget?.value ?? 0}
        accounts={accounts}
        onConfirm={handleEffectuateConfirm}
        onRequestAddMovementAccount={handleRequestAddAccount}
        onRequestAddInvestmentAccount={handleRequestAddAccount}
      />
    </div>
  );
};

export const InvestmentSection = memo(InvestmentSectionComponent);
