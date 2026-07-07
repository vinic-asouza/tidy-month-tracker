import { Heart, Clock, AlertCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const MOCK_WISHES = [
  {
    name: "Notebook novo",
    value: 4500,
    urgency: "Média",
    deadline: "Ago/2026",
    urgencyColor: "text-amber-600 bg-amber-50",
  },
  {
    name: "Viagem de férias",
    value: 2800,
    urgency: "Baixa",
    deadline: "Dez/2026",
    urgencyColor: "text-emerald-600 bg-emerald-50",
  },
  {
    name: "Curso de idiomas",
    value: 1200,
    urgency: "Alta",
    deadline: "Jul/2026",
    urgencyColor: "text-red-600 bg-red-50",
  },
];

export function WishListPreview() {
  return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      {MOCK_WISHES.map((wish) => (
        <div
          key={wish.name}
          className="flex items-center gap-3 rounded-xl border bg-card p-3 card-shadow hover-lift"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5">
            <Heart className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{wish.name}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(wish.value)}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                wish.urgencyColor
              )}
            >
              <AlertCircle className="h-2.5 w-2.5" />
              {wish.urgency}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {wish.deadline}
            </span>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-center text-muted-foreground pt-1">
        Isolado do saldo — reflexão antes da ação
      </p>
    </div>
  );
}
