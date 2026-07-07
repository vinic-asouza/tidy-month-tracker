import { SectionShell } from "@/components/layout/SectionShell";
import { ritual } from "@/content/copy";

export function RitualSection() {
  return (
    <SectionShell
      id={ritual.id}
      title={ritual.title}
      subtitle={ritual.subtitle}
      className="bg-muted/30"
      centered
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {ritual.steps.map((step) => (
          <div key={step.step} className="relative text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold mb-4">
              {step.step}
            </div>
            <h3 className="font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
