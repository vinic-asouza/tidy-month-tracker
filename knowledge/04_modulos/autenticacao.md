---
type: modulo
nome: Autenticação
status: Ativo
versao: "1.0"
owner: Development
ultima_atualizacao: 2026-08-22
tags: [auth, supabase, frontend]
dependencias: []
---

# Módulo — Autenticação

Documento-base em `knowledge/04_modulos/autenticacao.md`. Atualize quando sessões, rotas de auth ou o contrato do Supabase Auth mudarem.

Arquitetura: [`../03_arquitetura/seguranca.md`](../03_arquitetura/seguranca.md), [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md). ADR: [`../07_decisoes-tecnicas/ADR-004-auth-sempre-supabase.md`](../07_decisoes-tecnicas/ADR-004-auth-sempre-supabase.md).

---

## Overview

Identifica a pessoa, guarda a sessão e decide quem entra no painel. Sem este módulo, o restante do app não carrega dados.

**Responsabilidade única:** sessão Supabase Auth (cadastro, login, logout, recovery por e-mail) e guarda da rota `/`.

**Propósito no produto:** cada conta é individual (RN-G01). Confirmação de e-mail faz parte do ritual de entrada.

---

## Bounded context

### O que este módulo FAZ

- Cadastro com e-mail e senha (confirmação por e-mail)
- Login com e-mail e senha
- Logout
- Pedido de recuperação de senha (e-mail)
- Persistência e refresh da sessão
- Redirecionar visitante em `/` para `/auth` e usuário autenticado em `/auth` para `/`
- Mapear erros do Auth para mensagens em português

### O que este módulo NÃO FAZ

- Papéis, convite, conta compartilhada ou SSO
- Tela de perfil (a tabela `profiles` existe; a UI não lê/edita)
- CRUD financeiro nem totais do mês (resumo: [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md); entradas: [`entradas.md`](./entradas.md); gastos: [`gastos.md`](./gastos.md); cartões: [`cartoes.md`](./cartoes.md); investimentos: [`investimentos.md`](./investimentos.md); carteiras: [`carteiras.md`](./carteiras.md); desejos: [`desejos.md`](./desejos.md); regra financeira: [`regra-financeira.md`](./regra-financeira.md); seleção: [`selecao.md`](./selecao.md))
- Definir nova senha depois do link de recovery (o SPA **não** tem esse formulário; só dispara o e-mail)
- Hospedar SMTP: o e-mail é do Supabase Auth

---

## Estrutura de arquivos

```text
frontend/src/
  App.tsx                          # AuthProvider + rotas
  pages/Auth.tsx                   # UI login / cadastro / esqueci senha
  pages/Index.tsx                  # botão sair (handleSignOut)
  contexts/AuthContext.tsx         # sessão, signUp/signIn/signOut/resetPassword
  components/ProtectedRoute.tsx    # guard de /
  utils/authErrors.ts              # códigos Auth → PT-BR
  integrations/supabase/client.ts  # createClient (persistSession, autoRefreshToken)
```

| Arquivo | Descrição |
| --- | --- |
| `AuthContext.tsx` | Estado `user` / `session` / `loading`; SDK Auth |
| `Auth.tsx` | Formulários + Zod + toasts |
| `ProtectedRoute.tsx` | Spinner enquanto `loading`; senão `Navigate` para `/auth` |
| `authErrors.ts` | `getAuthErrorMessage` |
| `client.ts` | Cliente com chave publishable; sessão no `localStorage` |

---

## Entidades e models

Auth de identidade vive em `auth.users` (Supabase). O app não mapeia essa tabela no TypeScript de domínio.

### Tabela: `profiles`

Criada no signup pelo trigger; **não** há tela que a consuma.

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `user_id` | UUID | Sim | `auth.users.id`, unique, ON DELETE CASCADE |
| `email` | TEXT | Não | Copiado no insert do trigger |
| `created_at` / `updated_at` | timestamptz | Sim | |

### Side-effect no signup

`handle_new_user` (`on_auth_user_created`):

1. `INSERT profiles (user_id, email)`
2. `INSERT finance_settings (user_id)` — tags/categorias padrão para o restante do app

### Contrato TypeScript

```ts
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}
```

`User` / `Session` vêm de `@supabase/supabase-js`.

---

## Interface pública

Não há REST Express para auth. Produção = SDK.

| Operação | SDK | Payload | Observação |
| --- | --- | --- | --- |
| Cadastro | `supabase.auth.signUp` | e-mail, senha, `emailRedirectTo` = `origin + '/'` | E-mail normalizado (`trim` + lower) na UI |
| Login | `supabase.auth.signInWithPassword` | e-mail, senha | |
| Logout | `supabase.auth.signOut` | — | `signOut` do context **lança** se o SDK retornar erro |
| Recovery | `supabase.auth.resetPasswordForEmail` | e-mail, `redirectTo` = `origin + '/auth'` | Sem UI de nova senha no SPA |
| Sessão | `getSession` + `onAuthStateChange` | — | Ver eventos abaixo |

### UI / rotas

| Rota | Componente | Proteção |
| --- | --- | --- |
| `/auth` | `Auth.tsx` | Pública; se já há `user`, `navigate('/')` |
| `/` | `Index.tsx` | `ProtectedRoute` |
| `*` | `NotFound.tsx` | Pública |

### Validação no cliente (`Auth.tsx`)

- E-mail: Zod `.email()`
- Senha: 6–72 caracteres
- Cadastro: senha = confirmação
- Recovery: só e-mail

### Erros comuns (`authErrors.ts`)

| Código / padrão | Mensagem |
| --- | --- |
| `invalid_credentials` | E-mail ou senha incorretos |
| `email_not_confirmed` | Confirme seu e-mail antes de fazer login |
| `user_already_registered` / `user_already_exists` | Este e-mail já está cadastrado |
| `signup_disabled` | Cadastro temporariamente indisponível |
| `weak_password` | Senha muito fraca. Use pelo menos 6 caracteres |
| `over_request_rate_limit` | Muitas tentativas. Aguarde um momento… |
| fallback | Não foi possível concluir a operação. Tente novamente. |

---

## Regras de negócio

Detalhe de política: [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md). Isolamento de dados: [`../02_regras-de-negocio/regras-gerais.md`](../02_regras-de-negocio/regras-gerais.md) **RN-G01**.

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-G01 | Uma pessoa, só os próprios dados (JWT + RLS) | Auth + policies Postgres |
| — | `/` exige sessão | `ProtectedRoute.tsx` |
| — | Confirmação de e-mail antes do login útil | config Auth + toast `email_not_confirmed` |
| — | Sem papéis admin/membro | ausência no frontend |

---

## Dependências

### Módulos internos consumidos

Nenhum. Este módulo é a raiz. Os demais (resumo-e-estatisticas, entradas, …) **consomem** `useAuth().user`.

### Serviços / integrações externas

- Supabase Auth (e-mail de confirmação e recovery): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `@supabase/supabase-js` | Auth + cliente |
| `zod` | Validação do form |
| `sonner` | Toasts |
| `react-router-dom` | `Navigate`, `useNavigate` |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| `onAuthStateChange` | login, logout, refresh | `Session \| null` | `AuthContext` (estado global) |
| `TOKEN_REFRESHED` com `session` null | foco na aba | `getSession()` de novo; **não** desloga | `AuthContext` |
| `on_auth_user_created` | insert em `auth.users` | `profiles` + `finance_settings` | banco (não a UI) |
| N/A | — | Sem webhooks/jobs no app | — |

---

## Configurações

| Variável | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | string | Sim | Projeto Auth + API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | string | Sim | Anon; nunca `service_role` |
| Redirect URLs no dashboard Auth | — | Sim | Produção + localhost; senão confirmação/recovery falham |

`VITE_DATA_PROVIDER` não altera o Auth: a sessão é sempre Supabase.

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos de teste | `utils/__tests__/authErrors.test.ts`, `pages/__tests__/Auth.test.tsx`, `components/__tests__/ProtectedRoute.test.tsx` |
| Cobertura | Cliente coberto (DEV-69) — não inventar % |
| Casos críticos cobertos | Senhas divergentes, toast e-mail não confirmado, redirects |

**Casos críticos (DEV-69):**

- [x] Cadastro com senhas diferentes é recusado no cliente (`Auth.test.tsx`)
- [x] Login sem confirmar e-mail → mensagem via `getAuthErrorMessage` (`authErrors.test.ts` + Auth)
- [x] Sem sessão, `/` redireciona para `/auth` (`ProtectedRoute.test.tsx`)
- [x] Com sessão, `/auth` redireciona para `/` (`Auth.test.tsx`)
- [ ] Refresh de token ao focar a aba não desloga — **residual QA** (DEV-68)

**Como rodar** (quando existirem testes deste módulo):

```bash
npm run test --workspace=frontend
```

---

## Histórico de mudanças

| Data | Versão | Descrição | Issue ID | Autor |
| --- | --- | --- | --- | --- |
| 2026-08-22 | 1.0 | Bootstrap da KB a partir do código | — | Technical Writer |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/autenticacao.md`
- Índice: [`index.md`](./index.md)
- Jornada cadastro/login: [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
