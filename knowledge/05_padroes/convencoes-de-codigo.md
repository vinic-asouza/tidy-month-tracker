---
type: padrao
titulo: Convenções de código
ultima_atualizacao: 2026-08-23
---

# Convenções de código

Stack e pastas: [`../03_arquitetura/visao-geral.md`](../03_arquitetura/visao-geral.md). Módulos: [`../04_modulos/`](../04_modulos/index.md).

---

## Monorepo

Workspaces npm na raiz: `frontend`, `backend`, `landing`.

| Pacote | Papel | Produção |
| --- | --- | --- |
| `frontend` | SPA do produto | Sim (Vercel) |
| `backend` | Express de referência | Não |
| `landing` | Marketing | Fora do `vercel.json` do app |

Scripts na raiz: `dev`, `build`, `lint` e `test` apontam ao **frontend**. Backend: `npm run dev:backend`. Landing: `npm run dev:landing`.

Não misture dependências do app na landing. Não trate o Express como runtime do deploy atual.

---

## TypeScript

- Alias `@/` → `frontend/src/` (`vite.config.ts` e `tsconfig`).
- `strict: false`, `noImplicitAny: false`, unused locals/params desligados (`frontend/tsconfig.app.json` e ESLint `@typescript-eslint/no-unused-vars: off`).
- **Código novo:** tipar parâmetros e retornos públicos; não espalhar `any`. Não é obrigatório ligar `strict` no tsconfig neste passo.
- Domínio da UI: `frontend/src/types/domain.ts`. Constantes financeiras: `frontend/src/types/finance.ts`.
- Params de escrita nos facades: `frontend/src/services/params.ts`.
- Tipos PostgREST gerados: `frontend/src/integrations/supabase/types.ts` — **não editar à mão**.

Backend: `backend/tsconfig.json`, ESM (`"type": "module"`). Landing tem tsconfig próprio.

---

## Lint e formatação

- ESLint 9 só no frontend (`frontend/eslint.config.js`): recommended JS + `typescript-eslint`, `react-hooks`, `react-refresh/only-export-components` em warn.
- **Não há Prettier** nem EditorConfig na raiz.
- Siga o estilo do arquivo vizinho (aspas mistas existem; não reformate o repo inteiro numa Issue).

```bash
npm run lint                 # workspace frontend
```

---

## Onde o código vive (frontend)

```text
frontend/src/
  pages/           # Index, Auth, NotFound
  components/      # domínio + shadcn em ui/
  hooks/           # useSupabaseFinance, useWishItems, useFinancialRule…
  contexts/        # AuthContext
  services/        # facades + adapters (único I/O financeiro da UI)
  types/           # domain, finance
  utils/business/  # regras puras (caixa, parcelas, carteiras…)
  lib/             # cn, datas, chaves de query
  integrations/supabase/  # client + types gerados
  api/client.ts    # fetch do modo api (não é produção)
  test/            # setup Vitest
```

| Fazer | Evitar |
| --- | --- |
| Página/componente → hook → facade `services/*.ts` | Importar `supabase` ou `apiClient` em `components/` para CRUD |
| Regra pura em `utils/business/` (testável sem DOM) | Recalcular caixa só dentro do JSX |
| `cn()` (`lib/utils.ts`) para classes Tailwind | CSS solto que duplica token já existente |
| Componente de domínio em `components/*.tsx` | Copiar `components/ui/*` (shadcn) para “simplificar” |

`AuthContext` **pode** importar o client Supabase (auth não passa pelo facade financeiro).

---

## Nomes

| Coisa | Convenção neste repo |
| --- | --- |
| Componente React | PascalCase, arquivo igual (`IncomeSection.tsx`) |
| Hook | `use` + PascalCase (`useSupabaseFinance.ts`) |
| Facade / função | camelCase (`createIncome`, `getIncomes`) |
| Pasta de adaptador | `adapters/supabase`, `adapters/api` |
| Tabela SQL | snake_case (`year_month`, `account_id`) |
| Campo na UI | camelCase (`yearMonth`, `accountId`) — via `mappers.ts` |
| Mês de navegação | string `YYYY-MM` |
| Data de lançamento | `YYYY-MM-DD` |

Arquivos shadcn antigos (`use-mobile.tsx`, `use-toast.ts`) ficam como o gerador criou; código novo do produto não copia esse hífen.

---

## UI

- React 18, Vite, React Router: `/`, `/auth`, `*` (`App.tsx`). Guard: `ProtectedRoute`.
- Tailwind + tokens do tema; shadcn (`frontend/components.json`, `rsc: false`).
- Toasts de produto: **sonner** (`toast` de `sonner`). `Toaster` Radix também está montado; não introduza uma terceira lib de toast.
- Formulário de auth: **Zod** no cliente. Formulários financeiros: validação na própria seção (padrão atual); se adicionar schema, Zod.
- Copy da UI em **português**.
- Tema: `next-themes`, `storageKey` `tidy-month-tracker-theme`.
- Chaves `localStorage` do produto: prefixo `tidy-` (ex.: `tidy-summary-view-mode`, `tidy-selection-hint-seen`).

---

## Dados e cache

- TanStack Query em `useSupabaseFinance`. Chaves em `frontend/src/lib/financeQueryKeys.ts` (`financeKeys`). Query nova: estenda esse objeto; não espalhe arrays soltos.
- `QueryClient` em `App.tsx`: `staleTime` 60s, `retry: 1`, `refetchOnWindowFocus: false`.
- `VITE_DATA_PROVIDER`: só o valor exacto `supabase` usa o adaptador Supabase; qualquer outro cai em `api` (`adapters/provider.ts`). Produção deve ser `supabase`.

Variáveis do SPA (prefixo `VITE_`, entram no bundle):

| Variável | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | Client Auth + PostgREST |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon / publishable — **nunca** `service_role` |
| `VITE_DATA_PROVIDER` | `supabase` \| outro |
| `VITE_API_URL` | Só modo `api` |

---

## Backend (quando alguém mexer nele)

- Rotas em `backend/src/routes/` + Zod; lógica em `backend/src/services/`; `authenticate` em toda rota de negócio; `errorHandler` por último.
- `user_id` sai do JWT (`req.userId`), nunca só do body.
- `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL` só no servidor. Sem `VITE_*` com service role.

---

## O que este repo não pede

Admin, Open Finance, feature flags além de `VITE_DATA_PROVIDER`, filas, workers, i18n library. Alinhado a [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md).
