---
type: arquitetura
titulo: Segurança
ultima_atualizacao: 2026-08-21
---

# Segurança

Escopo: o que o código e o Supabase fazem hoje. Políticas de produto: [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md).

---

## Autenticação

- Supabase Auth: e-mail/senha; confirmação de cadastro; recovery.
- Sessão: `persistSession` + `autoRefreshToken` + `localStorage` (`integrations/supabase/client.ts`).
- Rota `/` envolvida em `ProtectedRoute`; sem user → `/auth`.
- Cliente criado só com **publishable/anon key**. Sem `service_role` em `VITE_*` ou no bundle.

---

## Autorização de dados

RLS em Postgres: cada linha de negócio exige `user_id = auth.uid()`. O frontend filtra por `userId` da sessão, mas a **barreira real** é o RLS (a anon key é pública).

Modo `api`: Express deve validar o JWT e usar o `user_id` do token — nunca o id vindo só do body sem checagem.

---

## O que a anon key permite

Quem extrai a chave do JS **ainda** só lê/grava o que o RLS autoriza para o JWT daquele usuário. Sem JWT válido, as políticas bloqueiam. Por isso políticas RLS incompletas ou `user_id` errado no insert são o risco principal — não “esconder a anon key”.

---

## Validações só no cliente

Valor > 0, percentuais da regra, formulários: **Zod/UI**. Um cliente adulterado pode mandar PostgREST fora dessas regras se o schema permitir. Aceito para beta; P4 sugere CHECK no banco. Ver políticas. ADR: [`../07_decisoes-tecnicas/ADR-006-validacao-no-cliente.md`](../07_decisoes-tecnicas/ADR-006-validacao-no-cliente.md).

---

## Outros controles

| Tema | Estado |
| --- | --- |
| CORS do Express | `CORS_ORIGIN` — irrelevante na produção atual |
| Secrets | `.env`, `.env.local` no `.gitignore` |
| XSS / HTML | UI React; sem markdown de usuário na KB |
| Cartão pelo nome | Não é falha de auth; é risco de **integridade** (dois cartões homônimos). ADR: [`../07_decisoes-tecnicas/ADR-005-cartao-por-nome.md`](../07_decisoes-tecnicas/ADR-005-cartao-por-nome.md) |
| Atomicidade | Vários INSERTs (repetição/parcelas) sem transação única no modo Supabase — falha parcial possível |

Não há WAF, rate limit de produto, 2FA nem audit log além do que o Supabase oferecer no plano.
