import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react';
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
  const totalIncome = monthData.incomes.reduce((sum, i) => sum + i.value, 0);
  const totalExpenses = monthData.expenses.reduce((sum, e) => sum + e.value, 0);
  const totalInvestments = monthData.investments.reduce((sum, i) => sum + i.value, 0);
  const balance = totalIncome - totalExpenses - totalInvestments;

  const cards = [
    {
      title: 'Entradas',
      value: totalIncome,
      icon: TrendingUp,
      bgClass: 'bg-income-light',
      iconClass: 'text-income',
      valueClass: 'text-income',
    },
    {
      title: 'Gastos',
      value: totalExpenses,
      icon: TrendingDown,
      bgClass: 'bg-expense-light',
      iconClass: 'text-expense',
      valueClass: 'text-expense',
    },
    {
      title: 'Investimentos',
      value: totalInvestments,
      icon: PiggyBank,
      bgClass: 'bg-investment-light',
      iconClass: 'text-investment',
      valueClass: 'text-investment',
    },
    {
      title: 'Saldo',
      value: balance,
      icon: Wallet,
      bgClass: 'bg-secondary',
      iconClass: 'text-primary',
      valueClass: balance >= 0 ? 'text-income' : 'text-expense',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bgClass} rounded-xl p-4 card-shadow transition-all hover:card-shadow-hover`}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`h-5 w-5 ${card.iconClass}`} />
            <span className="text-sm font-medium text-muted-foreground">
              {card.title}
            </span>
          </div>
          <p className={`text-xl font-bold ${card.valueClass}`}>
            {formatCurrency(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
};
