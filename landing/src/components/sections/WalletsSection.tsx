import { SectionShell } from "@/components/layout/SectionShell";
import { ScreenshotFrame } from "@/components/ui/ScreenshotFrame";
import { WalletStripPreview } from "@/components/previews/WalletStripPreview";
import { wallets } from "@/content/copy";

export function WalletsSection() {
  return (
    <SectionShell
      id={wallets.id}
      badge={wallets.badge}
      title={wallets.title}
      subtitle={wallets.subtitle}
    >
      <div className="grid lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-4">
          {wallets.features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-card p-4 card-shadow hover-lift"
            >
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
          <div className="rounded-xl border border-income/30 bg-income-light/50 p-4">
            <h3 className="font-semibold text-sm text-income mb-1">{wallets.saldoLivre.title}</h3>
            <p className="text-sm text-muted-foreground">{wallets.saldoLivre.description}</p>
          </div>
        </div>
        <ScreenshotFrame
          src="/screenshots/wallets-resgate.png"
          alt="Carteiras do Finto com aportes, resgate e Saldo Livre"
          fallback={<WalletStripPreview />}
        />
      </div>
    </SectionShell>
  );
}
