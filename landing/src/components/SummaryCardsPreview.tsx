import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const MOCK_CARDS = [
  {
    title: "Entradas",
    value: 8500,
    icon: TrendingUp,
    gradient: "gradient-income",
    shadowClass: "shadow-glow-income",
    lightBg: "bg-income-light",
    textColor: "text-income",
  },
  {
    title: "Gastos",
    value: 4200,
    icon: TrendingDown,
    gradient: "gradient-expense",
    shadowClass: "shadow-glow-expense",
    lightBg: "bg-expense-light",
    textColor: "text-expense",
  },
  {
    title: "Investimentos",
    value: 1200,
    icon: PiggyBank,
    gradient: "gradient-investment",
    shadowClass: "shadow-glow-investment",
    lightBg: "bg-investment-light",
    textColor: "text-investment",
  },
  {
    title: "Saldo",
    value: 3100,
    icon: Wallet,
    gradient: "gradient-income",
    shadowClass: "shadow-glow-income",
    lightBg: "bg-income-light",
    textColor: "text-income",
  },
];

export function SummaryCardsPreview() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md mx-auto">
      {MOCK_CARDS.map((card, index) => (
        <div
          key={card.title}
          className={cn(
            "group relative overflow-hidden rounded-lg p-2.5 card-shadow transition-all duration-300 hover:card-shadow-hover hover-lift",
            "animate-float",
            card.lightBg
          )}
          style={{
            animationDelay: `${index * 80}ms`,
            animationFillMode: "both",
          }}
        >
          <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-current to-transparent opacity-10" />
          <div className="relative flex items-center gap-2">
            <div
              className={cn(
                "flex-shrink-0 p-1.5 rounded-md",
                card.gradient,
                card.shadowClass
              )}
            >
              <card.icon className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0 flex flex-col justify-center gap-0">
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">
                {card.title}
              </p>
              <p className={cn("text-sm font-bold tracking-tight leading-tight", card.textColor)}>
                {formatCurrency(Math.abs(card.value))}
              </p>
            </div>
            {card.title === "Saldo" && (
              <div className={cn("flex-shrink-0 ml-auto", card.textColor)}>
                <ArrowUpRight className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
