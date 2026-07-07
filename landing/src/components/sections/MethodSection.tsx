import { Check } from "lucide-react";
import { SectionShell } from "@/components/layout/SectionShell";
import { FinancialRulePreview } from "@/components/previews/FinancialRulePreview";
import { method } from "@/content/copy";

export function MethodSection() {
  return (
    <SectionShell
      id={method.id}
      badge={method.badge}
      title={method.title}
      subtitle={method.subtitle}
      className="bg-muted/30"
    >
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          {method.bullets.map((bullet) => (
            <div key={bullet} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-income-light">
                <Check className="h-3.5 w-3.5 text-income" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{bullet}</p>
            </div>
          ))}
        </div>
        <FinancialRulePreview />
      </div>
    </SectionShell>
  );
}
