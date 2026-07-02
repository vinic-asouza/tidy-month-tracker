import { useState, useMemo, useEffect, useRef, memo } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, Repeat, List, LayoutGrid, ArrowUpDown, Settings, AlertTriangle, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ApplyToAllDialog } from '@/components/ui/apply-to-all-dialog';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { IncomeEntry } from '@/types/finance';
import { formatDateToYYYYMMDD, formatItemDayMonth } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sectionSurfaceClass } from '@/components/layout/SectionSurface';
import { SectionTotalsHeader } from '@/components/layout/SectionTotalsHeader';
import { SelectionToggle } from '@/components/SelectionToggle';
import { showSelectionHintIfNeeded } from '@/utils/selectionHint';
import { toast } from 'sonner';

type PersistHandler = (data: Omit<IncomeEntry, 'id'>) => Promise<boolean> | boolean;
type UpdateHandler = (
  id: string,
  updates: Partial<IncomeEntry>,
  applyToAllMonths?: boolean
) => Promise<boolean> | boolean;

interface IncomeSectionProps {
  incomes: IncomeEntry[];
  tags: string[];
  onAdd: PersistHandler;
  onUpdate: UpdateHandler;
  onDelete: (id: string, applyToAllMonths?: boolean) => void;
  onAddTag: (tag: string) => void;
  onUpdateTag: (oldTag: string, newTag: string) => void;
  onDeleteTag: (tag: string) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  openAddDialog?: boolean;
  onAddDialogClose?: () => void;
  variant?: 'default' | 'embedded';
  accounts?: import('@/types/domain').Account[];
}

type ViewMode = 'general' | 'summary';
type SortOption = 'date' | 'alphabetic' | 'category' | 'highest' | 'lowest';

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
  { value: 'category', label: 'Categoria' },
  { value: 'highest', label: 'Maior Valor' },
  { value: 'lowest', label: 'Menor Valor' },
];

const NO_ACCOUNT = 'none';

// Sorting function
const sortIncomes = (incomes: IncomeEntry[], sortOption: SortOption): IncomeEntry[] => {
  const sorted = [...incomes];
  const getSortDate = (i: IncomeEntry) => i.date ?? (i.createdAt ? i.createdAt.split('T')[0] : '');

  switch (sortOption) {
    case 'alphabetic':
      return sorted.sort((a, b) => a.description.localeCompare(b.description, 'pt-BR'));
    case 'category':
      return sorted.sort((a, b) => a.tag.localeCompare(b.tag, 'pt-BR'));
    case 'date':
      return sorted.sort((a, b) => getSortDate(a).localeCompare(getSortDate(b)));
    case 'highest':
      return sorted.sort((a, b) => b.value - a.value);
    case 'lowest':
      return sorted.sort((a, b) => a.value - b.value);
  }
  return sorted;
};

// Group incomes by category and calculate totals
const groupByCategory = (incomes: IncomeEntry[], sortOption: SortOption): { category: string; total: number }[] => {
  const grouped = incomes.reduce((acc, income) => {
    if (!acc[income.tag]) {
      acc[income.tag] = 0;
    }
    acc[income.tag] += income.value;
    return acc;
  }, {} as Record<string, number>);

  const result = Object.entries(grouped).map(([category, total]) => ({ category, total }));

  switch (sortOption) {
    case 'alphabetic':
    case 'category':
    case 'date':
      return result.sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'));
    case 'highest':
      return result.sort((a, b) => b.total - a.total);
    case 'lowest':
      return result.sort((a, b) => a.total - b.total);
  }
  return result;
};

// Summary item component
const CategorySummaryItem = ({
  category,
  total,
  groupTotal,
  shouldAnimate,
}: {
  category: string;
  total: number;
  groupTotal: number;
  shouldAnimate: boolean;
}) => {
  const percentage = groupTotal > 0 ? (total / groupTotal) * 100 : 0;
  
  return (
    <div className="relative flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/30 overflow-hidden">
      {/* Progress bar background */}
      <div
        className={`absolute inset-y-0 left-0 bg-income-light rounded-lg ${
          shouldAnimate ? 'progress-bar-animate' : 'transition-all duration-300'
        }`}
        style={{
          width: shouldAnimate ? undefined : `${percentage}%`,
          '--progress-width': `${percentage}%`
        } as React.CSSProperties & { '--progress-width'?: string }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-between w-full z-10 gap-2">
        <Badge
          variant="secondary"
          className="text-[11px] rounded px-1.5 py-0 bg-transparent text-income border-0 cursor-default truncate max-w-[60%] sm:max-w-none leading-tight"
        >
          {category}
        </Badge>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-medium tabular-nums">
            {percentage.toFixed(1)}%
          </span>
          <span className="font-bold whitespace-nowrap text-xs text-income tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
};

const IncomeListItem = ({
  income,
  isSelected,
  onItemClick,
  onToggleReceived,
  onToggleSelection,
  showSelectionToggle,
  onEdit,
  onDelete,
  className,
  style,
}: {
  income: IncomeEntry;
  isSelected: boolean;
  onItemClick: (e: React.MouseEvent) => void;
  onToggleReceived: (income: IncomeEntry) => void;
  onToggleSelection: () => void;
  showSelectionToggle: boolean;
  onEdit: (income: IncomeEntry) => void;
  onDelete: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const actionButtons = (
    <>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted shrink-0" onClick={() => onEdit(income)}>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted shrink-0" onClick={() => onDelete(income.id)}>
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </>
  );

  return (
    <div
      onClick={onItemClick}
      className={cn(
        'group flex items-stretch gap-3 py-2 px-2.5 rounded-lg transition-all duration-200 border-2 cursor-pointer',
        isSelected ? 'border-income/60' : 'border-transparent',
        income.received ? 'bg-income-light hover:bg-income-light/80' : 'bg-muted/30 hover:bg-muted/50',
        className
      )}
      style={style}
    >
      <div className="flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={income.received}
          onCheckedChange={() => onToggleReceived(income)}
          title="Marcar como recebido"
          className="h-4 w-4 rounded border-2 border-income/50 data-[state=checked]:bg-income data-[state=checked]:border-income data-[state=checked]:text-white"
        />
      </div>
      {/* Desktop */}
      <div className="hidden sm:flex flex-1 min-w-0 flex-col justify-center gap-0.5">
        <span className="text-xs text-income font-medium">{income.tag}</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium truncate text-foreground">{income.description}</span>
          {income.repeatAllMonths && <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end justify-center gap-0.5 shrink-0">
        <span className="text-xs text-muted-foreground tabular-nums">{formatItemDayMonth(income.date, income.createdAt)}</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-income whitespace-nowrap text-sm tabular-nums shrink-0">{formatCurrency(income.value)}</span>
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
        <span className="text-xs text-income font-medium">{income.tag}</span>
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-sm font-medium truncate text-foreground">{income.description}</span>
            {income.repeatAllMonths && <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatItemDayMonth(income.date, income.createdAt)}</span>
        </div>
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="font-bold text-income whitespace-nowrap text-sm tabular-nums shrink-0">{formatCurrency(income.value)}</span>
          <div className="flex items-center gap-0.5 shrink-0">
            {actionButtons}
          </div>
        </div>
      </div>
    </div>
  );
};

const IncomeSectionComponent = ({
  incomes,
  tags,
  onAdd,
  onUpdate,
  onDelete,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  selectedIds = new Set(),
  onSelectionChange,
  openAddDialog,
  onAddDialogClose,
  variant = 'default',
  accounts = [],
}: IncomeSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(NO_ACCOUNT);

  useEffect(() => {
    if (openAddDialog) setIsOpen(true);
  }, [openAddDialog]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [itemDate, setItemDate] = useState(() => formatDateToYYYYMMDD(new Date()));
  const [repeatAllMonths, setRepeatAllMonths] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [showApplyToAllDialog, setShowApplyToAllDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);
  const [applyToAllMonths, setApplyToAllMonths] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [sortOption, setSortOption] = useState<SortOption>('date');
  
  // Tag management
  const [isTagsOpenInModal, setIsTagsOpenInModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [isTagLoading, setIsTagLoading] = useState(false);

  // Error states
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  const INITIAL_ITEMS_LIMIT = 10;

  // Apply sorting and grouping
  const sortedIncomes = useMemo(() => sortIncomes(incomes, sortOption), [incomes, sortOption]);
  const groupedByCategory = useMemo(() => groupByCategory(incomes, sortOption), [incomes, sortOption]);

  const [showAllIncomes, setShowAllIncomes] = useState(false);
  const [isCollapsingIncomes, setIsCollapsingIncomes] = useState(false);
  const expandAnimationPlayedRef = useRef(false);
  const isExpandedOrCollapsing = showAllIncomes || isCollapsingIncomes;
  const displayedIncomes = isExpandedOrCollapsing ? sortedIncomes : sortedIncomes.slice(0, INITIAL_ITEMS_LIMIT);
  const hasMoreIncomes = sortedIncomes.length > INITIAL_ITEMS_LIMIT;
  const firstPart = displayedIncomes.slice(0, INITIAL_ITEMS_LIMIT);
  const restPart = displayedIncomes.slice(INITIAL_ITEMS_LIMIT);
  const shouldPlayExpandAnimation = showAllIncomes && !isCollapsingIncomes && !expandAnimationPlayedRef.current;

  useEffect(() => {
    if (!showAllIncomes) {
      expandAnimationPlayedRef.current = false;
      return;
    }
    if (isCollapsingIncomes) return;
    const t = setTimeout(() => {
      expandAnimationPlayedRef.current = true;
    }, 500);
    return () => clearTimeout(t);
  }, [showAllIncomes, isCollapsingIncomes]);

  const handleExpandCollapseIncomes = () => {
    if (isCollapsingIncomes) return;
    if (showAllIncomes) {
      setIsCollapsingIncomes(true);
    } else {
      setShowAllIncomes(true);
    }
  };

  useEffect(() => {
    if (!isCollapsingIncomes) return;
    const t = setTimeout(() => {
      setShowAllIncomes(false);
      setIsCollapsingIncomes(false);
    }, 300);
    return () => clearTimeout(t);
  }, [isCollapsingIncomes]);
  
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

  // Tag management handlers
  const handleAddTag = async () => {
    const trimmed = newTag.trim();
    if (!trimmed || tags.includes(trimmed) || isTagLoading) return;

    setIsTagLoading(true);
    try {
      await onAddTag(trimmed);
      // Se a tag foi adicionada no modal, seleciona automaticamente
      if (isTagsOpenInModal) {
        setSelectedTag(trimmed);
      }
      setNewTag('');
    } finally {
      setIsTagLoading(false);
    }
  };

  const handleSaveTagEdit = async () => {
    if (!editingTag) {
      setEditingTag(null);
      setEditingTagValue('');
      return;
    }

    const trimmed = editingTagValue.trim();
    if (!trimmed || trimmed === editingTag || isTagLoading) {
      setEditingTag(null);
      setEditingTagValue('');
      return;
    }

    setIsTagLoading(true);
    try {
      await onUpdateTag(editingTag, trimmed);
    } finally {
      setIsTagLoading(false);
      setEditingTag(null);
      setEditingTagValue('');
    }
  };

  const handleDeleteTag = async (tag: string) => {
    const hasIncomes = incomes.some((income) => income.tag === tag);
    if (hasIncomes) {
      toast.error('Não é possível excluir: existem entradas usando esta categoria');
      return;
    }
    if (isTagLoading) return;

    setIsTagLoading(true);
    try {
      await onDeleteTag(tag);
    } finally {
      setIsTagLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setValue('');
    setSelectedTag('');
    setItemDate(formatDateToYYYYMMDD(new Date()));
    setRepeatAllMonths(false);
    setEditingId(null);
    setSelectedAccountId(NO_ACCOUNT);
    setDescriptionError(null);
    setValueError(null);
    setTagError(null);
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
    if (!selectedTag) {
      setTagError('Selecione uma categoria');
      hasError = true;
    }
    
    if (hasError) return;

    setIsSubmitting(true);
    try {
      const success = editingId
        ? await onUpdate(
            editingId,
            { description: description.trim(), value: numValue, tag: selectedTag, date: itemDate, repeatAllMonths, accountId: selectedAccountId !== NO_ACCOUNT ? selectedAccountId : undefined },
            applyToAllMonths
          )
        : await onAdd({
            description: description.trim(),
            value: numValue,
            tag: selectedTag,
            date: itemDate,
            repeatAllMonths,
            received: false,
            accountId: selectedAccountId !== NO_ACCOUNT ? selectedAccountId : undefined,
          });

      if (success === false) return;

      if (!editingId && accounts.length > 0 && selectedAccountId === NO_ACCOUNT) {
        toast.info('Salvo sem carteira — não aparecerá nos chips de conta.');
      }

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

  const handleEdit = (income: IncomeEntry) => {
    // Verifica se é item fixo (tem repeatAllMonths ou baseIncomeId)
    const isFixedItem = income.repeatAllMonths || !!income.baseIncomeId;
    
    if (isFixedItem) {
      // Mostra diálogo perguntando se quer editar em todos os meses
      setEditingIncome(income);
      setPendingAction('edit');
      setShowApplyToAllDialog(true);
    } else {
      // Item normal, edita diretamente
      setEditingId(income.id);
      setDescription(income.description);
      setValue(formatValueForInput(income.value));
      setSelectedTag(income.tag);
      setItemDate(income.date ?? formatDateToYYYYMMDD(new Date()));
      setRepeatAllMonths(income.repeatAllMonths || false);
      setSelectedAccountId(income.accountId ?? NO_ACCOUNT);
      setIsOpen(true);
    }
  };

  const handleEditCurrentMonth = () => {
    if (editingIncome) {
      setEditingId(editingIncome.id);
      setDescription(editingIncome.description);
      setValue(formatValueForInput(editingIncome.value));
      setSelectedTag(editingIncome.tag);
      setItemDate(editingIncome.date ?? formatDateToYYYYMMDD(new Date()));
      setRepeatAllMonths(editingIncome.repeatAllMonths || false);
      setSelectedAccountId(editingIncome.accountId ?? NO_ACCOUNT);
      setIsOpen(true);
      setEditingIncome(null);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleEditAllMonths = () => {
    if (editingIncome) {
      setEditingId(editingIncome.id);
      setDescription(editingIncome.description);
      setValue(formatValueForInput(editingIncome.value));
      setSelectedTag(editingIncome.tag);
      setItemDate(editingIncome.date ?? formatDateToYYYYMMDD(new Date()));
      setRepeatAllMonths(editingIncome.repeatAllMonths || false);
      setApplyToAllMonths(true);
      setIsOpen(true);
      setEditingIncome(null);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    const income = incomes.find(i => i.id === id);
    if (income) {
      const isFixedItem = income.repeatAllMonths || !!income.baseIncomeId;
      if (isFixedItem) {
        setEditingIncome(income);
        setPendingAction('delete');
        setShowApplyToAllDialog(true);
      } else {
        setDeleteId(id);
      }
    }
  };

  const handleDeleteCurrentMonth = () => {
    if (editingIncome) {
      setDeleteId(editingIncome.id);
      setEditingIncome(null);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleDeleteAllMonths = () => {
    if (editingIncome) {
      onDelete(editingIncome.id, true); // Passa true para aplicar em todos os meses
      setDeleteId(null);
      setEditingIncome(null);
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

  const handleToggleReceived = (income: IncomeEntry) => {
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;
    onUpdate(income.id, { received: !income.received });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(scrollLeft, scrollTop);
      });
    });
  };

  const total = incomes.reduce((sum, i) => sum + i.value, 0);
  const receivedTotal = incomes
    .filter(i => i.received)
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

  return (
    <div className={shellClass}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {variant === 'default' && (
            <div className="p-2.5 rounded-md gradient-income shrink-0">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          )}
          <SectionTotalsHeader
            title="Entradas"
            plannedTotal={total}
            effectiveTotal={receivedTotal}
            effectiveLabel="Recebido"
            colorClass="text-income"
          />
        </div>
      </div>
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
                  {editingId ? 'Editar Entrada' : 'Nova Entrada'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-4">
                {/* Tag Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    Categoria
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select value={selectedTag} onValueChange={(v) => { setSelectedTag(v); setTagError(null); }}>
                        <SelectTrigger
                          className={`rounded-md h-10 ${tagError ? 'border-destructive' : ''} focus:ring-2 focus:ring-income focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-income focus-visible:ring-offset-2`}
                        >
                          <SelectValue placeholder="Selecione uma categoria..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                          {tags.map((tag) => (
                            <SelectItem
                              key={tag}
                              value={tag}
                              className="rounded-lg focus:bg-income-light focus:text-income hover:bg-income-light/50"
                            >
                              {tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Popover open={isTagsOpenInModal} onOpenChange={setIsTagsOpenInModal}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-md h-10 w-11 text-income hover:bg-income-light hover:text-income focus-visible:ring-2 focus-visible:ring-income focus-visible:ring-offset-2"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 rounded-md p-4 bg-background border shadow-lg" align="end">
                        <h4 className="font-semibold mb-3 text-sm">Gerenciar Categorias</h4>

                        {/* Add new category */}
                        <div className="flex gap-2 mb-3">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Nova categoria..."
                          className="rounded-lg h-9 text-sm focus-visible:ring-2 focus-visible:ring-income focus-visible:ring-offset-2"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                          disabled={isTagLoading}
                        />
                          <Button
                            size="sm"
                            onClick={handleAddTag}
                          className="rounded-lg h-9 px-3 bg-income hover:bg-income/90 focus-visible:ring-2 focus-visible:ring-income focus-visible:ring-offset-2"
                          disabled={isTagLoading || !newTag.trim() || tags.includes(newTag.trim())}
                          >
                          {isTagLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          </Button>
                        </div>

                        {/* List of categories */}
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {tags.map((tag) => {
                            const isUsed = incomes.some((i) => i.tag === tag);
                            const isEditing = editingTag === tag;

                            return (
                              <div
                                key={tag}
                                className="flex items-center gap-2 p-2 rounded-lg bg-income-light/40 hover:bg-income-light"
                              >
                              {isEditing ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    value={editingTagValue}
                                    onChange={(e) => setEditingTagValue(e.target.value)}
                                    className="h-7 text-sm rounded-md flex-1 focus-visible:ring-2 focus-visible:ring-income focus-visible:ring-offset-2"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTagEdit()}
                                    autoFocus
                                    disabled={isTagLoading}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md text-income hover:bg-income-light flex-shrink-0"
                                    onClick={handleSaveTagEdit}
                                    title="Confirmar edição"
                                    disabled={isTagLoading}
                                  >
                                    {isTagLoading ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="flex-1 text-sm truncate">{tag}</span>
                              )}

                              {!isEditing && (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-md text-income hover:bg-income-light"
                                      onClick={() => {
                                        setEditingTag(tag);
                                        setEditingTagValue(tag);
                                    }}
                                    disabled={isTagLoading}
                                    >
                                      <Pencil className="h-3 w-3 text-income" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-md hover:bg-income-light"
                                      onClick={() => handleDeleteTag(tag)}
                                    disabled={isUsed || isTagLoading}
                                      title={isUsed ? 'Esta categoria está em uso' : 'Excluir'}
                                    >
                                      <Trash2
                                        className={`h-3 w-3 ${isUsed ? 'text-muted-foreground/40' : 'text-income'}`}
                                      />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {tagError && (
                    <p className="text-destructive text-sm mt-1">{tagError}</p>
                  )}
                </div>

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

                {/* Description and Value: coluna no mobile, mesma linha no desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-3">
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">
                      Descrição
                    </label>
                    <Input
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); setDescriptionError(null); }}
                      placeholder="Ex: Salário janeiro"
                      className={`rounded-md h-10 ${descriptionError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-income focus-visible:ring-offset-2`}
                    />
                    {descriptionError && <p className="text-destructive text-sm mt-1">{descriptionError}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">
                      Valor
                    </label>
                    <CurrencyInput
                      value={value}
                      onValueChange={(v) => { setValue(v); setValueError(null); }}
                      className={`rounded-md h-10 ${valueError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-income focus-visible:ring-offset-2`}
                    />
                    {valueError && <p className="text-destructive text-sm mt-1">{valueError}</p>}
                  </div>
                </div>

                {/* Account / Carteira */}
                {accounts.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
                      Carteira (opcional)
                    </label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger className="rounded-md h-10">
                        <SelectValue placeholder="Nenhuma carteira" />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        <SelectItem value={NO_ACCOUNT} className="rounded-lg">Nenhuma</SelectItem>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id} className="rounded-lg">
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Repeat All Months */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="repeat-months" className="text-sm font-medium cursor-pointer">
                      Repetir todos os meses
                    </Label>
                  </div>
                  <Switch
                    id="repeat-months"
                    checked={repeatAllMonths}
                    onCheckedChange={setRepeatAllMonths}
                    className="data-[state=checked]:bg-income focus-visible:ring-income"
                  />
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                  Repete nos demais meses deste ano.
                </p>

                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-md gradient-income hover:opacity-90 transition-opacity text-white border-0"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    'Salvar Alterações'
                  ) : (
                    'Adicionar Entrada'
                  )}
                </Button>
              </div>
          </DialogContent>
        </Dialog>

      {/* View Controls */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        {/* View Mode Toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
          className="bg-income-light rounded-lg p-0.5"
        >
          <ToggleGroupItem
            value="general"
            aria-label="Visualização geral"
            className="rounded-md px-2 sm:px-2.5 py-1 text-xs data-[state=on]:bg-income data-[state=on]:text-white data-[state=on]:shadow-sm text-income hover:bg-income/20 hover:text-income"
          >
            <List className="h-3 w-3 mr-1 shrink-0" />
            Geral
          </ToggleGroupItem>
          <ToggleGroupItem
            value="summary"
            aria-label="Visualização resumida"
            className="rounded-md px-2 sm:px-2.5 py-1 text-xs data-[state=on]:bg-income data-[state=on]:text-white data-[state=on]:shadow-sm text-income hover:bg-income/20 hover:text-income"
          >
            <LayoutGrid className="h-3 w-3 mr-1 shrink-0" />
            Resumo
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg h-7 px-2 sm:px-2.5 text-xs gap-1 text-income hover:text-income hover:bg-income-light"
            >
              <ArrowUpDown className="h-3 w-3 shrink-0" />
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
                className={`rounded-lg cursor-pointer hover:bg-income-light hover:text-income ${sortOption === option.value ? 'bg-income-light text-income' : ''}`}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      {incomes.length === 0 ? (
        <div className="text-center py-8 sm:py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-income-light mb-3 shrink-0">
            <TrendingUp className="h-6 w-6 text-income" />
          </div>
          <p className="text-muted-foreground text-sm mb-4">Nenhuma entrada registrada</p>
          <Button
            onClick={() => setIsOpen(true)}
            className="gradient-income text-white hover:opacity-90"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar primeira entrada
          </Button>
        </div>
      ) : viewMode === 'general' ? (
        <div className="space-y-1">
          {firstPart.map((income) => {
            const isSelected = selectedIds.has(income.id);
            const handleItemClick = (e: React.MouseEvent) => {
              const target = e.target as HTMLElement;
              if (target.closest('button') || target.closest('[role="checkbox"]')) return;
              toggleItemSelection(income.id, isSelected);
            };
            return (
              <IncomeListItem
                key={income.id}
                income={income}
                isSelected={isSelected}
                onItemClick={handleItemClick}
                onToggleReceived={handleToggleReceived}
                onToggleSelection={() => toggleItemSelection(income.id, isSelected)}
                showSelectionToggle={!!onSelectionChange}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            );
          })}
          {restPart.length > 0 && (
            <div className={cn('space-y-1', isCollapsingIncomes && 'collapse-out')}>
              {restPart.map((income, index) => {
                const isSelected = selectedIds.has(income.id);
                const isNewlyExpanded = shouldPlayExpandAnimation;
                const handleItemClick = (e: React.MouseEvent) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('[role="checkbox"]')) return;
                  toggleItemSelection(income.id, isSelected);
                };
                return (
                  <IncomeListItem
                    key={income.id}
                    income={income}
                    isSelected={isSelected}
                    onItemClick={handleItemClick}
                    onToggleReceived={handleToggleReceived}
                    onToggleSelection={() => toggleItemSelection(income.id, isSelected)}
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
          {viewMode === 'general' && hasMoreIncomes && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1.5 text-income hover:bg-income-light hover:text-income rounded-lg gap-1.5 disabled:opacity-70 min-h-8 text-xs"
              onClick={handleExpandCollapseIncomes}
              disabled={isCollapsingIncomes}
            >
              {isCollapsingIncomes ? (
                <>Recolhendo...</>
              ) : showAllIncomes ? (
                <><ChevronUp className="h-4 w-4 shrink-0" />Recolher</>
              ) : (
                <><ChevronDown className="h-4 w-4 shrink-0" />Visualizar todos ({sortedIncomes.length})</>
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {groupedByCategory.map(({ category, total: categoryTotal }) => (
            <CategorySummaryItem
              key={category}
              category={category}
              total={categoryTotal}
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
        title="Excluir entrada"
        description={
          deleteId
            ? (() => {
                const item = incomes.find((i) => i.id === deleteId);
                return item
                  ? `Excluir "${item.description}" (${formatCurrency(item.value)})? Esta ação não pode ser desfeita.`
                  : 'Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.';
              })()
            : 'Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.'
        }
      />

      {/* Apply to All Months Dialog */}
      <ApplyToAllDialog
        open={showApplyToAllDialog}
        onOpenChange={setShowApplyToAllDialog}
        onApplyToCurrentMonth={pendingAction === 'edit' ? handleEditCurrentMonth : handleDeleteCurrentMonth}
        onApplyToAllMonths={pendingAction === 'edit' ? handleEditAllMonths : handleDeleteAllMonths}
        title={pendingAction === 'edit' ? 'Editar entrada fixa' : 'Excluir entrada fixa'}
        description={
          pendingAction === 'edit'
            ? 'Esta entrada se repete nos meses. Deseja editar apenas este mês ou em todos os meses seguintes?'
            : 'Esta entrada se repete nos meses. Deseja excluir apenas este mês ou em todos os meses seguintes?'
        }
        actionLabel={pendingAction === 'edit' ? 'Editar' : 'Excluir'}
        isDestructive={pendingAction === 'delete'}
        itemSummary={
          editingIncome
            ? `${editingIncome.description} — ${formatCurrency(editingIncome.value)}`
            : undefined
        }
        applyToAllButtonLabel={pendingAction === 'edit' ? 'Alterar todos os meses seguintes' : 'Excluir todos os meses seguintes'}
      />
    </div>
  );
};

export const IncomeSection = memo(IncomeSectionComponent);
