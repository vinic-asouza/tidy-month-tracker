import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { finalCta } from "@/content/copy";
import { AUTH_URL } from "@/lib/constants";

export function FinalCtaSection() {
  return (
    <section id={finalCta.id} className="py-16 md:py-24 scroll-mt-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 md:px-12 md:py-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80 pointer-events-none" />
          <div className="relative max-w-xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-primary-foreground">
              {finalCta.title}
            </h2>
            <p className="mt-4 text-primary-foreground/80 text-base sm:text-lg">
              {finalCta.subtitle}
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <a href={AUTH_URL}>
                {finalCta.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
