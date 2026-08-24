---
type: adr
id: ADR-003
titulo: Isolamento por RLS; anon key no cliente
status: Aceito
data: 2026-08-23
autor: Development
decisores: [Development]
tags: [seguranca, banco]
---

# ADR-003 — Isolamento por RLS; anon key no cliente

## Contexto e problema

Com SPA → PostgREST (ADR-001), a chave do client é pública.

**Problema técnico:** o que impede um usuário de ler a linha do outro.

**Por que registrar:** “esconder a anon key” não é o modelo; RLS incompleta é o furo.

## Forças

- RN-G01: só os próprios dados
- Sem backend na frente em produção
- `service_role` bypassa RLS — nunca em `VITE_*`

## Decisão

**Decidimos** que toda tabela de negócio tem **RLS** com políticas `auth.uid() = user_id` (SELECT/INSERT/UPDATE/DELETE, salvo exceções já existentes em `profiles` / `finance_settings` sem DELETE). O client do SPA usa só a **publishable/anon key**. `user_id` no insert deve ser o da sessão (`getAuthUserId`).

Modo Express (não produção): JWT validado; queries com `user_id` do token, não só do body. [`../03_arquitetura/seguranca.md`](../03_arquitetura/seguranca.md), [`../05_padroes/padroes-de-banco-de-dados.md`](../05_padroes/padroes-de-banco-de-dados.md).

## Opções consideradas

### Opção 1: RLS + anon no SPA _(escolhida)_

**Prós:** alinhado ao BaaS; sem API para “fazer de proxy”.  
**Contras:** política errada = incidente; chave visível no JS (esperado).

### Opção 2: service_role no frontend _(rejeitada)_

Qualquer um no DevTools vira admin do banco.

### Opção 3: API obrigatória com service_role só no server _(adiada)_

É o modelo do Express futuro; hoje o servidor não cobre o produto (ADR-001).

## Justificativa

A barreira real é a política, não o segredo da anon key.

## Consequências

**Positivas:** isolamento por linha sem app server.

**Negativas:** tabela nova **sem** RLS é bug de segurança; filtro só no cliente não basta.

**Follow-up:** migration nova = ENABLE RLS + quatro verbos; nunca `VITE_` com service_role.

## Conformidade

| Mecanismo | Como |
| --- | --- |
| Migration | `ENABLE ROW LEVEL SECURITY` + policies |
| Client | só `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Review | recusar `service_role` no SPA |

## Notas

Índice: [index.md](./index.md).
