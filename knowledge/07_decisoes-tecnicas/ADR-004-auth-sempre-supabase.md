---
type: adr
id: ADR-004
titulo: Identidade sempre Supabase Auth
status: Aceito
data: 2026-08-23
autor: Development
decisores: [Development]
tags: [seguranca, auth]
---

# ADR-004 — Identidade sempre Supabase Auth

## Contexto e problema

Há um Express no monorepo. Dá para imaginar sessão própria (cookie, Passport, etc.).

**Problema técnico:** uma identidade só, nos dois modos de dados.

**Por que registrar:** `VITE_DATA_PROVIDER` **não** troca o Auth.

## Forças

- E-mail/senha, confirmação e recovery já no Auth
- RLS usa `auth.uid()` (ADR-003)
- Express, se ligado, só **valida** o JWT (`auth.getUser(access_token)`)

## Decisão

**Decidimos** que cadastro, login, logout e recovery passam só por **Supabase Auth** (`AuthContext` → `supabase.auth`). Sessão: `persistSession` + `autoRefreshToken` + `localStorage`. O SPA **não** implementa tela de nova senha após o link (só dispara o e-mail).

Módulo: [`../04_modulos/autenticacao.md`](../04_modulos/autenticacao.md). Integração: [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md).

## Opções consideradas

### Opção 1: Auth só no Supabase _(escolhida)_

**Prós:** um provedor; JWT = RLS; Express reusa o token.  
**Contras:** e-mail/SMTP e redirect URLs no dashboard; dependência de cota Auth.

### Opção 2: Sessão no Express _(descartada)_

Dois logins ou sync frágil com `auth.users`.

### Opção 3: OAuth/SSO _(fora de escopo)_

Política de produto: conta individual e-mail/senha.

## Justificativa

`auth.uid()` é a chave do modelo de dados. Outra identidade quebraria RLS.

## Consequências

**Positivas:** modo `api` não inventa usuário.

**Negativas:** Site URL / Redirect URLs errados = e-mail morto; recovery sem form de senha no SPA.

**Follow-up:** form de nova senha só se produto pedir; SSO só com decisão de produto.

## Conformidade

| Mecanismo | Como |
| --- | --- |
| Código | `ProtectedRoute` + `AuthContext`; sem tabela de senha nossa |
| Dashboard | Site URL = origem da SPA (Vercel + localhost) |

## Notas

Índice: [index.md](./index.md).
