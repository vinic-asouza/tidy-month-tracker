---
type: adr
id: ADR-002
titulo: UI só fala com facades; adapters supabase ou api
status: Aceito
data: 2026-08-23
autor: Development
decisores: [Development]
tags: [frontend, api]
---

# ADR-002 — UI só fala com facades; adapters `supabase` \| `api`

## Contexto e problema

A UI precisa CRUD financeiro. Produção usa PostgREST (ADR-001); o git ainda tem Express incompleto.

**Problema técnico:** não espalhar `supabase.from` nem `fetch` nas seções.

**Por que registrar:** componente novo tende a importar o client direto e quebrar o modo `api` futuro.

## Forças

- Trocar provedor sem reescrever listas/forms
- Contrato TypeScript único (`domain.ts`, `params.ts`)
- `getDataProvider()`: só `'supabase'` usa o adapter Supabase; **qualquer outro valor** (vazio inclusive) usa `api`

## Decisão

**Decidimos** que páginas/componentes de negócio importam só **facades** em `frontend/src/services/*.ts`. Os facades delegam a `adapters/select.ts`. Mapeamento snake_case ↔ camelCase em `adapters/mappers.ts`. Bundles de mês/ano em `financeQueries.ts`.

Auth **não** passa por essa árvore (ADR-004). Padrão: [`../05_padroes/padroes-de-api.md`](../05_padroes/padroes-de-api.md).

## Opções consideradas

### Opção 1: Facades + dois adapters _(escolhida)_

**Prós:** UI estável; dá para completar o Express depois.  
**Contras:** dois adapters para manter; `api` mente se o servidor não tem a rota.

### Opção 2: Hooks chamam supabase-js _(descartada)_

**Prós:** menos arquivos.  
**Contras:** acoplamento; modo `api` vira rewrite.

### Opção 3: Só Express, UI REST _(descartada nesta fase)_

Contradiz ADR-001.

## Justificativa

Isola o “como persiste” do “o que a tela precisa”. O default perigoso (`!== 'supabase'` → `api`) é documentado de propósito.

## Consequências

**Positivas:** CRUD novo tem lugar óbvio (facade + os dois adapters se o domínio já tem par).

**Negativas:** adapters `api` de carteiras/desejos/operações **existem** no frontend e o Express **não** — ligar o modo `api` quebra.

**Follow-up:** feature nova = os dois lados **ou** deixar o adapter `api` explícito como stub que falha.

## Conformidade

| Mecanismo | Como |
| --- | --- |
| Review | `components/` sem `supabase.from` nem `apiClient` para CRUD financeiro |
| Env | produção `VITE_DATA_PROVIDER=supabase` |

## Notas

Índice: [index.md](./index.md).
