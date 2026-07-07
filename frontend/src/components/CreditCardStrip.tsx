import { useState, useMemo, useEffect, memo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard as CreditCardIcon,
  AlertTriangle,
  ArrowUpDown,
  MoreVertical,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
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
import { SectionSurface } from '@/components/layout/SectionSurface';
import { FinancialGlossaryDialog } from '@/components/FinancialGlossaryDialog';
import { CreditCardInvoiceDialog } from '@/components/CreditCardInvoiceDialog';
import { PayInvoiceDialog } from '@/components/PayInvoiceDialog';
import { UnpayInvoiceConfirmDialog } from '@/components/UnpayInvoiceConfirmDialog';
import { StatusToggleBadge } from '@/components/StatusToggleBadge';
import { CreditCard, CARD_COLORS } from '@/types/finance';
import type { Account, MonthData } from '@/types/domain';
import { cn } from '@/lib/utils';
import {
  getCreditCardDueAlertContext,
  getCreditCardUsagePercent,
  getDaysUntilDueForSort,
} from '@/utils/business/creditCards';
import { toast } from 'sonner';

interface CreditCardStripProps {
  creditCards: CreditCard[];
  accounts: Account[];
  currentMonth: string;
  monthData: MonthData;
  onAdd: (card: Omit<CreditCard, 'id'>) => Promise<boolean> | boolean;
  onUpdate: (id: string, updates: Partial<CreditCard>) => Promise<boolean> | boolean;
  onDelete: (id: string) => void;
  getCardTotal: (cardName: string) => number;
  canDeleteCard: (cardName: string) => Promise<boolean>;
  cardNameExists: (name: string, excludeId?: string) => boolean;
  getCardPaidStatus: (cardId: string) => boolean;
  payCardInvoice: (
    cardId: string,
    paymentAccountId: string | null,
    operationDate?: string
  ) => Promise<boolean>;
  unpayCardInvoice: (cardId: string) => Promise<boolean>;
  openAddDialog?: boolean;
  onAddDialogClose?: () => void;
}

type SortOption = 'default' | 'alphabetic' | 'color' | 'highest' | 'lowest' | 'dueDate';

const DUE_DAY_NONE = 'none';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'alphabetic', label: 'Ordem Alfabética' },
  { value: 'color', label: 'Cor' },
  { value: 'highest', label: 'Maior Valor' },
  { value: 'lowest', label: 'Menor Valor' },
  { value: 'dueDate', label: 'Vencimento' },
];

const DUE_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

const CreditCardStripComponent = ({
  creditCards,
  accounts,
  currentMonth,
  monthData,
  onAdd,
  onUpdate,
  onDelete,
  getCardTotal,
  canDeleteCard,
  cardNameExists,
  getCardPaidStatus,
  payCardInvoice,
  unpayCardInvoice,
  openAddDialog,
  onAddDialogClose,
}: CreditCardStripProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].id);
  const [dueDay, setDueDay] = useState<string>(DUE_DAY_NONE);
  const [creditLimitInput, setCreditLimitInput] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [checkingDelete, setCheckingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceDialogCard, setInvoiceDialogCard] = useState<CreditCard | null>(null);
  const [payDialogCard, setPayDialogCard] = useState<CreditCard | null>(null);
  const [unpayDialogCard, setUnpayDialogCard] = useState<CreditCard | null>(null);

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
      case 'dueDate':
        return sorted.sort((a, b) => {
          const daysA = getDaysUntilDueForSort(a.dueDay, currentMonth);
          const daysB = getDaysUntilDueForSort(b.dueDay, currentMonth);
          if (daysA == null && daysB == null) return 0;
          if (daysA == null) return 1;
          if (daysB == null) return -1;
          return daysA - daysB;
        });
      default:
        return sorted;
    }
  };

  const sortedCards = useMemo(() => sortCards(creditCards), [creditCards, sortOption, getCardTotal, currentMonth]);

  const totalInvoices = creditCards.reduce((sum, card) => sum + getCardTotal(card.name), 0);
  const paidCount = creditCards.filter((c) => getCardPaidStatus(c.id)).length;

  const resetForm = () => {
    setName('');
    setSelectedColor(CARD_COLORS[0].id);
    setDueDay(DUE_DAY_NONE);
    setCreditLimitInput('');
    setEditingId(null);
    setNameError(null);
  };

  const buildCardPayload = (): Omit<CreditCard, 'id'> => ({
    name: name.trim(),
    color: selectedColor,
    paid: false,
    dueDay: dueDay === DUE_DAY_NONE ? null : parseInt(dueDay, 10),
    creditLimit: creditLimitInput.trim() ? parseCurrencyToNumber(creditLimitInput) : null,
  });

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
      const payload = buildCardPayload();
      const success = editingId
        ? await onUpdate(editingId, payload)
        : await onAdd(payload);

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
    setDueDay(card.dueDay != null ? String(card.dueDay) : DUE_DAY_NONE);
    setCreditLimitInput(
      card.creditLimit != null && card.creditLimit > 0
        ? card.creditLimit.toFixed(2).replace('.', ',')
        : ''
    );
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

  const getColorClass = (colorId: string) =>
    CARD_COLORS.find((c) => c.id === colorId)?.class || CARD_COLORS[0].class;

  const handleSetCardPaid = async (cardId: string, paid: boolean) => {
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;
    const card = creditCards.find((c) => c.id === cardId);

    if (paid) {
      if (accounts.length > 0 && card) {
        setPayDialogCard(card);
        return true;
      }
      const success = await payCardInvoice(cardId, null);
      if (!success) {
        toast.error('Erro ao atualizar status da fatura');
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(scrollLeft, scrollTop);
        });
      });
      return success;
    }

    if (accounts.length > 0) {
      setUnpayDialogCard(card ?? creditCards.find((c) => c.id === cardId) ?? null);
      return true;
    }

    const success = await unpayCardInvoice(cardId);
    if (!success) {
      toast.error('Erro ao atualizar status da fatura');
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(scrollLeft, scrollTop);
      });
    });
    return success;
  };

  const handleConfirmUnpay = async () => {
    if (!unpayDialogCard) return;
    const success = await unpayCardInvoice(unpayDialogCard.id);
    if (!success) {
      toast.error('Erro ao desmarcar fatura');
    }
    setUnpayDialogCard(null);
  };

  const renderCardChip = (card: CreditCard) => {
    const total = getCardTotal(card.name);
    const colorClass = getColorClass(card.color);
    const isPaid = getCardPaidStatus(card.id);
    const usagePercent = getCreditCardUsagePercent(total, card.creditLimit);
    const dueAlert = getCreditCardDueAlertContext(card.dueDay, currentMonth, isPaid);

    return (
      <div
        key={card.id}
        id={`card-chip-${card.id}`}
        className="relative flex-shrink-0 w-[168px] sm:w-[184px] overflow-hidden rounded-lg snap-start"
      >
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', colorClass)} />
        {isPaid && (
          <div
            className="absolute inset-0 bg-black/20 pointer-events-none z-[1]"
            aria-hidden
          />
        )}
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
                    onClick={(e) => e.stopPropagation()}
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

          <button
            type="button"
            onClick={() => setInvoiceDialogCard(card)}
            className="flex flex-col gap-1.5 text-left w-full cursor-pointer"
            aria-label={`Ver fatura de ${card.name}`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-[10px] text-white/80 uppercase tracking-wide cursor-help w-fit">
                  Fatura
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Valor comprometido no cartão neste mês. Entra no saldo do resumo quando você marcar a
                fatura como paga e informar a carteira pagadora.
              </TooltipContent>
            </Tooltip>
            <p className="text-sm font-bold text-white tabular-nums leading-tight">
              {formatCurrency(total)}
            </p>

            {(card.dueDay != null || (usagePercent != null && total > 0)) && (
              <div
                className={cn(
                  'flex items-center gap-2 text-[10px] text-white/70 leading-snug',
                  card.dueDay != null && usagePercent != null && total > 0
                    ? 'justify-between'
                    : 'justify-start'
                )}
              >
                {card.dueDay != null && <span>Vence dia {card.dueDay}</span>}
                {usagePercent != null && total > 0 && (
                  <span className="tabular-nums shrink-0 text-white/80">
                    {usagePercent}% limite
                  </span>
                )}
              </div>
            )}

            {dueAlert && (
              <p
                className={cn(
                  'text-[10px] font-medium flex items-center gap-1 leading-snug',
                  dueAlert.kind === 'overdue' ? 'text-amber-200' : 'text-amber-100'
                )}
              >
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {dueAlert.message}
              </p>
            )}

            <p className="text-[10px] text-white/60 mt-0.5">Toque para ver detalhes</p>
          </button>

          <StatusToggleBadge
            checked={isPaid}
            checkedLabel="Pago"
            uncheckedLabel="Pendente"
            onToggle={() => {
              void handleSetCardPaid(card.id, !isPaid);
            }}
            surface="onGradient"
            size="full"
            ariaLabel={isPaid ? 'Desmarcar fatura como paga' : 'Marcar fatura como paga'}
          />
        </div>
      </div>
    );
  };

  const headerActions = (
    <div className="flex items-center gap-1 shrink-0">
      <FinancialGlossaryDialog
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          >
            <HelpCircle className="h-3 w-3" />
            <span className="hidden sm:inline">Glossário</span>
          </Button>
        }
      />
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
  );

  return (
    <SectionSurface
      id="credit-card-strip"
      title="Faturas do mês"
      subtitle={
        creditCards.length === 0
          ? 'Cadastre cartões para acompanhar faturas'
          : `${creditCards.length} cartão${creditCards.length > 1 ? 's' : ''} · ${formatCurrency(totalInvoices)}${paidCount > 0 ? ` · ${paidCount}/${creditCards.length} pagos` : ''}`
      }
      icon={CreditCardIcon}
      iconVariant="primary"
      actions={headerActions}
      className="border-border/60 bg-muted/10"
    >
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
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Dia de vencimento
              </label>
              <Select value={dueDay} onValueChange={setDueDay}>
                <SelectTrigger className="rounded-md h-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <SelectValue placeholder="Não informado" />
                </SelectTrigger>
                <SelectContent className="rounded-md max-h-60">
                  <SelectItem value={DUE_DAY_NONE} className="rounded-lg">
                    Não informado
                  </SelectItem>
                  {DUE_DAY_OPTIONS.map((day) => (
                    <SelectItem key={day} value={String(day)} className="rounded-lg">
                      Dia {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">
                Só para lembrar — não muda como a fatura é calculada neste mês.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Limite de crédito
              </label>
              <CurrencyInput
                value={creditLimitInput}
                onValueChange={setCreditLimitInput}
                placeholder="Opcional"
                className="rounded-md h-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Opcional. Mostra quanto da fatura usa do limite — não impede lançamentos por
                enquanto.
              </p>
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

      <CreditCardInvoiceDialog
        open={!!invoiceDialogCard}
        onOpenChange={(open) => !open && setInvoiceDialogCard(null)}
        card={invoiceDialogCard}
        accounts={accounts}
        currentMonth={currentMonth}
        monthData={monthData}
        isPaid={invoiceDialogCard ? getCardPaidStatus(invoiceDialogCard.id) : false}
        onSetPaid={(paid) =>
          invoiceDialogCard ? handleSetCardPaid(invoiceDialogCard.id, paid) : Promise.resolve(false)
        }
      />

      <PayInvoiceDialog
        open={!!payDialogCard}
        onOpenChange={(open) => !open && setPayDialogCard(null)}
        card={payDialogCard}
        invoiceTotal={payDialogCard ? getCardTotal(payDialogCard.name) : 0}
        accounts={accounts}
        onConfirm={async (paymentAccountId, operationDate) => {
          if (!payDialogCard) return false;
          const success = await payCardInvoice(
            payDialogCard.id,
            paymentAccountId,
            operationDate
          );
          if (!success) {
            toast.error('Erro ao registrar pagamento da fatura');
          }
          return success;
        }}
      />

      <UnpayInvoiceConfirmDialog
        open={!!unpayDialogCard}
        onOpenChange={(open) => !open && setUnpayDialogCard(null)}
        cardName={unpayDialogCard?.name}
        onConfirm={handleConfirmUnpay}
      />

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
    </SectionSurface>
  );
};

export const CreditCardStrip = memo(CreditCardStripComponent);
