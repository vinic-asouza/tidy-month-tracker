/**
 * Bloco de regra financeira na visão anual.
 * Total soma os 12 meses. Média usa a janela já calculada pelo resumo.
 */

import { useState, useMemo } from 'react';
import { Settings, Loader2, AlertCircle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionSurface } from '@/components/layout/SectionSurface';
import { SummaryTotalsLegend } from '@/components/layout/SummaryTotalsLegend';
import { FinancialRuleSetup } from './FinancialRuleSetup';
import { FinancialRuleDisplay } from './FinancialRuleDisplay';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { useFinancialRule } from '@/hooks/useFinancialRule';
import { formatCurrency } from '@/lib/utils';
import { sliceYearMonths } from '@/utils/business/annualAverage';
import {
  calculateAnnualFinancialRuleStatsByMode,
  resolveAnnualRuleMoney,
} from '@/utils/financialRuleCalculations';
import {
  getResgateInflowFromIncomes,
  isExpenseEffectivelyPaid,
  type SummaryViewMode,
} from '@/utils/business/monthTotals';
import type {
  MonthData,
  FinanceSettings,
  CreateFinancialRuleInput,
  CreditCard,
} from '@/types/domain';

function sumUnmappedExpenses(
  months: MonthData[],
  categories: string[],
  isPlanned: boolean,
  creditCards: CreditCard[]
) {
  return months.reduce((yearSum, monthData) => {
    const monthTotal = monthData.expenses
      .filter((expense) => categories.includes(expense.category))
      .filter(
        (expense) =>
          isPlanned ||
          isExpenseEffectivelyPaid(expense, creditCards, monthData.cardMonthlyStatuses)
      )
      .reduce((sum, expense) => sum + expense.value, 0);
    return yearSum + monthTotal;
  }, 0);
}

interface AnnualFinancialRuleSectionProps {
  currentYear: number;
  yearData: MonthData[];
  settings: FinanceSettings;
  creditCards: CreditCard[];
  viewMode?: SummaryViewMode;
  averageMonthCount: number;
  /** Meses da janela com entrada, gasto ou investimento no modo ativo. */
  activeMonthCount: number;
  averageWindowLabel: string;
}

export const AnnualFinancialRuleSection = ({
  currentYear,
  yearData,
  settings,
  creditCards,
  viewMode = 'effective',
  averageMonthCount,
  activeMonthCount,
  averageWindowLabel,
}: AnnualFinancialRuleSectionProps) => {
  const { rule, loading, createRule, updateRule, deleteRule } = useFinancialRule();
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [resetRuleOpen, setResetRuleOpen] = useState(false);
  const isPlanned = viewMode === 'planned';
  const windowMonths = useMemo(
    () => sliceYearMonths(yearData, averageMonthCount),
    [yearData, averageMonthCount]
  );

  const ruleFigures = useMemo(() => {
    if (!rule || yearData.length === 0) return null;
    const year = calculateAnnualFinancialRuleStatsByMode(viewMode, rule, yearData, creditCards);
    const windowStats = calculateAnnualFinancialRuleStatsByMode(
      viewMode,
      rule,
      windowMonths,
      creditCards
    );
    return resolveAnnualRuleMoney(year, windowStats, averageMonthCount, activeMonthCount);
  }, [rule, yearData, windowMonths, creditCards, viewMode, averageMonthCount, activeMonthCount]);

  const unmappedCategories = useMemo(() => {
    if (!rule || !settings.expenseCategories) return [];
    const mappedCategories = Object.keys(rule.categoryMapping || {});
    return settings.expenseCategories.filter((cat) => !mappedCategories.includes(cat));
  }, [rule, settings.expenseCategories]);

  const hasUnmappedCategories = unmappedCategories.length > 0;

  const unmappedYearTotal = useMemo(
    () =>
      hasUnmappedCategories
        ? sumUnmappedExpenses(yearData, unmappedCategories, isPlanned, creditCards)
        : 0,
    [yearData, unmappedCategories, hasUnmappedCategories, isPlanned, creditCards]
  );
  const unmappedAverage = useMemo(() => {
    if (!hasUnmappedCategories || activeMonthCount <= 0) return null;
    return (
      sumUnmappedExpenses(windowMonths, unmappedCategories, isPlanned, creditCards) / activeMonthCount
    );
  }, [windowMonths, unmappedCategories, hasUnmappedCategories, isPlanned, creditCards, activeMonthCount]);

  const resgateHint = useMemo(() => {
    if (viewMode !== 'effective') return null;
    const total = yearData.reduce((sum, month) => sum + getResgateInflowFromIncomes(month.incomes), 0);
    const windowSum = windowMonths.reduce(
      (sum, month) => sum + getResgateInflowFromIncomes(month.incomes),
      0
    );
    return {
      total,
      average: activeMonthCount > 0 ? windowSum / activeMonthCount : null,
    };
  }, [viewMode, yearData, windowMonths, activeMonthCount]);

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
    <>
      <SectionSurface
        title={`Regra Financeira — ${currentYear}`}
        subtitle={
          isPlanned
            ? `${averageWindowLabel}. O número grande é a média. O da direita soma os 12 meses registrados.`
            : `${averageWindowLabel}. O número grande é a média. O da direita soma os 12 meses efetivados.`
        }
        icon={Scale}
      >
        <SummaryTotalsLegend mode={viewMode} className="mb-4" />

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !rule ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Configure sua regra para acompanhar como seus gastos e investimentos se
                distribuem ao longo do ano.
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
                      {unmappedYearTotal > 0 &&
                        ` — média ${
                          unmappedAverage == null ? '—' : formatCurrency(unmappedAverage)
                        } (total ${formatCurrency(unmappedYearTotal)})`}
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

            {ruleFigures && (
              <FinancialRuleDisplay
                rule={rule}
                stats={ruleFigures.average ?? undefined}
                yearStats={ruleFigures.year}
                resgateHint={resgateHint ?? undefined}
                viewMode={viewMode}
                onEditMapping={handleEdit}
                emptyStateMessage={
                  ruleFigures.average
                    ? isPlanned
                      ? 'Registre lançamentos no período da média para ver as barras da regra. O total do ano continua abaixo.'
                      : 'Marque lançamentos como recebidos, pagos ou investidos no período da média para ver as barras da regra. O total do ano continua abaixo.'
                    : 'Nenhum mês com lançamentos neste período para calcular a média da regra. O total do ano continua abaixo.'
                }
              />
            )}
          </>
        )}
      </SectionSurface>

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
    </>
  );
};
