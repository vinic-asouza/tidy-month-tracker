import { Check } from "lucide-react";
import { SectionShell } from "@/components/layout/SectionShell";
import { ScreenshotFrame } from "@/components/ui/ScreenshotFrame";
import { WishListPreview } from "@/components/previews/WishListPreview";
import { wishes } from "@/content/copy";

export function WishListSection() {
  return (
    <SectionShell
      id={wishes.id}
      badge={wishes.badge}
      title={wishes.title}
      subtitle={wishes.subtitle}
    >
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <ScreenshotFrame
          src="/screenshots/wish-list.png"
          alt="Lista de desejos do Finto com prazo e urgência"
          fallback={<WishListPreview />}
        />
        <div className="space-y-4">
          {wishes.bullets.map((bullet) => (
            <div key={bullet} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{bullet}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
