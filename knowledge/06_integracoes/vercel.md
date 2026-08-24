---
type: integracao
servico: Vercel
ultima_atualizacao: 2026-08-23
status: Ativo (produção)
---

# Integração — Vercel

Host da **SPA estática**. Não roda Express, não executa Edge Function deste repo, não guarda o Postgres.

Arquitetura: [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md). Git: [`../05_padroes/padroes-de-git.md`](../05_padroes/padroes-de-git.md).

---

## O que usamos

| Recurso | Uso |
| --- | --- |
| Build + CDN do `frontend/dist` | Produção do app |
| Rewrite SPA | `/(.*)` → `/index.html` |
| Env `VITE_*` no build | URL e chave publishable do Supabase; `VITE_DATA_PROVIDER=supabase` |
| Deploy em push | Branch `main` |

## O que **não** usamos

Serverless / cron na Vercel, preview como fonte de verdade de dados (é o mesmo padrão de SPA; o banco é o Supabase), hospedagem do `backend/` ou da `landing/` neste projeto Vercel.

`.vercelignore` exclui `backend/` e `landing/`.

---

## Config no repo

`vercel.json` na raiz:

| Campo | Valor |
| --- | --- |
| `framework` | `vite` |
| `installCommand` | `npm install` |
| `buildCommand` | `npm run build --workspace=frontend` |
| `outputDirectory` | `frontend/dist` |
| `rewrites` | `/(.*)` → `/index.html` |

URL documentada: `https://tidy-month-tracker.vercel.app`.

`VITE_*` é inlined no **build**. Mudou env no dashboard → **redeploy**.

---

## Variáveis no projeto Vercel

| Variável | Valor esperado |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon / publishable |
| `VITE_DATA_PROVIDER` | `supabase` (string exacta) |

Não definir `VITE_API_URL` / `VITE_DATA_PROVIDER=api` neste projeto até o Express cobrir o domínio e estiver hospedado **fora** desta unidade Vercel.

Não colocar `service_role` nem `DATABASE_URL` aqui (iriam para o JS).

---

## Falhas típicas

| Situação | Efeito |
| --- | --- |
| Env `VITE_*` vazia no build | Client Supabase lança no boot (`client.ts`) |
| `VITE_DATA_PROVIDER` ≠ `supabase` | SPA tenta Express; produção quebra (rotas incompletas) |
| Redirect Auth sem a origem Vercel | E-mail de confirmação/recovery falha — ajustar no **Supabase**, não na Vercel |
| Rota profunda sem rewrite | 404 de arquivo estático — o `vercel.json` atual já reescreve |

Não há webhook Vercel no app. Observabilidade = o que o plano Vercel mostrar; não há Sentry neste repo.

---

## Relação com outras integrações

A Vercel só entrega HTML/JS. Toda persistência e Auth continuam no [Supabase](./supabase.md).
