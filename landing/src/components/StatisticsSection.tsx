import { Target } from "lucide-react";
import { FinancialRulePreview } from "./FinancialRulePreview";

export function StatisticsSection() {
  return (
    <section id="estatisticas" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center max-w-5xl mx-auto">
          <div className="space-y-4 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Target className="h-4 w-4" />
              Módulo Estatísticas
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Regra Financeira: acompanhe essenciais, estilo de vida e investimentos
            </h2>
            <p className="text-muted-foreground">
              Na visão de Estatísticas você configura a regra 50/30/20 (ou personalizada) e mapeia suas categorias de gasto. 
              O app mostra quanto da sua renda está em essenciais, estilo de vida e investimentos, com indicadores visuais do que está dentro ou fora da meta.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Regra 50/30/20 ou percentuais personalizados
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Gráficos anuais de entradas, gastos e investimentos
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Comparativo real vs. meta por categoria da regra
              </li>
            </ul>
          </div>
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <FinancialRulePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
