import {
  Eye,
  Brain,
  CalendarCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { SectionShell } from "@/components/layout/SectionShell";
import { benefits } from "@/content/copy";

const icons = [Eye, Brain, CalendarCheck, Target, TrendingUp];

export function BenefitsSection() {
  return (
    <SectionShell
      id={benefits.id}
      title={benefits.title}
      subtitle={benefits.subtitle}
      centered
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {benefits.pillars.map((pillar, i) => {
          const Icon = icons[i];
          return (
            <div
              key={pillar.title}
              className="rounded-xl border bg-card p-5 card-shadow hover-lift"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
