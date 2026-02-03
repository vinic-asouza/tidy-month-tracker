import { useState } from 'react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Expense } from '@/types/finance';

interface ExpenseSectionProps {
  expenses: Expense[];
  categories: string[];
  paymentMethods: string[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  onAddCategory: (category: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const ExpenseForm = ({
  type,
  categories,
  paymentMethods,
  onSubmit,
  initialData,
  onAddCategory,
}: {
  type: Expense['type'];
  categories: string[];
  paymentMethods: string[];
  onSubmit: (data: Omit<Expense, 'id'>) => void;
  initialData?: Expense;
  onAddCategory: (category: string) => void;
}) => {
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');
  const [value, setValue] = useState(initialData?.value?.toString() || '');
  const [installment, setInstallment] = useState(initialData?.installment || '');
  const [newCategory, setNewCategory] = useState('');

  const handleSubmit = () => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (!category || !description || isNaN(numValue) || !paymentMethod) return;

    onSubmit({
      type,
      category,
      description,
      date: date || undefined,
      paymentMethod,
      value: numValue,
      paid: initialData?.paid || false,
      installment: type === 'installment' ? installment : undefined,
    });
  };

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      onAddCategory(newCategory);
      setCategory(newCategory);
      setNewCategory('');
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Categoria</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 mt-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nova categoria..."
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddCategory}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Descrição</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Conta de luz"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Data (opcional)</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Valor (R$)</label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>
      {type === 'installment' && (
        <div>
          <label className="text-sm font-medium mb-1.5 block">Parcela</label>
          <Input
            value={installment}
            onChange={(e) => setInstallment(e.target.value)}
            placeholder="Ex: 2/10"
          />
        </div>
      )}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Forma de Pagamento</label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSubmit} className="w-full bg-expense hover:bg-expense/90 text-expense-foreground">
        {initialData ? 'Salvar' : 'Adicionar'}
      </Button>
    </div>
  );
};

const ExpenseItem = ({
  expense,
  onUpdate,
  onDelete,
  onEdit,
}: {
  expense: Expense;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}) => (
  <div
    className={`flex items-center justify-between p-3 rounded-lg group transition-colors ${
      expense.paid ? 'bg-muted/50' : 'bg-secondary/50 hover:bg-secondary'
    }`}
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Checkbox
        checked={expense.paid}
        onCheckedChange={(checked) => onUpdate(expense.id, { paid: !!checked })}
      />
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${expense.paid ? 'line-through text-muted-foreground' : ''}`}>
          {expense.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">{expense.category}</Badge>
          <span className="text-xs text-muted-foreground">{expense.paymentMethod}</span>
          {expense.installment && (
            <Badge variant="secondary" className="text-xs">
              {expense.installment}
            </Badge>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 ml-3">
      <span className={`font-semibold whitespace-nowrap ${expense.paid ? 'text-muted-foreground' : 'text-expense'}`}>
        {formatCurrency(expense.value)}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(expense)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => onDelete(expense.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
);

export const ExpenseSection = ({
  expenses,
  categories,
  paymentMethods,
  onAdd,
  onUpdate,
  onDelete,
  onAddCategory,
}: ExpenseSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Expense['type']>('fixed');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

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

  const total = expenses.reduce((sum, e) => sum + e.value, 0);

  const renderExpenseList = (list: Expense[], emptyMessage: string) => (
    list.length === 0 ? (
      <p className="text-muted-foreground text-sm text-center py-4">
        {emptyMessage}
      </p>
    ) : (
      <div className="space-y-2">
        {list.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>
    )
  );

  return (
    <div className="bg-card rounded-xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-expense rounded-full" />
          <h3 className="text-lg font-semibold">Gastos</h3>
          <span className="text-sm text-muted-foreground">
            ({formatCurrency(total)})
          </span>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingExpense(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-expense hover:bg-expense/90 text-expense-foreground">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Editar Gasto' : 'Novo Gasto'}
              </DialogTitle>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Expense['type'])}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="fixed">Fixo</TabsTrigger>
                <TabsTrigger value="variable">Variável</TabsTrigger>
                <TabsTrigger value="installment">Parcelado</TabsTrigger>
              </TabsList>
              {(['fixed', 'variable', 'installment'] as const).map((type) => (
                <TabsContent key={type} value={type}>
                  <ExpenseForm
                    type={type}
                    categories={categories}
                    paymentMethods={paymentMethods}
                    onSubmit={handleSubmit}
                    initialData={editingExpense?.type === type ? editingExpense : undefined}
                    onAddCategory={onAddCategory}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            Gastos Fixos
            <span className="text-xs">({formatCurrency(fixedExpenses.reduce((s, e) => s + e.value, 0))})</span>
          </h4>
          {renderExpenseList(fixedExpenses, 'Nenhum gasto fixo')}
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            Gastos Variáveis
            <span className="text-xs">({formatCurrency(variableExpenses.reduce((s, e) => s + e.value, 0))})</span>
          </h4>
          {renderExpenseList(variableExpenses, 'Nenhum gasto variável')}
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            Gastos Parcelados
            <span className="text-xs">({formatCurrency(installmentExpenses.reduce((s, e) => s + e.value, 0))})</span>
          </h4>
          {renderExpenseList(installmentExpenses, 'Nenhum gasto parcelado')}
        </div>
      </div>
    </div>
  );
};
