import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenshotPlaceholder } from "./ScreenshotPlaceholder";

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden gradient-subtle py-16 md:py-24 pt-[5.5rem]">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Wallet className="h-4 w-4" />
              Controle financeiro pessoal
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Seu dinheiro organizado em um só lugar
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Receitas, despesas, investimentos e cartões em uma interface simples. Acompanhe seu mês sem planilha.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="rounded-xl">
                Começar grátis
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl">
                Já tenho conta
              </Button>
            </div>
          </div>
          <div className="animate-fade-in flex justify-center">
            <ScreenshotPlaceholder
              label="Screenshot do dashboard (resumo do mês)"
              aspectRatio="wide"
              className="w-full max-w-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
