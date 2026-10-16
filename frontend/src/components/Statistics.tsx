import { useMemo } from 'react';
import { ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AnnualExportActions } from '@/components/AnnualExportActions';
import { AnnualYearSections } from '@/components/AnnualYearSections';
import { SectionSurface } from '@/components/layout/SectionSurface';
import { SummaryTotalsLegend } from '@/components/layout/SummaryTotalsLegend';
import { SummaryViewModeToggle } from '@/components/SummaryViewModeToggle';
import { BarChart3, Loader2, BarChart2 } from 'lucide-react';
import { useFinancialRule } from '@/hooks/useFinancialRule';
import { useSummaryViewMode } from '@/hooks/useSummaryViewMode';
import {
  countActiveAverageMonths,
  formatAverageWindowLabel,
  resolveAnnualAverageWindow,
  sliceYearMonths,
} from '@/utils/business/annualAverage';
import { calculateMonthTotals } from '@/utils/business/monthTotals';
import { MonthData, CreditCard, FinanceSettings } from '@/types/finance';
import type { WishItem } from '@/types/domain';
import { AnnualFinancialRuleSection } from '@/components/AnnualFinancialRuleSection';

interface StatisticsProps {
  yearData: MonthData[];
  currentYear: number;
  creditCards: CreditCard[];
  settings: FinanceSettings;
  isLoading?: boolean;
  wishes?: WishItem[];
  wishesLoading?: boolean;
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

const SERIES_COLORS = {
  Entradas: 'hsl(160, 84%, 39%)',
  Gastos: 'hsl(350, 89%, 60%)',
  Investimentos: 'hsl(220, 92%, 60%)',
  Saldo: 'hsl(45, 93%, 47%)',
} as const;

const SALDO_POSITIVE = 'hsl(160, 84%, 39%)';
const SALDO_NEGATIVE = 'hsl(350, 89%, 60%)';

type MonthlyChartPoint = {
  name: string;
  monthIndex: number;
  Entradas: number;
  Gastos: number;
  Investimentos: number;
  Saldo: number;
};

const renderSaldoDot = (props: {
  cx?: number;
  cy?: number;
  payload?: MonthlyChartPoint;
}) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  const fill = payload.Saldo >= 0 ? SALDO_POSITIVE : SALDO_NEGATIVE;
  return <circle cx={cx} cy={cy} r={4} fill={fill} stroke={SERIES_COLORS.Saldo} strokeWidth={1} />;
};

export const Statistics = ({
  yearData,
  currentYear,
  creditCards,
  settings,
  isLoading = false,
  wishes = [],
  wishesLoading = false,
}: StatisticsProps) => {
  const { viewMode, setViewMode } = useSummaryViewMode();
  const { rule, loading: ruleLoading, createRule, updateRule, deleteRule } = useFinancialRule();
  const isPlanned = viewMode === 'planned';
  const today = useMemo(() => new Date(), []);
  const currentMonthIndex = currentYear === today.getFullYear() ? today.getMonth() : -1;
  const averageWindow = useMemo(
    () => resolveAnnualAverageWindow(currentYear, today),
    [currentYear, today]
  );

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

  const activeMonthCount = useMemo(() => {
    const signals = yearStats.monthlyData.map((month) => ({
      income: month.Entradas,
      expenses: month.Gastos,
      investments: month.Investimentos,
    }));
    return countActiveAverageMonths(signals, averageWindow.monthCount);
  }, [yearStats, averageWindow.monthCount]);
  const averageWindowLabel = useMemo(
    () => formatAverageWindowLabel(currentYear, today, activeMonthCount),
    [currentYear, today, activeMonthCount]
  );

  const averageTotals = useMemo(() => {
    if (activeMonthCount <= 0) return null;

    const windowMonths = sliceYearMonths(yearStats.monthlyData, averageWindow.monthCount);
    const sum = windowMonths.reduce(
      (acc, month) => ({
        income: acc.income + month.Entradas,
        expenses: acc.expenses + month.Gastos,
        investments: acc.investments + month.Investimentos,
        balance: acc.balance + month.Saldo,
      }),
      { income: 0, expenses: 0, investments: 0, balance: 0 }
    );

    return {
      income: sum.income / activeMonthCount,
      expenses: sum.expenses / activeMonthCount,
      investments: sum.investments / activeMonthCount,
      balance: sum.balance / activeMonthCount,
    };
  }, [yearStats, averageWindow.monthCount, activeMonthCount]);

  const hasNoData =
    yearStats.totals.income === 0 &&
    yearStats.totals.expenses === 0 &&
    yearStats.totals.investments === 0;

  const StatCard = ({
    title,
    average,
    total,
    variant,
  }: {
    title: string;
    average: number | null;
    total: number;
    variant: 'income' | 'expense' | 'investment' | 'balance';
  }) => {
    const isBalance = variant === 'balance';
    const isPositive = (average ?? 0) >= 0;
    const colorClass =
      average == null
        ? 'text-muted-foreground'
        : isBalance
          ? isPositive
            ? 'text-income'
            : 'text-expense'
          : variant === 'income'
            ? 'text-income'
            : variant === 'expense'
              ? 'text-expense'
              : 'text-investment';
    const lightBg = isBalance
      ? average == null
        ? 'bg-muted/40'
        : isPositive
          ? 'bg-income-light'
          : 'bg-expense-light'
      : variant === 'income'
        ? 'bg-income-light'
        : variant === 'expense'
          ? 'bg-expense-light'
          : 'bg-investment-light';

    return (
      <div className={`${lightBg} rounded-md p-4 text-center`}>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Média</p>
        <p className={`text-xl font-bold tabular-nums leading-tight ${colorClass}`}>
          {average == null ? (
            '—'
          ) : (
            <>
              {isBalance && isPositive ? '+' : ''}
              {formatCurrency(average)}
            </>
          )}
        </p>
        <div className="mx-auto mt-3 border-t border-foreground/10 pt-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {isBalance && total > 0 ? '+' : ''}
            {formatCurrency(total)}
          </p>
        </div>
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

  const summarySubtitle = isPlanned
    ? `${averageWindowLabel}. Abaixo de cada média, o total dos 12 meses — fluxo mensal, não saldo acumulado.`
    : `${averageWindowLabel}. Abaixo de cada média, o total dos 12 meses. Investimentos são aportes de caixa, não valorização de ativos.`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-muted-foreground">
          O modo efetivado ou planejado vale para o resumo, o gráfico, a regra e as seções de dinheiro.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <AnnualExportActions
            year={currentYear}
            mode={viewMode}
            yearData={yearData}
            creditCards={creditCards}
            rule={rule}
            expenseCategories={settings.expenseCategories}
            today={today}
            blocked={isLoading || yearData.length !== 12 || ruleLoading}
          />
          <SummaryViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      {yearData.length === 0 && isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <SectionSurface
            title={`Resumo Anual — ${currentYear}`}
            subtitle={summarySubtitle}
            icon={BarChart3}
          >
            <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <SummaryTotalsLegend mode={viewMode} className="mb-6" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard title="Entradas" average={averageTotals?.income ?? null} total={yearStats.totals.income} variant="income" />
              <StatCard title="Gastos" average={averageTotals?.expenses ?? null} total={yearStats.totals.expenses} variant="expense" />
              <StatCard title="Investimentos" average={averageTotals?.investments ?? null} total={yearStats.totals.investments} variant="investment" />
              <StatCard title="Saldo" average={averageTotals?.balance ?? null} total={yearStats.totals.balance} variant="balance" />
            </div>

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
              <div className="h-72 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearStats.monthlyData}>
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
                      <Line
                        type="monotone"
                        dataKey="Entradas"
                        stroke={SERIES_COLORS.Entradas}
                        strokeWidth={2}
                        dot={{ r: 3, fill: SERIES_COLORS.Entradas }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Gastos"
                        stroke={SERIES_COLORS.Gastos}
                        strokeWidth={2}
                        dot={{ r: 3, fill: SERIES_COLORS.Gastos }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Investimentos"
                        stroke={SERIES_COLORS.Investimentos}
                        strokeWidth={2}
                        dot={{ r: 3, fill: SERIES_COLORS.Investimentos }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Saldo"
                        stroke={SERIES_COLORS.Saldo}
                        strokeWidth={2}
                        dot={renderSaldoDot}
                        activeDot={{ r: 5, fill: SERIES_COLORS.Saldo }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
              </div>
            )}
            </div>
          </SectionSurface>

          <AnnualFinancialRuleSection
            currentYear={currentYear}
            yearData={yearData}
            settings={settings}
            creditCards={creditCards}
            viewMode={viewMode}
            averageMonthCount={averageWindow.monthCount}
            activeMonthCount={activeMonthCount}
            averageWindowLabel={averageWindowLabel}
            rule={rule}
            ruleLoading={ruleLoading}
            onCreateRule={createRule}
            onUpdateRule={updateRule}
            onDeleteRule={deleteRule}
          />

          <AnnualYearSections
            yearData={yearData}
            currentYear={currentYear}
            creditCards={creditCards}
            viewMode={viewMode}
            monthCount={averageWindow.monthCount}
            averageWindowLabel={averageWindowLabel}
            wishes={wishes}
            wishesLoading={wishesLoading}
          />
        </>
      )}
    </div>
  );
};
