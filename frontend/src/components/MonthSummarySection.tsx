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
import { EffectiveTotalsLegend } from '@/components/layout/EffectiveTotalsLegend';
import { FinancialRuleSetup } from './FinancialRuleSetup';
import { FinancialRuleDisplay } from './FinancialRuleDisplay';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { useFinancialRule } from '@/hooks/useFinancialRule';
import { formatCurrency, formatSummaryMonthTitle } from '@/lib/utils';
import { calculateEffectiveMonthTotals, isExpenseEffectivelyPaid } from '@/utils/business/monthTotals';
import type { MonthData, FinanceSettings, CreateFinancialRuleInput, CreditCard } from '@/types/domain';

interface MonthSummarySectionProps {
  currentMonth: string;
  monthData: MonthData;
  settings: FinanceSettings;
  creditCards: CreditCard[];
  cardMonthlyStatuses: Record<string, boolean>;
}

export const MonthSummarySection = ({
  currentMonth,
  monthData,
  settings,
  creditCards,
  cardMonthlyStatuses,
}: MonthSummarySectionProps) => {
  const { rule, loading, createRule, updateRule, deleteRule } = useFinancialRule();
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [resetRuleOpen, setResetRuleOpen] = useState(false);

  const { totalIncome, totalExpenses, totalInvestments, balance } = useMemo(
    () => calculateEffectiveMonthTotals(monthData, creditCards, cardMonthlyStatuses),
    [monthData, creditCards, cardMonthlyStatuses]
  );

  const enrichedMonthData = useMemo(
    () => ({ ...monthData, cardMonthlyStatuses }),
    [monthData, cardMonthlyStatuses]
  );

  const metrics = [
    { label: 'Entradas (efetiv.)', value: formatCurrency(totalIncome), icon: TrendingUp, color: 'text-income', bg: 'bg-income-light' },
    { label: 'Gastos (efetiv.)', value: formatCurrency(totalExpenses), icon: TrendingDown, color: 'text-expense', bg: 'bg-expense-light' },
    { label: 'Invest. (efetiv.)', value: formatCurrency(totalInvestments), icon: PiggyBank, color: 'text-investment', bg: 'bg-investment-light' },
    {
      label: 'Saldo (efetiv.)',
      value: `${balance >= 0 ? '+' : ''}${formatCurrency(balance)}`,
      icon: Wallet,
      color: balance >= 0 ? 'text-income' : 'text-expense',
      bg: balance >= 0 ? 'bg-income-light' : 'bg-expense-light',
      hint: balance < 0 ? 'Com base no que já entrou e saiu de fato neste mês' : undefined,
    },
  ];

  const unmappedCategories = useMemo(() => {
    if (!rule || !settings.expenseCategories) return [];
    const mappedCategories = Object.keys(rule.categoryMapping || {});
    return settings.expenseCategories.filter((cat) => !mappedCategories.includes(cat));
  }, [rule, settings.expenseCategories]);

  const hasUnmappedCategories = unmappedCategories.length > 0;

  const unmappedExpensesTotal = useMemo(() => {
    if (!hasUnmappedCategories) return 0;
    return monthData.expenses
      .filter(
        (e) =>
          unmappedCategories.includes(e.category) &&
          isExpenseEffectivelyPaid(e, creditCards, cardMonthlyStatuses)
      )
      .reduce((sum, e) => sum + e.value, 0);
  }, [monthData.expenses, unmappedCategories, hasUnmappedCategories, creditCards, cardMonthlyStatuses]);

  const handleComplete = async (data: CreateFinancialRuleInput) => {
    try {
      if (rule) {
        await updateRule(data);
      } else {
        await createRule(data);
      }
      setIsSetupOpen(false);
    } catch {
      // Toast já exibido pelo hook; mantém dialog aberto
    }
  };

  const handleEdit = () => setIsSetupOpen(true);

  const handleResetRule = async () => {
    try {
      await deleteRule();
      setResetRuleOpen(false);
    } catch {
      // toast no hook
    }
  };

  return (
    <SectionSurface
      title={formatSummaryMonthTitle(currentMonth)}
      subtitle="Saldos efetivados e regra financeira"
      icon={Wallet}
    >
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(7.5rem,22%)_1fr] md:gap-5 md:items-start">
        {/* Métricas — coluna esquerda */}
        <div className="flex flex-col gap-2">
          <EffectiveTotalsLegend />
          {metrics.map(({ label, value, icon, color, bg, hint }) => (
            <div key={label}>
              <MetricTile
                label={label}
                value={value}
                icon={icon}
                colorClass={color}
                bgClass={bg}
                variant="compact"
              />
              {hint && (
                <p className="text-[10px] text-muted-foreground px-0.5 mt-0.5">{hint}</p>
              )}
            </div>
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
                        {unmappedCategories.length} categoria(s) sem mapeamento
                        {unmappedExpensesTotal > 0 && ` — ${formatCurrency(unmappedExpensesTotal)} este mês`}
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
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs text-muted-foreground h-auto p-0 w-fit"
                    onClick={() => setResetRuleOpen(true)}
                  >
                    Redefinir regra
                  </Button>
                </div>
              </div>
              <FinancialRuleDisplay
                rule={rule}
                monthData={enrichedMonthData}
                creditCards={creditCards}
                onEditMapping={handleEdit}
              />
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

      <DeleteConfirmDialog
        open={resetRuleOpen}
        onOpenChange={setResetRuleOpen}
        onConfirm={handleResetRule}
        title="Redefinir regra financeira"
        description="Isso remove sua configuração atual. Você poderá configurar uma nova regra depois."
      />
    </SectionSurface>
  );
};
