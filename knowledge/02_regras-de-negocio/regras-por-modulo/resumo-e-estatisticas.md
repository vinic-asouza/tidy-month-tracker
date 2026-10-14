---
type: regras-modulo
modulo: resumo-e-estatisticas
ultima_atualizacao: 2026-10-13
---

# Resumo do mês e estatísticas anuais

Componentes: `MonthSummarySection`, `Statistics`. Cálculo: `monthTotals.ts`.

---

## RN-R01 — Quatro números

Entradas, gastos, investimentos e saldo, conforme o modo do toggle (RN-G03). Saldo positivo em verde; negativo em vermelho.

## RN-R02 — Toggle compartilhado

Efetivados (padrão) | Planejados. O mesmo modo alimenta resumo, regra financeira e visão anual. Na visão Anual o controle é um só, na barra acima das seções (resumo, gráfico e regra). A visão Mensal tem a própria instância; o `localStorage` alinha a próxima montagem, não as duas ao vivo.

## RN-R03 — Pendências (modo efetivado)

Linhas secundárias: a receber, a pagar, a investir — planejado do tipo **menos** efetivado daquele tipo. Pendência de entradas usa renda **recebida**, sem misturar resgate na conta de “a receber”.

## RN-R04 — Visão anual

O cabeçalho troca o seletor de mês por setas de ano. Fora do ano-calendário de hoje, aparece o atalho para o ano atual. O mês aberto fica guardado: ao voltar para Mensal, é o mesmo mês nesse ano.

Dois eixos independentes. Efetivados/Planejados segue a RN-R02. Total (padrão) soma os 12 meses. Média soma só a janela e divide pelo tamanho dela. O gráfico continua um valor por mês.

Janela da média, sem olhar o mês selecionado:

- Ano anterior ao de hoje: 12 meses.
- Ano corrente: só meses já encerrados (em 13 de outubro, janeiro a setembro).
- Ano futuro: nenhum mês completo; não divide por zero.

Meses vazios dentro da janela entram no divisor. Total/Média vive na página, não no `localStorage`: permanece ao trocar o ano e volta para Total ao sair da visão Anual.

Mesma regra de gasto no cartão (só conta com fatura paga, no modo efetivado). O eixo X destaca o mês de hoje quando o ano visto é o ano-calendário; nos outros anos, não destaca.

## RN-R05 — Sem desejos

Desejos não aparecem no resumo nem nas estatísticas.
