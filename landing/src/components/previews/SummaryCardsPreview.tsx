import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const MOCK_CARDS = [
  {
    title: "Entradas",
    value: 8500,
    pending: 1200,
    icon: TrendingUp,
    gradient: "gradient-income",
    shadowClass: "shadow-glow-income",
    lightBg: "bg-income-light",
    textColor: "text-income",
  },
  {
    title: "Gastos",
    value: 4200,
    pending: 890,
    icon: TrendingDown,
    gradient: "gradient-expense",
    shadowClass: "shadow-glow-expense",
    lightBg: "bg-expense-light",
    textColor: "text-expense",
  },
  {
    title: "Investimentos",
    value: 1200,
    pending: 500,
    icon: PiggyBank,
    gradient: "gradient-investment",
    shadowClass: "shadow-glow-investment",
    lightBg: "bg-investment-light",
    textColor: "text-investment",
  },
  {
    title: "Saldo",
    value: 3100,
    pending: null,
    icon: Wallet,
    gradient: "gradient-income",
    shadowClass: "shadow-glow-income",
    lightBg: "bg-income-light",
    textColor: "text-income",
  },
];

export function SummaryCardsPreview() {
  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                {card.pending !== null && (
                  <p className="text-[8px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                    <Clock className="h-2 w-2" />
                    {formatCurrency(card.pending)} pendente
                  </p>
                )}
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
      <p className="text-[10px] text-center text-muted-foreground">
        Caixa efetivado — valores recebidos, pagos ou investidos de fato
      </p>
    </div>
  );
}
