---
type: modulo
nome: Entradas
status: Ativo
versao: "1.0"
owner: Development
ultima_atualizacao: 2026-10-16
tags: [entradas, incomes, frontend, supabase]
dependencias: [autenticacao]
---

# Módulo — Entradas

Documento-base em `knowledge/04_modulos/entradas.md`. Atualize quando o CRUD de receitas, a efetivação ou a série anual mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/entradas.md`](../02_regras-de-negocio/regras-por-modulo/entradas.md). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Persistência: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md).

---

## Overview

Registra **receitas do mês** (salário, extras, rendimentos) e as marca como recebidas. Sem este módulo o resumo não tem lado “entrou”.

**Responsabilidade única:** persistir e editar linhas na tabela `incomes` (incluindo tags em `finance_settings.income_tags`) e o toggle de efetivação `received`.

**Propósito no produto:** a pessoa planeja o que deve entrar e confirma quando o dinheiro chegou — no caixa efetivado, só conta o que está `received` (RN-G02, RN-G03).

---

## Bounded context

### O que este módulo FAZ

- CRUD de entradas do mês autenticado (`description`, `value`, `tag`, `date`)
- Nascer **não recebida** (RN-E01)
- Marcar recebida / desmarcar pelo toggle `StatusToggleBadge` (só `received`; sem diálogo nem carteira) (RN-E02)
- Repetir nos outros 11 meses do **mesmo ano civil**; editar/excluir “só este mês” ou “este e os seguintes da série”; `received` não se copia (RN-E03, RN-G05)
- Tratar entradas históricas com a tag `Resgate de investimentos` como entradas normais: editáveis, excluíveis e com toggle livre (RN-E04)
- CRUD de tags de entrada; renomear propaga em **todas** as `incomes` do usuário; excluir bloqueado se a tag estiver em uso em **qualquer** mês (RN-E05 / RN-G06)

### O que este módulo NÃO FAZ

- Totais do mês / gráfico anual ([`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) só **lê** `incomes`)
- CRUD de gastos ([`gastos.md`](./gastos.md)), cartões ([`cartoes.md`](./cartoes.md)), aportes ([`investimentos.md`](./investimentos.md)), desejos ([`desejos.md`](./desejos.md)) ou regra financeira ([`regra-financeira.md`](./regra-financeira.md))
- Criar resgate automático ou vincular a carteira: **removido** na DEV-151 ([`carteiras.md`](./carteiras.md), tombstone)
- Seleção múltipla / barra inferior ([`selecao.md`](./selecao.md); a seção só encaminha `selectedIds`)
- Reordenar `display_order` na UI (o serviço `reorderIncomes` existe; nenhum componente chama)

---

## Estrutura de arquivos

```text
frontend/src/
  components/IncomeSection.tsx                 # lista, form, tags, toggle recebido
  components/MonthRecordsSection.tsx           # aba Entradas
  hooks/useSupabaseFinance.ts                  # add/update/deleteIncome, tags
  services/incomes.ts                          # facade
  services/adapters/supabase/incomes.ts        # PostgREST + cópias da série
  services/adapters/api/incomes.ts             # Express (não é produção)
  services/adapters/supabase/settings.ts       # income_tags + rename em incomes
  types/domain.ts                              # Income
  types/finance.ts                             # IncomeEntry, DEFAULT_INCOME_TAGS, RESGATE_INCOME_TAG
  utils/business/repeatMonths.ts               # calculateRemainingMonths
  utils/business/seriesUpdates.ts              # omitPerMonthFields
  utils/business/monthTotals.ts                # isResgateIncome, getResgateInflowFromIncomes (tag histórica)
```

| Arquivo | Descrição |
| --- | --- |
| `IncomeSection.tsx` | Validação no cliente, série, tags, toggle de recebido |
| `incomes.ts` (supabase) | INSERT/UPDATE/DELETE; clones com `base_income_id` |
| `useSupabaseFinance.ts` | Optimistic update |
| `repeatMonths.ts` | Outros 11 meses do mesmo `YYYY`, inclusive já passados |
| `seriesUpdates.ts` | Não propaga `received` no “aplicar aos seguintes” |

Backend `backend/src/routes/incomes.ts` + Zod existe no monorepo; **produção não usa** (SPA → Supabase).

---

## Entidades e models

### Tabela: `incomes`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `user_id` | UUID | Sim | `auth.users`; RLS |
| `year_month` | TEXT | Sim | `YYYY-MM` do lançamento |
| `description` | TEXT | Sim | |
| `value` | DECIMAL(15,2) | Sim | UI exige `> 0`; sem CHECK no banco |
| `tag` | TEXT | Sim | Texto livre alinhado a `income_tags` |
| `date` | TEXT | Sim (insert) | `YYYY-MM-DD`; domínio permite `null` |
| `received` | BOOLEAN | Sim | Default `false` |
| `repeat_all_months` | BOOLEAN | Sim | Série no ano civil |
| `base_income_id` | UUID | Não | Pai da série; `ON DELETE CASCADE` |
| `display_order` | INTEGER | Sim | Default 0; sem UI de reorder |
| `created_at` / `updated_at` | timestamptz | Sim | Trigger de `updated_at` |

### Tabela: `finance_settings` (recorte)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `income_tags` | TEXT[] | Lista da pessoa; seed `DEFAULT_INCOME_TAGS` no signup |

### Contrato TypeScript (`Income`)

```ts
interface Income {
  id: string;
  description: string;
  value: number;
  tag: string;
  date: string | null;
  received: boolean;
  repeatAllMonths?: boolean;
  baseIncomeId?: string;
  createdAt?: string;
}

type IncomeEntry = Income;

const RESGATE_INCOME_TAG = 'Resgate de investimentos';
```

`CreateIncomeParams` = `Income` sem `id` + `userId?`, `yearMonth`, `displayOrder?`.

### Enums / constantes

| Nome | Valores |
| --- | --- |
| `RESGATE_INCOME_TAG` | `'Resgate de investimentos'` |
| `DEFAULT_INCOME_TAGS` | Salário, Benefício, Extra, Bonificação, Pagamento de terceiros, Freelance, Resgate de investimentos, Rendimentos, Presente, Outros |

`isResgateIncome`: `tag === RESGATE_INCOME_TAG`. Usado só para tirar essas entradas da renda **planejada** (RN-G03); não bloqueia edição.

---

## Interface pública

Não há REST de produção. Produção = facade + hook + PostgREST.

| Operação | Onde | Auth | Input | Efeito |
| --- | --- | --- | --- | --- |
| Listar mês | `getIncomes(userId, yearMonth)` | JWT + RLS | `YYYY-MM` | `Income[]` (`display_order`) |
| Criar | `createIncome` | idem | payload; `received` default false | INSERT; se `repeatAllMonths`, clones nos outros 11 meses (`received: false`, `base_income_id` = id criado) |
| Atualizar | `updateIncome` | idem | `updates`, `applyToAllMonths?` | Um id, ou ids da série com `year_month >=` mês atual; `omitPerMonthFields` no lote |
| Excluir | `deleteIncome` | idem | `applyToAllMonths?` | Um id ou série `>=` mês atual |
| Tags | `updateIncomeTags` / `updateIncomeTagInIncomes` | idem | lista / old→new | Settings + `UPDATE incomes SET tag` de todo o user |
| Reorder | `reorderIncomes` | idem | lista do mês | Só serviço; UI não chama |

Ligar/desligar `repeatAllMonths` no update: **liga** e não é cópia (`!base_income_id`) → insere os outros meses; **desliga** → apaga linhas com aquele `base_income_id`.

### Validação no cliente (`IncomeSection`)

- Descrição não vazia
- Valor `> 0`
- Tag obrigatória
- Sem Zod neste form (o Zod de `backend/src/routes/incomes.ts` só vale no modo API)

### UI / rotas

Mesma rota autenticada `/`. Aba de registros `activeTab = 'income'` (rótulo **Entradas**). Sem URL própria.

| Superfície | Componente | Observação |
| --- | --- | --- |
| `/` · aba Entradas | `IncomeSection` | Form, lista, visão resumo por tag, sort |
| Dialog série | `ApplyToAllDialog` | Editar/excluir este mês vs seguintes |

### Erros comuns (toasts do hook)

| Situação | Mensagem |
| --- | --- |
| Falha create | Erro ao adicionar entrada |
| Falha update | Erro ao atualizar entrada |
| Falha delete | Erro ao excluir entrada |
| Tag em uso no histórico | Não é possível excluir: esta categoria está em uso no histórico de entradas |

Falha de um mês em `fetchYearData` não é deste módulo (resumo/estatísticas).

---

## Regras de negócio

Detalhe: [`../02_regras-de-negocio/regras-por-modulo/entradas.md`](../02_regras-de-negocio/regras-por-modulo/entradas.md). Gerais: RN-G01, RN-G02, RN-G04, RN-G05, RN-G06, RN-G08 (tag histórica).

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-E01 | Nova entrada `received = false`; tag + descrição; valor > 0 | `IncomeSection.handleSubmit` + `createIncome` (`received ?? false`) |
| RN-E02 | Toggle recebido (só flag) | `handleToggleReceived` → `onUpdate({ received })` |
| RN-E03 | Série no ano civil; `received` não copia; edição “siguientes” = `year_month >=` atual | `calculateRemainingMonths`, `omitPerMonthFields`, `updateIncome`/`deleteIncome` |
| RN-E04 | Tag *Resgate de investimentos* é histórica; entrada normal | `RESGATE_INCOME_TAG`; `isResgateIncome` (planejado) |
| RN-E05 | CRUD tags; rename propaga | `updateIncomeTag` no hook |
| RN-G06 | Não excluir tag em uso **em qualquer mês** | Adapter `updateIncomeTags` (existence check em `incomes`); UI propaga erro |
| RN-G08 | Tag histórica no caixa efetivado / fora do planejado | `monthTotals.ts` (módulo resumo) |

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — `user.id`; RLS
- [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — **não** é dependência de escrita; o resumo consome as linhas deste módulo

### Serviços / integrações externas

- Supabase PostgREST (`incomes`, `finance_settings`): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `@tanstack/react-query` | Cache do bundle do mês (hook) |
| `sonner` | Toasts de erro / tag em uso |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| Mutação `incomes` | CRUD / efetivar | Bundle do mês (e meses da série se `applyToAllMonths` / repeat) | Resumo e regra no mesmo `MonthData` |
| N/A | — | Sem webhooks/jobs no app | — |

---

## Configurações

Nenhuma env exclusiva. Mesmo `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` e sessão. [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md).

| Chave | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `VITE_DATA_PROVIDER` | string | Não | Só muda o adapter; fórmulas e UI são as mesmas |

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos de teste deste módulo | Nenhum spec de `IncomeSection` / adapter `incomes` |
| Relacionados | `repeatMonths.test.ts`, `seriesUpdates.test.ts`; tag de resgate no caixa em `monthTotals.test.ts` |
| Cobertura | Lacuna de UI/CRUD — não inventar % |

**Casos cobertos (helpers compartilhados):**

- [x] `calculateRemainingMonths` devolve 11 meses do mesmo ano, inclusive passados
- [x] `omitPerMonthFields` tira `received` do update em lote
- [x] Entrada com tag de resgate recebida entra no total efetivado (módulo resumo)

**Casos críticos (adapter / residual QA — DEV-63):**

- [ ] Create recusa descrição vazia / valor ≤ 0 / sem tag — **residual QA** (validação na UI; adapter não valida)
- [x] Create com repeat clona 11 meses do ano civil sem `received` (`incomes.test.ts`)
- [ ] Toggle de recebido atualiza só `received` — **residual QA** (UI; adapter update coberto em parte)
- [x] Apply to following não altera `received` dos outros meses — `omitPerMonthFields` + adapter série
- [x] Excluir tag usada em **outro** mês (RN-G06) — `settings.test.ts`

**Como rodar:**

```bash
npm test --workspace=frontend
```

---

## Histórico de mudanças

| Data | Versão | Descrição | Issue ID | Autor |
| --- | --- | --- | --- | --- |
| 2026-08-23 | 1.0 | Bootstrap da KB a partir do código | — | Technical Writer |
| 2026-10-16 | 1.1 | Remove carteiras: efetivar só com toggle; sem `account_id` / resgate automático | DEV-151 | Technical Writer |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/entradas.md`
- Índice: [`index.md`](./index.md)
- Jornada registrar/efetivar entrada: [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
