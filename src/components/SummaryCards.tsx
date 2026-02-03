import { TrendingUp, TrendingDown, PiggyBank, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MonthData } from '@/types/finance';

interface SummaryCardsProps {
  monthData: MonthData;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return formatCurrency(value);
};

export const SummaryCards = ({ monthData }: SummaryCardsProps) => {
  const totalIncome = monthData.incomes.reduce((sum, i) => sum + i.value, 0);
  const totalExpenses = monthData.expenses.reduce((sum, e) => sum + e.value, 0);
  const totalInvestments = monthData.investments.reduce((sum, i) => sum + i.value, 0);
  const balance = totalIncome - totalExpenses - totalInvestments;

  const cards = [
    {
      title: 'Entradas',
      value: totalIncome,
      icon: TrendingUp,
      gradient: 'gradient-income',
      shadowClass: 'shadow-glow-income',
      lightBg: 'bg-income-light',
      textColor: 'text-income',
      trend: totalIncome > 0 ? '+' : '',
    },
    {
      title: 'Gastos',
      value: totalExpenses,
      icon: TrendingDown,
      gradient: 'gradient-expense',
      shadowClass: 'shadow-glow-expense',
      lightBg: 'bg-expense-light',
      textColor: 'text-expense',
      trend: '-',
    },
    {
      title: 'Investimentos',
      value: totalInvestments,
      icon: PiggyBank,
      gradient: 'gradient-investment',
      shadowClass: 'shadow-glow-investment',
      lightBg: 'bg-investment-light',
      textColor: 'text-investment',
      trend: totalInvestments > 0 ? '+' : '',
    },
    {
      title: 'Saldo',
      value: balance,
      icon: Wallet,
      gradient: balance >= 0 ? 'gradient-income' : 'gradient-expense',
      shadowClass: balance >= 0 ? 'shadow-glow-income' : 'shadow-glow-expense',
      lightBg: balance >= 0 ? 'bg-income-light' : 'bg-expense-light',
      textColor: balance >= 0 ? 'text-income' : 'text-expense',
      trend: balance >= 0 ? '+' : '',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={`group relative overflow-hidden rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all duration-300 hover-lift ${card.lightBg}`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Background decoration */}
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-current to-transparent opacity-10" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${card.gradient} ${card.shadowClass}`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
              {card.value !== 0 && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${card.textColor}`}>
                  {balance >= 0 && card.title === 'Saldo' ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : card.title === 'Saldo' ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : null}
                </div>
              )}
            </div>
            
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {card.title}
            </p>
            
            <p className={`text-xl lg:text-2xl font-bold tracking-tight ${card.textColor}`}>
              {formatCurrency(Math.abs(card.value))}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
