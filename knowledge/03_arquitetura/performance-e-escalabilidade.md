---
type: arquitetura
titulo: Performance e escalabilidade
ultima_atualizacao: 2026-08-21
---

# Performance e escalabilidade

O desenho atual é para **beta pequeno** (1–3 usuários). Não está dimensionado como multi-tenant de alto QPS.

---

## Frontend

- **TanStack Query** em `useSupabaseFinance`:
  - mês: `staleTime` 30s
  - ano: só com `statisticsEnabled` (visão Anual); `staleTime` 5 min
  - histórico de carteiras: range derivado de declarações + `earliestMovementMonth`
- `QueryClient` global em `App.tsx`: `staleTime` 60s, `retry: 1`, `refetchOnWindowFocus: false`
- `fetchMonthBundle`: `Promise.all` (incomes, expenses, investments, status de fatura, operações)
- `Statistics` em `lazy()` + `Suspense`
- Tema: `next-themes`; toggle com transição curta

Cálculos de caixa, regra e carteiras são **no cliente** (funções puras). Volume grande de lançamentos aumenta CPU do browser e payload PostgREST, não uma API nossa.

---

## Rede e banco

- Cada troca de mês dispara o bundle do mês.
- Visão anual puxa os 12 meses quando a aba Anual abre.
- Carry-forward de carteira pode buscar um **intervalo** de meses — cresce com o histórico.
- Índices existem (ex.: `payment_method`, `account_id` parciais). Não há cache server-side.

---

## Limites conhecidos

| Limite | Efeito |
| --- | --- |
| Repetição / parcelas = N inserts | Sem transação única no adaptador Supabase; falha no meio deixa série incompleta |
| Sem paginação nas listas do mês | Lista do mês cabe na memória; não há virtualização documentada como requisito |
| SPA estático | Escala de host barata; gargalo vira Supabase (Auth + Postgres) |

---

## Escalabilidade

Crescer usuários implica: revisar RLS e índices, atomicidade (RPC/transação), eventualmente voltar o Express ou Edge Functions para operações compostas (resgate + income, transferência par). Até lá, o caminho é direto PostgREST.

Não há CDN de API, fila, worker nem read replica no desenho atual.
