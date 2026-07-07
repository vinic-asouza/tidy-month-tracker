import { SectionShell } from "@/components/layout/SectionShell";
import { ScreenshotFrame } from "@/components/ui/ScreenshotFrame";
import { AnnualChartPreview } from "@/components/previews/AnnualChartPreview";
import { annual } from "@/content/copy";

export function AnnualSection() {
  return (
    <SectionShell
      id={annual.id}
      badge={annual.badge}
      title={annual.title}
      subtitle={annual.subtitle}
      className="bg-muted/30"
      centered
    >
      <div className="max-w-2xl mx-auto">
        <ScreenshotFrame
          src="/screenshots/annual-chart.png"
          alt="Gráfico anual de evolução financeira no Finto"
          fallback={<AnnualChartPreview />}
        />
      </div>
    </SectionShell>
  );
}
