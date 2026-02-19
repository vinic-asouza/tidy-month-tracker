import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, CreditCard as CreditCardIcon, CheckCircle2, AlertTriangle, List, LayoutGrid, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { CreditCard, CARD_COLORS } from '@/types/finance';

interface CreditCardSectionProps {
  creditCards: CreditCard[];
  currentMonth: string;
  onAdd: (card: Omit<CreditCard, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<CreditCard>) => void;
  onDelete: (id: string) => void;
  getCardTotal: (cardName: string) => number;
  canDeleteCard: (cardName: string) => boolean;
  cardNameExists: (name: string, excludeId?: string) => boolean;
  getCardPaidStatus: (cardId: string) => boolean;
  setCardPaidStatus: (cardId: string, paid: boolean) => Promise<boolean>;
}

type ViewMode = 'general' | 'summary';
type SortOption = 'default' | 'alphabetic' | 'color' | 'highest' | 'lowest';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'alphabetic', label: 'Ordem Alfabética' },
  { value: 'color', label: 'Cor' },
  { value: 'highest', label: 'Maior Valor' },
  { value: 'lowest', label: 'Menor Valor' },
];

export const CreditCardSection = ({
  creditCards,
  currentMonth,
  onAdd,
  onUpdate,
  onDelete,
  getCardTotal,
  canDeleteCard,
  cardNameExists,
  getCardPaidStatus,
  setCardPaidStatus,
}: CreditCardSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].id);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Sorting function
  const sortCards = (cards: CreditCard[]): CreditCard[] => {
    if (sortOption === 'default') return cards;
    
    const sorted = [...cards];
    
    switch (sortOption) {
      case 'alphabetic':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      case 'color':
        return sorted.sort((a, b) => {
          const colorOrderA = CARD_COLORS.findIndex(c => c.id === a.color);
          const colorOrderB = CARD_COLORS.findIndex(c => c.id === b.color);
          return colorOrderA - colorOrderB;
        });
      case 'highest':
        return sorted.sort((a, b) => getCardTotal(b.name) - getCardTotal(a.name));
      case 'lowest':
        return sorted.sort((a, b) => getCardTotal(a.name) - getCardTotal(b.name));
      default:
        return sorted;
    }
  };

  const sortedCards = useMemo(() => sortCards(creditCards), [creditCards, sortOption]);

  const resetForm = () => {
    setName('');
    setSelectedColor(CARD_COLORS[0].id);
    setEditingId(null);
    setNameError(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError('Nome do cartão é obrigatório');
      return;
    }

    if (cardNameExists(name.trim(), editingId || undefined)) {
      setNameError('Já existe um cartão com este nome');
      return;
    }

    if (editingId) {
      onUpdate(editingId, { name: name.trim(), color: selectedColor });
    } else {
      onAdd({ name: name.trim(), color: selectedColor, paid: false });
    }
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (card: CreditCard) => {
    setEditingId(card.id);
    setName(card.name);
    setSelectedColor(card.color || CARD_COLORS[0].id);
    setIsOpen(true);
  };

  const handleDeleteAttempt = (card: CreditCard) => {
    if (!canDeleteCard(card.name)) {
      setDeleteError(`Não é possível excluir o cartão "${card.name}" pois existem gastos vinculados a ele. Remova os gastos primeiro.`);
      return;
    }
    setDeleteId(card.id);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const getColorClass = (colorId: string) => {
    return CARD_COLORS.find(c => c.id === colorId)?.class || CARD_COLORS[0].class;
  };

  const totalInvoices = creditCards.reduce((sum, card) => sum + getCardTotal(card.name), 0);

  // Render individual card
  const renderCard = (card: CreditCard) => {
    const total = getCardTotal(card.name);
    const colorClass = getColorClass(card.color);
    const isPaid = getCardPaidStatus(card.id);
    
    return (
      <div
        key={card.id}
        className={`group relative overflow-hidden rounded-xl p-3 transition-all duration-300 hover-lift ${
          isPaid ? 'opacity-70' : ''
        }`}
      >
        {/* Card Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-90`} />
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-4 w-4 text-white/80" />
              <span className="font-semibold text-white text-sm">{card.name}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => handleEdit(card)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => handleDeleteAttempt(card)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="mb-2">
            <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">Fatura</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(total)}
            </p>
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t border-white/20">
            <Checkbox
              id={`card-paid-${card.id}`}
              checked={isPaid}
              onCheckedChange={(checked) => setCardPaidStatus(card.id, !!checked)}
              className="h-4 w-4 rounded-md border-2 border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-gray-900"
            />
            <label
              htmlFor={`card-paid-${card.id}`}
              className="text-xs text-white/80 cursor-pointer flex items-center gap-1"
            >
              Fatura paga
            </label>
          </div>
        </div>
      </div>
    );
  };

  // Render summary card (all cards combined)
  const renderSummaryCard = () => {
    const paidCount = creditCards.filter(c => getCardPaidStatus(c.id)).length;
    const allPaid = paidCount === creditCards.length && creditCards.length > 0;
    
    return (
      <div
        className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 ${
          allPaid ? 'opacity-70' : ''
        }`}
      >
        {/* Credit section gradient background */}
        <div className="absolute inset-0 gradient-credit opacity-95" />
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-10 -translate-x-10" />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <CreditCardIcon className="h-5 w-5 text-white/80" />
            <span className="font-semibold text-white">Todos os Cartões</span>
          </div>
          
          <div className="mb-3">
            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Total das Faturas</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(totalInvoices)}
            </p>
          </div>
          
          <div className="flex items-center gap-3 pt-3 border-t border-white/20">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/70">{creditCards.length} cartões</span>
            </div>
            {paidCount > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-white/70" />
                <span className="text-xs text-white/70">{paidCount} pagos</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-credit shadow-glow-credit">
            <CreditCardIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Cartões de Crédito</h3>
            <p className="text-base font-bold text-credit">
              {formatCurrency(totalInvoices)}
            </p>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="rounded-xl gradient-credit shadow-glow-credit hover:opacity-90 transition-opacity text-white border-0"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingId ? 'Editar Cartão' : 'Novo Cartão'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Nome do Cartão
                </label>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(null); }}
                  placeholder="Ex: Nubank, Inter, C6..."
                  className={`rounded-xl h-11 focus-visible:ring-2 focus-visible:ring-credit focus-visible:ring-offset-2 ${nameError ? 'border-destructive' : ''}`}
                />
                {nameError && (
                  <p className="text-destructive text-sm mt-1">{nameError}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Cor do Cartão
                </label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger className="rounded-xl h-11 focus-visible:ring-2 focus-visible:ring-credit focus-visible:ring-offset-2 focus:ring-2 focus:ring-credit focus:ring-offset-2">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${getColorClass(selectedColor)}`} />
                        <span>{CARD_COLORS.find(c => c.id === selectedColor)?.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CARD_COLORS.map((color) => (
                      <SelectItem
                        key={color.id}
                        value={color.id}
                        className="rounded-lg focus:bg-credit-light focus:text-credit hover:bg-credit-light/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${color.class}`} />
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleSubmit} 
                className="w-full h-11 rounded-xl gradient-credit shadow-glow-credit hover:opacity-90 transition-opacity text-white border-0 focus-visible:ring-2 focus-visible:ring-credit focus-visible:ring-offset-2"
              >
                {editingId ? 'Salvar Alterações' : 'Adicionar Cartão'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Controls */}
      {creditCards.length > 0 && (
        <div className="flex items-center justify-between mb-4 gap-2">
          {/* View Mode Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="bg-credit-light rounded-lg p-0.5"
          >
            <ToggleGroupItem
              value="general"
              aria-label="Visualização geral"
              className="rounded-md px-2.5 py-1 text-xs data-[state=on]:bg-credit data-[state=on]:text-white data-[state=on]:shadow-sm text-credit hover:bg-credit/15 hover:text-credit"
            >
              <List className="h-3 w-3 mr-1" />
              Geral
            </ToggleGroupItem>
            <ToggleGroupItem
              value="summary"
              aria-label="Visualização resumida"
              className="rounded-md px-2.5 py-1 text-xs data-[state=on]:bg-credit data-[state=on]:text-white data-[state=on]:shadow-sm text-credit hover:bg-credit/15 hover:text-credit"
            >
              <LayoutGrid className="h-3 w-3 mr-1" />
              Resumo
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Sort Dropdown - only visible in general view */}
          {viewMode === 'general' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg h-7 px-2.5 text-xs gap-1 text-credit hover:text-credit hover:bg-credit-light"
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
                    className={`rounded-lg cursor-pointer hover:bg-credit-light hover:text-credit ${sortOption === option.value ? 'bg-credit-light text-credit' : ''}`}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Cards Grid / Summary */}
      {creditCards.length === 0 ? (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-credit-light mb-3">
            <CreditCardIcon className="h-6 w-6 text-credit" />
          </div>
          <p className="text-muted-foreground text-sm">
            Nenhum cartão cadastrado
          </p>
        </div>
      ) : viewMode === 'general' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {sortedCards.map(renderCard)}
        </div>
      ) : (
        renderSummaryCard()
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir cartão"
        description="Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."
      />

      {/* Error Dialog - Cannot Delete */}
      <AlertDialog open={!!deleteError} onOpenChange={(open) => !open && setDeleteError(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Não é possível excluir
            </AlertDialogTitle>
            <AlertDialogDescription>{deleteError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setDeleteError(null)}
              className="rounded-xl bg-credit text-white hover:bg-credit/90 focus-visible:ring-2 focus-visible:ring-credit focus-visible:ring-offset-2"
            >
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
