import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section id="cta" className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
          Comece a organizar suas finanças hoje
        </h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
          Crie sua conta gratuitamente e tenha controle total do seu dinheiro por mês.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="rounded-xl bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          Começar agora
        </Button>
      </div>
    </section>
  );
}
