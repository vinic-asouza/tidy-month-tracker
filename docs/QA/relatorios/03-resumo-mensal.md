# Relatório QA — 03 Resumo do Mês

| Campo | Valor |
|-------|-------|
| **Módulo** | Resumo do Mês (`MonthSummarySection`) |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `frontend/src/components/MonthSummarySection.tsx`, `frontend/src/components/layout/MetricTile.tsx` |

---

## Resumo executivo

**Veredito geral:** Aprovado com ressalvas — métricas calculadas corretamente pelo código, mas critério de totais diverge da visão anual.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 1 |
| Médio | 1 |
| Baixo | 0 |

---

## Mapa de fluxos validados

| # | Checklist | Status |
|---|-----------|--------|
| 1 | Totais entradas, gastos, investimentos | OK |
| 2 | Saldo = entradas − gastos − investimentos | OK (L35-38) |
| 3 | Saldo negativo estilo vermelho | OK (L48-49) |
| 4 | Integração regra financeira | OK (delegado módulo 09) |

---

## Achados

### Totais usam valores brutos, não itens efetivados

**Severidade:** Alto

**Evidência:** `MonthSummarySection.tsx` L35-37 — `reduce` soma todos os `value` sem filtrar `received`, `paid`, `invested`. `Statistics.tsx` filtra itens efetivados e exibe nota explicativa.

**Comportamento atual:** Resumo mensal mostra R$ 5.000 em gastos mesmo que nada esteja marcado pago; visão anual mostra R$ 0 nos mesmos dados.

**Comportamento esperado:** Critério único documentado ou labels distintos ("planejado" vs "efetivado").

**Recomendação:** Alinhar com produto; ajustar cálculo ou adicionar legenda.

---

### `handleComplete` da regra fecha dialog mesmo se `updateRule` falhar após toast

**Severidade:** Médio

**Evidência:** L61-67 — `await updateRule/createRule` pode lançar (`useFinancialRule` re-throw). Se erro, dialog permanece aberto (OK). Porém não há estado de erro inline no wizard — só toast.

**Recomendação:** Manter dialog aberto em erro (já ocorre); considerar feedback adicional no setup.

---

## Itens sem achado

- Layout responsivo métricas + regra
- Badge de categorias não mapeadas
- Loading da regra isolado na coluna direita
- Formatação de moeda via `formatCurrency`

## Referências cruzadas

- Módulo 09 (regra financeira), Módulo 10 (divergência de totais)
