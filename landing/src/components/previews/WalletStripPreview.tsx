import { PiggyBank, ArrowRightLeft, Wallet, TrendingUp } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const MOCK_WALLETS = [
  { name: "Nubank", balance: 12500, monthly: 800, color: "bg-purple-100 text-purple-700" },
  { name: "Inter", balance: 8200, monthly: 500, color: "bg-orange-100 text-orange-700" },
  { name: "XP Invest.", balance: 34000, monthly: 1200, color: "bg-blue-100 text-blue-700" },
];

export function WalletStripPreview() {
  return (
    <div className="w-full max-w-lg mx-auto space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MOCK_WALLETS.map((wallet) => (
          <div
            key={wallet.name}
            className="flex-shrink-0 w-36 rounded-xl border bg-card p-3 card-shadow hover-lift"
          >
            <div className={cn("inline-flex rounded-md p-1.5 mb-2", wallet.color)}>
              <PiggyBank className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs font-medium truncate">{wallet.name}</p>
            <p className="text-sm font-bold">{formatCurrency(wallet.balance)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              +{formatCurrency(wallet.monthly)} no mês
            </p>
          </div>
        ))}
        <div className="flex-shrink-0 w-36 rounded-xl border border-dashed bg-muted/30 p-3 flex flex-col justify-center items-center gap-1">
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground text-center">Transferir entre carteiras</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3 card-shadow flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-income-light">
          <Wallet className="h-4 w-4 text-income" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">Saldo Livre</p>
          <p className="text-sm font-bold text-income">{formatCurrency(1850)}</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          Resgate + movimentos
        </div>
      </div>
    </div>
  );
}
