---
type: integracao
servico: Supabase
ultima_atualizacao: 2026-08-23
status: Ativo (produção)
---

# Integração — Supabase

Única API de dados e identidade em **produção**. O SPA fala com Auth + PostgREST via `@supabase/supabase-js`. Sem webhooks nossos, sem Storage, sem Realtime, sem Edge Functions no código.

Arquitetura: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md), [`../03_arquitetura/seguranca.md`](../03_arquitetura/seguranca.md), [`../03_arquitetura/api-design.md`](../03_arquitetura/api-design.md). Padrões: [`../05_padroes/padroes-de-banco-de-dados.md`](../05_padroes/padroes-de-banco-de-dados.md), [`../05_padroes/padroes-de-api.md`](../05_padroes/padroes-de-api.md). Auth de produto: [`../04_modulos/autenticacao.md`](../04_modulos/autenticacao.md). ADRs: [ADR-001](../07_decisoes-tecnicas/ADR-001-spa-supabase-producao.md), [ADR-003](../07_decisoes-tecnicas/ADR-003-rls-chave-anon.md), [ADR-004](../07_decisoes-tecnicas/ADR-004-auth-sempre-supabase.md).

---

## O que usamos

| Produto Supabase | Uso no Finto |
| --- | --- |
| Auth (e-mail/senha) | Cadastro, login, logout, recovery; sessão no `localStorage` |
| E-mail Auth | Confirmação de cadastro e “esqueci senha” (SMTP do Supabase, não nosso) |
| Postgres | Tabelas de negócio + RLS (`user_id = auth.uid()`) |
| PostgREST | CRUD dos adapters `services/adapters/supabase/*` |

## O que **não** usamos (não documente como se existisse)

Storage, Realtime/`channel()`, Edge Functions, Auth OAuth/SSO, Magic Link como fluxo da UI, `service_role` no frontend.

---

## Projeto

| Dado | Valor no repo |
| --- | --- |
| `project_id` | `yoinjsmlntehikilqoxx` (`supabase/config.toml`) |
| Região (KB arquitetura) | `us-east-2` |
| SDK | `@supabase/supabase-js` no workspace `frontend` |

URL pública do projeto é `https://<project_id>.supabase.co`. Não versionar a **service_role**.

---

## Código

| Caminho | Papel |
| --- | --- |
| `frontend/src/integrations/supabase/client.ts` | `createClient`; `persistSession` + `autoRefreshToken` + `localStorage` |
| `frontend/src/integrations/supabase/types.ts` | Tipos gerados — **não editar à mão** |
| `frontend/src/contexts/AuthContext.tsx` | `signUp` / `signInWithPassword` / `signOut` / `resetPasswordForEmail`; `onAuthStateChange` |
| `frontend/src/services/adapters/supabase/` | PostgREST; `getAuthUserId` + `throwIfError` em `helpers.ts` |
| `frontend/src/services/adapters/mappers.ts` | snake_case ↔ camelCase |
| `backend/src/infra/auth.ts` | Só modo `api`: `auth.getUser(jwt)` com **service_role** no servidor |
| `backend/src/infra/database.ts` | Só modo `api`: `pg` + `DATABASE_URL` (SSL) |

Componentes **não** chamam `supabase.from(...)` para CRUD financeiro. Auth pode usar o client direto.

Signup: `emailRedirectTo` = `origin + '/'`. Recovery: `redirectTo` = `origin + '/auth'`. O SPA **não** tem formulário de nova senha depois do link.

---

## Variáveis

### Frontend (vão para o bundle)

| Variável | Obrigatória | Notas |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Sim | URL do projeto |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sim | Anon / publishable. **Nunca** `service_role` |
| `VITE_DATA_PROVIDER` | Produção: `supabase` | Qualquer outro valor seleciona adapters `api` |

Auth **não** depende de `VITE_DATA_PROVIDER`: a sessão é sempre Supabase.

### Backend (não é produção hoje)

| Variável | Uso |
| --- | --- |
| `SUPABASE_URL` | Validar JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | Só no Express; bypassa RLS se usada em query — o código atual usa para `getUser(token)` |
| `DATABASE_URL` | Pool `pg` nas mesmas tabelas |

---

## Dashboard (setup manual)

Sem isto, confirmação e recovery falham:

- **Site URL:** origem da SPA (`https://tidy-month-tracker.vercel.app` em produção)
- **Redirect URLs:** essa origem `/**` + localhost do Vite (`8080`; o repo também cita `5173` se alguém subir na porta default)

Confirm e-mail no Auth: ligado (cadastro espera confirmação).

Schema: `supabase/setup-completo.sql` + `supabase/migrations/`. Regenerar tipos:

```bash
supabase gen types typescript --project-id yoinjsmlntehikilqoxx > frontend/src/integrations/supabase/types.ts
```

---

## Falhas e limites

| Situação | Efeito |
| --- | --- |
| Redirect URL ausente | Link de e-mail não volta ao app |
| RLS incompleta / `user_id` errado no insert | Vazamento ou 403 — a anon key é pública |
| Vários INSERTs de série/parcelas | Sem transação única no adapter Supabase; falha no meio deixa série incompleta |
| Express `VITE_DATA_PROVIDER=api` | Auth continua Supabase; CRUD incompleto (sem carteiras/desejos/operações no servidor) |
| Plano / cota Auth e-mail | Fora do nosso código; fila de e-mail é do Supabase |

Não há retry/circuit breaker nosso em volta do SDK. Erro PostgREST: `throwIfError` → toast na UI.

---

## Webhooks / jobs

Nenhum endpoint nosso recebe webhook do Supabase. Trigger `on_auth_user_created` no **banco** cria `profiles` + `finance_settings`.

---

## Relação com módulos

Todos os módulos de dados persistidos (entradas, gastos, cartões, investimentos, carteiras, desejos, regra) passam por esta integração no modo produção. Seleção não fala com o Supabase. Resumo só lê o que os facades já trouxeram.
