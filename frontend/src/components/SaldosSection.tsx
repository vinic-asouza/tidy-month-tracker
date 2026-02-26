/**
 * Seção Saldos: totais de entradas, gastos, investimentos e saldo do mês.
 * Substitui os cards de resumo, com destaque para o saldo.
 */

import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react';
import { MonthData } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SaldosSectionProps {
  monthData: MonthData;
}

export const SaldosSection = ({ monthData }: SaldosSectionProps) => {
  const totalIncome = monthData.incomes.reduce((sum, i) => sum + i.value, 0);
  const totalExpenses = monthData.expenses.reduce((sum, e) => sum + e.value, 0);
  const totalInvestments = monthData.investments.reduce((sum, i) => sum + i.value, 0);
  const balance = totalIncome - totalExpenses - totalInvestments;

  const items = [
    { label: 'Entradas', value: totalIncome, icon: TrendingUp, color: 'text-income', bg: 'bg-income-light' },
    { label: 'Gastos', value: totalExpenses, icon: TrendingDown, color: 'text-expense', bg: 'bg-expense-light' },
    { label: 'Investimentos', value: totalInvestments, icon: PiggyBank, color: 'text-investment', bg: 'bg-investment-light' },
  ];

  return (
    <div className="bg-card rounded-2xl p-6 card-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl gradient-primary shadow-glow">
          <Wallet className="h-4 w-4 text-white dark:text-black" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Saldos</h3>
          <p className="text-sm text-muted-foreground">Totais do mês</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2.5',
              bg
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', color)} />
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <span className={cn('text-sm font-semibold tabular-nums', color)}>
              {formatCurrency(value)}
            </span>
          </div>
        ))}
      </div>

      {/* Saldo em destaque */}
      <div
        className={cn(
          'mt-4 rounded-xl px-4 py-4 border-2',
          balance >= 0
            ? 'bg-income-light border-income/30'
            : 'bg-expense-light border-expense/30'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wallet className={cn(
              'h-5 w-5',
              balance >= 0 ? 'text-income' : 'text-expense'
            )} />
            <span className="text-sm font-medium text-muted-foreground">Saldo</span>
          </div>
          <span
            className={cn(
              'text-xl font-bold tabular-nums',
              balance >= 0 ? 'text-income' : 'text-expense'
            )}
          >
            {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
          </span>
        </div>
      </div>
    </div>
  );
};
