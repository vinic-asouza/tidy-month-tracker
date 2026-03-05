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

  // Calcular renda total
  const totalIncome = monthData.incomes.reduce((sum, income) => sum + income.value, 0);

  // Componente de barra de progresso
  const ProgressBar = ({
    current,
    target,
    label,
    color,
  }: {
    current: number;
    target: number;
    label: string;
    color: 'expense' | 'income' | 'investment';
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
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground text-xs sm:text-sm tabular-nums">
            {color === 'investment' ? 'Meta' : 'Limite'}: {target.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-7 sm:h-8 rounded-xl bg-muted/30 overflow-visible">
          {/* Barra da Limite (atrás) */}
          {targetPercentage <= 100 && (
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-xl transition-all duration-500',
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
                  'absolute inset-y-0 left-0 rounded-l-xl transition-all duration-500 z-10',
                  color === 'expense' ? colorClasses.income : colorClasses.investment
                )}
                style={{ width: `${visualTargetPercentage}%` }}
              />
              {/* Parte do excesso */}
              <div
                className={cn(
                  'absolute inset-y-0 rounded-r-xl transition-all duration-500 z-10',
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
                'absolute inset-y-0 left-0 rounded-xl transition-all duration-500 z-10',
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

          {/* Label da porcentagem atual sempre na ponta da barra atual */}
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

  // Linha de valores: "R$ atual de R$ limite" + diferença colorida + alertas
  const ValuesLine = ({
    currentValue,
    targetValue,
    differenceValue,
    differencePercent,
    kind,
  }: {
    currentValue: number;
    targetValue: number;
    differenceValue: number;
    differencePercent: number;
    kind: 'expense' | 'investment';
  }) => {
    // Se não há diferença em valor, mostramos apenas os valores base
    if (differenceValue === 0) {
      return (
        <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="tabular-nums">
            {formatCurrency(currentValue)} de {formatCurrency(targetValue)}
          </span>
        </p>
      );
    }

    let displayText: string;
    let displayClass: string;

    if (kind === 'expense') {
      // Para essenciais e estilo de vida, interpretamos como SALDO:
      // saldo = limite - atual -> > 0 = abaixo do limite (bom / positivo), < 0 = acima (ruim / negativo)
      const saldo = targetValue - currentValue;
      const saldoAbs = Math.abs(saldo);

      // Se por algum motivo saldo for 0 mas differenceValue não (edge raro), tratamos como sem diferença visível
      if (saldoAbs === 0) {
        return (
          <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="tabular-nums">
              {formatCurrency(currentValue)} de {formatCurrency(targetValue)}
            </span>
          </p>
        );
      }

      const isPositive = saldo > 0;
      // Sinal invertido em relação ao gasto bruto:
      // + para saldo positivo (abaixo do limite), - para saldo negativo (acima do limite)
      displayText = `${isPositive ? '+' : '-'}${formatCurrency(saldoAbs)}`;
      displayClass = isPositive ? 'text-income' : 'text-expense';
    } else {
      // Para investimentos, usamos a diferença direta: > 0 = acima da meta (bom), < 0 = abaixo (ruim)
      const diffAbs = Math.abs(differenceValue);
      const isPositive = differenceValue > 0;

      displayText = `${isPositive ? '+' : '-'}${formatCurrency(diffAbs)}`;
      displayClass = isPositive ? 'text-investment' : 'text-expense';
    }

    return (
      <div className="flex flex-col gap-1.5 sm:gap-0 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-muted-foreground">
        <span className="tabular-nums order-2 sm:order-1">
          {formatCurrency(currentValue)} de {formatCurrency(targetValue)}
        </span>
        <span className="flex flex-wrap items-center gap-2 order-1 sm:order-2">
          {/* Alertas para gastos essenciais/estilo de vida acima do limite */}
          {kind === 'expense' && differencePercent > 0 && (
            <Badge
              variant="outline"
              className="h-6 px-2 rounded-full border-none bg-expense-light text-expense text-[10px] sm:text-[11px] font-medium gap-1 w-fit"
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span className="whitespace-nowrap">{differencePercent.toFixed(1)}% acima do limite</span>
            </Badge>
          )}

          {/* Alerta para investimento: abaixo da meta */}
          {kind === 'investment' && differencePercent < 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-investment bg-investment-light/80 px-2 py-0.5 rounded-full whitespace-nowrap">
              <Frown className="h-3 w-3 shrink-0" />
              Faltam {Math.abs(differencePercent).toFixed(1)}% para meta
            </span>
          )}
          {/* Feedback para investimento acima da meta */}
          {kind === 'investment' && differencePercent > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-investment bg-investment-light/80 px-2 py-0.5 rounded-full whitespace-nowrap">
              <Smile className="h-3 w-3 shrink-0" />
              {differencePercent.toFixed(1)}% acima da meta
            </span>
          )}

          <span className={cn('font-semibold tabular-nums', displayClass)}>
            {displayText}
          </span>
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-2">
          Renda do mês:{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {formatCurrency(totalIncome)}
          </span>
        </p>

        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-1.5 sm:space-y-2">
            <ProgressBar
              current={stats.essentials.current}
              target={stats.essentials.target}
              label="Essenciais"
              color="expense"
            />
            <ValuesLine
              currentValue={stats.essentials.currentValue}
              targetValue={stats.essentials.targetValue}
              differenceValue={stats.essentials.differenceValue}
              differencePercent={stats.essentials.difference}
              kind="expense"
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <ProgressBar
              current={stats.lifestyle.current}
              target={stats.lifestyle.target}
              label="Estilo de Vida"
              color="expense"
            />
            <ValuesLine
              currentValue={stats.lifestyle.currentValue}
              targetValue={stats.lifestyle.targetValue}
              differenceValue={stats.lifestyle.differenceValue}
              differencePercent={stats.lifestyle.difference}
              kind="expense"
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <ProgressBar
              current={stats.investments.current}
              target={stats.investments.target}
              label="Investimentos"
              color="investment"
            />
            <ValuesLine
              currentValue={stats.investments.currentValue}
              targetValue={stats.investments.targetValue}
              differenceValue={stats.investments.differenceValue}
              differencePercent={stats.investments.difference}
              kind="investment"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
