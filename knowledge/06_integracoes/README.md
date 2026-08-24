---
type: index
secao: 06_integracoes
ultima_atualizacao: 2026-08-24
---

# 06 · Integrações

Serviços **externos** que o Finto usa em runtime ou no deploy. Um arquivo por provedor. Código manda se divergir desta KB.

Arquitetura: [`../03_arquitetura/`](../03_arquitetura/README.md). Padrões: [`../05_padroes/`](../05_padroes/README.md). ADRs: [`../07_decisoes-tecnicas/`](../07_decisoes-tecnicas/index.md) (produção = ADR-001).

| Serviço | Papel neste produto | Arquivo |
| --- | --- | --- |
| Supabase | Auth, Postgres, PostgREST, e-mail de cadastro/recovery | [supabase.md](./supabase.md) |
| Vercel | Host estático da SPA | [vercel.md](./vercel.md) |

## Fora deste catálogo

Não são integração de **produto** (não entram no browser do usuário como API de negócio):

| Peça | Onde vive |
| --- | --- |
| GitHub | Código; [`../05_padroes/padroes-de-git.md`](../05_padroes/padroes-de-git.md) |
| Linear | Demanda / Ledger Flow; não há SDK no app |
| npm / Vite / React | Dependências de build; não documentar como “API externa” |
| Express no monorepo | Código nosso, **não** deployado |

## Explicitamente ausente (código + política)

Não invente estes arquivos até existirem no produto: Stripe, Open Finance, SendGrid/Resend próprio, Sentry, analytics, Storage/CDN, Edge Functions, Realtime, push, WhatsApp. Políticas: [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md).
