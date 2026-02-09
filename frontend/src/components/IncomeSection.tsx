import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, Repeat, List, LayoutGrid, ArrowUpDown } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { IncomeEntry } from '@/types/finance';
import { formatDateToYYYYMMDD } from '@/lib/utils';

interface IncomeSectionProps {
  incomes: IncomeEntry[];
  tags: string[];
  onAdd: (income: Omit<IncomeEntry, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<IncomeEntry>) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

type ViewMode = 'general' | 'summary';
type SortOption = 'default' | 'alphabetic' | 'category' | 'highest' | 'lowest';

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
  { value: 'default', label: 'Padrão' },
  { value: 'alphabetic', label: 'Ordem Alfabética' },
  { value: 'category', label: 'Categoria' },
  { value: 'highest', label: 'Maior Valor' },
  { value: 'lowest', label: 'Menor Valor' },
];

// Sorting function
const sortIncomes = (incomes: IncomeEntry[], sortOption: SortOption): IncomeEntry[] => {
  if (sortOption === 'default') return incomes;
  
  const sorted = [...incomes];
  
  switch (sortOption) {
    case 'alphabetic':
      return sorted.sort((a, b) => a.description.localeCompare(b.description, 'pt-BR'));
    case 'category':
      return sorted.sort((a, b) => a.tag.localeCompare(b.tag, 'pt-BR'));
    case 'highest':
      return sorted.sort((a, b) => b.value - a.value);
    case 'lowest':
      return sorted.sort((a, b) => a.value - b.value);
    default:
      return sorted;
  }
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
      return result.sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'));
    case 'highest':
      return result.sort((a, b) => b.total - a.total);
    case 'lowest':
      return result.sort((a, b) => a.total - b.total);
    default:
      return result;
  }
};

// Summary item component
const CategorySummaryItem = ({
  category,
  total,
}: {
  category: string;
  total: number;
}) => {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/30">
      <Badge 
        variant="secondary" 
        className="text-xs rounded-md px-2 py-0.5 bg-income-light text-income border-0 cursor-default"
      >
        {category}
      </Badge>
      <span className="font-bold whitespace-nowrap text-sm text-income">
        {formatCurrency(total)}
      </span>
    </div>
  );
};

export const IncomeSection = ({
  incomes,
  tags,
  onAdd,
  onUpdate,
  onDelete,
  selectedIds,
  onSelectionChange,
}: IncomeSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [repeatAllMonths, setRepeatAllMonths] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  
  // Error states
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  // Apply sorting and grouping
  const sortedIncomes = useMemo(() => sortIncomes(incomes, sortOption), [incomes, sortOption]);
  const groupedByCategory = useMemo(() => groupByCategory(incomes, sortOption), [incomes, sortOption]);

  const resetForm = () => {
    setDescription('');
    setValue('');
    setSelectedTag('');
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
      setTagError('Selecione uma categoria');
      hasError = true;
    }
    
    if (hasError) return;

    if (editingId) {
      onUpdate(editingId, { description: description.trim(), value: numValue, tag: selectedTag, repeatAllMonths });
    } else {
      onAdd({
        description: description.trim(),
        value: numValue,
        tag: selectedTag,
        date: formatDateToYYYYMMDD(new Date()),
        repeatAllMonths,
      });
    }
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (income: IncomeEntry) => {
    setEditingId(income.id);
    setDescription(income.description);
    setValue(formatValueForInput(income.value));
    setSelectedTag(income.tag);
    setRepeatAllMonths(income.repeatAllMonths || false);
    setIsOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
      const newSet = new Set(selectedIds);
      newSet.delete(deleteId);
      onSelectionChange(newSet);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange(newSet);
  };

  const total = incomes.reduce((sum, i) => sum + i.value, 0);
  const selectedTotal = incomes
    .filter(i => selectedIds.has(i.id))
    .reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-income shadow-glow-income">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Entradas</h3>
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-income">
                {formatCurrency(total)}
              </p>
              {selectedIds.size > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">| Recebido:</span>
                  <p className="text-base font-bold text-income">
                    {formatCurrency(selectedTotal)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="rounded-xl gradient-income shadow-glow-income hover:opacity-90 transition-opacity text-white border-0"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
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
                <Select value={selectedTag} onValueChange={(v) => { setSelectedTag(v); setTagError(null); }}>
                  <SelectTrigger className={`rounded-xl h-11 ${tagError ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Selecione uma categoria..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {tags.map((tag) => (
                      <SelectItem key={tag} value={tag} className="rounded-lg">
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tagError && <p className="text-destructive text-sm mt-1">{tagError}</p>}
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
                    placeholder="Ex: Salário janeiro"
                    className={`rounded-xl h-11 ${descriptionError ? 'border-destructive' : ''}`}
                  />
                  {descriptionError && <p className="text-destructive text-sm mt-1">{descriptionError}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    Valor
                  </label>
                  <CurrencyInput
                    value={value}
                    onValueChange={(v) => { setValue(v); setValueError(null); }}
                    className={`rounded-xl h-11 ${valueError ? 'border-destructive' : ''}`}
                  />
                  {valueError && <p className="text-destructive text-sm mt-1">{valueError}</p>}
                </div>
              </div>

              {/* Repeat All Months */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
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
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full h-11 rounded-xl gradient-income shadow-glow-income hover:opacity-90 transition-opacity text-white border-0"
              >
                {editingId ? 'Salvar Alterações' : 'Adicionar Entrada'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between mb-4 gap-2">
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
            className="rounded-md px-2.5 py-1 text-xs data-[state=on]:bg-income data-[state=on]:text-white data-[state=on]:shadow-sm text-income hover:bg-income/20 hover:text-income"
          >
            <List className="h-3 w-3 mr-1" />
            Geral
          </ToggleGroupItem>
          <ToggleGroupItem
            value="summary"
            aria-label="Visualização resumida"
            className="rounded-md px-2.5 py-1 text-xs data-[state=on]:bg-income data-[state=on]:text-white data-[state=on]:shadow-sm text-income hover:bg-income/20 hover:text-income"
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
              className="rounded-lg h-7 px-2.5 text-xs gap-1 text-income hover:text-income hover:bg-income-light"
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
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-income-light mb-3">
            <TrendingUp className="h-6 w-6 text-income" />
          </div>
          <p className="text-muted-foreground text-sm">
            Nenhuma entrada registrada
          </p>
        </div>
      ) : viewMode === 'general' ? (
        <div className="space-y-1">
          {sortedIncomes.map((income) => {
            const isSelected = selectedIds.has(income.id);
            return (
              <div
                key={income.id}
                className={`group flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-200 cursor-default ${
                  isSelected ? 'bg-income-light' : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(income.id)}
                  className="h-4 w-4 rounded-md border-2 border-income/50 data-[state=checked]:bg-income data-[state=checked]:border-income data-[state=checked]:text-white flex-shrink-0"
                />

                {/* Tag */}
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-income-light text-income border-0 rounded-md px-2 py-0.5 flex-shrink-0 cursor-default"
                >
                  {income.tag}
                </Badge>

                {/* Description */}
                <span className="flex-1 text-sm font-medium truncate text-foreground">
                  {income.description}
                </span>

                {/* Repeat indicator */}
                {income.repeatAllMonths && (
                  <Repeat className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}

                {/* Value */}
                <span className="font-bold text-income whitespace-nowrap text-sm flex-shrink-0 transition-all duration-200 group-hover:mr-0">
                  {formatCurrency(income.value)}
                </span>

                {/* Actions - slide in from right */}
                <div className="flex gap-1 w-0 overflow-hidden group-hover:w-16 transition-all duration-200 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-muted"
                    onClick={() => handleEdit(income)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-muted"
                    onClick={() => setDeleteId(income.id)}
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
          {groupedByCategory.map(({ category, total }) => (
            <CategorySummaryItem
              key={category}
              category={category}
              total={total}
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
        description="Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita."
      />
    </div>
  );
};
