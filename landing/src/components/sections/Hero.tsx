import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenshotFrame } from "@/components/ui/ScreenshotFrame";
import { SummaryCardsPreview } from "@/components/previews/SummaryCardsPreview";
import { hero } from "@/content/copy";
import { AUTH_URL } from "@/lib/constants";

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden py-16 md:py-24 scroll-mt-16">
      <div className="absolute inset-0 gradient-subtle pointer-events-none" />
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="max-w-xl animate-fade-in">
            <p className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              {hero.badge}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
              {hero.title}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{hero.subtitle}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild>
                <a href={AUTH_URL}>
                  {hero.ctaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href={AUTH_URL}>{hero.ctaSecondary}</a>
              </Button>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
            <ScreenshotFrame
              src="/screenshots/dashboard-light.png"
              alt="Dashboard do Finto com resumo mensal e caixa efetivado"
              fallback={<SummaryCardsPreview />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
