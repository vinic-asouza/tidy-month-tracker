import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { MonthData } from '@/types/finance';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface StatisticsProps {
  monthData: MonthData;
  yearData: MonthData[];
  currentYear: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const COLORS = [
  'hsl(174, 62%, 40%)',
  'hsl(217, 72%, 53%)',
  'hsl(152, 60%, 42%)',
  'hsl(4, 72%, 56%)',
  'hsl(45, 93%, 47%)',
  'hsl(280, 60%, 50%)',
  'hsl(330, 60%, 50%)',
  'hsl(200, 60%, 50%)',
];

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const Statistics = ({ monthData, yearData, currentYear }: StatisticsProps) => {
  const [isYearOpen, setIsYearOpen] = useState(true);
  const [isMonthOpen, setIsMonthOpen] = useState(true);

  const yearStats = useMemo(() => {
    const totals = yearData.reduce(
      (acc, month) => ({
        income: acc.income + month.incomes.reduce((s, i) => s + i.value, 0),
        expenses: acc.expenses + month.expenses.reduce((s, e) => s + e.value, 0),
        investments: acc.investments + month.investments.reduce((s, i) => s + i.value, 0),
      }),
      { income: 0, expenses: 0, investments: 0 }
    );

    const monthlyData = yearData.map((month, index) => ({
      name: MONTH_NAMES[index],
      Entradas: month.incomes.reduce((s, i) => s + i.value, 0),
      Gastos: month.expenses.reduce((s, e) => s + e.value, 0),
      Investimentos: month.investments.reduce((s, i) => s + i.value, 0),
    }));

    return { totals, monthlyData };
  }, [yearData]);

  const incomeByTag = useMemo(() => {
    const tagMap = new Map<string, number>();
    monthData.incomes.forEach((income) => {
      income.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + income.value);
      });
      if (income.tags.length === 0) {
        tagMap.set('Sem tag', (tagMap.get('Sem tag') || 0) + income.value);
      }
    });
    return Array.from(tagMap.entries()).map(([name, value]) => ({ name, value }));
  }, [monthData.incomes]);

  const investmentByTag = useMemo(() => {
    const tagMap = new Map<string, number>();
    monthData.investments.forEach((inv) => {
      inv.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + inv.value);
      });
      if (inv.tags.length === 0) {
        tagMap.set('Sem tag', (tagMap.get('Sem tag') || 0) + inv.value);
      }
    });
    return Array.from(tagMap.entries()).map(([name, value]) => ({ name, value }));
  }, [monthData.investments]);

  const expenseByCategory = useMemo(() => {
    const catMap = new Map<string, number>();
    monthData.expenses.forEach((exp) => {
      catMap.set(exp.category, (catMap.get(exp.category) || 0) + exp.value);
    });
    const data = Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return data;
  }, [monthData.expenses]);

  const expenseByPayment = useMemo(() => {
    const payMap = new Map<string, number>();
    monthData.expenses.forEach((exp) => {
      payMap.set(exp.paymentMethod, (payMap.get(exp.paymentMethod) || 0) + exp.value);
    });
    const data = Array.from(payMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return data;
  }, [monthData.expenses]);

  const totalIncome = monthData.incomes.reduce((s, i) => s + i.value, 0);
  const totalExpenses = monthData.expenses.reduce((s, e) => s + e.value, 0);
  const totalInvestments = monthData.investments.reduce((s, i) => s + i.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Year Summary */}
      <Collapsible open={isYearOpen} onOpenChange={setIsYearOpen}>
        <div className="bg-card rounded-xl p-5 card-shadow">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent">
              <h3 className="text-lg font-semibold">Resumo Anual - {currentYear}</h3>
              {isYearOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-income-light rounded-lg">
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="text-lg font-bold text-income">{formatCurrency(yearStats.totals.income)}</p>
              </div>
              <div className="text-center p-3 bg-expense-light rounded-lg">
                <p className="text-sm text-muted-foreground">Total Gastos</p>
                <p className="text-lg font-bold text-expense">{formatCurrency(yearStats.totals.expenses)}</p>
              </div>
              <div className="text-center p-3 bg-investment-light rounded-lg">
                <p className="text-sm text-muted-foreground">Total Investido</p>
                <p className="text-lg font-bold text-investment">{formatCurrency(yearStats.totals.investments)}</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearStats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Entradas" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastos" fill="hsl(4, 72%, 56%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Investimentos" fill="hsl(217, 72%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Monthly Statistics */}
      <Collapsible open={isMonthOpen} onOpenChange={setIsMonthOpen}>
        <div className="bg-card rounded-xl p-5 card-shadow">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent">
              <h3 className="text-lg font-semibold">Estatísticas do Mês</h3>
              {isMonthOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-6">
            {/* Income Stats */}
            {totalIncome > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-income" />
                  <h4 className="font-medium">Entradas</h4>
                  <span className="text-sm text-muted-foreground">({formatCurrency(totalIncome)})</span>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeByTag}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {incomeByTag.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Investment Stats */}
            {totalInvestments > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-investment" />
                  <h4 className="font-medium">Investimentos</h4>
                  <span className="text-sm text-muted-foreground">({formatCurrency(totalInvestments)})</span>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={investmentByTag}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {investmentByTag.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Expense Stats */}
            {totalExpenses > 0 && (
              <div className="space-y-6">
                {/* By Category */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-5 w-5 text-expense" />
                    <h4 className="font-medium">Gastos por Categoria</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {expenseByCategory.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {expenseByCategory.map((cat, index) => (
                        <div key={cat.name} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm">{cat.name}</span>
                          </div>
                          <span className="font-medium text-sm">{formatCurrency(cat.value)}</span>
                        </div>
                      ))}
                      {expenseByCategory.length > 0 && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <ArrowUpCircle className="h-4 w-4 text-expense" />
                            <span>Maior gasto: <strong>{expenseByCategory[0].name}</strong></span>
                          </div>
                          {expenseByCategory.length > 1 && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <ArrowDownCircle className="h-4 w-4 text-income" />
                              <span>Menor gasto: <strong>{expenseByCategory[expenseByCategory.length - 1].name}</strong></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* By Payment Method */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-5 w-5 text-expense" />
                    <h4 className="font-medium">Gastos por Forma de Pagamento</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseByPayment}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {expenseByPayment.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {expenseByPayment.map((pay, index) => (
                        <div key={pay.name} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm">{pay.name}</span>
                          </div>
                          <span className="font-medium text-sm">{formatCurrency(pay.value)}</span>
                        </div>
                      ))}
                      {expenseByPayment.length > 0 && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <ArrowUpCircle className="h-4 w-4 text-expense" />
                            <span>Mais usado: <strong>{expenseByPayment[0].name}</strong></span>
                          </div>
                          {expenseByPayment.length > 1 && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <ArrowDownCircle className="h-4 w-4 text-income" />
                              <span>Menos usado: <strong>{expenseByPayment[expenseByPayment.length - 1].name}</strong></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {totalIncome === 0 && totalExpenses === 0 && totalInvestments === 0 && (
              <p className="text-muted-foreground text-center py-6">
                Adicione dados para ver as estatísticas
              </p>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};
