import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, PiggyBank, Settings, List, LayoutGrid, ArrowUpDown, Repeat, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ApplyToAllDialog } from '@/components/ui/apply-to-all-dialog';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { Investment } from '@/types/finance';
import { formatDateToYYYYMMDD, formatItemDayMonth } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvestmentSectionProps {
  investments: Investment[];
  tags: string[];
  onAdd: (investment: Omit<Investment, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Investment>, applyToAllMonths?: boolean) => void;
  onDelete: (id: string, applyToAllMonths?: boolean) => void;
  onAddTag: (tag: string) => void;
  onUpdateTag: (oldTag: string, newTag: string) => void;
  onDeleteTag: (tag: string) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  /** Abre o dialog de novo investimento (controlado pelo FAB global) */
  openAddDialog?: boolean;
  /** Chamado quando o dialog de adicionar é fechado */
  onAddDialogClose?: () => void;
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
  { value: 'institution', label: 'Instituição' },
  { value: 'highest', label: 'Maior Valor' },
  { value: 'lowest', label: 'Menor Valor' },
];

// Sorting function
const sortInvestments = (investments: Investment[], sortOption: SortOption): Investment[] => {
  const sorted = [...investments];
  const getSortDate = (i: Investment) => i.date ?? (i.createdAt ? i.createdAt.split('T')[0] : '');

  switch (sortOption) {
    case 'alphabetic':
      return sorted.sort((a, b) => a.description.localeCompare(b.description, 'pt-BR'));
    case 'institution':
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

// Group investments by institution and calculate totals
const groupByInstitution = (investments: Investment[], sortOption: SortOption): { institution: string; total: number }[] => {
  const grouped = investments.reduce((acc, investment) => {
    if (!acc[investment.tag]) {
      acc[investment.tag] = 0;
    }
    acc[investment.tag] += investment.value;
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
    <div className="relative flex items-center justify-between py-1.5 px-3 rounded-xl bg-muted/30 overflow-hidden">
      {/* Progress bar background */}
      <div
        className={`absolute inset-y-0 left-0 bg-investment-light rounded-xl ${
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

export const InvestmentSection = ({
  investments,
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
}: InvestmentSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [showApplyToAllDialog, setShowApplyToAllDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);
  const [applyToAllMonths, setApplyToAllMonths] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [sortOption, setSortOption] = useState<SortOption>('date');
  
  // Tag management
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isTagsOpenInModal, setIsTagsOpenInModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [isTagLoading, setIsTagLoading] = useState(false);
  
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  // Apply sorting and grouping
  const sortedInvestments = useMemo(() => sortInvestments(investments, sortOption), [investments, sortOption]);
  const groupedByInstitution = useMemo(() => groupByInstitution(investments, sortOption), [investments, sortOption]);
  
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
    setSelectedTag('');
    setItemDate(formatDateToYYYYMMDD(new Date()));
    setRepeatAllMonths(false);
    setEditingId(null);
    setDescriptionError(null);
    setValueError(null);
    setTagError(null);
  };

  const handleSubmit = () => {
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
      setTagError('Selecione uma instituição');
      hasError = true;
    }
    
    if (hasError) return;

    if (editingId) {
      onUpdate(editingId, { description: description.trim(), value: numValue, tag: selectedTag, date: itemDate, repeatAllMonths }, applyToAllMonths);
      setApplyToAllMonths(false);
    } else {
      onAdd({
        description: description.trim(),
        value: numValue,
        tag: selectedTag,
        date: itemDate,
        repeatAllMonths,
        invested: false
      });
    }
    resetForm();
    setIsOpen(false);
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
      setSelectedTag(investment.tag);
      setItemDate(investment.date ?? formatDateToYYYYMMDD(new Date()));
      setRepeatAllMonths(investment.repeatAllMonths || false);
      setIsOpen(true);
    }
  };

  const handleEditCurrentMonth = () => {
    if (editingInvestment) {
      setEditingId(editingInvestment.id);
      setDescription(editingInvestment.description);
      setValue(formatValueForInput(editingInvestment.value));
      setSelectedTag(editingInvestment.tag);
      setItemDate(editingInvestment.date ?? formatDateToYYYYMMDD(new Date()));
      setRepeatAllMonths(editingInvestment.repeatAllMonths || false);
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
      setSelectedTag(editingInvestment.tag);
      setItemDate(editingInvestment.date ?? formatDateToYYYYMMDD(new Date()));
      setRepeatAllMonths(editingInvestment.repeatAllMonths || false);
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
    onUpdate(investment.id, { invested: !investment.invested });
  };
  
  // Tag management handlers
  const handleAddTag = async () => {
    const trimmed = newTag.trim();
    if (!trimmed || tags.includes(trimmed) || isTagLoading) return;

    setIsTagLoading(true);
    try {
      await onAddTag(trimmed);
      setNewTag('');
      // Se a tag foi adicionada no modal, seleciona ela automaticamente
      if (isTagsOpenInModal) {
        setSelectedTag(trimmed);
      }
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
    // Check if any investment uses this tag
    const hasInvestments = investments.some(i => i.tag === tag);
    if (hasInvestments || isTagLoading) {
      return; // Don't delete if in use
    }

    setIsTagLoading(true);
    try {
      await onDeleteTag(tag);
    } finally {
      setIsTagLoading(false);
    }
  };

  const total = investments.reduce((sum, i) => sum + i.value, 0);
  const investedTotal = investments
    .filter(i => i.invested)
    .reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-investment shadow-glow-investment">
            <PiggyBank className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Investimentos</h3>
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-investment">
                {formatCurrency(total)}
              </p>
              {investedTotal > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">| Investido:</span>
                  <p className="text-base font-bold text-investment">
                    {formatCurrency(investedTotal)}
                  </p>
                </>
              )}
            </div>
          </div>
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
        <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingId ? 'Editar Investimento' : 'Novo Investimento'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-4">
                {/* Tag Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    Instituição
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select value={selectedTag} onValueChange={(v) => { setSelectedTag(v); setTagError(null); }}>
                        <SelectTrigger
                          className={`rounded-xl h-11 ${tagError ? 'border-destructive' : ''} focus:ring-2 focus:ring-investment focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-investment focus-visible:ring-offset-2`}
                        >
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {tags.map((tag) => (
                            <SelectItem
                              key={tag}
                              value={tag}
                              className="rounded-lg focus:bg-investment-light focus:text-investment hover:bg-investment-light/50"
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
                          className="rounded-xl h-11 w-11 text-investment hover:bg-investment-light hover:text-investment focus-visible:ring-2 focus-visible:ring-investment focus-visible:ring-offset-2"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 rounded-xl p-4 bg-background border shadow-lg" align="end">
                        <h4 className="font-semibold mb-3 text-sm">Gerenciar Instituições</h4>
                        
                        {/* Add new tag */}
                        <div className="flex gap-2 mb-3">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Nova instituição..."
                            className="rounded-lg h-9 text-sm focus-visible:ring-2 focus-visible:ring-investment focus-visible:ring-offset-2"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            disabled={isTagLoading}
                          />
                          <Button 
                            size="sm" 
                            onClick={handleAddTag}
                            className="rounded-lg h-9 px-3 bg-investment hover:bg-investment/90 focus-visible:ring-2 focus-visible:ring-investment focus-visible:ring-offset-2"
                            disabled={isTagLoading || !newTag.trim() || tags.includes(newTag.trim())}
                          >
                            {isTagLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {/* List of tags */}
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {tags.map((tag) => {
                            const isUsed = investments.some(i => i.tag === tag);
                            const isEditing = editingTag === tag;
                            
                            return (
                              <div 
                                key={tag} 
                                className="flex items-center gap-2 p-2 rounded-lg bg-investment-light/40 hover:bg-investment-light"
                              >
                                {isEditing ? (
                                  <div className="flex items-center gap-1 flex-1">
                                    <Input
                                      value={editingTagValue}
                                      onChange={(e) => setEditingTagValue(e.target.value)}
                                      className="h-7 text-sm rounded-md flex-1 focus-visible:ring-2 focus-visible:ring-investment focus-visible:ring-offset-2"
                                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTagEdit()}
                                      autoFocus
                                      disabled={isTagLoading}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-md text-investment hover:bg-investment-light flex-shrink-0"
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
                                      className="h-6 w-6 rounded-md text-investment hover:bg-investment-light"
                                      onClick={() => {
                                        setEditingTag(tag);
                                        setEditingTagValue(tag);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3 text-investment" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-md hover:bg-investment-light"
                                      onClick={() => handleDeleteTag(tag)}
                                      disabled={isUsed}
                                      title={isUsed ? 'Esta instituição está em uso' : 'Excluir'}
                                    >
                                      <Trash2 className={`h-3 w-3 ${isUsed ? 'text-muted-foreground/40' : 'text-investment'}`} />
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
                          'w-full justify-start text-left font-normal rounded-xl h-11',
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
                      className={`rounded-xl h-11 ${descriptionError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-investment focus-visible:ring-offset-2`}
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
                      className={`rounded-xl h-11 ${valueError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-investment focus-visible:ring-offset-2`}
                    />
                    {valueError && (
                      <p className="text-destructive text-sm mt-1">{valueError}</p>
                    )}
                  </div>
                </div>

                {/* Repeat All Months */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
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

                <Button 
                  onClick={handleSubmit} 
                  className="w-full h-11 rounded-xl gradient-investment shadow-glow-investment hover:opacity-90 transition-opacity text-white border-0"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Investimento'}
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
          <DropdownMenuContent align="end" className="rounded-xl">
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-investment-light mb-3">
            <PiggyBank className="h-6 w-6 text-investment" />
          </div>
          <p className="text-muted-foreground text-sm">
            Nenhum investimento registrado
          </p>
        </div>
      ) : viewMode === 'general' ? (
        <div className="space-y-1">
          {sortedInvestments.map((investment) => {
            const isSelected = selectedIds.has(investment.id);
            
            const handleItemClick = (e: React.MouseEvent) => {
              // Don't trigger selection if clicking on checkbox or action buttons
              const target = e.target as HTMLElement;
              if (
                target.closest('button') ||
                target.closest('[role="checkbox"]') ||
                target.closest('.group-hover\\:w-16')
              ) {
                return;
              }
              
              if (onSelectionChange) {
                const newSelection = new Set(selectedIds);
                if (isSelected) {
                  newSelection.delete(investment.id);
                } else {
                  newSelection.add(investment.id);
                }
                onSelectionChange(newSelection);
              }
            };

            return (
              <div
                key={investment.id}
                onClick={handleItemClick}
                className={`group flex items-center gap-2 py-1.5 px-3 rounded-xl transition-all duration-200 ${
                  isSelected 
                    ? 'bg-muted/70 cursor-pointer' 
                    : investment.invested 
                      ? 'bg-investment-light cursor-pointer hover:bg-investment-light/80' 
                      : 'bg-muted/30 cursor-pointer hover:bg-muted/50'
                }`}
              >
                {/* Checkbox */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={investment.invested}
                    onCheckedChange={() => handleToggleInvested(investment)}
                    className="h-4 w-4 rounded-md border-2 border-investment/50 data-[state=checked]:bg-investment data-[state=checked]:border-investment data-[state=checked]:text-white flex-shrink-0"
                  />
                </div>

                {/* Esquerda: categoria, data, descrição */}
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-investment-light text-investment border-0 rounded-md px-2 py-0.5 flex-shrink-0 cursor-default hover:opacity-100 hover:bg-investment-light"
                >
                  {investment.tag}
                </Badge>
                <span className="text-muted-foreground text-xs tabular-nums flex-shrink-0">
                  {formatItemDayMonth(investment.date, investment.createdAt)}
                </span>
                <span className="flex-1 text-sm font-medium truncate text-foreground min-w-0">
                  {investment.description}
                </span>

                {/* Direita: valor, ícone recorrência */}
                <span className="font-bold text-investment whitespace-nowrap text-sm flex-shrink-0 transition-all duration-200">
                  {formatCurrency(investment.value)}
                </span>
                {investment.repeatAllMonths && (
                  <Repeat className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}

                {/* Actions */}
                <div 
                  className="flex gap-1 w-0 overflow-hidden group-hover:w-16 transition-all duration-200 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-muted"
                    onClick={() => handleEdit(investment)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-muted"
                    onClick={() => handleDeleteClick(investment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {groupedByInstitution.map(({ institution, total: institutionTotal }) => (
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
        description="Tem certeza que deseja excluir este investimento? Esta ação não pode ser desfeita."
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
        applyToAllButtonLabel={pendingAction === 'edit' ? 'Alterar todos os meses seguintes' : 'Excluir todos os meses seguintes'}
      />
    </div>
  );
};
