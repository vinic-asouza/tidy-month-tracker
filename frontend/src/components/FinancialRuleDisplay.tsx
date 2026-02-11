/**
 * Componente de Exibição da Regra Financeira
 * 
 * Exibe comparação percentual e valores monetários baseados na renda
 */

import { useMemo } from 'react';
import { Receipt, ShoppingBag, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { FinancialRule, MonthData, FinancialRuleStats } from '@/types/domain';
import { calculateFinancialRuleStats } from '@/utils/financialRuleCalculations';
import { cn } from '@/lib/utils';

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
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {color === 'investment' ? 'Meta' : 'Limite'}: {target.toFixed(1)}%
            </span>
            <span className={cn(
              'font-semibold',
              color === 'investment'
                ? 'text-investment'
                : isOverTarget
                  ? 'text-expense'
                  : 'text-income'
            )}>
              Atual: {current.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="relative h-8 rounded-xl bg-muted/30 overflow-visible">
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

  return (
    <div className="space-y-6">
      {/* BLOCO ÚNICO: Renda + Regra + Gráfico + Informações */}
      <div>
        {/* Renda do mês */}
        <p className="text-sm text-muted-foreground mb-2">
          Renda do mês:{' '}
          <span className="font-semibold text-foreground">
            {formatCurrency(totalIncome)}
          </span>
        </p>

        {/* Gráfico + Bloco Informativo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Gráfico (barras) */}
          <div className="space-y-4">
            <ProgressBar
              current={stats.essentials.current}
              target={stats.essentials.target}
              label="Essenciais"
              color="expense"
            />
            <ProgressBar
              current={stats.lifestyle.current}
              target={stats.lifestyle.target}
              label="Estilo de Vida"
              color="expense"
            />
            <ProgressBar
              current={stats.investments.current}
              target={stats.investments.target}
              label="Investimentos"
              color="investment"
            />
          </div>

          {/* Bloco Informativo (valores monetários) */}
          <div className="space-y-0 rounded-xl border bg-muted/20 p-4 text-sm">
            {/* Essenciais */}
            <div className="space-y-1.5 pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Essenciais</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Limite</span>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(stats.essentials.targetValue)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Atual</span>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(stats.essentials.currentValue)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Diferença</span>
                  <p className={cn(
                    'font-semibold',
                    stats.essentials.differenceValue > 0
                      ? 'text-expense'
                      : stats.essentials.differenceValue < 0
                        ? 'text-income'
                        : 'text-foreground'
                  )}>
                    {stats.essentials.differenceValue > 0 ? '+' : ''}
                    {formatCurrency(stats.essentials.differenceValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50 my-2" />

            {/* Estilo de Vida */}
            <div className="space-y-1.5 pb-4 pt-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Estilo de Vida</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Limite</span>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(stats.lifestyle.targetValue)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Atual</span>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(stats.lifestyle.currentValue)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Diferença</span>
                  <p className={cn(
                    'font-semibold',
                    stats.lifestyle.differenceValue > 0
                      ? 'text-expense'
                      : stats.lifestyle.differenceValue < 0
                        ? 'text-income'
                        : 'text-foreground'
                  )}>
                    {stats.lifestyle.differenceValue > 0 ? '+' : ''}
                    {formatCurrency(stats.lifestyle.differenceValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50 my-2" />

            {/* Investimentos */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Investimentos</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Meta</span>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(stats.investments.targetValue)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Atual</span>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(stats.investments.currentValue)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Diferença</span>
                  <p className={cn(
                    'font-semibold',
                    stats.investments.differenceValue < 0
                      ? 'text-expense'
                      : stats.investments.differenceValue > 0
                        ? 'text-investment'
                        : 'text-foreground'
                  )}>
                    {stats.investments.differenceValue > 0 ? '+' : ''}
                    {formatCurrency(stats.investments.differenceValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
