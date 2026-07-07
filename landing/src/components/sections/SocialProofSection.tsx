import { MessageCircle } from "lucide-react";
import { SectionShell } from "@/components/layout/SectionShell";
import { socialProof } from "@/content/copy";

export function SocialProofSection() {
  return (
    <SectionShell
      id={socialProof.id}
      title={socialProof.title}
      subtitle={socialProof.subtitle}
      centered
    >
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center card-shadow">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <MessageCircle className="h-7 w-7 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">{socialProof.placeholder}</p>
          <div className="mt-6 grid grid-cols-3 gap-3 opacity-40">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-4 h-24" aria-hidden />
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
