# Relatório QA — 04 Entradas

| Campo | Valor |
|-------|-------|
| **Módulo** | Entradas (Receitas) |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `frontend/src/components/IncomeSection.tsx`, `frontend/src/services/adapters/supabase/incomes.ts`, `frontend/src/hooks/useSupabaseFinance.ts` (operações de income) |

---

## Resumo executivo

**Veredito geral:** Aprovado com ressalvas.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 0 |
| Médio | 3 |
| Baixo | 2 |

---

## Mapa de fluxos validados

| # | Checklist | Status |
|---|-----------|--------|
| 1 | Criar entrada simples | OK |
| 2 | Repetição anual (`repeatAllMonths`) | OK (adaptador + `calculateRemainingMonths`) |
| 3 | Editar/excluir escopo mês vs todos | OK (`ApplyToAllDialog`) |
| 4 | Marcar recebido | OK |
| 5 | Validação valor ≤ 0, campos vazios | OK (L358-369) |
| 6 | CRUD tags | OK |
| 7 | Não excluir tag em uso | OK com ressalva (sem feedback) |
| 8 | Ordenação e visão resumo | OK |
| 9 | Seleção múltipla | OK |
| 10 | Reordenar (drag) | Não implementado na UI |

---

## Achados

### Exclusão de tag em uso bloqueada sem feedback ao usuário

**Severidade:** Médio

**Evidência:** `IncomeSection.tsx` L329-332 — `if (hasIncomes || isTagLoading) return;` sem toast ou tooltip.

**Recomendação:** Toast "Categoria em uso" ou desabilitar botão com explicação.

---

### `onAdd`/`onUpdate` não aguardam Promise no componente

**Severidade:** Médio

**Evidência:** Props tipadas como `void` em `MonthRecordsSection`; `handleSubmit` chama `onAdd`/`onUpdate` sem `await`. Falhas async só aparecem via toast do hook, dialog fecha imediatamente (L386-387).

**Comportamento atual:** Dialog fecha antes de confirmar persistência; em falha, rollback no hook mas UI já fechou.

**Recomendação:** Tipar handlers como `Promise<boolean>` e aguardar antes de fechar dialog.

---

### Cópias mensais de repetição não herdam `date` atualizada em apply-to-all parcial

**Severidade:** Médio

**Evidência:** `supabase/incomes.ts` — update com `applyToAllMonths` propaga `date` no batch; cópias criadas na inserção usam `itemDate` fixo. Edge case se usuário alterar só descrição em todos os meses — OK; alteração de data em item filho não sincroniza irmãos sem apply-to-all.

**Recomendação:** Documentar ou unificar comportamento de `date` em réplicas.

---

### Repetição limitada ao mesmo ano civil

**Severidade:** Baixo

**Evidência:** `calculateRemainingMonths` — apenas meses 1-12 do ano de `yearMonth`, não continua para ano seguinte.

**Recomendação:** Confirmar se regra de negócio intencional (documentação ANALISE confirma).

---

### `reorderIncomes` exposto sem UI

**Severidade:** Baixo

**Evidência:** Hook exporta; nenhum componente chama.

---

## Itens sem achado

- Validação descrição, valor, tag
- Toggle `received` com preservação de scroll
- Ícone `Repeat` para itens fixos
- Expandir/recolher lista longa
- Optimistic update + rollback no hook
- Apply-to-all para itens com `baseIncomeId`

## Referências cruzadas

- Módulo 08 (tags), Módulo 11 (seleção), Módulo 03 (totais brutos)
