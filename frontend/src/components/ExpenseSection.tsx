import { useState, useMemo, ReactNode, useEffect } from 'react';
import { Plus, Pencil, Trash2, TrendingDown, Receipt, Repeat, CreditCard, AlertTriangle, List, LayoutGrid, ArrowUpDown, Settings, Check, Loader2 } from 'lucide-react';
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
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { ApplyToAllDialog } from '@/components/ui/apply-to-all-dialog';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { Expense, CreditCard as CreditCardType, CARD_COLORS } from '@/types/finance';

interface ExpenseSectionProps {
  expenses: Expense[];
  categories: string[];
  paymentMethods: string[];
  creditCards: CreditCardType[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Expense>, applyToAllMonths?: boolean) => void;
  onDelete: (id: string, applyToAllMonths?: boolean) => void;
  onDeleteInstallment: (expense: Expense) => void;
  getCardPaidStatus?: (cardId: string) => boolean;
  onAddCategory: (category: string) => Promise<void> | void;
  onUpdateCategory: (oldCategory: string, newCategory: string) => Promise<void> | void;
  onDeleteCategory: (category: string) => Promise<void> | void;
}

type ViewMode = 'general' | 'summary';
type SortOption = 'default' | 'alphabetic' | 'category' | 'payment' | 'highest' | 'lowest';

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
  onSubmit: (data: Omit<Expense, 'id'>) => void;
  initialData?: Expense;
  categoryManagerSlot?: ReactNode;
}) => {
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');
  const [value, setValue] = useState(initialData ? formatValueForInput(initialData.value) : '');
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

  // Build payment methods list with active credit cards
  const allPaymentMethods = [
    ...paymentMethods,
    ...creditCards.map(c => ({ label: `Crédito: ${c.name}`, value: c.name }))
  ];

  const handleSubmit = () => {
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

    onSubmit({
      type,
      category,
      description: description.trim(),
      paymentMethod,
      value: numValue,
      paid: initialData?.paid || false,
      repeatAllMonths: type === 'fixed' ? repeatAllMonths : undefined,
      currentInstallment: type === 'installment' ? parseInt(currentInstallment) || 1 : undefined,
      totalInstallments: type === 'installment' ? parseInt(totalInstallments) || 12 : undefined,
    });
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Category */}
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">Categoria</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={category} onValueChange={(v) => { setCategory(v); setCategoryError(null); }}>
              <SelectTrigger className={`rounded-xl h-11 ${categoryError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2`}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-64">
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

      {/* Description and Value on same line */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3">
          <label className="text-sm font-medium mb-2 block text-muted-foreground">Descrição</label>
          <Input
            value={description}
            onChange={(e) => { setDescription(e.target.value); setDescriptionError(null); }}
            placeholder="Ex: Conta de luz"
            className={`rounded-xl h-11 ${descriptionError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2`}
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
            className={`rounded-xl h-11 ${valueError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2`}
          />
          {valueError && <p className="text-destructive text-sm mt-1">{valueError}</p>}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">Forma de Pagamento</label>
        <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setPaymentError(null); }}>
          <SelectTrigger
            className={`rounded-xl h-11 ${paymentError ? 'border-destructive' : ''} focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2`}
          >
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
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
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-48">
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
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-48">
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
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
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
      )}

      <Button
        onClick={handleSubmit}
        className="w-full h-11 rounded-xl gradient-expense shadow-glow-expense hover:opacity-90 transition-opacity text-white border-0"
      >
        {initialData ? 'Salvar Alterações' : 'Adicionar Gasto'}
      </Button>
    </div>
  );
};

// Payment method color mapping
const getPaymentMethodStyle = (paymentMethod: string, creditCards: CreditCardType[]) => {
  // Check if it's a credit card payment
  const creditCard = creditCards.find(c => c.name === paymentMethod);
  if (creditCard) {
    // Get card color from CARD_COLORS - use gradient background matching the card with white text
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
      isCard: true,
    };
  }

  // Standard payment methods - lighter background with stronger text color
  switch (paymentMethod.toLowerCase()) {
    case 'dinheiro':
      return {
        className: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      };
    case 'pix':
      return {
        className: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
      };
    case 'débito':
      return {
        className: 'bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
      };
    case 'boleto':
      return {
        className: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300',
      };
    default:
      return {
        className: 'bg-muted text-muted-foreground',
      };
  }
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
}) => {
  const installmentText = expense.currentInstallment && expense.totalInstallments
    ? `${expense.currentInstallment}/${expense.totalInstallments}`
    : null;

  const style = getPaymentMethodStyle(expense.paymentMethod, creditCards);
  const isPaid = isLinkedToCard ? isCardPaid : expense.paid;

  return (
    <div
      className={`group flex items-center gap-2 py-1.5 px-3 rounded-xl transition-all duration-200 cursor-default select-none ${isPaid
        ? 'bg-expense-light'
        : 'bg-muted/30 hover:bg-muted/50'
        }`}
    >
      {/* Paid Checkbox */}
      {isLinkedToCard ? (
        <div
          onClick={onCardItemClick}
          className="cursor-pointer"
        >
          <Checkbox
            checked={isCardPaid}
            className="h-4 w-4 rounded-md border-2 border-expense/30 opacity-50 pointer-events-none data-[state=checked]:bg-expense data-[state=checked]:border-expense data-[state=checked]:text-white flex-shrink-0"
          />
        </div>
      ) : (
        <Checkbox
          checked={expense.paid}
          onCheckedChange={onTogglePaid}
          className="h-4 w-4 rounded-md border-2 border-expense/50 data-[state=checked]:bg-expense data-[state=checked]:border-expense data-[state=checked]:text-white flex-shrink-0"
        />
      )}

      {/* Category */}
      <Badge
        variant="secondary"
        className="text-xs rounded-md px-2 py-0.5 bg-expense-light text-expense border-0 flex-shrink-0 cursor-default hover:opacity-100 hover:bg-expense-light"
      >
        {expense.category}
      </Badge>

      {/* Description */}
      <span className="flex-1 text-sm font-medium truncate text-foreground">
        {expense.description}
      </span>

      {/* Payment Method Badge */}
      <Badge
        variant="secondary"
        className={`text-xs rounded-md px-2 py-0.5 flex-shrink-0 hidden sm:inline-flex border-0 cursor-default hover:opacity-100 ${style.className}`}
      >
        {style.isCard && (
          <CreditCard className="h-3 w-3 mr-1" />
        )}
        <span>{expense.paymentMethod}</span>
      </Badge>

      {/* Installment */}
      {installmentText && (
        <Badge
          variant="secondary"
          className="text-xs rounded-md px-2 py-0.5 bg-muted text-muted-foreground border-0 flex-shrink-0 cursor-default"
        >
          {installmentText}
        </Badge>
      )}

      {/* Repeat indicator */}
      {expense.repeatAllMonths && (
        <Repeat className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      )}

      {/* Value */}
      <span className="font-bold whitespace-nowrap text-sm flex-shrink-0 text-expense">
        {formatCurrency(expense.value)}
      </span>

      {/* Actions */}
      <div className="flex gap-1 w-0 overflow-hidden group-hover:w-16 transition-all duration-200 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:bg-muted"
          onClick={() => onEdit(expense)}
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:bg-muted"
          onClick={() => onDelete(expense)}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
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
    <div className="relative flex items-center justify-between py-1.5 px-3 rounded-xl bg-muted/30 overflow-hidden">
      {/* Progress bar background */}
      <div
        className={`absolute inset-y-0 left-0 bg-expense-light rounded-xl ${
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
          className="text-xs rounded-md px-2 py-0.5 bg-expense-light text-expense border-0 cursor-default"
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
  if (sortOption === 'default') return expenses;

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

    default:
      return sorted;
  }
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
      return result.sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'));
    case 'highest':
      return result.sort((a, b) => b.total - a.total);
    case 'lowest':
      return result.sort((a, b) => a.total - b.total);
    default:
      return result;
  }
};

export const ExpenseSection = ({
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
}: ExpenseSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Expense['type']>('fixed');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [cardWarningOpen, setCardWarningOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [sortOption, setSortOption] = useState<SortOption>('default');
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
    // Não permitir excluir categoria em uso
    const hasExpenses = expenses.some((expense) => expense.category === category);
    if (hasExpenses || isCategoryLoading) return;

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

  const handleSubmit = (data: Omit<Expense, 'id'>) => {
    if (editingExpense) {
      onUpdate(editingExpense.id, data, applyToAllMonths);
      setApplyToAllMonths(false); // Reset após uso
    } else {
      onAdd(data);
    }
    setIsOpen(false);
    setEditingExpense(null);
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
      if (deleteExpense.type === 'installment') {
        onDeleteInstallment(deleteExpense);
      } else {
        onDelete(deleteExpense.id, false); // Apenas este mês
      }
      setDeleteExpense(null);
    }
  };

  const handleTogglePaid = (expense: Expense) => {
    onUpdate(expense.id, { paid: !expense.paid });
  };

  // Calculate paid total (items marked as paid or linked to paid cards)
  const paidTotal = expenses.reduce((sum, e) => {
    const isLinked = isExpenseLinkedToCard(e);
    const isPaid = isLinked ? isExpenseCardPaid(e) : e.paid;
    return isPaid ? sum + e.value : sum;
  }, 0);

  const total = expenses.reduce((sum, e) => sum + e.value, 0);
  const hasPaidItems = paidTotal > 0;

  const ExpenseGroup = ({
    title,
    icon: Icon,
    list,
    type,
    emptyMessage,
    groupTotal,
    groupCreditCards,
  }: {
    title: string;
    icon: typeof Receipt;
    list: Expense[];
    type: Expense['type'];
    emptyMessage: string;
    groupTotal: number;
    groupCreditCards: CreditCardType[];
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <span className="text-sm font-semibold text-expense">{formatCurrency(groupTotal)}</span>
      </div>
      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4 bg-muted/20 rounded-xl">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-1">
          {list.map((expense) => (
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
            />
          ))}
        </div>
      )}
    </div>
  );

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
        <p className="text-muted-foreground text-sm text-center py-4 bg-muted/20 rounded-xl">
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
      return 'Este é um gasto parcelado. A exclusão será aplicada a todos os meses subsequentes. Deseja continuar?';
    }
    return 'Tem certeza que deseja excluir este gasto? Esta ação não pode ser desfeita.';
  };

  return (
    <div className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-expense shadow-glow-expense">
            <TrendingDown className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Gastos</h3>
            <div className="flex items-center gap-2">
              {hasPaidItems && (
                <>
                  <span className="text-xs text-muted-foreground">Total:</span>
                </>
              )}
              <p className="text-base font-bold text-expense">
                {formatCurrency(total)}
              </p>
              {hasPaidItems && (
                <>
                  <span className="text-xs text-muted-foreground">| Pago:</span>
                  <p className="text-base font-bold text-expense">
                    {formatCurrency(paidTotal)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingExpense(null); }}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-xl gradient-expense shadow-glow-expense hover:opacity-90 transition-opacity text-white border-0"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingExpense ? 'Editar Gasto' : 'Novo Gasto'}
                </DialogTitle>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Expense['type'])}>
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted p-1">
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
                      type={type}
                      categories={categories}
                      paymentMethods={paymentMethods}
                      creditCards={creditCards}
                      onSubmit={handleSubmit}
                      initialData={editingExpense?.type === type ? editingExpense : undefined}
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
                              className="rounded-xl h-11 w-11 text-expense hover:bg-expense-light hover:text-expense focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 rounded-xl p-4 bg-background border shadow-lg" align="end">
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
        </div>
      </div>

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
          <DropdownMenuContent align="end" className="rounded-xl">
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
      <div className="space-y-6">
        {viewMode === 'general' ? (
          <>
            <ExpenseGroup
              title="Gastos Fixos"
              icon={Receipt}
              list={sortedFixedExpenses}
              type="fixed"
              emptyMessage="Nenhum gasto fixo"
              groupTotal={fixedExpenses.reduce((s, e) => s + e.value, 0)}
              groupCreditCards={creditCards}
            />
            <ExpenseGroup
              title="Gastos Parcelados"
              icon={CreditCard}
              list={sortedInstallmentExpenses}
              type="installment"
              emptyMessage="Nenhum gasto parcelado"
              groupTotal={installmentExpenses.reduce((s, e) => s + e.value, 0)}
              groupCreditCards={creditCards}
            />
            <ExpenseGroup
              title="Gastos Variáveis"
              icon={Repeat}
              list={sortedVariableExpenses}
              type="variable"
              emptyMessage="Nenhum gasto variável"
              groupTotal={variableExpenses.reduce((s, e) => s + e.value, 0)}
              groupCreditCards={creditCards}
            />
          </>
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
              : 'Este gasto se repete em todos os meses. Deseja editar apenas este mês ou em todos os meses?'
            : editingExpense?.type === 'installment'
              ? 'Este gasto é parcelado. Deseja excluir apenas esta parcela ou todas as parcelas?'
              : 'Este gasto se repete em todos os meses. Deseja excluir apenas este mês ou em todos os meses?'
        }
        actionLabel={pendingAction === 'edit' ? 'Editar' : 'Excluir'}
      />

      {/* Card Item Warning Dialog */}
      <AlertDialog open={cardWarningOpen} onOpenChange={setCardWarningOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Item vinculado a cartão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este gasto está vinculado a uma fatura de cartão de crédito e não pode ser marcado individualmente como pago. Para registrar o pagamento, acesse a seção "Cartões de Crédito" e marque a fatura correspondente como paga.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setCardWarningOpen(false)}
              className="rounded-xl bg-expense text-white hover:bg-expense/90 focus-visible:ring-2 focus-visible:ring-expense focus-visible:ring-offset-2"
            >
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
