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

  // Build payment methods list with active credit cards
  const allPaymentMethods = [...paymentMethods, ...creditCards.map(c => c.name)];

  const handleSubmit = () => {
    const numValue = parseCurrencyToNumber(value);
    if (!category || !description || numValue <= 0 || !paymentMethod) return;

    onSubmit({
      type,
      category,
      description,
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
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="rounded-xl h-11">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="rounded-lg">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description and Value on same line */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3">
          <label className="text-sm font-medium mb-2 block text-muted-foreground">Descrição</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Conta de luz"
            className="rounded-xl h-11"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium mb-2 block text-muted-foreground">Valor</label>
          <CurrencyInput
            value={value}
            onValueChange={setValue}
            className="rounded-xl h-11"
          />
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">Forma de Pagamento</label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="rounded-xl h-11">
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
  onDelete: (id: string) => void;
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
          ? 'bg-muted/20 opacity-60' 
          : 'bg-muted/30 hover:bg-muted/50'
      } ${isDragged ? 'opacity-50' : ''}`}
    >
      {/* Drag Handle */}
      <div className="w-0 overflow-hidden group-hover:w-5 transition-all duration-200 flex-shrink-0">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </div>

      {/* Checkbox */}
      <Checkbox
        checked={expense.paid}
        onCheckedChange={(checked) => onUpdate(expense.id, { paid: !!checked })}
        className="h-4 w-4 rounded-md border-2 data-[state=checked]:bg-income data-[state=checked]:border-income flex-shrink-0"
      />

      {/* Category */}
      <Badge 
        variant="outline" 
        className="text-xs rounded-md px-2 py-0.5 border-expense/30 text-expense bg-expense-light flex-shrink-0"
      >
        {expense.category}
      </Badge>

      {/* Description */}
      <span className={`flex-1 text-sm font-medium truncate ${expense.paid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
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
          onClick={() => onDelete(expense.id)}
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
  onReorder,
}: ExpenseSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Expense['type']>('fixed');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const handleDragStart = (type: Expense['type'], index: number) => {
    setDraggedIndex({ type, index });
  };

  const handleDragOver = (e: React.DragEvent, type: Expense['type'], index: number) => {
    e.preventDefault();
    if (!draggedIndex || draggedIndex.type !== type || draggedIndex.index === index) return;

    const typeExpenses = expenses.filter(exp => exp.type === type);
    const otherExpenses = expenses.filter(exp => exp.type !== type);
    
    const newTypeExpenses = [...typeExpenses];
    const draggedItem = newTypeExpenses[draggedIndex.index];
    newTypeExpenses.splice(draggedIndex.index, 1);
    newTypeExpenses.splice(index, 0, draggedItem);
    
    onReorder([...otherExpenses, ...newTypeExpenses]);
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
              onDelete={(id) => setDeleteId(id)}
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
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir gasto"
        description="Tem certeza que deseja excluir este gasto? Esta ação não pode ser desfeita."
      />
    </div>
  );
};
