import { AlertTriangle, FileSpreadsheet, Zap } from "lucide-react";
import { SectionShell } from "@/components/layout/SectionShell";
import { problem } from "@/content/copy";

const icons = [Zap, FileSpreadsheet, AlertTriangle];

export function ProblemSection() {
  return (
    <SectionShell
      id={problem.id}
      title={problem.title}
      subtitle={problem.subtitle}
      className="bg-muted/30"
      centered
    >
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {problem.points.map((point, i) => {
          const Icon = icons[i];
          return (
            <div
              key={point.title}
              className="rounded-xl border bg-card p-6 card-shadow hover-lift"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-expense-light mb-4">
                <Icon className="h-5 w-5 text-expense" />
              </div>
              <h3 className="font-semibold mb-2">{point.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
