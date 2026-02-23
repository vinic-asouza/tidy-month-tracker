import { ScreenshotPlaceholder } from "./ScreenshotPlaceholder";

export function Preview() {
  return (
    <section id="preview" className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Interface simples e objetiva
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tudo que você precisa em uma tela: resumo do mês, receitas, despesas, investimentos e cartões.
          </p>
          <ScreenshotPlaceholder
            label="Screenshot do app — Dashboard (Controle do mês)"
            src="/dash-light.png"
            alt="Dashboard do Tidy Month Tracker — Fevereiro 2026"
            aspectRatio="video"
            className="w-full rounded-2xl"
          />
        </div>
      </div>
    </section>
  );
}
