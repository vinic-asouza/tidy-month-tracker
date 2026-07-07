import { useMemo } from 'react';
import { ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { SectionSurface } from '@/components/layout/SectionSurface';
import { SummaryTotalsLegend } from '@/components/layout/SummaryTotalsLegend';
import { SummaryViewModeToggle } from '@/components/SummaryViewModeToggle';
import { BarChart3, Loader2, BarChart2 } from 'lucide-react';
import { useSummaryViewMode } from '@/hooks/useSummaryViewMode';
import { calculateMonthTotals } from '@/utils/business/monthTotals';
import { MonthData, CreditCard, FinanceSettings } from '@/types/finance';
import { AnnualFinancialRuleSection } from '@/components/AnnualFinancialRuleSection';

interface StatisticsProps {
  yearData: MonthData[];
  currentYear: number;
  currentMonth: string;
  creditCards: CreditCard[];
  settings: FinanceSettings;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatAxisValue = (value: number) => {
  if (Math.abs(value) < 1000) {
    return String(Math.round(value));
  }
  return `${(value / 1000).toFixed(0)}k`;
};

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export const Statistics = ({
  yearData,
  currentYear,
  currentMonth,
  creditCards,
  settings,
  isLoading = false,
}: StatisticsProps) => {
  const { viewMode, setViewMode } = useSummaryViewMode();
  const isPlanned = viewMode === 'planned';
  const currentMonthIndex = parseInt(currentMonth.split('-')[1], 10) - 1;

  const yearStats = useMemo(() => {
    const totals = { income: 0, expenses: 0, investments: 0, balance: 0 };

    const monthlyData = yearData.map((month, index) => {
      const { totalIncome, totalExpenses, totalInvestments, balance } = calculateMonthTotals(
        viewMode,
        month,
        creditCards,
        month.cardMonthlyStatuses
      );

      totals.income += totalIncome;
      totals.expenses += totalExpenses;
      totals.investments += totalInvestments;
      totals.balance += balance;

      return {
        name: MONTH_NAMES[index],
        monthIndex: index,
        Entradas: totalIncome,
        Gastos: totalExpenses,
        Investimentos: totalInvestments,
        Saldo: balance,
      };
    });

    return { totals, monthlyData };
  }, [yearData, creditCards, viewMode]);

  const hasNoData =
    yearStats.totals.income === 0 &&
    yearStats.totals.expenses === 0 &&
    yearStats.totals.investments === 0;

  const StatCard = ({
    title,
    value,
    variant,
  }: {
    title: string;
    value: number;
    variant: 'income' | 'expense' | 'investment' | 'balance';
  }) => {
    const isBalance = variant === 'balance';
    const isPositive = value >= 0;
    const colorClass = isBalance
      ? isPositive
        ? 'text-income'
        : 'text-expense'
      : variant === 'income'
        ? 'text-income'
        : variant === 'expense'
          ? 'text-expense'
          : 'text-investment';
    const lightBg = isBalance
      ? isPositive
        ? 'bg-income-light'
        : 'bg-expense-light'
      : variant === 'income'
        ? 'bg-income-light'
        : variant === 'expense'
          ? 'bg-expense-light'
          : 'bg-investment-light';

    return (
      <div className={`${lightBg} rounded-md p-4 text-center`}>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className={`text-lg font-bold tabular-nums ${colorClass}`}>
          {isBalance && isPositive ? '+' : ''}
          {formatCurrency(value)}
        </p>
      </div>
    );
  };

  const renderXAxisTick = (props: { x: number; y: number; payload: { value: string; index: number } }) => {
    const { x, y, payload } = props;
    const isCurrent = payload.index === currentMonthIndex;
    return (
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        fill={isCurrent ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
        fontSize={isCurrent ? 13 : 12}
        fontWeight={isCurrent ? 700 : 400}
      >
        {payload.value}
      </text>
    );
  };

  return (
    <div className="space-y-5">
      <SectionSurface
        title={`Resumo Anual — ${currentYear}`}
        subtitle={
          isPlanned
            ? 'Baseado em tudo que você registrou neste ano — fluxo mensal, não patrimônio acumulado'
            : 'Fluxo efetivado do ano — investimentos são aportes de caixa, não valorização de ativos'
        }
        icon={BarChart3}
        actions={<SummaryViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />}
      >
        {yearData.length === 0 && isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <SummaryTotalsLegend mode={viewMode} className="mb-6" />

            {hasNoData ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <BarChart2 className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground max-w-sm">
                  {isPlanned
                    ? 'Registre lançamentos ao longo do ano para ver o gráfico planejado.'
                    : 'Marque lançamentos como recebidos, pagos ou investidos para ver o gráfico.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard title="Entradas" value={yearStats.totals.income} variant="income" />
                  <StatCard title="Gastos" value={yearStats.totals.expenses} variant="expense" />
                  <StatCard title="Investimentos" value={yearStats.totals.investments} variant="investment" />
                  <StatCard title="Saldo" value={yearStats.totals.balance} variant="balance" />
                </div>

                <div className="h-72 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearStats.monthlyData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={renderXAxisTick}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={formatAxisValue}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
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
                      <Bar dataKey="Saldo" radius={[6, 6, 0, 0]}>
                        {yearStats.monthlyData.map((entry, index) => (
                          <Cell
                            key={`saldo-${index}`}
                            fill={entry.Saldo >= 0 ? 'hsl(160, 84%, 39%)' : 'hsl(350, 89%, 60%)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}
      </SectionSurface>

      <AnnualFinancialRuleSection
        currentYear={currentYear}
        yearData={yearData}
        settings={settings}
        creditCards={creditCards}
        viewMode={viewMode}
      />
    </div>
  );
};
