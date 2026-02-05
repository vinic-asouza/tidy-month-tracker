import { useState } from 'react';
import { Plus, Pencil, Trash2, TrendingDown, Receipt, Repeat, CreditCard, AlertTriangle } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { Expense, CreditCard as CreditCardType, CARD_COLORS } from '@/types/finance';

interface ExpenseSectionProps {
  expenses: Expense[];
  categories: string[];
  paymentMethods: string[];
  creditCards: CreditCardType[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  onDeleteInstallment: (expense: Expense) => void;
  getCardPaidStatus?: (cardId: string) => boolean;
}

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

const ExpenseForm = ({
  type,
  categories,
  paymentMethods,
  creditCards,
  onSubmit,
  initialData,
}: {
  type: Expense['type'];
  categories: string[];
  paymentMethods: string[];
  creditCards: CreditCardType[];
  onSubmit: (data: Omit<Expense, 'id'>) => void;
  initialData?: Expense;
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
        <Select value={category} onValueChange={(v) => { setCategory(v); setCategoryError(null); }}>
          <SelectTrigger className={`rounded-xl h-11 ${categoryError ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-64">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="rounded-lg">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            className={`rounded-xl h-11 ${descriptionError ? 'border-destructive' : ''}`}
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
            className={`rounded-xl h-11 ${valueError ? 'border-destructive' : ''}`}
          />
          {valueError && <p className="text-destructive text-sm mt-1">{valueError}</p>}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">Forma de Pagamento</label>
        <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setPaymentError(null); }}>
          <SelectTrigger className={`rounded-xl h-11 ${paymentError ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {allPaymentMethods.map((method) => {
              const isCard = typeof method === 'object';
              const value = isCard ? method.value : method;
              const label = isCard ? method.label : method;
              return (
                <SelectItem key={value} value={value} className="rounded-lg">
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
    // Get card color from CARD_COLORS
    const cardColor = CARD_COLORS.find(c => c.id === creditCard.color);
    if (cardColor) {
      // Map card color to tailwind classes with light bg and darker text
      const colorMap: Record<string, string> = {
        'violet': 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
        'orange': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
        'emerald': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
        'blue': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
        'pink': 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
        'yellow': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
        'slate': 'bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-400',
        'cyan': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
        'red': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
      };
      return {
        className: colorMap[creditCard.color] || 'bg-muted text-muted-foreground',
        isCard: true,
      };
    }
  }

  // Standard payment methods
  switch (paymentMethod.toLowerCase()) {
    case 'dinheiro':
      return {
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
      };
    case 'pix':
      return {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
      };
    case 'débito':
      return {
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
      };
    case 'boleto':
      return {
        className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
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
  onUpdate: (id: string, updates: Partial<Expense>) => void;
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
      className={`group flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-200 cursor-default select-none ${
        isPaid 
          ? 'bg-expense-light' 
          : 'bg-muted/30 hover:bg-muted/50'
      }`}
    >
      {/* Paid Checkbox */}
      {isLinkedToCard ? (
        <Checkbox
          checked={isCardPaid}
          disabled
          onClick={onCardItemClick}
          className="h-4 w-4 rounded-md border-2 border-expense/30 opacity-50 cursor-not-allowed data-[state=checked]:bg-expense data-[state=checked]:border-expense data-[state=checked]:text-white flex-shrink-0"
        />
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
        className="text-xs rounded-md px-2 py-0.5 bg-expense-light text-expense border-0 flex-shrink-0"
      >
        {expense.category}
      </Badge>

      {/* Description */}
      <span className={`flex-1 text-sm font-medium truncate ${isPaid ? 'text-muted-foreground' : 'text-foreground'}`}>
        {expense.description}
      </span>

      {/* Payment Method Badge */}
      <Badge 
        variant="secondary" 
        className={`text-xs rounded-md px-2 py-0.5 flex-shrink-0 hidden sm:inline-flex border-0 ${style.className}`}
      >
        {expense.paymentMethod}
      </Badge>

      {/* Installment */}
      {installmentText && (
        <Badge 
          variant="secondary" 
          className="text-xs rounded-md px-2 py-0.5 bg-muted text-muted-foreground border-0 flex-shrink-0"
        >
          {installmentText}
        </Badge>
      )}

      {/* Repeat indicator */}
      {expense.repeatAllMonths && (
        <Repeat className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      )}

      {/* Value */}
      <span className={`font-bold whitespace-nowrap text-sm flex-shrink-0 transition-all duration-200 ${isPaid ? 'text-muted-foreground' : 'text-expense'}`}>
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
}: ExpenseSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Expense['type']>('fixed');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [cardWarningOpen, setCardWarningOpen] = useState(false);

  const fixedExpenses = expenses.filter((e) => e.type === 'fixed');
  const variableExpenses = expenses.filter((e) => e.type === 'variable');
  const installmentExpenses = expenses.filter((e) => e.type === 'installment');

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
      onUpdate(editingExpense.id, data);
    } else {
      onAdd(data);
    }
    setIsOpen(false);
    setEditingExpense(null);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setActiveTab(expense.type);
    setIsOpen(true);
  };

  const handleDeleteRequest = (expense: Expense) => {
    setDeleteExpense(expense);
  };

  const handleConfirmDelete = () => {
    if (deleteExpense) {
      if (deleteExpense.type === 'installment') {
        onDeleteInstallment(deleteExpense);
      } else {
        onDelete(deleteExpense.id);
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
                <TabsTrigger value="fixed" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  Fixo
                </TabsTrigger>
                <TabsTrigger value="variable" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  Variável
                </TabsTrigger>
                <TabsTrigger value="installment" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
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
                  />
                </TabsContent>
              ))}
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expense Groups */}
      <div className="space-y-6">
        <ExpenseGroup
          title="Gastos Fixos"
          icon={Receipt}
          list={fixedExpenses}
          type="fixed"
          emptyMessage="Nenhum gasto fixo"
          groupTotal={fixedExpenses.reduce((s, e) => s + e.value, 0)}
          groupCreditCards={creditCards}
        />
        <ExpenseGroup
          title="Gastos Variáveis"
          icon={Repeat}
          list={variableExpenses}
          type="variable"
          emptyMessage="Nenhum gasto variável"
          groupTotal={variableExpenses.reduce((s, e) => s + e.value, 0)}
          groupCreditCards={creditCards}
        />
        <ExpenseGroup
          title="Gastos Parcelados"
          icon={CreditCard}
          list={installmentExpenses}
          type="installment"
          emptyMessage="Nenhum gasto parcelado"
          groupTotal={installmentExpenses.reduce((s, e) => s + e.value, 0)}
          groupCreditCards={creditCards}
        />
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteExpense}
        onOpenChange={(open) => !open && setDeleteExpense(null)}
        onConfirm={handleConfirmDelete}
        title={deleteExpense?.type === 'installment' ? 'Excluir gasto parcelado' : 'Excluir gasto'}
        description={getDeleteMessage()}
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
              className="rounded-xl"
            >
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
