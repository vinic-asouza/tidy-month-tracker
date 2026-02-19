import { useMemo } from 'react';
import { ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BarChart3, Loader2 } from 'lucide-react';
import { MonthData, FinanceSettings, CreditCard } from '@/types/finance';
import { FinancialRuleSection } from './FinancialRuleSection';

interface StatisticsProps {
  yearData: MonthData[];
  currentYear: number;
  monthData: MonthData;
  settings: FinanceSettings;
  creditCards: CreditCard[];
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const Statistics = ({ yearData, currentYear, monthData, settings, creditCards, isLoading = false }: StatisticsProps) => {
  // Função auxiliar para calcular gastos pagos considerando cartões de crédito
  const calculatePaidExpenses = (month: MonthData) => {
    return month.expenses.reduce((sum, expense) => {
      // Verifica se o gasto está vinculado a um cartão de crédito
      const linkedCard = creditCards.find(c => c.name === expense.paymentMethod);
      if (linkedCard && month.cardMonthlyStatuses) {
        // Se vinculado a um cartão, usa o status do cartão para o mês
        const cardPaid = month.cardMonthlyStatuses[linkedCard.id] || false;
        return cardPaid ? sum + expense.value : sum;
      }
      // Caso contrário, usa o status próprio do gasto
      return expense.paid ? sum + expense.value : sum;
    }, 0);
  };

  const yearStats = useMemo(() => {
    const totals = yearData.reduce(
      (acc, month) => ({
        income: acc.income + month.incomes.filter(i => i.received).reduce((s, i) => s + i.value, 0),
        expenses: acc.expenses + calculatePaidExpenses(month),
        investments: acc.investments + month.investments.filter(i => i.invested).reduce((s, i) => s + i.value, 0),
      }),
      { income: 0, expenses: 0, investments: 0 }
    );

    const monthlyData = yearData.map((month, index) => ({
      name: MONTH_NAMES[index],
      Entradas: month.incomes.filter(i => i.received).reduce((s, i) => s + i.value, 0),
      Gastos: calculatePaidExpenses(month),
      Investimentos: month.investments.filter(i => i.invested).reduce((s, i) => s + i.value, 0),
    }));

    return { totals, monthlyData };
  }, [yearData, creditCards]);

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

  return (
    <div className="space-y-6">
      {/* Financial Rule Section */}
      <FinancialRuleSection monthData={monthData} settings={settings} />

      {/* Year Summary */}
      <div className="bg-card rounded-2xl p-6 card-shadow">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl gradient-primary shadow-glow">
                <BarChart3 className="h-4 w-4 text-white dark:text-black" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold tracking-tight">Resumo Anual</h3>
                <p className="text-sm text-muted-foreground">{currentYear}</p>
              </div>
            </div>
            
            {/* Informativo discreto */}
            <p className="text-xs text-muted-foreground/70 mb-6 italic">
              Considera apenas itens marcados como recebido, pago ou investido
            </p>
            
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
          </>
        )}
      </div>
    </div>
  );
};
