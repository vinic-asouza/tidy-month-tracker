import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MOCK_DATA = [62, 68, 71, 65, 78, 82, 75, 88, 85, 90, 87, 92];

export function AnnualChartPreview() {
  const max = Math.max(...MOCK_DATA);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-xl border bg-card p-5 card-shadow">
        <div className="flex items-end justify-between gap-1.5 h-32 mb-3">
          {MOCK_DATA.map((value, i) => (
            <div key={MONTHS[i]} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-full rounded-t-md transition-all duration-300",
                  i === MOCK_DATA.length - 1 ? "bg-income" : "bg-income/40"
                )}
                style={{ height: `${(value / max) * 100}%`, minHeight: "8px" }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-1.5">
          {MONTHS.map((month, i) => (
            <span
              key={month}
              className={cn(
                "flex-1 text-center text-[9px]",
                i === MOCK_DATA.length - 1 ? "text-income font-medium" : "text-muted-foreground"
              )}
            >
              {month}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          % da meta de investimento atingida — mês a mês
        </p>
      </div>
    </div>
  );
}
