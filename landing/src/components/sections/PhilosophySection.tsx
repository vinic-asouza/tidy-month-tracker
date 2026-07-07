import { ArrowRight } from "lucide-react";
import { SectionShell } from "@/components/layout/SectionShell";
import { philosophy } from "@/content/copy";

export function PhilosophySection() {
  return (
    <SectionShell
      id={philosophy.id}
      title={philosophy.title}
      subtitle={philosophy.subtitle}
      centered
    >
      <div className="max-w-2xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center gap-3 rounded-full border bg-card px-6 py-3 card-shadow text-sm">
          <span className="text-muted-foreground">{philosophy.comparison.them}</span>
          <ArrowRight className="h-4 w-4 text-primary" aria-hidden />
          <span className="font-semibold text-primary">{philosophy.comparison.us}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {philosophy.reflections.map((item) => (
          <div
            key={item.action}
            className="flex items-start gap-4 rounded-xl border bg-card p-4 card-shadow hover-lift"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              →
            </div>
            <div>
              <p className="text-sm font-medium">{item.action}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{item.effect}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
