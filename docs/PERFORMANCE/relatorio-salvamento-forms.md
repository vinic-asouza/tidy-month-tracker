# Relatório de Performance — Salvamento de Formulários

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-07 |
| **Agente** | Performance & Scalability Engineer (`docs/PERFORMANCE/performance-specialist.mdc`) |
| **Escopo** | Latência percebida ao salvar registros (entradas, gastos, investimentos, carteiras, cartões, faturas) |

---

## Resumo executivo

O tempo entre clicar em "Salvar" e o modal fechar era dominado por **sincronizações secundárias** executadas dentro do mesmo `await` que o componente aguardava — não pelo write principal no Supabase.

As otimizações aplicadas reduzem o caminho crítico do modal para: **validação → write principal → merge otimista no cache**. Sincronizações de fatura, histórico de carteiras e dados anuais passam a rodar em background.

---

## Diagnóstico (antes das mudanças)

### Padrão identificado

```
Modal → await onAdd/onUpdate → hook (otimista + API + syncs) → setIsOpen(false)
```

### Gargalos por severidade

| Severidade | Problema | Impacto no fechamento do modal |
|------------|----------|-------------------------------|
| Alto | `await syncInvoicePaymentsForMonth()` após todo add/update/delete de gasto | +1 RTT por cartão com fatura paga |
| Alto | `await refreshAffectedYearMonths()` em gastos fixos/parcelados e "aplicar a todos" | Invalidava mês atual + refetch sequencial de até 12 meses |
| Alto | `await invalidateAccountHistory()` em transferência, resgate e pagamento de fatura | Refetch de N meses × 5 queries |
| Alto | `await refreshYearMonths()` em entradas/investimentos com `repeatAllMonths` | Até 12 × 5 queries sequenciais |
| Médio | `getMonthItemCount` antes de cada create | +1 RTT por save |
| Médio | `fetchCreditCards()` após criar cartão | Refetch desnecessário da lista |
| Médio | `await invalidateCurrentMonth()` ao renomear cartão | Refetch de 5 tabelas do mês |

### Meta de referência

Save simples (entrada/investimento variável): **< 500 ms** em rede local, com **1 request** de escrita (sem COUNT extra).

---

## Instrumentação adicionada

Helper em [`frontend/src/utils/perf/saveTiming.ts`](../../frontend/src/utils/perf/saveTiming.ts).

Em modo dev (`import.meta.env.DEV`), operações instrumentadas logam no console:

```
[save-timing] addIncome total=180ms api=175ms sync=0ms
[save-timing] addExpense total=210ms api=205ms sync=0ms
```

Operações com timing: `addIncome`, `addExpense`, `addInvestment`, `updateExpense`, `payCardInvoice`, `createTransfer`, `createWithdrawal`.

### Checklist de medição manual

1. Abrir DevTools → Console (filtrar `save-timing`) e Network.
2. Executar cada cenário e anotar `total` e `api`:

| Cenário | O que observar |
|---------|----------------|
| Entrada variável | 1 request INSERT; `sync=0ms` |
| Gasto variável (sem faturas pagas) | 1 request INSERT; modal fecha antes de sync de fatura |
| Gasto variável (2 cartões com fatura paga) | Modal fecha após INSERT; sync de fatura em background |
| Gasto fixo + repetir todos os meses | Modal fecha após INSERT; refresh anual em background |
| Investimento + repeatAllMonths | Modal fecha após INSERT; refresh anual em background |
| Pagar fatura | Modal fecha após writes principais; histórico de carteira em background |
| Transferência / Resgate | Modal fecha após operações; histórico em background |

---

## Correções implementadas

### P1 — Sincronizações em background

Arquivo: [`frontend/src/hooks/useSupabaseFinance.ts`](../../frontend/src/hooks/useSupabaseFinance.ts)

- `scheduleSyncInvoicePayments()` — substitui `await syncInvoicePaymentsForMonth()`
- `scheduleInvalidateAccountHistory()` — substitui `await invalidateAccountHistory()`
- `scheduleRefreshYearMonths()` / `scheduleRefreshAffectedYearMonths()` — refresh anual sem bloquear modal
- Renomear cartão: `invalidateCurrentMonth` em background
- Excluir parcelas: `invalidateCurrentMonth` em background (integridade via refetch assíncrono)

### P2 — Remoção de COUNT redundante

Arquivos: [`incomes.ts`](../../frontend/src/services/adapters/supabase/incomes.ts), [`expenses.ts`](../../frontend/src/services/adapters/supabase/expenses.ts), [`investments.ts`](../../frontend/src/services/adapters/supabase/investments.ts)

- `displayOrder` vem do hook (`items.length`); removido `getMonthItemCount` no create.
- `createResgateIncome` também usa `displayOrder` passado pelo hook.

**Ganho:** −1 round-trip por create.

### P3 — Refresh multi-mês otimizado

- `refreshYearMonths`: loop sequencial → `Promise.all` (paralelo).
- `refreshAffectedYearMonths`: removido `invalidateCurrentMonth` duplicado; exclui mês corrente (já atualizado via otimista + `patchYearFromCurrentMonth`).
- Gasto fixo/parcelado: merge do `created` no cache local; refresh dos outros meses em background.

### P4 — Cartão sem refetch

- `addCreditCard`: usa retorno de `createCreditCard` para substituir item `temp-*`.

---

## Ganho esperado (qualitativo)

| Operação | Antes | Depois |
|----------|-------|--------|
| Entrada/investimento variável | 2 RTT (COUNT + INSERT) | 1 RTT (INSERT) |
| Gasto variável com faturas pagas | INSERT + N syncs de fatura | INSERT apenas no caminho crítico |
| Gasto fixo/parcelado | INSERT + invalidate + 12 refetches | INSERT + merge local |
| Pagar fatura / transferência | Writes + refetch histórico completo | Writes apenas no caminho crítico |
| Criar cartão | COUNT + INSERT + refetch lista | COUNT + INSERT (lista via retorno) |

---

## Validação

- **Testes automatizados:** `npm run test` — 174 testes passando.
- **Typecheck:** `npx tsc --noEmit` — sem erros.
- **Regressão manual recomendada:**
  - Valor da fatura paga atualiza após gasto em cartão (background).
  - Histórico de carteira reflete transferência/resgate após alguns segundos.
  - Séries fixas/parceladas aparecem nos meses corretos na visão anual.
  - `repeatAllMonths` propaga dados nos meses futuros.

---

## Fora do escopo desta entrega

- Lazy load do Recharts / carga inicial da visão anual (~60 queries).
- RPC Postgres para agregação anual.
- `React.memo` / unmount de abas inativas (melhoria de re-render pós-save).
