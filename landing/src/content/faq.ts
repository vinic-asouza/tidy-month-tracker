export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Preciso lançar tudo manualmente?",
    answer:
      "Sim — e é assim que você aprende. Cada registro é um segundo de reflexão. Apps que importam tudo não mudam seu comportamento. Leva minutos por dia; parcelas e repetições fazem o grosso do trabalho.",
  },
  {
    question: "Por que o Finto não conecta no banco?",
    answer:
      "Apps automáticos mostram onde foi. O Finto te ajuda a entender por quê e a mudar. Sem Open Finance — seus dados, seu ritmo, sua responsabilidade.",
  },
  {
    question: "Os números vão bater com meu banco?",
    answer:
      "O Finto não espelha extrato. Saldo do mês = caixa efetivado. Carteiras = saldo estimado com declaração consciente. Saldo Livre = movimentos sem carteira + resgates — não é sua conta bancária.",
  },
  {
    question: "O que é Saldo Livre?",
    answer:
      "Agrupamento de movimentos efetivados do mês que não estão em nenhuma carteira, mais entradas de resgate. Não é conta corrente — é organização consciente.",
  },
  {
    question: "Como funcionam resgate e transferência?",
    answer:
      "Resgate: sai da carteira, entra no Saldo Livre e no resumo como entrada efetivada. Transferência: move valor entre carteiras sem alterar saldo do mês nem a regra 50/30/20.",
  },
  {
    question: "O que significa caixa efetivado?",
    answer:
      "Valores que já entraram, saíram ou foram investidos de fato. Gastos em cartão só contam quando a fatura está marcada como paga. Pendências (A receber · A pagar · A investir) aparecem separadas.",
  },
  {
    question: "Por que o total do cartão difere do resumo?",
    answer:
      "O chip do cartão mostra a fatura do mês (comprometido). O resumo só conta quando você marca a fatura como paga — fluxo de caixa correto.",
  },
  {
    question: "A repetição mensal continua em janeiro?",
    answer:
      "No MVP, repetição é dentro do ano civil. Em janeiro, duplique ou recrie os lançamentos para o ano seguinte.",
  },
  {
    question: "Funciona para renda irregular?",
    answer:
      "Sim. A regra usa o que você efetivamente recebeu naquele mês. Cada mês é uma nova reflexão.",
  },
  {
    question: "Posso personalizar formas de pagamento?",
    answer:
      "Fora do MVP. Opções padrão: Pix, Débito, Dinheiro, Boleto + cartões que você cadastra.",
  },
  {
    question: "O Finto substitui minha corretora?",
    answer:
      "Não. O Finto constrói o hábito de aportar e organizar. A corretora guarda seus ativos.",
  },
  {
    question: "Posso confiar nos cálculos?",
    answer:
      "Lógica auditada com testes automatizados. Glossário integrado explica cada número exibido.",
  },
];
