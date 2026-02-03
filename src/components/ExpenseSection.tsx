import { useState } from 'react';
import { Plus, Pencil, Trash2, TrendingDown, Receipt, Repeat, CreditCard } from 'lucide-react';
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
        <div className="flex gap-2 mt-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nova categoria..."
            className="flex-1 rounded-xl h-10"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <Button type="button" variant="outline" size="icon" onClick={handleAddCategory} className="rounded-xl h-10 w-10">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">Descrição</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Conta de luz"
          className="rounded-xl h-11"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-2 block text-muted-foreground">Data (opcional)</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl h-11"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block text-muted-foreground">Valor (R$)</label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0,00"
            className="rounded-xl h-11 text-lg font-medium"
          />
        </div>
      </div>
      {type === 'installment' && (
        <div>
          <label className="text-sm font-medium mb-2 block text-muted-foreground">Parcela</label>
          <Input
            value={installment}
            onChange={(e) => setInstallment(e.target.value)}
            placeholder="Ex: 2/10"
            className="rounded-xl h-11"
          />
        </div>
      )}
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">Forma de Pagamento</label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="rounded-xl h-11">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method} className="rounded-lg">
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
}: {
  expense: Expense;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}) => (
  <div
    className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
      expense.paid 
        ? 'bg-muted/20 opacity-60' 
        : 'bg-muted/30 hover:bg-muted/50'
    }`}
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Checkbox
        checked={expense.paid}
        onCheckedChange={(checked) => onUpdate(expense.id, { paid: !!checked })}
        className="h-5 w-5 rounded-md border-2 data-[state=checked]:bg-income data-[state=checked]:border-income"
      />
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${expense.paid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {expense.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge 
            variant="outline" 
            className="text-2xs rounded-md px-2 py-0.5 border-expense/30 text-expense bg-expense-light"
          >
            {expense.category}
          </Badge>
          <span className="text-2xs text-muted-foreground">{expense.paymentMethod}</span>
          {expense.installment && (
            <Badge 
              variant="secondary" 
              className="text-2xs rounded-md px-2 py-0.5 bg-muted"
            >
              {expense.installment}
            </Badge>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3 ml-4">
      <span className={`font-bold whitespace-nowrap text-lg ${expense.paid ? 'text-muted-foreground' : 'text-expense'}`}>
        {formatCurrency(expense.value)}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-muted"
          onClick={() => onEdit(expense)}
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-destructive/10"
          onClick={() => onDelete(expense.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
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

  const ExpenseGroup = ({ 
    title, 
    icon: Icon, 
    list, 
    emptyMessage,
    total 
  }: { 
    title: string; 
    icon: typeof Receipt;
    list: Expense[]; 
    emptyMessage: string;
    total: number;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <span className="text-sm font-semibold text-expense">{formatCurrency(total)}</span>
      </div>
      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4 bg-muted/20 rounded-xl">
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
            <p className="text-sm text-muted-foreground">
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

      {/* Expense Groups */}
      <div className="space-y-6">
        <ExpenseGroup
          title="Gastos Fixos"
          icon={Receipt}
          list={fixedExpenses}
          emptyMessage="Nenhum gasto fixo"
          total={fixedExpenses.reduce((s, e) => s + e.value, 0)}
        />
        <ExpenseGroup
          title="Gastos Variáveis"
          icon={Repeat}
          list={variableExpenses}
          emptyMessage="Nenhum gasto variável"
          total={variableExpenses.reduce((s, e) => s + e.value, 0)}
        />
        <ExpenseGroup
          title="Gastos Parcelados"
          icon={CreditCard}
          list={installmentExpenses}
          emptyMessage="Nenhum gasto parcelado"
          total={installmentExpenses.reduce((s, e) => s + e.value, 0)}
        />
      </div>
    </div>
  );
};
