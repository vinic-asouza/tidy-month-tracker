import { useState, useMemo, useEffect, memo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard as CreditCardIcon,
  AlertTriangle,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { CreditCard, CARD_COLORS } from '@/types/finance';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreditCardStripProps {
  creditCards: CreditCard[];
  onAdd: (card: Omit<CreditCard, 'id'>) => Promise<boolean> | boolean;
  onUpdate: (id: string, updates: Partial<CreditCard>) => Promise<boolean> | boolean;
  onDelete: (id: string) => void;
  getCardTotal: (cardName: string) => number;
  canDeleteCard: (cardName: string) => Promise<boolean>;
  cardNameExists: (name: string, excludeId?: string) => boolean;
  getCardPaidStatus: (cardId: string) => boolean;
  setCardPaidStatus: (cardId: string, paid: boolean) => Promise<boolean>;
  openAddDialog?: boolean;
  onAddDialogClose?: () => void;
}

type SortOption = 'default' | 'alphabetic' | 'color' | 'highest' | 'lowest';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'alphabetic', label: 'Ordem Alfabética' },
  { value: 'color', label: 'Cor' },
  { value: 'highest', label: 'Maior Valor' },
  { value: 'lowest', label: 'Menor Valor' },
];

const CreditCardStripComponent = ({
  creditCards,
  onAdd,
  onUpdate,
  onDelete,
  getCardTotal,
  canDeleteCard,
  cardNameExists,
  getCardPaidStatus,
  setCardPaidStatus,
  openAddDialog,
  onAddDialogClose,
}: CreditCardStripProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].id);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [checkingDelete, setCheckingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (openAddDialog) setIsOpen(true);
  }, [openAddDialog]);

  const sortCards = (cards: CreditCard[]): CreditCard[] => {
    if (sortOption === 'default') return cards;
    const sorted = [...cards];
    switch (sortOption) {
      case 'alphabetic':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      case 'color':
        return sorted.sort((a, b) => {
          const colorOrderA = CARD_COLORS.findIndex((c) => c.id === a.color);
          const colorOrderB = CARD_COLORS.findIndex((c) => c.id === b.color);
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

  const sortedCards = useMemo(() => sortCards(creditCards), [creditCards, sortOption, getCardTotal]);

  const totalInvoices = creditCards.reduce((sum, card) => sum + getCardTotal(card.name), 0);
  const paidCount = creditCards.filter((c) => getCardPaidStatus(c.id)).length;

  const resetForm = () => {
    setName('');
    setSelectedColor(CARD_COLORS[0].id);
    setEditingId(null);
    setNameError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError('Nome do cartão é obrigatório');
      return;
    }
    if (cardNameExists(name.trim(), editingId || undefined)) {
      setNameError('Já existe um cartão com este nome');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = editingId
        ? await onUpdate(editingId, { name: name.trim(), color: selectedColor })
        : await onAdd({ name: name.trim(), color: selectedColor, paid: false });

      if (success === false) return;

      resetForm();
      setIsOpen(false);
      onAddDialogClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (card: CreditCard) => {
    setEditingId(card.id);
    setName(card.name);
    setSelectedColor(card.color || CARD_COLORS[0].id);
    setIsOpen(true);
  };

  const handleDeleteAttempt = async (card: CreditCard) => {
    setCheckingDelete(true);
    try {
      const canDelete = await canDeleteCard(card.name);
      if (!canDelete) {
        setDeleteError(
          `Não é possível excluir o cartão "${card.name}" pois existem gastos vinculados a ele. Remova os gastos primeiro.`
        );
        return;
      }
      setDeleteId(card.id);
    } finally {
      setCheckingDelete(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const getColorClass = (colorId: string) => {
    return CARD_COLORS.find((c) => c.id === colorId)?.class || CARD_COLORS[0].class;
  };

  const renderCardChip = (card: CreditCard) => {
    const total = getCardTotal(card.name);
    const colorClass = getColorClass(card.color);
    const isPaid = getCardPaidStatus(card.id);

    return (
      <div
        key={card.id}
        id={`card-chip-${card.id}`}
        className="relative flex-shrink-0 w-[148px] sm:w-[160px] overflow-hidden rounded-lg snap-start"
      >
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', colorClass)} />
        <div className="relative z-10 p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <CreditCardIcon className="h-3 w-3 flex-shrink-0 text-white/80" />
              <span className="font-semibold text-white text-xs truncate">{card.name}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md text-white/80 hover:text-white hover:bg-white/20 flex-shrink-0"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-md">
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer gap-2"
                  onClick={() => handleEdit(card)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer gap-2 text-destructive focus:text-destructive"
                  disabled={checkingDelete}
                  onClick={() => handleDeleteAttempt(card)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-[10px] text-white/80 uppercase tracking-wide">Fatura</p>
          <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(total)}</p>
          <label
            htmlFor={`card-paid-${card.id}`}
            className="text-xs text-white/90 cursor-pointer flex items-center gap-2"
          >
            <Checkbox
              id={`card-paid-${card.id}`}
              checked={isPaid}
              onCheckedChange={async (checked) => {
                const scrollTop = window.scrollY;
                const scrollLeft = window.scrollX;
                const success = await setCardPaidStatus(card.id, !!checked);
                if (!success) {
                  toast.error('Erro ao atualizar status da fatura');
                }
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    window.scrollTo(scrollLeft, scrollTop);
                  });
                });
              }}
              className="h-4 w-4 rounded-full border-2 border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-gray-900 flex-shrink-0"
            />
            Fatura paga
          </label>
        </div>
      </div>
    );
  };

  return (
    <div id="credit-card-strip" className="space-y-3">
      {/* Header compacto */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg gradient-primary shrink-0">
            <CreditCardIcon className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight">Faturas do mês</h3>
            <p className="text-[10px] text-muted-foreground">Total de compras no cartão</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-bold text-foreground tabular-nums">{formatCurrency(totalInvoices)}</p>
              {creditCards.length > 0 && paidCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  {paidCount}/{creditCards.length} pagos
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {creditCards.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground hover:bg-muted"
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
                      'rounded-lg cursor-pointer hover:bg-muted hover:text-foreground',
                      sortOption === option.value && 'bg-muted text-foreground'
                    )}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Faixa horizontal */}
      {creditCards.length === 0 ? (
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors text-sm"
        >
          <CreditCardIcon className="h-4 w-4" />
          Adicionar cartão de crédito
        </button>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin">
          {sortedCards.map(renderCardChip)}
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsOpen(true);
            }}
            className="flex-shrink-0 w-[60px] sm:w-[72px] flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors snap-start"
            aria-label="Adicionar cartão"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-medium">Novo</span>
          </button>
        </div>
      )}

      {/* Dialog add/edit */}
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
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                placeholder="Ex: Nubank, Inter, C6..."
                className={cn(
                  'rounded-md h-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  nameError && 'border-destructive'
                )}
              />
              {nameError && <p className="text-destructive text-sm mt-1">{nameError}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Cor do Cartão
              </label>
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger className="rounded-md h-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn('w-5 h-5 rounded-md bg-gradient-to-br', getColorClass(selectedColor))}
                      />
                      <span>{CARD_COLORS.find((c) => c.id === selectedColor)?.name}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  {CARD_COLORS.map((color) => (
                    <SelectItem
                      key={color.id}
                      value={color.id}
                      className="rounded-lg focus:bg-muted focus:text-foreground hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn('w-5 h-5 rounded-md bg-gradient-to-br', color.class)} />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-10 rounded-md gradient-primary hover:opacity-90 transition-opacity text-primary-foreground border-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                'Salvar Alterações'
              ) : (
                'Adicionar Cartão'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir cartão"
        description="Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."
      />

      <AlertDialog open={!!deleteError} onOpenChange={(open) => !open && setDeleteError(null)}>
        <AlertDialogContent className="rounded-lg">
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
              className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const CreditCardStrip = memo(CreditCardStripComponent);
