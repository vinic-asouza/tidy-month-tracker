/**
 * Bloco unificado de resumo do mês: métricas inline e regra financeira.
 */

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionSurface } from '@/components/layout/SectionSurface';
import { MetricTile } from '@/components/layout/MetricTile';
import { FinancialRuleSetup } from './FinancialRuleSetup';
import { FinancialRuleDisplay } from './FinancialRuleDisplay';
import { useFinancialRule } from '@/hooks/useFinancialRule';
import { formatCurrency, formatSummaryMonthTitle } from '@/lib/utils';
import type { MonthData, FinanceSettings, CreateFinancialRuleInput } from '@/types/domain';

interface MonthSummarySectionProps {
  currentMonth: string;
  monthData: MonthData;
  settings: FinanceSettings;
}

export const MonthSummarySection = ({ currentMonth, monthData, settings }: MonthSummarySectionProps) => {
  const { rule, loading, createRule, updateRule } = useFinancialRule();
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  const totalIncome = monthData.incomes.reduce((sum, i) => sum + i.value, 0);
  const totalExpenses = monthData.expenses.reduce((sum, e) => sum + e.value, 0);
  const totalInvestments = monthData.investments.reduce((sum, i) => sum + i.value, 0);
  const balance = totalIncome - totalExpenses - totalInvestments;

  const metrics = [
    { label: 'Entradas', value: formatCurrency(totalIncome), icon: TrendingUp, color: 'text-income', bg: 'bg-income-light' },
    { label: 'Gastos', value: formatCurrency(totalExpenses), icon: TrendingDown, color: 'text-expense', bg: 'bg-expense-light' },
    { label: 'Invest.', value: formatCurrency(totalInvestments), icon: PiggyBank, color: 'text-investment', bg: 'bg-investment-light' },
    {
      label: 'Saldo',
      value: `${balance >= 0 ? '+' : ''}${formatCurrency(balance)}`,
      icon: Wallet,
      color: balance >= 0 ? 'text-income' : 'text-expense',
      bg: balance >= 0 ? 'bg-income-light' : 'bg-expense-light',
    },
  ];

  const unmappedCategories = useMemo(() => {
    if (!rule || !settings.expenseCategories) return [];
    const mappedCategories = Object.keys(rule.categoryMapping || {});
    return settings.expenseCategories.filter((cat) => !mappedCategories.includes(cat));
  }, [rule, settings.expenseCategories]);

  const hasUnmappedCategories = unmappedCategories.length > 0;

  const handleComplete = async (data: CreateFinancialRuleInput) => {
    if (rule) {
      await updateRule(data);
    } else {
      await createRule(data);
    }
    setIsSetupOpen(false);
  };

  const handleEdit = () => setIsSetupOpen(true);

  return (
    <SectionSurface
      title={formatSummaryMonthTitle(currentMonth)}
      subtitle="Saldos e regra financeira"
      icon={Wallet}
    >
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(7.5rem,22%)_1fr] md:gap-5 md:items-start">
        {/* Métricas — coluna esquerda */}
        <div className="flex flex-col gap-2">
          {metrics.map(({ label, value, icon, color, bg }) => (
            <MetricTile
              key={label}
              label={label}
              value={value}
              icon={icon}
              colorClass={color}
              bgClass={bg}
              variant="compact"
            />
          ))}
        </div>

        {/* Regra Financeira — coluna direita */}
        <div className="min-w-0 md:border-l md:border-border/60 md:pl-5">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !rule ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">Regra Financeira</h3>
                <p className="text-xs text-muted-foreground">
                  Configure para acompanhar seus gastos e investimentos
                </p>
              </div>
              <Button onClick={() => setIsSetupOpen(true)} size="sm" className="gap-2 shrink-0">
                <Settings className="h-4 w-4" />
                Configurar Regra
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold tracking-tight">Regra Financeira</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {rule.isCustom
                      ? `Personalizada: ${rule.essentialsPercentage}% / ${rule.lifestylePercentage}% / ${rule.investmentsPercentage}%`
                      : 'Regra 50/30/20'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
                  {hasUnmappedCategories && (
                    <Badge
                      variant="destructive"
                      className="gap-1 cursor-pointer hover:opacity-80 transition-opacity w-fit text-xs px-2 py-0.5"
                      onClick={handleEdit}
                    >
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span className="line-clamp-2 sm:line-clamp-none">
                        {unmappedCategories.length} nova(s) categoria(s) necessita de mapeamento
                      </span>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-md hover:bg-muted w-full sm:w-auto justify-center sm:justify-start"
                    onClick={handleEdit}
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    Configurar Regra
                  </Button>
                </div>
              </div>
              <FinancialRuleDisplay rule={rule} monthData={monthData} />
            </>
          )}
        </div>
      </div>

      <FinancialRuleSetup
        open={isSetupOpen}
        onOpenChange={setIsSetupOpen}
        onComplete={handleComplete}
        categories={settings.expenseCategories}
        initialRule={rule}
        unmappedCategories={hasUnmappedCategories ? unmappedCategories : undefined}
      />
    </SectionSurface>
  );
};
