import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, BarChart3, PieChartIcon } from 'lucide-react';
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

const CHART_COLORS = [
  'hsl(252, 85%, 60%)',
  'hsl(160, 84%, 39%)',
  'hsl(350, 89%, 60%)',
  'hsl(220, 92%, 60%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 70%, 55%)',
  'hsl(180, 70%, 45%)',
  'hsl(30, 90%, 55%)',
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

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
          <p className="font-semibold text-sm">{payload[0].name}</p>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ 
    title, 
    value, 
    gradient, 
    lightBg 
  }: { 
    title: string; 
    value: number; 
    gradient: string; 
    lightBg: string;
  }) => (
    <div className={`${lightBg} rounded-xl p-4 text-center`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-lg font-bold ${gradient === 'income' ? 'text-income' : gradient === 'expense' ? 'text-expense' : 'text-investment'}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );

  const ChartSection = ({ 
    title, 
    icon: Icon, 
    data, 
    total, 
    colorClass 
  }: { 
    title: string; 
    icon: typeof TrendingUp;
    data: Array<{ name: string; value: number }>;
    total: number;
    colorClass: string;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${colorClass}`} />
        <h4 className="font-semibold">{title}</h4>
        <span className="text-sm text-muted-foreground">({formatCurrency(total)})</span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Year Summary */}
      <Collapsible open={isYearOpen} onOpenChange={setIsYearOpen}>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl gradient-primary shadow-glow">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold tracking-tight">Resumo Anual</h3>
                  <p className="text-sm text-muted-foreground">{currentYear}</p>
                </div>
              </div>
              <div className={`p-2 rounded-lg bg-muted group-hover:bg-accent transition-colors`}>
                {isYearOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard title="Entradas" value={yearStats.totals.income} gradient="income" lightBg="bg-income-light" />
              <StatCard title="Gastos" value={yearStats.totals.expenses} gradient="expense" lightBg="bg-expense-light" />
              <StatCard title="Investido" value={yearStats.totals.investments} gradient="investment" lightBg="bg-investment-light" />
            </div>
            
            {/* Bar Chart */}
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearStats.monthlyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend 
                    iconType="circle"
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                  <Bar dataKey="Entradas" fill="hsl(160, 84%, 39%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gastos" fill="hsl(350, 89%, 60%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Investimentos" fill="hsl(220, 92%, 60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Monthly Statistics */}
      <Collapsible open={isMonthOpen} onOpenChange={setIsMonthOpen}>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent">
                  <PieChartIcon className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold tracking-tight">Estatísticas do Mês</h3>
                  <p className="text-sm text-muted-foreground">Distribuição detalhada</p>
                </div>
              </div>
              <div className={`p-2 rounded-lg bg-muted group-hover:bg-accent transition-colors`}>
                {isMonthOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-6 space-y-8">
            {/* Income Stats */}
            {totalIncome > 0 && (
              <ChartSection
                title="Entradas"
                icon={TrendingUp}
                data={incomeByTag}
                total={totalIncome}
                colorClass="text-income"
              />
            )}

            {/* Investment Stats */}
            {totalInvestments > 0 && (
              <ChartSection
                title="Investimentos"
                icon={TrendingUp}
                data={investmentByTag}
                total={totalInvestments}
                colorClass="text-investment"
              />
            )}

            {/* Expense Stats */}
            {totalExpenses > 0 && (
              <div className="space-y-8">
                {/* By Category */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-expense" />
                    <h4 className="font-semibold">Gastos por Categoria</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {expenseByCategory.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            formatter={(value) => <span className="text-sm">{value}</span>}
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {expenseByCategory.map((cat, index) => (
                        <div key={cat.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{cat.name}</span>
                          </div>
                          <span className="font-bold text-sm">{formatCurrency(cat.value)}</span>
                        </div>
                      ))}
                      {expenseByCategory.length > 0 && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <ArrowUpCircle className="h-4 w-4 text-expense" />
                            <span>Maior gasto: <strong>{expenseByCategory[0].name}</strong></span>
                          </div>
                          {expenseByCategory.length > 1 && (
                            <div className="flex items-center gap-2 text-sm">
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
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-expense" />
                    <h4 className="font-semibold">Gastos por Forma de Pagamento</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseByPayment}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {expenseByPayment.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            formatter={(value) => <span className="text-sm">{value}</span>}
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {expenseByPayment.map((pay, index) => (
                        <div key={pay.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{pay.name}</span>
                          </div>
                          <span className="font-bold text-sm">{formatCurrency(pay.value)}</span>
                        </div>
                      ))}
                      {expenseByPayment.length > 0 && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <ArrowUpCircle className="h-4 w-4 text-expense" />
                            <span>Mais usado: <strong>{expenseByPayment[0].name}</strong></span>
                          </div>
                          {expenseByPayment.length > 1 && (
                            <div className="flex items-center gap-2 text-sm">
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
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-4">
                  <PieChartIcon className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Adicione dados para ver as estatísticas
                </p>
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};
