---
type: arquitetura
titulo: API e contratos de dados
ultima_atualizacao: 2026-08-21
---

# API e contratos de dados

Em produção **não há API REST própria**. O browser usa `supabase-js` (PostgREST + Auth). A “API” estável para a UI são os **facades** em `frontend/src/services/`. ADRs: [ADR-001](../07_decisoes-tecnicas/ADR-001-spa-supabase-producao.md), [ADR-002](../07_decisoes-tecnicas/ADR-002-facades-adaptadores.md).

---

## Contrato da UI (produção)

Facades (`incomes.ts`, `expenses.ts`, `investments.ts`, `creditCards.ts`, `settings.ts`, `financialRule.ts`, `wishItems.ts`, `accounts.ts`, `accountBalances.ts`, `accountOperations.ts`):

- Assinatura em TypeScript (`domain.ts` / `params.ts`)
- Delegam a `adapters/select.ts` conforme `VITE_DATA_PROVIDER`
- **`provider.ts`:** só o valor exacto `supabase` ativa o adaptador Supabase; qualquer outro valor (inclusive vazio) cai em `api`

Bundles de leitura: `financeQueries.ts` (`fetchMonthBundle`, `fetchYearData`, `fetchMonthsRange`) — `Promise.all` por mês.

Auth: `AuthContext` → `supabase.auth` (não passa pelo Express).

---

## Modo `api` (Express)

Cliente: `frontend/src/api/client.ts` — `fetch` + `Authorization: Bearer <access_token>` do Supabase.

Rotas montadas em `backend/src/index.ts`:

| Prefixo | Domínio |
| --- | --- |
| `GET /health` | Healthcheck |
| `/api/incomes` | Entradas |
| `/api/expenses` | Gastos |
| `/api/investments` | Investimentos |
| `/api/credit-cards` | Cartões |
| `/api/settings` | Settings |
| `/api/financial-rule` | Regra financeira |

**Não existem** rotas Express para `accounts`, `account_balances`, `account_operations` nem `wish_items`. Há adaptadores `adapters/api/*` no frontend para parte disso, mas o servidor atual não fecha o produto. **Não ligar `VITE_DATA_PROVIDER=api` em produção** até o Express cobrir o domínio.

Reativar no futuro: hospedar o backend, `VITE_API_URL`, `CORS_ORIGIN` = URL da Vercel. Mesmo Postgres. Ver [`infraestrutura.md`](./infraestrutura.md).

---

## Auth nas duas pontas

| Caminho | Auth |
| --- | --- |
| Supabase direto | JWT da sessão; RLS no Postgres |
| Express | Valida o mesmo JWT; queries com `user_id` do token |

Nunca `service_role` no frontend (`VITE_*`).
