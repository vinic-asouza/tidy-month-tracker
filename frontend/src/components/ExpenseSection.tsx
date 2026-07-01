import { useState, useMemo, ReactNode, useEffect, useRef, memo } from 'react';
import { Plus, Pencil, Trash2, TrendingDown, Receipt, Repeat, CreditCard, AlertTriangle, List, LayoutGrid, ArrowUpDown, Settings, Check, Loader2, Banknote, Landmark, FileText, CircleDollarSign, ChevronDown, ChevronUp } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { ApplyToAllDialog } from '@/components/ui/apply-to-all-dialog';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { Expense, CreditCard as CreditCardType, CARD_COLORS } from '@/types/finance';
import { formatDateToYYYYMMDD, formatItemDayMonth } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sectionSurfaceClass } from '@/components/layout/SectionSurface';
import { SectionTotalsHeader } from '@/components/layout/SectionTotalsHeader';
import { SelectionToggle } from '@/components/SelectionToggle';
import { showSelectionHintIfNeeded } from '@/utils/selectionHint';
import { toast } from 'sonner';

type PersistHandler = (expense: Omit<Expense, 'id'>) => Promise<Expense | null> | Expense | null;
type UpdateHandler = (
  id: string,
  updates: Partial<Expense>,
  applyToAllMonths?: boolean
) => Promise<boolean> | boolean;

interface ExpenseSectionProps {
  expenses: Expense[];
  categories: string[];
  paymentMethods: string[];
  creditCards: CreditCardType[];
  onAdd: PersistHandler;
  onUpdate: UpdateHandler;
  onDelete: (id: string, applyToAllMonths?: boolean) => void;
  onDeleteInstallment: (expense: Expense) => void;
  getCardPaidStatus?: (cardId: string) => boolean;
  onAddCategory: (category: string) => Promise<void> | void;
  onUpdateCategory: (oldCategory: string, newCategory: string) => Promise<void> | void;
  onDeleteCategory: (category: string) => Promise<void> | void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  /** Abre o dialog de novo gasto (controlado pelo FAB global) */
  openAddDialog?: boolean;
  /** Chamado quando o dialog de adicionar é fechado */
  onAddDialogClose?: () => void;
  /** Pré-preenche o formulário de novo gasto (ex.: conquista de desejo) */
  expenseDraft?: Partial<Expense> | null;
  /** Chamado após consumir o rascunho de gasto */
  onExpenseDraftConsumed?: () => void;
  variant?: 'default' | 'embedded';
}

type ViewMode = 'general' | 'summary';
type SortOption = 'date' | 'alphabetic' | 'category' | 'payment' | 'highest' | 'lowest';

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
  { value: 'payment', label: 'Forma de Pagamento' },
  { value: 'highest', label: 'Maior Valor' },
  { value: 'lowest', label: 'Menor Valor' },
];

const ExpenseForm = ({
  type,
  categories,
  paymentMethods,
  creditCards,
  onSubmit,
  initialData,
  categoryManagerSlot,
}: {
  type: Expense['type'];
  categories: string[];
  paymentMethods: string[];
  creditCards: CreditCardType[];
  onSubmit: (data: Omit<Expense, 'id'>) => Promise<boolean> | boolean;
  initialData?: Expense;
  categoryManagerSlot?: ReactNode;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');
  const [value, setValue] = useState(initialData ? formatValueForInput(initialData.value) : '');
  const [itemDate, setItemDate] = useState(
    initialData?.date ?? formatDateToYYYYMMDD(new Date())
  );
  const [repeatAllMonths, setRepeatAllMonths] = useState(
    initialData?.repeatAllMonths ?? type === 'fixed'
  );
  const [currentInstallment, setCurrentInstallment] = useState(
    initialData?.currentInstallment?.toString() || '1'
  );
  const [totalInstallments, setTotalInstallments] = useState(
    initialData?.totalInstallments?.toString() || '12'
  );

  // Error states
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Sincroniza a data do formulário apenas ao editar (initialData definido). Em modo "adicionar",
  // não sobrescreve itemDate para evitar resetar a data que o usuário acabou de selecionar.
  useEffect(() => {
    if (initialData !== undefined) {
      setItemDate(initialData?.date ?? formatDateToYYYYMMDD(new Date()));
    }
  }, [initialData]);

  // Build payment methods list with active credit cards
  const allPaymentMethods = [
    ...paymentMethods,
    ...creditCards.map(c => ({ label: `Crédito: ${c.name}`, value: c.name }))
  ];

  const handleSubmit = async () => {
    const numValue = parseCurrencyToNumber(value);
    let hasError = false;

    if (!category) {
      setCategoryError('Selecione uma categoria');
      hasError = true;
    }
    if (!description.trim()) {
      setDescriptionError('Descrição é obrigatória');
      hasError = true;
    }
    if (numValue <= 0) {
      setValueError('Valor deve ser maior que zero');
      hasError = true;
    }
    if (!paymentMethod) {
      setPaymentError('Selecione uma forma de pagamento');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        type,
        category,
        description: description.trim(),
        paymentMethod,
        value: numValue,
        date: itemDate,
        paid: initialData?.paid || false,
        repeatAllMonths: type === 'fixed' ? repeatAllMonths : undefined,
        currentInstallment: type === 'installment' ? parseInt(currentInstallment) || 1 : undefined,
        totalInstallments: type === 'installment' ? parseInt(totalInstallments) || 12 : undefined,
      });
      if (result === false) return;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Category */}
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">Categoria</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={category} onValueChange={(v) => { setCategory(v); setCategoryError(null); }}>
              <SelectTrigger className={`rounded-md h-10 ${categoryError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2`}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="rounded-md max-h-64">
                {categories.map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat}
                    className="rounded-lg focus:bg-expense-light focus:text-expense hover:bg-expense-light/50"
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {categoryManagerSlot}
        </div>
        {categoryError && <p className="text-destructive text-sm mt-1">{categoryError}</p>}
      </div>

      {/* Data do item */}
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">Data</label>
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
          <label className="text-sm font-medium mb-2 block text-muted-foreground">Descrição</label>
          <Input
            value={description}
            onChange={(e) => { setDescription(e.target.value); setDescriptionError(null); }}
            placeholder="Ex: Conta de luz"
            className={`rounded-md h-10 ${descriptionError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2`}
          />
          {descriptionError && <p className="text-destructive text-sm mt-1">{descriptionError}</p>}
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium mb-2 block text-muted-foreground">
            {type === 'installment' ? 'Valor da parcela' : 'Valor'}
          </label>
          <CurrencyInput
            value={value}
            onValueChange={(v) => { setValue(v); setValueError(null); }}
            className={`rounded-md h-10 ${valueError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2`}
          />
          {valueError && <p className="text-destructive text-sm mt-1">{valueError}</p>}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">Forma de Pagamento</label>
        <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setPaymentError(null); }}>
          <SelectTrigger
            className={`rounded-md h-10 ${paymentError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2`}
          >
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            {allPaymentMethods.map((method) => {
              const isCard = typeof method === 'object';
              const value = isCard ? method.value : method;
              const label = isCard ? method.label : method;
              return (
                <SelectItem
                  key={value}
                  value={value}
                  className="rounded-lg focus:bg-expense-light focus:text-expense hover:bg-expense-light/50"
                >
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {paymentError && <p className="text-destructive text-sm mt-1">{paymentError}</p>}
      </div>

      {/* Installments for parcelado */}
      {type === 'installment' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">Parcela Atual</label>
            <Select value={currentInstallment} onValueChange={setCurrentInstallment}>
              <SelectTrigger className="rounded-md h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-md max-h-48">
                {Array.from({ length: parseInt(totalInstallments) || 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()} className="rounded-lg">
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">Total de Parcelas</label>
            <Select value={totalInstallments} onValueChange={setTotalInstallments}>
              <SelectTrigger className="rounded-md h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-md max-h-48">
                {Array.from({ length: 48 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()} className="rounded-lg">
                    {i + 1}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Repeat for fixed expenses */}
      {type === 'fixed' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="repeat-months-expense" className="text-sm font-medium cursor-pointer">
                Repetir todos os meses
              </Label>
            </div>
            <Switch
              id="repeat-months-expense"
              checked={repeatAllMonths}
              onCheckedChange={setRepeatAllMonths}
              className="data-[state=checked]:bg-expense focus-visible:ring-expense"
            />
          </div>
          <p className="text-xs text-muted-foreground px-1">
            Repete nos demais meses deste ano.
          </p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full h-10 rounded-md gradient-expense hover:opacity-90 transition-opacity text-white border-0"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : initialData ? (
          'Salvar Alterações'
        ) : (
          'Adicionar Gasto'
        )}
      </Button>
    </div>
  );
};

// Ícones e cores para formas de pagamento (não-cartão) — tons que se diferem dos cartões
const PAYMENT_METHOD_ICONS: Record<string, { Icon: React.ComponentType<{ className?: string }>; className: string }> = {
  dinheiro: { Icon: Banknote, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200' },
  pix: { Icon: CircleDollarSign, className: 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200' },
  débito: { Icon: Landmark, className: 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200' },
  boleto: { Icon: FileText, className: 'bg-sky-100 text-sky-700 dark:bg-sky-800 dark:text-sky-200' },
};

// Payment method style: cartão (gradiente) ou não-cartão (retorna ícone + classe para badge redonda)
const getPaymentMethodStyle = (paymentMethod: string, creditCards: CreditCardType[]) => {
  const creditCard = creditCards.find(c => c.name === paymentMethod);
  if (creditCard) {
    const gradientMap: Record<string, string> = {
      'violet': 'bg-gradient-to-br from-violet-500 to-purple-600 text-white',
      'orange': 'bg-gradient-to-br from-orange-500 to-red-500 text-white',
      'emerald': 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
      'blue': 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white',
      'pink': 'bg-gradient-to-br from-pink-500 to-rose-600 text-white',
      'yellow': 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white',
      'slate': 'bg-gradient-to-br from-slate-600 to-slate-800 text-white',
      'cyan': 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white',
      'red': 'bg-gradient-to-br from-red-500 to-rose-600 text-white',
    };
    return {
      className: gradientMap[creditCard.color] || 'bg-muted text-muted-foreground',
      isCard: true as const,
      iconConfig: null,
    };
  }
  const key = paymentMethod.toLowerCase();
  const iconConfig = PAYMENT_METHOD_ICONS[key] ?? { Icon: Receipt, className: 'bg-muted text-muted-foreground' };
  return {
    className: iconConfig.className,
    isCard: false as const,
    iconConfig,
  };
};

const ExpenseItem = ({
  expense,
  creditCards,
  isLinkedToCard,
  isCardPaid,
  onTogglePaid,
  onUpdate,
  onDelete,
  onEdit,
  onCardItemClick,
  isSelected,
  onItemClick,
  onToggleSelection,
}: {
  expense: Expense;
  creditCards: CreditCardType[];
  isLinkedToCard: boolean;
  isCardPaid: boolean;
  onTogglePaid: () => void;
  onUpdate: (id: string, updates: Partial<Expense>, applyToAllMonths?: boolean) => void;
  onDelete: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onCardItemClick: () => void;
  isSelected?: boolean;
  onItemClick?: (e: React.MouseEvent) => void;
  onToggleSelection?: () => void;
}) => {
  const installmentText = expense.currentInstallment && expense.totalInstallments
    ? `${expense.currentInstallment}/${expense.totalInstallments}`
    : null;

  const style = getPaymentMethodStyle(expense.paymentMethod, creditCards);
  const PaymentIcon = !style.isCard && style.iconConfig ? style.iconConfig.Icon : null;
  const isPaid = isLinkedToCard ? isCardPaid : expense.paid;

  const paymentMethodBadge = (style.isCard || PaymentIcon) && (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0">
          {style.isCard ? (
            <Badge variant="secondary" className={cn('text-xs rounded-full border-0 cursor-default p-1', style.className)}>
              <CreditCard className="h-3.5 w-3.5" />
            </Badge>
          ) : PaymentIcon ? (
            <Badge variant="secondary" className={cn('text-xs rounded-full border-0 cursor-default p-1', style.className)}>
              <PaymentIcon className="h-3.5 w-3.5" />
            </Badge>
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {expense.paymentMethod}
      </TooltipContent>
    </Tooltip>
  );

  const actionButtons = (
    <>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted shrink-0" onClick={() => onEdit(expense)}>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted shrink-0" onClick={() => onDelete(expense)}>
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </>
  );

  return (
    <div
      onClick={onItemClick}
      className={cn(
        'group flex items-stretch gap-3 py-2 px-2.5 rounded-md transition-all duration-200 select-none border-2 cursor-pointer',
        isSelected ? 'border-expense/60' : 'border-transparent',
        isPaid ? 'bg-expense-light hover:bg-expense-light/80' : 'bg-muted/30 hover:bg-muted/50'
      )}
    >
      {/* Col 1: checkbox centralizado verticalmente */}
      <div className="flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
        {isLinkedToCard ? (
          <div onClick={onCardItemClick} className="cursor-pointer" title="Pagamento via fatura do cartão">
            <Checkbox
              checked={isCardPaid}
              className="h-4 w-4 rounded border-2 border-expense/30 opacity-50 pointer-events-none data-[state=checked]:bg-expense data-[state=checked]:border-expense data-[state=checked]:text-white"
            />
          </div>
        ) : (
          <Checkbox
            checked={expense.paid}
            onCheckedChange={onTogglePaid}
            title="Marcar como pago"
            className="h-4 w-4 rounded border-2 border-expense/50 data-[state=checked]:bg-expense data-[state=checked]:border-expense data-[state=checked]:text-white"
          />
        )}
      </div>
      {/* Desktop: colunas 2 e 3 */}
      <div className="hidden sm:flex flex-1 min-w-0 flex-col justify-center gap-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-expense font-medium">{expense.category}</span>
          {installmentText && (
            <Badge variant="secondary" className="text-xs rounded-md px-2 py-0.5 bg-muted text-muted-foreground border-0 cursor-default">
              {installmentText}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium truncate text-foreground">{expense.description}</span>
          {isLinkedToCard && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0 text-muted-foreground">
              Via fatura
            </Badge>
          )}
          {expense.repeatAllMonths && <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end justify-center gap-0.5 shrink-0">
        <span className="text-xs text-muted-foreground tabular-nums">{formatItemDayMonth(expense.date, expense.createdAt)}</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold whitespace-nowrap text-sm text-expense tabular-nums shrink-0">{formatCurrency(expense.value)}</span>
          {paymentMethodBadge}
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onToggleSelection && (
              <SelectionToggle isSelected={!!isSelected} onToggle={onToggleSelection} />
            )}
            <div className="flex justify-end opacity-100 sm:opacity-60 sm:group-hover:opacity-100 sm:w-0 sm:min-w-0 sm:overflow-hidden sm:group-hover:w-[3.75rem] transition-[width,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shrink-0">
              <div className="flex gap-0.5 shrink-0 sm:translate-x-full sm:group-hover:translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
                {actionButtons}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile: duas linhas */}
      <div className="flex sm:hidden flex-1 min-w-0 flex-col justify-center gap-0.5">
        <span className="text-xs text-expense font-medium">{expense.category}</span>
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-sm font-medium truncate text-foreground">{expense.description}</span>
            {installmentText && (
              <Badge variant="secondary" className="text-xs rounded-md px-2 py-0.5 bg-muted text-muted-foreground border-0 cursor-default shrink-0">
                {installmentText}
              </Badge>
            )}
            {expense.repeatAllMonths && <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatItemDayMonth(expense.date, expense.createdAt)}</span>
        </div>
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {isLinkedToCard && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0 text-muted-foreground">
              Via fatura
            </Badge>
          )}
          <span className="font-bold whitespace-nowrap text-sm text-expense tabular-nums shrink-0">{formatCurrency(expense.value)}</span>
          {paymentMethodBadge}
          <div className="flex items-center gap-0.5 shrink-0">
            {actionButtons}
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary item component for category summary view
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
    <div className="relative flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30 overflow-hidden">
      {/* Progress bar background */}
      <div
        className={`absolute inset-y-0 left-0 bg-expense-light rounded-md ${
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
          className="text-xs rounded-md px-2 py-0.5 bg-transparent text-expense border-0 cursor-default"
        >
          {category}
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {percentage.toFixed(1)}%
          </span>
          <span className="font-bold whitespace-nowrap text-sm text-expense">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Sorting function
const sortExpenses = (expenses: Expense[], sortOption: SortOption, creditCards: CreditCardType[]): Expense[] => {
  const sorted = [...expenses];

  switch (sortOption) {
    case 'alphabetic':
      return sorted.sort((a, b) => a.description.localeCompare(b.description, 'pt-BR'));

    case 'category':
      return sorted.sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'));

    case 'payment':
      // Sort by payment method, with credit cards last
      return sorted.sort((a, b) => {
        const aIsCard = creditCards.some(c => c.name === a.paymentMethod);
        const bIsCard = creditCards.some(c => c.name === b.paymentMethod);

        if (aIsCard && !bIsCard) return 1;
        if (!aIsCard && bIsCard) return -1;

        return a.paymentMethod.localeCompare(b.paymentMethod, 'pt-BR');
      });

    case 'highest':
      return sorted.sort((a, b) => b.value - a.value);

    case 'lowest':
      return sorted.sort((a, b) => a.value - b.value);

    case 'date': {
      const getSortDate = (e: Expense) => e.date ?? (e.createdAt ? e.createdAt.split('T')[0] : '');
      return sorted.sort((a, b) => getSortDate(a).localeCompare(getSortDate(b)));
    }
  }
  return sorted;
};

// Group expenses by category and calculate totals
const groupByCategory = (expenses: Expense[], sortOption: SortOption): { category: string; total: number }[] => {
  const grouped = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.value;
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

const ExpenseSectionComponent = ({
  expenses,
  categories,
  paymentMethods,
  creditCards,
  onAdd,
  onUpdate,
  onDelete,
  onDeleteInstallment,
  getCardPaidStatus,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  selectedIds = new Set(),
  onSelectionChange,
  openAddDialog,
  onAddDialogClose,
  expenseDraft,
  onExpenseDraftConsumed,
  variant = 'default',
}: ExpenseSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<Partial<Expense> | null>(null);

  useEffect(() => {
    if (openAddDialog) setIsOpen(true);
  }, [openAddDialog]);

  const [activeTab, setActiveTab] = useState<Expense['type']>('fixed');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (!expenseDraft) return;
    setEditingExpense(null);
    setAddDraft(expenseDraft);
    setActiveTab(expenseDraft.type ?? 'variable');
    setIsOpen(true);
  }, [expenseDraft]);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [cardWarningOpen, setCardWarningOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [showApplyToAllDialog, setShowApplyToAllDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);
  const [applyToAllMonths, setApplyToAllMonths] = useState(false);

  // Category management state (similar to Income/Investment)
  const [isCategoryManagerOpenInModal, setIsCategoryManagerOpenInModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const INITIAL_ITEMS_LIMIT = 10;
  const [showAllFixed, setShowAllFixed] = useState(false);
  const [showAllInstallment, setShowAllInstallment] = useState(false);
  const [showAllVariable, setShowAllVariable] = useState(false);
  const [isCollapsingFixed, setIsCollapsingFixed] = useState(false);
  const [isCollapsingInstallment, setIsCollapsingInstallment] = useState(false);
  const [isCollapsingVariable, setIsCollapsingVariable] = useState(false);

  useEffect(() => {
    if (!isCollapsingFixed) return;
    const t = setTimeout(() => { setShowAllFixed(false); setIsCollapsingFixed(false); }, 300);
    return () => clearTimeout(t);
  }, [isCollapsingFixed]);
  useEffect(() => {
    if (!isCollapsingInstallment) return;
    const t = setTimeout(() => { setShowAllInstallment(false); setIsCollapsingInstallment(false); }, 300);
    return () => clearTimeout(t);
  }, [isCollapsingInstallment]);
  useEffect(() => {
    if (!isCollapsingVariable) return;
    const t = setTimeout(() => { setShowAllVariable(false); setIsCollapsingVariable(false); }, 300);
    return () => clearTimeout(t);
  }, [isCollapsingVariable]);

  const expandAnimationPlayedFixedRef = useRef(false);
  const expandAnimationPlayedInstallmentRef = useRef(false);
  const expandAnimationPlayedVariableRef = useRef(false);

  useEffect(() => {
    if (!showAllFixed) { expandAnimationPlayedFixedRef.current = false; return; }
    if (isCollapsingFixed) return;
    const t = setTimeout(() => { expandAnimationPlayedFixedRef.current = true; }, 500);
    return () => clearTimeout(t);
  }, [showAllFixed, isCollapsingFixed]);
  useEffect(() => {
    if (!showAllInstallment) { expandAnimationPlayedInstallmentRef.current = false; return; }
    if (isCollapsingInstallment) return;
    const t = setTimeout(() => { expandAnimationPlayedInstallmentRef.current = true; }, 500);
    return () => clearTimeout(t);
  }, [showAllInstallment, isCollapsingInstallment]);
  useEffect(() => {
    if (!showAllVariable) { expandAnimationPlayedVariableRef.current = false; return; }
    if (isCollapsingVariable) return;
    const t = setTimeout(() => { expandAnimationPlayedVariableRef.current = true; }, 500);
    return () => clearTimeout(t);
  }, [showAllVariable, isCollapsingVariable]);

  // Category management handlers
  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed) || isCategoryLoading) return;

    setIsCategoryLoading(true);
    try {
      await onAddCategory(trimmed);
      setNewCategory('');
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCategory) {
      setEditingCategory(null);
      setEditingCategoryValue('');
      return;
    }

    const trimmed = editingCategoryValue.trim();
    if (!trimmed || trimmed === editingCategory || isCategoryLoading) {
      setEditingCategory(null);
      setEditingCategoryValue('');
      return;
    }

    setIsCategoryLoading(true);
    try {
      await onUpdateCategory(editingCategory, trimmed);
    } finally {
      setIsCategoryLoading(false);
      setEditingCategory(null);
      setEditingCategoryValue('');
    }
  };

  const handleDeleteCategory = async (category: string) => {
    const hasExpenses = expenses.some((expense) => expense.category === category);
    if (hasExpenses) {
      toast.error('Não é possível excluir: existem gastos usando esta categoria');
      return;
    }
    if (isCategoryLoading) return;

    setIsCategoryLoading(true);
    try {
      await onDeleteCategory(category);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const fixedExpenses = expenses.filter((e) => e.type === 'fixed');
  const variableExpenses = expenses.filter((e) => e.type === 'variable');
  const installmentExpenses = expenses.filter((e) => e.type === 'installment');

  // Apply sorting to each group
  const sortedFixedExpenses = useMemo(
    () => sortExpenses(fixedExpenses, sortOption, creditCards),
    [fixedExpenses, sortOption, creditCards]
  );
  const sortedVariableExpenses = useMemo(
    () => sortExpenses(variableExpenses, sortOption, creditCards),
    [variableExpenses, sortOption, creditCards]
  );
  const sortedInstallmentExpenses = useMemo(
    () => sortExpenses(installmentExpenses, sortOption, creditCards),
    [installmentExpenses, sortOption, creditCards]
  );

  // Group by category for summary view - combine all expense types
  const allExpensesByCategory = useMemo(() => groupByCategory(expenses, sortOption), [expenses, sortOption]);

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

  // Check if expense is linked to a credit card
  const isExpenseLinkedToCard = (expense: Expense): boolean => {
    return creditCards.some(c => c.name === expense.paymentMethod);
  };

  // Get card ID from payment method
  const getCardIdFromPaymentMethod = (paymentMethod: string): string | null => {
    const card = creditCards.find(c => c.name === paymentMethod);
    return card?.id || null;
  };

  // Check if expense's card is paid
  const isExpenseCardPaid = (expense: Expense): boolean => {
    if (!getCardPaidStatus) return false;
    const cardId = getCardIdFromPaymentMethod(expense.paymentMethod);
    return cardId ? getCardPaidStatus(cardId) : false;
  };

  const clearAddDialogState = () => {
    setEditingExpense(null);
    if (addDraft) {
      setAddDraft(null);
      onExpenseDraftConsumed?.();
    }
    onAddDialogClose?.();
  };

  const buildDraftExpense = (type: Expense['type'], draft: Partial<Expense>): Expense => ({
    id: '',
    type,
    category: draft.category ?? '',
    description: draft.description ?? '',
    paymentMethod: draft.paymentMethod ?? '',
    value: draft.value ?? 0,
    paid: draft.paid ?? false,
    date: draft.date,
    repeatAllMonths: draft.repeatAllMonths,
  });

  const handleSubmit = async (data: Omit<Expense, 'id'>) => {
    if (editingExpense) {
      const success = await onUpdate(editingExpense.id, data, applyToAllMonths);
      if (success === false) return false;
    } else {
      const created = await onAdd(data);
      if (!created) return false;
    }

    setApplyToAllMonths(false);
    setIsOpen(false);
    clearAddDialogState();
    return true;
  };

  const handleEdit = (expense: Expense) => {
    // Verifica se é item fixo (type === 'fixed' e tem repeatAllMonths ou baseExpenseId)
    const isFixedItem = expense.type === 'fixed' && (expense.repeatAllMonths || !!expense.baseExpenseId);
    // Verifica se é item parcelado
    const isInstallmentItem = expense.type === 'installment';

    if (isFixedItem || isInstallmentItem) {
      // Mostra diálogo perguntando se quer editar apenas esta parcela/mês ou todas
      setEditingExpense(expense);
      setPendingAction('edit');
      setShowApplyToAllDialog(true);
    } else {
      // Item normal, edita diretamente
      setEditingExpense(expense);
      setActiveTab(expense.type);
      setIsOpen(true);
    }
  };

  const handleEditCurrentMonth = () => {
    if (editingExpense) {
      setActiveTab(editingExpense.type);
      setIsOpen(true);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleEditAllMonths = () => {
    if (editingExpense) {
      setActiveTab(editingExpense.type);
      setApplyToAllMonths(true); // Marca que deve aplicar em todos os meses
      setIsOpen(true);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleDeleteRequest = (expense: Expense) => {
    // Verifica se é item fixo (type === 'fixed' e tem repeatAllMonths ou baseExpenseId)
    const isFixedItem = expense.type === 'fixed' && (expense.repeatAllMonths || !!expense.baseExpenseId);
    // Verifica se é item parcelado
    const isInstallmentItem = expense.type === 'installment';

    if (isFixedItem || isInstallmentItem) {
      // Mostra diálogo perguntando se quer deletar apenas esta parcela/mês ou todas
      setEditingExpense(expense);
      setPendingAction('delete');
      setShowApplyToAllDialog(true);
    } else {
      // Item normal, deleta diretamente
      setDeleteExpense(expense);
    }
  };

  const handleDeleteCurrentMonth = () => {
    if (editingExpense) {
      setDeleteExpense(editingExpense);
      setEditingExpense(null);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleDeleteAllMonths = () => {
    if (editingExpense) {
      if (editingExpense.type === 'installment') {
        // Para parcelas, deleta todas as parcelas relacionadas
        onDeleteInstallment(editingExpense);
      } else {
        // Para itens fixos, deleta em todos os meses
        onDelete(editingExpense.id, true);
      }
      setEditingExpense(null);
      setPendingAction(null);
      setShowApplyToAllDialog(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteExpense) {
      // Parcela "apenas este mês" remove só o registro atual; série completa usa onDeleteInstallment
      onDelete(deleteExpense.id, false);
      setDeleteExpense(null);
    }
  };

  const handleTogglePaid = (expense: Expense) => {
    if (isExpenseLinkedToCard(expense)) return;

    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;
    onUpdate(expense.id, { paid: !expense.paid });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(scrollLeft, scrollTop);
      });
    });
  };

  // Calculate paid total (items marked as paid or linked to paid cards)
  const paidTotal = expenses.reduce((sum, e) => {
    const isLinked = isExpenseLinkedToCard(e);
    const isPaid = isLinked ? isExpenseCardPaid(e) : e.paid;
    return isPaid ? sum + e.value : sum;
  }, 0);

  const total = expenses.reduce((sum, e) => sum + e.value, 0);

  const toggleItemSelection = (id: string, isSelected: boolean) => {
    if (!onSelectionChange) return;
    showSelectionHintIfNeeded();
    const newSelection = new Set(selectedIds);
    if (isSelected) newSelection.delete(id);
    else newSelection.add(id);
    onSelectionChange(newSelection);
  };

  const ExpenseGroup = ({
    title,
    icon: Icon,
    list,
    type,
    emptyMessage,
    groupTotal,
    groupCreditCards,
    initialLimit = 10,
    showAll = false,
    isCollapsing = false,
    shouldPlayExpandAnimation = false,
    onShowAll,
    onRecolherClick,
  }: {
    title: string;
    icon: typeof Receipt;
    list: Expense[];
    type: Expense['type'];
    emptyMessage: string;
    groupTotal: number;
    groupCreditCards: CreditCardType[];
    initialLimit?: number;
    showAll?: boolean;
    isCollapsing?: boolean;
    shouldPlayExpandAnimation?: boolean;
    onShowAll?: () => void;
    onRecolherClick?: () => void;
  }) => {
    const isExpandedOrCollapsing = showAll || isCollapsing;
    const displayedList = isExpandedOrCollapsing || list.length <= initialLimit ? list : list.slice(0, initialLimit);
    const firstPart = displayedList.slice(0, initialLimit);
    const restPart = displayedList.slice(initialLimit);
    const hasMore = list.length > initialLimit && !showAll && !isCollapsing;
    const isExpanded = showAll && list.length > initialLimit && !isCollapsing;
    const handleItemClick = (expense: Expense) => (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[role="checkbox"]')) {
        return;
      }
      toggleItemSelection(expense.id, selectedIds.has(expense.id));
    };

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{title} ({list.length})</span>
          </div>
          <span className="text-sm font-semibold text-expense">{formatCurrency(groupTotal)}</span>
        </div>
        {list.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4 bg-muted/20 rounded-md">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-1">
            {firstPart.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                creditCards={groupCreditCards}
                isLinkedToCard={isExpenseLinkedToCard(expense)}
                isCardPaid={isExpenseCardPaid(expense)}
                onTogglePaid={() => handleTogglePaid(expense)}
                onUpdate={onUpdate}
                onDelete={handleDeleteRequest}
                onEdit={handleEdit}
                onCardItemClick={() => setCardWarningOpen(true)}
                isSelected={selectedIds.has(expense.id)}
                onItemClick={handleItemClick(expense)}
                onToggleSelection={() => toggleItemSelection(expense.id, selectedIds.has(expense.id))}
              />
            ))}
            {restPart.length > 0 && (
              <div className={cn('space-y-1', isCollapsing && 'collapse-out')}>
                {restPart.map((expense, index) => {
                  const isNewlyExpanded = shouldPlayExpandAnimation;
                  return (
                    <div
                      key={expense.id}
                      className={cn(isNewlyExpanded && 'expand-in')}
                      style={isNewlyExpanded ? { animationDelay: `${index * 35}ms` } : undefined}
                    >
                      <ExpenseItem
                        expense={expense}
                        creditCards={groupCreditCards}
                        isLinkedToCard={isExpenseLinkedToCard(expense)}
                        isCardPaid={isExpenseCardPaid(expense)}
                        onTogglePaid={() => handleTogglePaid(expense)}
                        onUpdate={onUpdate}
                        onDelete={handleDeleteRequest}
                        onEdit={handleEdit}
                        onCardItemClick={() => setCardWarningOpen(true)}
                        isSelected={selectedIds.has(expense.id)}
                        onItemClick={handleItemClick(expense)}
                onToggleSelection={() => toggleItemSelection(expense.id, selectedIds.has(expense.id))}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {(hasMore && onShowAll) || isExpanded || isCollapsing ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-1.5 text-expense hover:bg-expense-light hover:text-expense rounded-lg gap-1.5 disabled:opacity-70 min-h-8 text-xs"
                onClick={hasMore ? onShowAll : onRecolherClick}
                disabled={isCollapsing}
              >
                {isCollapsing ? (
                  <>Recolhendo...</>
                ) : isExpanded ? (
                  <><ChevronUp className="h-4 w-4 shrink-0" />Recolher</>
                ) : (
                  <><ChevronDown className="h-4 w-4 shrink-0" />Visualizar todos ({list.length})</>
                )}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  const SummaryGroup = ({
    title,
    icon: Icon,
    categoryData,
    emptyMessage,
    groupTotal,
  }: {
    title: string;
    icon: typeof Receipt;
    categoryData: { category: string; total: number }[];
    emptyMessage: string;
    groupTotal: number;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <span className="text-sm font-semibold text-expense">{formatCurrency(groupTotal)}</span>
      </div>
      {categoryData.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4 bg-muted/20 rounded-md">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-1">
          {categoryData.map(({ category, total }) => (
            <CategorySummaryItem
              key={category}
              category={category}
              total={total}
              groupTotal={groupTotal}
              shouldAnimate={shouldAnimate}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Get delete confirmation message based on expense type
  const getDeleteMessage = () => {
    if (!deleteExpense) return '';
    if (deleteExpense.type === 'installment') {
      return 'Deseja excluir apenas esta parcela deste mês? As demais parcelas serão mantidas.';
    }
    return 'Tem certeza que deseja excluir este gasto? Esta ação não pode ser desfeita.';
  };

  const shellClass = variant === 'embedded' ? '' : sectionSurfaceClass;

  return (
    <div className={shellClass}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {variant === 'default' && (
            <div className="p-2.5 rounded-md gradient-expense shrink-0">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
          )}
          <div>
            <SectionTotalsHeader
              title="Gastos"
              plannedTotal={total}
              effectiveTotal={paidTotal}
              effectiveLabel="Pago"
              colorClass="text-expense"
            />
          </div>
        </div>
      </div>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) clearAddDialogState();
        }}
      >
        <DialogContent className="rounded-lg max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingExpense ? 'Editar Gasto' : 'Novo Gasto'}
                </DialogTitle>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Expense['type'])}>
            <TabsList className="grid w-full grid-cols-3 rounded-md bg-muted p-1">
              <TabsTrigger
                value="fixed"
                className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-expense data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Fixo
              </TabsTrigger>
              <TabsTrigger
                value="variable"
                className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-expense data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Variável
              </TabsTrigger>
              <TabsTrigger
                value="installment"
                className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-expense data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Parcelado
              </TabsTrigger>
            </TabsList>
                {(['fixed', 'variable', 'installment'] as const).map((type) => (
                  <TabsContent key={type} value={type}>
                    <ExpenseForm
                      key={editingExpense?.id ?? (addDraft ? `draft-${type}` : `new-${type}`)}
                      type={type}
                      categories={categories}
                      paymentMethods={paymentMethods}
                      creditCards={creditCards}
                      onSubmit={handleSubmit}
                      initialData={
                        editingExpense?.type === type
                          ? editingExpense
                          : addDraft &&
                              (addDraft.type === type || (!addDraft.type && type === 'variable'))
                            ? buildDraftExpense(type, addDraft)
                            : undefined
                      }
                      categoryManagerSlot={
                        <Popover
                          open={isCategoryManagerOpenInModal}
                          onOpenChange={setIsCategoryManagerOpenInModal}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="rounded-md h-10 w-11 text-expense hover:bg-expense-light hover:text-expense focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 rounded-md p-4 bg-background border shadow-lg" align="end">
                            <h4 className="font-semibold mb-3 text-sm">Gerenciar Categorias</h4>

                            {/* Add new category */}
                            <div className="flex gap-2 mb-3">
                              <Input
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Nova categoria..."
                                className="rounded-lg h-9 text-sm focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                disabled={isCategoryLoading}
                              />
                              <Button
                                size="sm"
                                onClick={handleAddCategory}
                                className="rounded-lg h-9 px-3 bg-expense hover:bg-expense/90 focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2"
                                disabled={isCategoryLoading || !newCategory.trim() || categories.includes(newCategory.trim())}
                              >
                                {isCategoryLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </div>

                            {/* List of categories */}
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {categories.map((category) => {
                                const isUsed = expenses.some((e) => e.category === category);
                                const isEditing = editingCategory === category;

                                return (
                                  <div
                                    key={category}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-expense-light/40 hover:bg-expense-light"
                                  >
                                    {isEditing ? (
                                      <div className="flex items-center gap-1 flex-1">
                                        <Input
                                          value={editingCategoryValue}
                                          onChange={(e) => setEditingCategoryValue(e.target.value)}
                                          className="h-7 text-sm rounded-md flex-1 focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2"
                                          onKeyDown={(e) => e.key === 'Enter' && handleSaveCategoryEdit()}
                                          autoFocus
                                          disabled={isCategoryLoading}
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-md text-expense hover:bg-expense-light flex-shrink-0"
                                          onClick={handleSaveCategoryEdit}
                                          title="Confirmar edição"
                                          disabled={isCategoryLoading}
                                        >
                                          {isCategoryLoading ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Check className="h-3.5 w-3.5" />
                                          )}
                                        </Button>
                                      </div>
                                    ) : (
                                      <span className="flex-1 text-sm truncate">{category}</span>
                                    )}

                                    {!isEditing && (
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 rounded-md text-expense hover:bg-expense-light"
                                          onClick={() => {
                                            setEditingCategory(category);
                                            setEditingCategoryValue(category);
                                          }}
                                          disabled={isCategoryLoading}
                                        >
                                          <Pencil className="h-3 w-3 text-expense" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 rounded-md hover:bg-expense-light"
                                          onClick={() => handleDeleteCategory(category)}
                                          disabled={isUsed || isCategoryLoading}
                                          title={isUsed ? 'Esta categoria está em uso' : 'Excluir'}
                                        >
                                          <Trash2
                                            className={`h-3 w-3 ${isUsed ? 'text-muted-foreground/40' : 'text-expense'}`}
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
                      }
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </DialogContent>
      </Dialog>

      {/* View Controls */}
      <div className="flex items-center justify-between mb-4 gap-2">
        {/* View Mode Toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
          className="bg-expense-light rounded-lg p-0.5"
        >
          <ToggleGroupItem
            value="general"
            aria-label="Visualização geral"
            className="rounded-md px-2.5 py-1 text-xs data-[state=on]:bg-expense data-[state=on]:text-white data-[state=on]:shadow-sm text-expense hover:bg-expense/20 hover:text-expense"
          >
            <List className="h-3 w-3 mr-1" />
            Geral
          </ToggleGroupItem>
          <ToggleGroupItem
            value="summary"
            aria-label="Visualização resumida"
            className="rounded-md px-2.5 py-1 text-xs data-[state=on]:bg-expense data-[state=on]:text-white data-[state=on]:shadow-sm text-expense hover:bg-expense/20 hover:text-expense"
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
              className="rounded-lg h-7 px-2.5 text-xs gap-1 text-expense hover:text-expense hover:bg-expense-light"
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
                className={`rounded-lg cursor-pointer hover:bg-expense-light hover:text-expense ${sortOption === option.value ? 'bg-expense-light text-expense' : ''}`}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expense Groups */}
      <div>
        {expenses.length === 0 ? (
          <div className="text-center py-8 sm:py-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-expense-light mb-3">
              <TrendingDown className="h-6 w-6 text-expense" />
            </div>
            <p className="text-muted-foreground text-sm mb-4">Nenhum gasto registrado</p>
            <Button
              onClick={() => {
                setEditingExpense(null);
                setIsOpen(true);
              }}
              className="gradient-expense text-white hover:opacity-90"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar gasto
            </Button>
          </div>
        ) : viewMode === 'general' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-6">
              <ExpenseGroup
                title="Gastos Fixos"
                icon={Receipt}
                list={sortedFixedExpenses}
                type="fixed"
                emptyMessage="Nenhum gasto fixo"
                groupTotal={fixedExpenses.reduce((s, e) => s + e.value, 0)}
                groupCreditCards={creditCards}
                initialLimit={INITIAL_ITEMS_LIMIT}
                showAll={showAllFixed}
                isCollapsing={isCollapsingFixed}
                shouldPlayExpandAnimation={showAllFixed && !isCollapsingFixed && !expandAnimationPlayedFixedRef.current}
                onShowAll={() => setShowAllFixed(true)}
                onRecolherClick={() => setIsCollapsingFixed(true)}
              />
              <ExpenseGroup
                title="Gastos Parcelados"
                icon={CreditCard}
                list={sortedInstallmentExpenses}
                type="installment"
                emptyMessage="Nenhum gasto parcelado"
                groupTotal={installmentExpenses.reduce((s, e) => s + e.value, 0)}
                groupCreditCards={creditCards}
                initialLimit={INITIAL_ITEMS_LIMIT}
                showAll={showAllInstallment}
                isCollapsing={isCollapsingInstallment}
                shouldPlayExpandAnimation={showAllInstallment && !isCollapsingInstallment && !expandAnimationPlayedInstallmentRef.current}
                onShowAll={() => setShowAllInstallment(true)}
                onRecolherClick={() => setIsCollapsingInstallment(true)}
              />
            </div>
            <div>
              <ExpenseGroup
                title="Gastos Variáveis"
                icon={Repeat}
                list={sortedVariableExpenses}
                type="variable"
                emptyMessage="Nenhum gasto variável"
                groupTotal={variableExpenses.reduce((s, e) => s + e.value, 0)}
                groupCreditCards={creditCards}
                initialLimit={INITIAL_ITEMS_LIMIT}
                showAll={showAllVariable}
                isCollapsing={isCollapsingVariable}
                shouldPlayExpandAnimation={showAllVariable && !isCollapsingVariable && !expandAnimationPlayedVariableRef.current}
                onShowAll={() => setShowAllVariable(true)}
                onRecolherClick={() => setIsCollapsingVariable(true)}
              />
            </div>
          </div>
        ) : (
          <SummaryGroup
            title="Gastos"
            icon={TrendingDown}
            categoryData={allExpensesByCategory}
            emptyMessage="Nenhum gasto registrado"
            groupTotal={total}
          />
        )}
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteExpense}
        onOpenChange={(open) => !open && setDeleteExpense(null)}
        onConfirm={handleConfirmDelete}
        title={deleteExpense?.type === 'installment' ? 'Excluir gasto parcelado' : 'Excluir gasto'}
        description={getDeleteMessage()}
      />

      {/* Apply to All Months Dialog */}
      <ApplyToAllDialog
        open={showApplyToAllDialog}
        onOpenChange={setShowApplyToAllDialog}
        onApplyToCurrentMonth={pendingAction === 'edit' ? handleEditCurrentMonth : handleDeleteCurrentMonth}
        onApplyToAllMonths={pendingAction === 'edit' ? handleEditAllMonths : handleDeleteAllMonths}
        title={
          pendingAction === 'edit'
            ? editingExpense?.type === 'installment' ? 'Editar gasto parcelado' : 'Editar gasto fixo'
            : editingExpense?.type === 'installment' ? 'Excluir gasto parcelado' : 'Excluir gasto fixo'
        }
        description={
          pendingAction === 'edit'
            ? editingExpense?.type === 'installment'
              ? 'Este gasto é parcelado. Deseja editar apenas esta parcela ou todas as parcelas?'
              : 'Este gasto se repete nos meses. Deseja editar apenas este mês ou em todos os meses seguintes?'
            : editingExpense?.type === 'installment'
              ? 'Este gasto é parcelado. Deseja excluir apenas esta parcela ou todas as parcelas?'
              : 'Este gasto se repete nos meses. Deseja excluir apenas este mês ou em todos os meses seguintes?'
        }
        actionLabel={pendingAction === 'edit' ? 'Editar' : 'Excluir'}
        isDestructive={pendingAction === 'delete'}
        itemSummary={
          editingExpense
            ? `${editingExpense.description} — ${formatCurrency(editingExpense.value)}`
            : undefined
        }
        applyToAllButtonLabel={editingExpense?.type === 'installment' ? undefined : (pendingAction === 'edit' ? 'Alterar todos os meses seguintes' : 'Excluir todos os meses seguintes')}
      />

      {/* Card Item Warning Dialog */}
      <AlertDialog open={cardWarningOpen} onOpenChange={setCardWarningOpen}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Item vinculado a cartão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este gasto está vinculado a uma fatura de cartão de crédito e não pode ser marcado individualmente como pago. Para registrar o pagamento, marque a fatura correspondente como paga na faixa de cartões acima.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setCardWarningOpen(false)}
              className="rounded-md bg-expense text-white hover:bg-expense/90 focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2"
            >
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const ExpenseSection = memo(ExpenseSectionComponent);
