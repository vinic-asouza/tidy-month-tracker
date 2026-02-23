const steps = [
  {
    step: 1,
    title: "Crie sua conta",
    description: "Cadastre-se com e-mail e senha em segundos.",
  },
  {
    step: 2,
    title: "Cadastre receitas e despesas",
    description: "Adicione entradas, gastos e investimentos do mês.",
  },
  {
    step: 3,
    title: "Acompanhe o saldo e as estatísticas",
    description: "Veja o resumo do mês, a regra financeira e os gráficos do ano.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
            Como funciona
          </h2>
          <p className="text-muted-foreground">
            Três passos para começar a organizar suas finanças.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {steps.map(({ step, title, description }) => (
            <div key={step} className="relative text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                {step}
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
              {step < steps.length && (
                <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
