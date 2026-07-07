import { SectionShell } from "@/components/layout/SectionShell";
import { ScreenshotFrame } from "@/components/ui/ScreenshotFrame";
import { SummaryCardsPreview } from "@/components/previews/SummaryCardsPreview";
import { productDemo } from "@/content/copy";

export function ProductDemoSection() {
  return (
    <SectionShell
      id={productDemo.id}
      title={productDemo.title}
      subtitle={productDemo.subtitle}
      className="bg-muted/30"
      centered
    >
      <div className="max-w-3xl mx-auto">
        <ScreenshotFrame
          src="/screenshots/dashboard-light.png"
          alt="Demonstração do dashboard Finto com resumo mensal, caixa efetivado e pendências"
          fallback={<SummaryCardsPreview />}
          aspectRatio="wide"
        />
        <p className="text-sm text-center text-muted-foreground mt-4">{productDemo.legend}</p>
      </div>
    </SectionShell>
  );
}
