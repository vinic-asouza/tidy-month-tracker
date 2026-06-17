# Relatório QA — 09 Regra Financeira

| Campo | Valor |
|-------|-------|
| **Módulo** | Regra Financeira |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `FinancialRuleSetup.tsx`, `FinancialRuleDisplay.tsx`, `useFinancialRule.ts`, `financialRuleCalculations.ts`, `supabase/financialRule.ts` |

---

## Resumo executivo

**Veredito geral:** Aprovado com ressalvas — wizard completo; exclusão e projeção ausentes na UI.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 1 |
| Médio | 3 |
| Baixo | 1 |

---

## Mapa de fluxos validados

| # | Checklist | Status |
|---|-----------|--------|
| 1 | Configurar 50/30/20 | OK |
| 2 | Percentuais custom (soma ≠ 100 rejeitada) | OK (UI L105-108 + serviço L10-20) |
| 3 | Mapear todas categorias | OK |
| 4 | Alerta categoria nova | OK (`MonthSummarySection`) |
| 5 | Barras refletem mês | OK com ressalva (totais brutos) |
| 6 | Editar regra | OK |
| 7 | Excluir regra | Não implementado na UI |

---

## Achados

### Cálculos usam gastos/investimentos não efetivados

**Severidade:** Alto

**Evidência:** `financialRuleCalculations.ts` L18-28 — soma todos expenses/investments e todas incomes sem filtrar flags.

**Impacto:** Regra mostra % acima do limite mesmo que usuário só tenha "planejado" gastos.

**Recomendação:** Alinhar com produto (efetivados vs planejados) ou rotular na UI.

---

### `deleteRule` implementado sem interface

**Severidade:** Médio

**Evidência:** `useFinancialRule.ts` L81-99 — nenhum componente importa `deleteRule`.

---

### `calculateProjection` não utilizada

**Severidade:** Médio

**Evidência:** `financialRuleCalculations.ts` L80-131 — sem imports em componentes.

**Impacto:** Funcionalidade de projeção semanal documentada no tipo `FinancialRuleStats.projection` nunca exibida.

---

### Validação de mapeamento ignora categorias se lista vazia no DB

**Severidade:** Médio

**Evidência:** `financialRule.ts` L84-87 — `if (categories.length > 0)` antes de `validateCategoryMapping`.

---

### Wizard não permite pular passo 1 em primeira configuração com categorias vazias

**Severidade:** Baixo

**Evidência:** Passo 2 com lista vazia — `allCategoriesMapped` true trivialmente.

---

## Itens sem achado

- Wizard 2 passos com indicador
- Validação percentuais no client e serviço
- Badge categorias novas
- Barras com segmentação visual de excesso
- Uma regra por usuário (`maybeSingle`)

## Referências cruzadas

- Módulos 03, 08, 10 (critérios de totais)
