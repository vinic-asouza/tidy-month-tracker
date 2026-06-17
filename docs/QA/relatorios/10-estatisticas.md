# Relatório QA — 10 Estatísticas Anuais

| Campo | Valor |
|-------|-------|
| **Módulo** | Estatísticas (Visão Anual) |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `frontend/src/components/Statistics.tsx`, `frontend/src/pages/Index.tsx` (carga `yearData`), `useSupabaseFinance.getYearData` |

---

## Resumo executivo

**Veredito geral:** Requer atenção — lógica de efetivados correta no componente, integração com dashboard incompleta.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 2 |
| Médio | 2 |
| Baixo | 1 |

---

## Mapa de fluxos validados

| # | Checklist | Status |
|---|-----------|--------|
| 1 | Carregar 12 meses do ano do navegador | OK (`getYearData`) |
| 2 | Totais só efetivados | OK (`Statistics.tsx`) |
| 3 | Gastos cartão só se fatura paga | OK (L28-39) |
| 4 | Gráfico valores corretos | OK por código |
| 5 | Atualizar após marcar item | OK parcial |
| 6 | Atualizar após marcar cartão pago | **Achado** |

---

## Achados

### Recarga por debounce ignora mudança de status de cartão

**Severidade:** Alto

**Evidência:** `Index.tsx` L129-133 — hash não inclui `cardMonthlyStatus`.

---

### `yearData` stale ao mudar ano sem reentrar na view

**Severidade:** Alto

**Evidência:** `Index.tsx` L111-121 — condição `yearData.length === 0`.

---

### Eixo Y formata valores &lt; 1000 como "0k"

**Severidade:** Médio

**Evidência:** `Statistics.tsx` L115 — `tickFormatter={(v) => \`${(v/1000).toFixed(0)}k\`}`.

**Impacto:** Meses com poucos dados parecem zerados no eixo.

---

### `getYearData` silencia erro por mês com objeto vazio

**Severidade:** Médio

**Evidência:** `useSupabaseFinance.ts` L760-765 — catch retorna `getEmptyMonthData()` sem toast.

---

### Gráfico oculto inteiro durante `isLoading` mesmo com dados parciais

**Severidade:** Baixo

**Evidência:** `Statistics.tsx` L84-88 — substitui todo conteúdo por spinner.

---

## Itens sem achado

- Nota explicativa sobre itens efetivados
- Três barras com cores semânticas
- Tooltip em BRL
- Cards resumo anual

## Referências cruzadas

- Módulos 02, 03, 06
