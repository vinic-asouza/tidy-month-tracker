import { useState } from 'react';
import { Plus, Pencil, Trash2, TrendingDown, Receipt, Repeat, CreditCard, GripVertical } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { Expense, CreditCard as CreditCardType } from '@/types/finance';

interface ExpenseSectionProps {
  expenses: Expense[];
  categories: string[];
  paymentMethods: string[];
  creditCards: CreditCardType[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  onDeleteInstallment: (expense: Expense) => void;
  onReorder: (expenses: Expense[]) => void;
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
  const allPaymentMethods = [...paymentMethods, ...creditCards.map(c => c.name)];

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
            {allPaymentMethods.map((method) => (
              <SelectItem key={method} value={method} className="rounded-lg">
                {method}
              </SelectItem>
            ))}
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

const ExpenseItem = ({
  expense,
  onUpdate,
  onDelete,
  onEdit,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragged,
}: {
  expense: Expense;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragged: boolean;
}) => {
  const installmentText = expense.currentInstallment && expense.totalInstallments
    ? `${expense.currentInstallment}/${expense.totalInstallments}`
    : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`group flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-200 cursor-default ${
        expense.paid 
          ? 'bg-muted/20' 
          : 'bg-muted/30 hover:bg-muted/50'
      } ${isDragged ? 'opacity-50' : ''}`}
    >
      {/* Drag Handle */}
      <div className="w-0 overflow-hidden group-hover:w-5 transition-all duration-200 flex-shrink-0">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </div>

      {/* Checkbox - expense themed */}
      <Checkbox
        checked={expense.paid}
        onCheckedChange={(checked) => onUpdate(expense.id, { paid: !!checked })}
        className="h-4 w-4 rounded-md border-2 border-expense/50 data-[state=checked]:bg-expense data-[state=checked]:border-expense flex-shrink-0"
      />

      {/* Category */}
      <Badge 
        variant="outline" 
        className="text-xs rounded-md px-2 py-0.5 border-expense/30 text-expense bg-expense-light flex-shrink-0"
      >
        {expense.category}
      </Badge>

      {/* Description */}
      <span className={`flex-1 text-sm font-medium truncate ${expense.paid ? 'text-muted-foreground' : 'text-foreground'}`}>
        {expense.description}
      </span>

      {/* Payment Method */}
      <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
        {expense.paymentMethod}
      </span>

      {/* Installment */}
      {installmentText && (
        <Badge 
          variant="secondary" 
          className="text-xs rounded-md px-2 py-0.5 bg-muted flex-shrink-0"
        >
          {installmentText}
        </Badge>
      )}

      {/* Repeat indicator */}
      {expense.repeatAllMonths && (
        <Repeat className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      )}

      {/* Value */}
      <span className={`font-bold whitespace-nowrap text-sm flex-shrink-0 transition-all duration-200 ${expense.paid ? 'text-muted-foreground' : 'text-expense'}`}>
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
  onReorder,
}: ExpenseSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Expense['type']>('fixed');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<{ type: Expense['type']; index: number } | null>(null);

  const fixedExpenses = expenses.filter((e) => e.type === 'fixed');
  const variableExpenses = expenses.filter((e) => e.type === 'variable');
  const installmentExpenses = expenses.filter((e) => e.type === 'installment');

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

  const handleDragStart = (type: Expense['type'], index: number) => {
    setDraggedIndex({ type, index });
  };

  const handleDragOver = (e: React.DragEvent, type: Expense['type'], index: number) => {
    e.preventDefault();
    if (!draggedIndex || draggedIndex.type !== type || draggedIndex.index === index) return;

    // Get only expenses of this type
    const typeExpenses = type === 'fixed' ? [...fixedExpenses] : 
                         type === 'variable' ? [...variableExpenses] : 
                         [...installmentExpenses];
    
    // Reorder within the type group
    const draggedItem = typeExpenses[draggedIndex.index];
    typeExpenses.splice(draggedIndex.index, 1);
    typeExpenses.splice(index, 0, draggedItem);
    
    // Rebuild full expenses array maintaining type order
    const otherFixed = type === 'fixed' ? typeExpenses : fixedExpenses;
    const otherVariable = type === 'variable' ? typeExpenses : variableExpenses;
    const otherInstallment = type === 'installment' ? typeExpenses : installmentExpenses;
    
    onReorder([...otherFixed, ...otherVariable, ...otherInstallment]);
    setDraggedIndex({ type, index });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const total = expenses.reduce((sum, e) => sum + e.value, 0);

  const ExpenseGroup = ({ 
    title, 
    icon: Icon, 
    list, 
    type,
    emptyMessage,
    groupTotal 
  }: { 
    title: string; 
    icon: typeof Receipt;
    list: Expense[]; 
    type: Expense['type'];
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
      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4 bg-muted/20 rounded-xl">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-1">
          {list.map((expense, index) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              onUpdate={onUpdate}
              onDelete={handleDeleteRequest}
              onEdit={handleEdit}
              onDragStart={() => handleDragStart(type, index)}
              onDragOver={(e) => handleDragOver(e, type, index)}
              onDragEnd={handleDragEnd}
              isDragged={draggedIndex?.type === type && draggedIndex?.index === index}
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
            <p className="text-base font-bold text-expense">
              {formatCurrency(total)}
            </p>
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
        />
        <ExpenseGroup
          title="Gastos Variáveis"
          icon={Repeat}
          list={variableExpenses}
          type="variable"
          emptyMessage="Nenhum gasto variável"
          groupTotal={variableExpenses.reduce((s, e) => s + e.value, 0)}
        />
        <ExpenseGroup
          title="Gastos Parcelados"
          icon={CreditCard}
          list={installmentExpenses}
          type="installment"
          emptyMessage="Nenhum gasto parcelado"
          groupTotal={installmentExpenses.reduce((s, e) => s + e.value, 0)}
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
    </div>
  );
};