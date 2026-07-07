import { Receipt, ShoppingBag, PiggyBank } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// Dados fictícios: regra 50/30/20, renda 10.000
const MOCK_STATS = {
  essentials: {
    current: 48,
    target: 50,
    currentValue: 4800,
    targetValue: 5000,
    differenceValue: -200,
  },
  lifestyle: {
    current: 32,
    target: 30,
    currentValue: 3200,
    targetValue: 3000,
    differenceValue: 200,
  },
  investments: {
    current: 18,
    target: 20,
    currentValue: 1800,
    targetValue: 2000,
    differenceValue: -200,
  },
};

const MOCK_INCOME = 10000;

type BarColor = "expense" | "income" | "investment";

function ProgressBar({
  current,
  target,
  label,
  color,
}: {
  current: number;
  target: number;
  label: string;
  color: BarColor;
}) {
  const percentage = Math.max(0, Math.min(100, current));
  const targetPercentage = Math.max(0, Math.min(100, target));
  const visualPercentage = percentage === 0 ? 0 : Math.max(6, Math.min(percentage, 100));
  const visualTargetPercentage =
    targetPercentage === 0 ? 0 : Math.max(6, Math.min(targetPercentage, 100));
  const isOverTarget = percentage > targetPercentage;

  const colorClasses: Record<BarColor, string> = {
    expense: "gradient-expense",
    income: "gradient-income",
    investment: "gradient-investment",
  };
  const investmentExcessColor = "bg-[hsl(220_70%_45%)]";
  const metaBarColor = "bg-muted/100";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {color === "investment" ? "Meta" : "Limite"}: {target.toFixed(1)}%
          </span>
          <span
            className={cn(
              "font-semibold",
              color === "investment"
                ? "text-investment"
                : isOverTarget
                  ? "text-expense"
                  : "text-income"
            )}
          >
            Atual: {current.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="relative h-8 rounded-xl bg-muted/30 overflow-visible">
        {targetPercentage <= 100 && (
          <div
            className={cn("absolute inset-y-0 left-0 rounded-xl transition-all duration-500", metaBarColor)}
            style={{ width: `${visualTargetPercentage}%` }}
          />
        )}
        {((color === "expense" || color === "investment") && isOverTarget && targetPercentage > 0) ? (
          <>
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-l-xl transition-all duration-500 z-10",
                color === "expense" ? colorClasses.income : colorClasses.investment
              )}
              style={{ width: `${visualTargetPercentage}%` }}
            />
            <div
              className={cn(
                "absolute inset-y-0 rounded-r-xl transition-all duration-500 z-10",
                color === "expense" ? colorClasses.expense : investmentExcessColor
              )}
              style={{
                left: `${visualTargetPercentage}%`,
                width: `${Math.max(0, visualPercentage - visualTargetPercentage)}%`,
              }}
            />
          </>
        ) : (
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-xl transition-all duration-500 z-10",
              color === "expense" && !isOverTarget
                ? colorClasses.income
                : color === "investment" && !isOverTarget
                  ? colorClasses.investment
                  : isOverTarget
                    ? colorClasses.expense
                    : colorClasses[color]
            )}
            style={{ width: `${visualPercentage}%` }}
          />
        )}
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
}

export function FinancialRulePreview() {
  const stats = MOCK_STATS;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      {/* Card único: gráfico + bloco informativo */}
      <div className="rounded-xl border bg-card p-6 card-shadow flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Renda do mês:{" "}
          <span className="font-semibold text-foreground">{formatCurrency(MOCK_INCOME)}</span>
        </p>

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

        {/* Bloco informativo (valores monetários) */}
        <div className="space-y-0 text-sm">
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
                <p
                  className={cn(
                    "font-semibold",
                    stats.essentials.differenceValue > 0
                      ? "text-expense"
                      : stats.essentials.differenceValue < 0
                        ? "text-income"
                        : "text-foreground"
                  )}
                >
                  {stats.essentials.differenceValue > 0 ? "+" : ""}
                  {formatCurrency(stats.essentials.differenceValue)}
                </p>
              </div>
            </div>
          </div>

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
                <p
                  className={cn(
                    "font-semibold",
                    stats.lifestyle.differenceValue > 0
                      ? "text-expense"
                      : stats.lifestyle.differenceValue < 0
                        ? "text-income"
                        : "text-foreground"
                  )}
                >
                  {stats.lifestyle.differenceValue > 0 ? "+" : ""}
                  {formatCurrency(stats.lifestyle.differenceValue)}
                </p>
              </div>
            </div>
          </div>

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
                <p
                  className={cn(
                    "font-semibold",
                    stats.investments.differenceValue < 0
                      ? "text-expense"
                      : stats.investments.differenceValue > 0
                        ? "text-investment"
                        : "text-foreground"
                  )}
                >
                  {stats.investments.differenceValue > 0 ? "+" : ""}
                  {formatCurrency(stats.investments.differenceValue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
