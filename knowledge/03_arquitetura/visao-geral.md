---
type: arquitetura
titulo: Visão geral do sistema
ultima_atualizacao: 2026-09-03
---

# Visão geral

O Finto em **produção** é um SPA React que fala **direto** com o Supabase (Auth + Postgres via PostgREST). O backend Express existe no monorepo para um modo `api` futuro; **não** entra no deploy atual.

Diagrama: [`diagrama-de-sistema.md`](./diagrama-de-sistema.md). Dados: [`banco-de-dados.md`](./banco-de-dados.md). Hosts: [`infraestrutura.md`](./infraestrutura.md).

---

## Stack (evidência no repo)

| Camada | Tecnologia |
| --- | --- |
| UI | React 18, Vite, TypeScript, Tailwind, shadcn/ui |
| Rotas | React Router — `/`, `/auth`, `*` (`App.tsx`) |
| Auth | Supabase Auth (`AuthContext.tsx`), sessão no `localStorage` |
| Dados (produção) | `VITE_DATA_PROVIDER=supabase` → `services/adapters/supabase/*` |
| Dados (opcional) | qualquer outro valor → `adapters/api/*` → Express (`provider.ts`) |
| Regras puras | `frontend/src/utils/business/`, `financialRuleCalculations.ts` |
| Cache | TanStack Query (`useSupabaseFinance`) |

Monorepo npm: `frontend`, `backend`, `landing`. Produção builda só o frontend (`vercel.json`).

---

## Camadas no frontend

```
Pages / Components
        ↓
Hooks (useAuth, useSupabaseFinance, useFinancialRule, useWishItems)
        ↓
Facades `services/*.ts`  ← únicos imports de dados da UI
        ↓
select.ts → supabase | api
        ↓
Supabase JS  ou  api/client.ts (Bearer JWT)
```

Componentes **não** importam o cliente Supabase nem o `apiClient` para CRUD financeiro.

---

## Fase atual vs. futuro

| Agora | Depois (documentado, não deployado) |
| --- | --- |
| Vercel estático + Supabase | Hospedar Express; `VITE_DATA_PROVIDER=api` + `VITE_API_URL` |
| 1 sessão = 1 usuário; RLS | Mesmo banco; sem migração destrutiva prevista |
| Beta ~1–3 pessoas | Escalar implica revisar RLS + atomicidade (ver performance) |

O Express **não** cobre ainda carteiras, desejos nem `account_operations` (rotas só de lançamentos clássicos). Reativar `api` hoje quebraria o produto completo. Detalhe: [`api-design.md`](./api-design.md). ADRs: [`../07_decisoes-tecnicas/`](../07_decisoes-tecnicas/index.md) (ADR-001, ADR-002).

---

## O que este sistema não tem (código)

Admin de usuários, pagamentos, Open Finance, exportação CSV/PDF, importação automática (sem revisão), analytics, push, feature flags além de `VITE_DATA_PROVIDER`. Importação **CSV assistida de gastos** (parse no cliente) é exceção documentada em [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md).
