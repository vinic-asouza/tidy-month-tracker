/**
 * Componente de Exibição da Regra Financeira
 * 
 * Exibe comparação percentual e valores monetários baseados na renda
 */

import { useMemo } from 'react';
import { AlertTriangle, Smile, Frown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { FinancialRule, MonthData, FinancialRuleStats } from '@/types/domain';
import { calculateFinancialRuleStats } from '@/utils/financialRuleCalculations';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FinancialRuleDisplayProps {
  rule: FinancialRule;
  monthData: MonthData;
}

export const FinancialRuleDisplay = ({ rule, monthData }: FinancialRuleDisplayProps) => {
  const stats = useMemo(() => calculateFinancialRuleStats(rule, monthData), [rule, monthData]);

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

  return (
    <div className="space-y-5 sm:space-y-6">
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
    </div>
  );
};
