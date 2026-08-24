---
type: adr
id: ADR-001
titulo: Produção = SPA na Vercel + Supabase direto
status: Aceito
data: 2026-08-23
autor: Development
decisores: [Development]
tags: [infra, backend, supabase, vercel]
---

# ADR-001 — Produção = SPA na Vercel + Supabase direto

## Contexto e problema

O monorepo tem `frontend`, `backend` (Express) e `landing`. Precisava de um caminho de produção para o beta (poucos usuários) sem hospedar API própria.

**Problema técnico:** onde rodar o app e quem fala com o Postgres.

**Por que registrar:** o Express ainda está no git; alguém pode ligar `VITE_DATA_PROVIDER=api` e quebrar o produto.

## Forças

- Beta pequeno (~1–3 pessoas)
- Sem ops para Node 24×7
- Mesmo Postgres se um dia voltar o Express
- Landing e backend **não** devem ir no mesmo deploy do app

## Decisão

**Decidimos** publicar só o SPA (`frontend/dist`) na **Vercel** (push em `main`) e, em produção, o browser acessa **Supabase** (Auth + PostgREST). O Express **não** entra nesse deploy (`.vercelignore`). `VITE_DATA_PROVIDER` em produção = `supabase`.

Integrações: [`../06_integracoes/vercel.md`](../06_integracoes/vercel.md), [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md). Visão: [`../03_arquitetura/visao-geral.md`](../03_arquitetura/visao-geral.md).

## Opções consideradas

### Opção 1: SPA + Supabase _(escolhida)_

**Prós:** um host estático; Auth e RLS no provedor; custo baixo no beta.  
**Contras:** lógica composta (série, parcelas, resgate) sem transação única no adapter; anon key no bundle (mitigado na ADR-003).

### Opção 2: SPA + Express na frente do Postgres _(descartada nesta fase)_

**Prós:** transação SQL; esconder PostgREST.  
**Contras:** outro runtime; o Express **atual** não cobre carteiras, desejos nem `account_operations`.

### Opção 3: BaaS só Auth + API própria _(descartada)_

Duplicaria Postgres e Auth sem ganho no tamanho do time.

## Justificativa

Velocidade e um único banco. O dual adapter (ADR-002) deixa a porta do Express aberta **depois** que as rotas existirem.

## Consequências

**Positivas:** deploy previsível; schema único.

**Negativas:** `VITE_DATA_PROVIDER=api` em produção hoje quebra o domínio; inserts em lote podem falhar no meio; sem WAF/rate limit nossos.

**Follow-up:** só ligar `api` com Express hospedado **e** rotas completas; `VITE_API_URL` + `CORS_ORIGIN`.

## Conformidade

| Mecanismo | Como |
| --- | --- |
| Env Vercel | `VITE_DATA_PROVIDER=supabase` |
| `vercel.json` / `.vercelignore` | só frontend |
| Review | recusar `service_role` em `VITE_*` |

## Notas

Índice: [index.md](./index.md).
