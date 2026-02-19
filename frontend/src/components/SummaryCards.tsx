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

export const SummaryCards = ({ monthData }: SummaryCardsProps) => {
  // Totais consideram todas as inserções do mês (não apenas itens marcados como pago/recebido/investido)
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={`group relative overflow-hidden rounded-xl p-3 card-shadow hover:card-shadow-hover transition-all duration-300 hover-lift ${card.lightBg}`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br from-current to-transparent opacity-10" />
          <div className="relative flex items-center gap-3">
            <div className={`flex-shrink-0 p-2 rounded-lg ${card.gradient} ${card.shadowClass}`}>
              <card.icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex flex-col justify-center gap-0.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">
                {card.title}
              </p>
              <p className={`text-base font-bold tracking-tight leading-tight ${card.textColor}`}>
                {formatCurrency(Math.abs(card.value))}
              </p>
            </div>
            {card.value !== 0 && card.title === 'Saldo' && (
              <div className={`flex-shrink-0 ml-auto ${card.textColor}`}>
                {balance >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
