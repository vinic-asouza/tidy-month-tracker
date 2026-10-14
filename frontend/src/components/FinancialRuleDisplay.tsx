/**
 * Componente de Exibição da Regra Financeira
 * 
 * Exibe comparação percentual e valores monetários baseados na renda
 */

import { useMemo } from 'react';
import { AlertTriangle, Smile, Frown, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { FinancialRule, MonthData, FinancialRuleStats, CreditCard } from '@/types/domain';
import { calculateFinancialRuleStatsByMode } from '@/utils/financialRuleCalculations';
import type { SummaryViewMode } from '@/utils/business/monthTotals';
import { getResgateInflowFromIncomes } from '@/utils/business/monthTotals';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface FinancialRuleDisplayProps {
  rule: FinancialRule;
  monthData?: MonthData;
  creditCards?: CreditCard[];
  stats?: FinancialRuleStats;
  /** Totais dos 12 meses. Só a visão Anual envia. */
  yearStats?: FinancialRuleStats;
  /** Resgates da visão Anual: média da janela e total do ano. */
  resgateHint?: { average: number | null; total: number };
  viewMode?: SummaryViewMode;
  onEditMapping?: () => void;
  emptyStateMessage?: string;
}

function AnnualFigure({
  caption,
  average,
  total,
}: {
  caption: string;
  average: number | null;
  total: number;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{caption}</p>
        <p className="text-lg font-semibold tabular-nums leading-tight text-foreground">
          {average == null ? '—' : formatCurrency(average)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">No ano</p>
        <p className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(total)}</p>
      </div>
    </div>
  );
}

const DEFAULT_EMPTY_MESSAGES: Record<SummaryViewMode, string> = {
  effective: 'Marque suas entradas como recebidas para calcular os percentuais da regra.',
  planned: 'Registre entradas para calcular os percentuais planejados.',
};

export const FinancialRuleDisplay = ({
  rule,
  monthData,
  creditCards = [],
  stats: statsProp,
  yearStats,
  resgateHint,
  viewMode = 'effective',
  onEditMapping,
  emptyStateMessage,
}: FinancialRuleDisplayProps) => {
  const resolvedEmptyMessage =
    emptyStateMessage ?? DEFAULT_EMPTY_MESSAGES[viewMode];

  const stats = useMemo(() => {
    if (statsProp) return statsProp;
    if (!monthData) return null;
    return calculateFinancialRuleStatsByMode(
      viewMode,
      rule,
      monthData,
      creditCards,
      monthData.cardMonthlyStatuses
    );
  }, [statsProp, viewMode, rule, monthData, creditCards]);

  if (!stats && !yearStats) {
    throw new Error('FinancialRuleDisplay requires monthData when stats is not provided');
  }

  const CategoryAlerts = ({
    differencePercent,
    kind,
  }: {
    differencePercent: number;
    kind: 'expense' | 'investment';
  }) => {
    if (kind === 'expense' && differencePercent > 0) {
      return (
        <Badge
          variant="outline"
          className="h-6 px-2 rounded-full border-none bg-expense-light text-expense text-[10px] sm:text-[11px] font-medium gap-1 w-fit"
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span className="whitespace-nowrap">
            {differencePercent.toFixed(1)}% acima do limite
          </span>
        </Badge>
      );
    }

    if (kind === 'investment' && differencePercent < 0) {
      return (
        <Badge
          variant="outline"
          className="h-6 px-2 rounded-full border-none bg-investment-light text-investment text-[10px] sm:text-[11px] font-medium gap-1 w-fit"
        >
          <Frown className="h-3 w-3 shrink-0" />
          <span className="whitespace-nowrap">
            Faltam {Math.abs(differencePercent).toFixed(1)}% para meta
          </span>
        </Badge>
      );
    }

    if (kind === 'investment' && differencePercent > 0) {
      return (
        <Badge
          variant="outline"
          className="h-6 px-2 rounded-full border-none bg-investment-light text-investment text-[10px] sm:text-[11px] font-medium gap-1 w-fit"
        >
          <Smile className="h-3 w-3 shrink-0" />
          <span className="whitespace-nowrap">
            {differencePercent.toFixed(1)}% acima da meta
          </span>
        </Badge>
      );
    }

    return null;
  };

  // Componente de barra de progresso
  const ProgressBar = ({
    current,
    target,
    label,
    color,
    differencePercent,
    kind,
  }: {
    current: number;
    target: number;
    label: string;
    color: 'expense' | 'income' | 'investment';
    differencePercent: number;
    kind: 'expense' | 'investment';
  }) => {
    const percentage = Math.max(0, Math.min(100, current));
    const targetPercentage = Math.max(0, Math.min(100, target));
    const visualPercentage = percentage === 0 ? 0 : Math.max(6, Math.min(percentage, 100));
    const visualTargetPercentage =
      targetPercentage === 0 ? 0 : Math.max(6, Math.min(targetPercentage, 100));
    const isOverTarget = percentage > targetPercentage;

    const colorClasses = {
      expense: 'gradient-expense',
      income: 'gradient-income',
      investment: 'gradient-investment',
    };

    // Cor para excesso de investimentos (azul escuro)
    const investmentExcessColor = 'bg-[hsl(220_70%_45%)]';

    // Barra de Limite: cinza levemente mais escuro (uniforme para todos)
    const metaBarColor = 'bg-muted/100';

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          <Badge
            variant="outline"
            className="h-6 px-2 rounded-full border-none bg-muted text-muted-foreground text-[10px] sm:text-[11px] font-semibold tabular-nums w-fit"
          >
            {target.toFixed(1)}%
          </Badge>
          <CategoryAlerts differencePercent={differencePercent} kind={kind} />
        </div>
        <div className="relative h-7 sm:h-7 rounded-md bg-muted/30 overflow-hidden">
          {/* Barra da Limite (atrás) */}
          {targetPercentage <= 100 && (
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-md transition-all duration-500',
                metaBarColor
              )}
              style={{ width: `${visualTargetPercentage}%` }}
            />
          )}
          {/* Barra de progresso atual (na frente) */}
          {/* Para Essenciais e Estilo de Vida: se passar da Limite, segmentar (verde até Limite, vermelho do excesso) */}
          {/* Para Investimentos: se passar da Limite, segmentar (cor normal até Limite, azul escuro do excesso) */}
          {((color === 'expense' || color === 'investment') && isOverTarget && targetPercentage > 0) ? (
            <>
              {/* Parte até a Limite */}
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-l-md transition-all duration-500 z-10',
                  color === 'expense' ? colorClasses.income : colorClasses.investment
                )}
                style={{ width: `${visualTargetPercentage}%` }}
              />
              {/* Parte do excesso */}
              <div
                className={cn(
                  'absolute inset-y-0 rounded-r-md transition-all duration-500 z-10',
                  color === 'expense' ? colorClasses.expense : investmentExcessColor
                )}
                style={{
                  left: `${visualTargetPercentage}%`,
                  width: `${Math.max(0, visualPercentage - visualTargetPercentage)}%`,
                }}
              />
            </>
          ) : (
            /* Comportamento padrão: barra única */
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-md transition-all duration-500 z-10',
                // Para Essenciais e Estilo de Vida (color === 'expense'): sempre verde quando não passa da Limite
                color === 'expense' && !isOverTarget
                  ? colorClasses.income
                  : // Para Investimentos: sempre cor normal quando não passa da Limite
                    color === 'investment' && !isOverTarget
                    ? colorClasses.investment
                    : // Para outros casos que passam da Limite: vermelho
                      isOverTarget
                      ? colorClasses.expense
                      : // Comportamento padrão baseado na cor
                        colorClasses[color]
              )}
              style={{ width: `${visualPercentage}%` }}
            />
          )}

          {/* Porcentagem atual na ponta da barra */}
          {visualPercentage > 6 && (
            <div
              className="absolute inset-y-0 left-0 z-20 flex items-center"
              style={{ width: `${visualPercentage}%` }}
            >
              <div className="ml-auto pr-2">
                <span className="text-xs font-semibold text-white whitespace-nowrap">
                  {current.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Linha de valores: limite/gasto à esquerda + tag de diferença; alertas à direita
  const ValuesLine = ({
    currentValue,
    targetValue,
    differenceValue,
    kind,
  }: {
    currentValue: number;
    targetValue: number;
    differenceValue: number;
    kind: 'expense' | 'investment';
  }) => {
    const limitLabel = kind === 'investment' ? 'Meta' : 'Limite';
    const spentLabel = kind === 'investment' ? 'Valor investido' : 'Valor gasto';

    let displayText: string | null = null;
    let badgeClass: string | null = null;

    if (kind === 'expense') {
      const delta = currentValue - targetValue;
      const deltaAbs = Math.abs(delta);

      if (deltaAbs > 0) {
        const isOverLimit = delta > 0;
        displayText = `${isOverLimit ? '+' : '-'}${formatCurrency(deltaAbs)}`;
        badgeClass = isOverLimit
          ? 'border-none bg-expense-light text-expense'
          : 'border-none bg-income-light text-income';
      }
    } else if (differenceValue !== 0) {
      const diffAbs = Math.abs(differenceValue);
      const isPositive = differenceValue > 0;
      displayText = `${isPositive ? '+' : '-'}${formatCurrency(diffAbs)}`;
      badgeClass = isPositive
        ? 'border-none bg-investment-light text-investment'
        : 'border-none bg-expense-light text-expense';
    }

    return (
      <div className="text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-muted-foreground min-w-0">
          <span>
            {limitLabel}:{' '}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(targetValue)}
            </span>
          </span>
          <span className="text-border hidden sm:inline" aria-hidden>
            |
          </span>
          <span>
            {spentLabel}:{' '}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(currentValue)}
            </span>
          </span>
          {displayText && badgeClass && (
            <Badge
              variant="outline"
              className={cn(
                'h-6 px-2 rounded-full text-[10px] sm:text-[11px] font-semibold tabular-nums w-fit',
                badgeClass
              )}
            >
              {displayText}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  const reading = stats ?? yearStats;
  if (!reading) {
    throw new Error('FinancialRuleDisplay requires monthData when stats is not provided');
  }

  const averageAbsent = stats == null;
  const showBars = stats != null && stats.totalIncome > 0;

  if (!showBars && !yearStats) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <Info className="h-8 w-8 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground max-w-xs">
          {resolvedEmptyMessage}
        </p>
      </div>
    );
  }

  const classifiedExpenses =
    reading.essentials.currentValue + reading.lifestyle.currentValue;
  const unclassifiedPercent =
    stats && stats.totalIncome > 0
      ? (stats.unclassifiedValue / stats.totalIncome) * 100
      : 0;
  const unclassifiedVisible =
    (stats?.unclassifiedValue ?? 0) > 0 || (yearStats?.unclassifiedValue ?? 0) > 0;
  const resgateInRuleBase = monthData ? getResgateInflowFromIncomes(monthData.incomes) : 0;

  if (yearStats) {
    const averageOf = (value: number) => (averageAbsent ? null : value);
    const buckets = [
      {
        key: 'essentials' as const,
        label: 'Essenciais',
        kind: 'expense' as const,
        color: 'expense' as const,
        caption: 'Gasto',
        limitLabel: 'Limite',
      },
      {
        key: 'lifestyle' as const,
        label: 'Estilo de Vida',
        kind: 'expense' as const,
        color: 'expense' as const,
        caption: 'Gasto',
        limitLabel: 'Limite',
      },
      {
        key: 'investments' as const,
        label: 'Investimentos',
        kind: 'investment' as const,
        color: 'investment' as const,
        caption: 'Aporte',
        limitLabel: 'Meta',
      },
    ];

    return (
      <div className="divide-y divide-border/60">
        {!showBars && (
          <div className="flex flex-col items-center justify-center gap-2 pb-4 text-center">
            <Info className="h-8 w-8 text-muted-foreground/60" />
            <p className="max-w-xs text-sm text-muted-foreground">{resolvedEmptyMessage}</p>
          </div>
        )}
        {viewMode === 'effective' && resgateHint && resgateHint.total > 0 && (
          <p className="pb-4 text-xs leading-relaxed text-muted-foreground">
            Resgates na renda: média {resgateHint.average == null ? '—' : formatCurrency(resgateHint.average)}, no ano{' '}
            {formatCurrency(resgateHint.total)}. Isso dilui os percentuais.
          </p>
        )}
        {buckets.map((bucket) => {
          const averageBucket = reading[bucket.key];
          const yearBucket = yearStats[bucket.key];
          return (
            <div key={bucket.key} className="space-y-3 py-4 first:pt-0 last:pb-0">
              {showBars && stats ? (
                <ProgressBar
                  current={stats[bucket.key].current}
                  target={stats[bucket.key].target}
                  label={bucket.label}
                  color={bucket.color}
                  differencePercent={stats[bucket.key].difference}
                  kind={bucket.kind}
                />
              ) : (
                <p className="text-sm font-medium">{bucket.label}</p>
              )}
              <AnnualFigure
                caption={bucket.caption}
                average={averageOf(averageBucket.currentValue)}
                total={yearBucket.currentValue}
              />
              <p className="text-sm text-muted-foreground">
                {bucket.limitLabel}{' '}
                {averageOf(averageBucket.targetValue) == null
                  ? '—'
                  : formatCurrency(averageBucket.targetValue)}{' '}
                na média · {formatCurrency(yearBucket.targetValue)} no ano
              </p>
            </div>
          );
        })}
        {unclassifiedVisible && (
          <div className="space-y-3 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Não classificado</p>
                {showBars && (
                  <Badge
                    variant="outline"
                    className="h-6 rounded-full border-none bg-muted px-2 text-[10px] font-semibold tabular-nums text-muted-foreground sm:text-[11px]"
                  >
                    {unclassifiedPercent.toFixed(1)}%
                  </Badge>
                )}
              </div>
              {onEditMapping && (
                <Button variant="outline" size="sm" className="h-8" onClick={onEditMapping}>
                  Mapear
                </Button>
              )}
            </div>
            <AnnualFigure
              caption="Gasto"
              average={averageOf(reading.unclassifiedValue)}
              total={yearStats.unclassifiedValue}
            />
          </div>
        )}
      </div>
    );
  }

  if (!stats) {
    throw new Error('FinancialRuleDisplay requires monthData when stats is not provided');
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {viewMode === 'effective' && resgateInRuleBase > 0 && (
        <p className="text-xs text-muted-foreground">
          Inclui {formatCurrency(resgateInRuleBase)} em resgates na base da renda — dilui os
          percentuais em relação à renda ganha.
        </p>
      )}
      {stats.unclassifiedValue > 0 && (
        <Alert variant="destructive" className="py-2.5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>
              {formatCurrency(stats.unclassifiedValue)} em categorias ainda não mapeadas — toque para
              classificar.
            </span>
            {onEditMapping && (
              <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={onEditMapping}>
                Mapear categorias
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-2.5 sm:space-y-3">
        <ProgressBar
          current={stats.essentials.current}
          target={stats.essentials.target}
          label="Essenciais"
          color="expense"
          differencePercent={stats.essentials.difference}
          kind="expense"
        />
        <ValuesLine
          currentValue={stats.essentials.currentValue}
          targetValue={stats.essentials.targetValue}
          differenceValue={stats.essentials.differenceValue}
          kind="expense"
        />
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        <ProgressBar
          current={stats.lifestyle.current}
          target={stats.lifestyle.target}
          label="Estilo de Vida"
          color="expense"
          differencePercent={stats.lifestyle.difference}
          kind="expense"
        />
        <ValuesLine
          currentValue={stats.lifestyle.currentValue}
          targetValue={stats.lifestyle.targetValue}
          differenceValue={stats.lifestyle.differenceValue}
          kind="expense"
        />
      </div>
      {stats.unclassifiedValue > 0 && (
        <div className="space-y-1 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Não classificado</span>
            <Badge
              variant="outline"
              className="h-6 rounded-full border-none bg-muted px-2 text-[10px] font-semibold tabular-nums text-muted-foreground sm:text-[11px]"
            >
              {unclassifiedPercent.toFixed(1)}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Valor gasto:{' '}
            <span className="font-medium tabular-nums text-foreground">
              {formatCurrency(stats.unclassifiedValue)}
            </span>
            <span className="hidden sm:inline"> — categorias ainda não mapeadas na regra</span>
          </p>
        </div>
      )}
      <div className="space-y-2.5 sm:space-y-3">
        <ProgressBar
          current={stats.investments.current}
          target={stats.investments.target}
          label="Investimentos"
          color="investment"
          differencePercent={stats.investments.difference}
          kind="investment"
        />
        <ValuesLine
          currentValue={stats.investments.currentValue}
          targetValue={stats.investments.targetValue}
          differenceValue={stats.investments.differenceValue}
          kind="investment"
        />
      </div>
      {stats.totalEffectiveExpenses > 0 && (
        <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          {viewMode === 'planned' ? 'Gastos planejados' : 'Gastos efetivados'}:{' '}
          <span className="font-medium tabular-nums text-foreground">
            {formatCurrency(stats.totalEffectiveExpenses)}
          </span>
          {' · '}
          Na regra:{' '}
          <span className="font-medium tabular-nums text-foreground">
            {formatCurrency(classifiedExpenses)}
          </span>
          {stats.unclassifiedValue > 0 && (
            <>
              {' · '}
              Não classificado:{' '}
              <span className="font-medium tabular-nums text-foreground">
                {formatCurrency(stats.unclassifiedValue)}
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
};
