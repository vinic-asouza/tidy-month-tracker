# Relatório QA — 05 Gastos

| Campo | Valor |
|-------|-------|
| **Módulo** | Gastos (Despesas) |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `frontend/src/components/ExpenseSection.tsx`, `frontend/src/services/adapters/supabase/expenses.ts`, `frontend/src/utils/business/installments.ts`, `frontend/src/utils/business/repeatMonths.ts` |

---

## Resumo executivo

**Veredito geral:** Requer atenção — maior complexidade do sistema; lógica de parcelas e repetição correta em código, com riscos de atomicidade e UX.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 2 |
| Médio | 4 |
| Baixo | 1 |

---

## Mapa de fluxos validados

| # | Checklist | Status |
|---|-----------|--------|
| 1 | Gasto variável | OK |
| 2 | Gasto fixo com/sem repetição | OK |
| 3 | Gasto parcelado + meses futuros | OK |
| 4 | Editar/excluir escopo parcelas | OK |
| 5 | Marcar pago (não-cartão) | OK |
| 6 | Gasto em cartão herda status | OK |
| 7 | CRUD categorias + rename propagado | OK |
| 8 | Não excluir categoria em uso | OK sem feedback |
| 9 | Ordenação e visões | OK |

---

## Achados

### Criação de parcelas/repetições não atômica (múltiplos INSERTs)

**Severidade:** Alto

**Evidência:** `supabase/expenses.ts` L91-166 — loop de INSERTs sem transação. Documentado em `PLANO_FRONTEND_DIRETO_SUPABASE.md`.

**Impacto:** Falha no meio pode deixar parcelas parciais.

**Recomendação:** RPC Postgres ou compensação/rollback no cliente.

---

### Excluir parcela "este mês" deixa parcelas futuras órfãs na série

**Severidade:** Alto

**Evidência:** `deleteExpense(id, false)` — DELETE único registro. Parcelas futuras com mesmo `base_expense_id` permanecem. Pode ser intencional, mas fluxo "Excluir apenas este mês" em item parcelado usa `deleteInstallment` só no fluxo "todas" (`ExpenseSection` L897-904 vs L911-917).

**Comportamento atual:** `handleConfirmDelete` para installment chama sempre `onDeleteInstallment` (L913-914), não `onDelete(id, false)`.

**Comportamento esperado:** "Apenas este mês" em parcela deveria remover só uma parcela.

**Recomendação:** Revisar matriz delete: installment + escopo mês único.

---

### Checkbox "pago" habilitado para gasto em cartão na lista em alguns modos

**Severidade:** Médio

**Evidência:** `ExpenseSection` — `isExpenseLinkedToCard` desabilita toggle em `ExpenseRow` (verificar implementação). Gastos em cartão devem usar só status do cartão — auditoria indica lógica em `isPaid` derivado; inconsistência se usuário marcar `paid` direto no DB.

**Recomendação:** Garantir `onUpdate({ paid })` bloqueado para linked card na UI (verificar `ExpenseRow`).

---

### Exclusão de categoria em uso sem feedback

**Severidade:** Médio

**Evidência:** `ExpenseSection.tsx` L756-757 — `return` silencioso.

---

### Dialog fecha antes de confirmar persistência

**Severidade:** Médio

**Evidência:** Mesmo padrão de Entradas — `handleSubmit` fecha dialog sem await.

---

### Tipo `variable` sem distinção de regra de repetição

**Severidade:** Médio

**Evidência:** Apenas `fixed` oferece `repeatAllMonths` no form (L184). Variável nunca repete — consistente com análise.

---

### `reorderExpenses` sem UI

**Severidade:** Baixo

---

## Itens sem achado

- Validação valor > 0, categoria, descrição, pagamento
- Três tipos com abas no form
- `ensureRemainingInstallmentsExist` ao editar parcelas
- Agrupamento fixo/variável/parcelado
- `ApplyToAllDialog` para fixo e parcelado
- Propagação rename categoria via settings service

## Referências cruzadas

- Módulos 06, 08, 09, 02 (`canDeleteCard`)
