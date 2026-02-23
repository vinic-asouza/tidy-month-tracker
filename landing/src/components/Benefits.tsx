import { Calendar, Target, CreditCard, BarChart3 } from "lucide-react";

const benefits = [
  {
    icon: Calendar,
    title: "Visão por mês",
    description:
      "Navegue por mês e veja entradas, gastos, investimentos e saldo de forma clara.",
  },
  {
    icon: Target,
    title: "Regra 50/30/20",
    description:
      "Acompanhe essenciais, estilo de vida e investimentos com a regra 50/30/20 ou personalizada.",
  },
  {
    icon: CreditCard,
    title: "Cartões e parcelas",
    description:
      "Cadastre cartões, marque o que já pagou e acompanhe despesas parceladas.",
  },
  {
    icon: BarChart3,
    title: "Estatísticas do ano",
    description:
      "Gráficos anuais para enxergar tendências de receita, gastos e investimentos.",
  },
];

export function Benefits() {
  return (
    <section id="beneficios" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
            Tudo que você precisa para organizar
          </h2>
          <p className="text-muted-foreground">
            Controle financeiro simples, sem complicação.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-6 card-shadow hover:card-shadow transition-shadow"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
