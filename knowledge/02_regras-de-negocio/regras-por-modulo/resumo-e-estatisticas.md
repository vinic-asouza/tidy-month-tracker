---
type: regras-modulo
modulo: resumo-e-estatisticas
ultima_atualizacao: 2026-08-21
---

# Resumo do mês e estatísticas anuais

Componentes: `MonthSummarySection`, `Statistics`. Cálculo: `monthTotals.ts`.

---

## RN-R01 — Quatro números

Entradas, gastos, investimentos e saldo, conforme o modo do toggle (RN-G03). Saldo positivo em verde; negativo em vermelho.

## RN-R02 — Toggle compartilhado

Efetivados (padrão) | Planejados. O mesmo modo alimenta resumo, regra financeira e visão anual.

## RN-R03 — Pendências (modo efetivado)

Linhas secundárias: a receber, a pagar, a investir — planejado do tipo **menos** efetivado daquele tipo. Pendência de entradas usa renda **recebida**, sem misturar resgate na conta de “a receber”.

## RN-R04 — Visão anual

Totais dos 12 meses do ano civil da navegação + gráfico mês a mês. Mesma regra de gasto no cartão (só conta com fatura paga, no modo efetivado).

## RN-R05 — Sem desejos

Desejos não aparecem no resumo nem nas estatísticas.
