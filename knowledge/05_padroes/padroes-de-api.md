---
type: padrao
titulo: Padrões de API
ultima_atualizacao: 2026-08-23
---

# Padrões de API

Arquitetura: [`../03_arquitetura/api-design.md`](../03_arquitetura/api-design.md). Segurança: [`../03_arquitetura/seguranca.md`](../03_arquitetura/seguranca.md).

Em produção **não há REST próprio**. O contrato estável da UI são os **facades** em `frontend/src/services/`.

---

## Camada que a UI pode chamar

```text
Hook / página
    → services/<dominio>.ts          # facade (assinatura TypeScript)
        → adapters/select.ts         # supabase | api
            → adapters/supabase/*    # supabase-js (produção)
            → adapters/api/*         # api/client.ts (não produção)
```

Facades atuais: `incomes`, `expenses`, `investments`, `creditCards`, `settings`, `financialRule`, `wishItems`, `accounts`, `accountBalances`, `accountOperations`.

Leitura em lote: `financeQueries.ts` (`fetchMonthBundle`, `fetchYearData`, `fetchMonthsRange`) — `Promise.all` por mês.

Auth **não** passa por essa árvore: `AuthContext` → `supabase.auth`.

---

## Regra para código novo (produção)

1. Expor operação no facade (`services/foo.ts`) com tipos em `domain.ts` / `params.ts`.
2. Implementar **os dois** adaptadores se o domínio já tem par `supabase` + `api`. Se o Express **não** tiver rota (carteiras, desejos, operações), o adaptador `api` pode existir no frontend e ainda assim **não** fechar o produto — não ligue `VITE_DATA_PROVIDER=api` em produção.
3. Mapear linha Postgres → domínio em `adapters/mappers.ts` (`snake_case` → camelCase, `Number()` em valores).
4. User id: sessão (`getAuthUserId` em `adapters/supabase/helpers.ts` ou equivalente). Não confiar só no id que a UI mandou.
5. Erro PostgREST: `throwIfError` (helpers). Não engolir `error` e retornar lista vazia como se fosse sucesso.
6. Componentes **não** chamam `supabase.from(...)` nem `apiClient` para CRUD financeiro.

`getDataProvider()`: `import.meta.env.VITE_DATA_PROVIDER === 'supabase'` → Supabase; senão `api`.

---

## Modo `api` (Express) — convenção se for evoluir

Cliente: `frontend/src/api/client.ts`.

- `VITE_API_URL` (default `http://localhost:3000`)
- `Authorization: Bearer <access_token>` da sessão Supabase
- JSON; 204 sem body
- Falha → `ApiClientError` (`statusCode`, `details` do Zod)

Rotas montadas hoje (`backend/src/index.ts`):

| Prefixo | Domínio |
| --- | --- |
| `GET /health` | Healthcheck (sem JWT) |
| `/api/incomes` | Entradas |
| `/api/expenses` | Gastos |
| `/api/investments` | Investimentos |
| `/api/credit-cards` | Cartões |
| `/api/settings` | Settings |
| `/api/financial-rule` | Regra financeira |

**Não existem** rotas Express para `accounts`, `account_balances`, `account_operations`, `wish_items`.

### Forma das rotas existentes

- Router Express + `authenticate` em tudo que não é `/health`.
- Query de mês: `?month=YYYY-MM` (ex.: GET/POST `/api/incomes`).
- Body validado com **Zod** na rota; `400` + `{ error, details }` se falhar.
- Service usa `req.userId` do token (`infra/auth.ts` → `supabase.auth.getUser(token)`).
- SQL com `$1`, `$2` via `pg` (`DATABASE_URL`). Sem concatenar SQL.
- Respostas: `200` JSON, `201` no create, `{ success: true }` em parte dos updates.
- Erros não tratados: `errorHandler` (`500` + `error`; `stack` só com `NODE_ENV=development`).

CORS: `CORS_ORIGIN` (default `http://localhost:8080`). Produção futura: origem da Vercel.

Não exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.

---

## PostgREST (produção)

Não desenhe recursos REST “bonitos” no SPA. O browser fala tabelas/colunas via `supabase-js`. Filtros: `user_id` + `year_month` (ou o equivalente do domínio). RLS é a barreira; o filtro no cliente não substitui política.

Operações compostas (vários INSERTs de série/parcelas) **não** são transação única no adaptador Supabase. Código novo que precise atomicidade: RPC Postgres ou, no futuro, Express — não fingir que `Promise.all` de inserts é atômico.

---

## Versionamento e breaking change

Não há versionamento `/v1`. Mudança de contrato = mudança de tipo no facade + mapper + (se aplicável) coluna via migration. Documente em [`../04_modulos/`](../04_modulos/index.md) e, se for decisão, em [`../07_decisoes-tecnicas/`](../07_decisoes-tecnicas/index.md).
