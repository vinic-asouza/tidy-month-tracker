---
type: modulo
nome: Investimentos
status: Ativo
versao: "1.0"
owner: Development
ultima_atualizacao: 2026-08-23
tags: [investimentos, aportes, frontend, supabase]
dependencias: [autenticacao]
---

# Módulo — Investimentos

Documento-base em `knowledge/04_modulos/investimentos.md`. Atualize quando o CRUD de aportes, a efetivação origem→destino ou a série anual mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/investimentos.md`](../02_regras-de-negocio/regras-por-modulo/investimentos.md). Posição nas carteiras: [`../02_regras-de-negocio/regras-por-modulo/carteiras.md`](../02_regras-de-negocio/regras-por-modulo/carteiras.md) ([`carteiras.md`](./carteiras.md)). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Persistência: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md).

---

## Overview

Registra **aportes do mês** (“quanto apliquei neste período?”), não a carteira da corretora. Sem este módulo o resumo não desconta o hábito de investir (RN-G03).

**Responsabilidade única:** persistir linhas em `investments` e o fluxo `invested` + origem (`source_account_id`) + destino (`account_id`).

**Propósito no produto:** planejar o aporte e, ao efetivar, tirar liquidez de uma carteira de movimentação (ou Saldo Livre) e subir a posição numa carteira de investimentos.

---

## Bounded context

### O que este módulo FAZ

- CRUD de aportes do mês (`description`, `value`, `date`, tag obrigatória via CRUD de tags — RN-I05)
- Nascer `invested = false`, sem origem nem destino (RN-I01)
- Efetivar via `EffectuateInvestmentDialog`: origem = movimentação **ou** Saldo Livre (`source_account_id` nulo); destino = carteira `role = investment`; origem ≠ destino (RN-I02)
- Desefetivar zera `invested`, `account_id` e `source_account_id`
- Oferecer “criar carteira” se faltar papel movimentação ou investimentos (RN-I03)
- Repetir nos outros 11 meses do **mesmo ano civil**; editar/excluir “só este mês” ou “este e os seguintes”; origem/destino **não** se copiam (RN-I05 / RN-G05)
- Ao efetivar, gravar `tag` = **nome da carteira destino** (comportamento atual da UI)

### O que este módulo NÃO FAZ

- Totais do mês / gráfico anual ([`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) lê `investments` com `invested`)
- Saldo estimado / chip da carteira de investimentos ([`carteiras.md`](./carteiras.md) deriva aportes recebidos/enviados destas linhas — **não** cria `account_operations` no aporte)
- Resgate (RN-W06): isso é [`carteiras.md`](./carteiras.md) + entrada automática ([`entradas.md`](./entradas.md))
- Transferência entre movimentações (RN-W05)
- CRUD de gastos, cartões, entradas ou desejos ([`desejos.md`](./desejos.md))
- Seleção múltipla / barra inferior ([`selecao.md`](./selecao.md); a seção só encaminha `selectedIds`)
- Reordenar `display_order` na UI (`reorderInvestments` existe; a seção não chama)
- Extrato da corretora, cotação ou rendimento automático

---

## Estrutura de arquivos

```text
frontend/src/
  components/InvestmentSection.tsx             # lista, form, toggle investido
  components/MonthRecordsSection.tsx           # aba Investimentos
  components/EffectuateInvestmentDialog.tsx    # origem → destino
  hooks/useSupabaseFinance.ts                  # add/update/deleteInvestment; tags no hook
  services/investments.ts                      # facade
  services/adapters/supabase/investments.ts    # PostgREST + série
  services/adapters/api/investments.ts         # Express (não é produção)
  services/adapters/supabase/settings.ts       # investment_tags (hook; UI desta seção não usa)
  types/domain.ts                              # Investment
  types/finance.ts                             # DEFAULT_INVESTMENT_TAGS
  utils/effectuateInvestmentDefaults.ts        # localStorage origem/destino
  utils/business/repeatMonths.ts
  utils/business/seriesUpdates.ts              # omitPerMonthFields
  utils/business/accountRoles.ts               # filterMovementAccounts / filterInvestmentAccounts
  utils/business/monthTotals.ts                # soma invested no caixa
  utils/business/accounts.ts                   # métricas de carteira a partir destas linhas
```

| Arquivo | Descrição |
| --- | --- |
| `InvestmentSection.tsx` | Validação; série; `PENDING_INVESTMENT_TAG = '—'`; dialog de efetivação |
| `investments.ts` (supabase) | INSERT sempre sem carteiras; clones da série; lote `year_month >=` |
| `EffectuateInvestmentDialog.tsx` | Origem (Saldo Livre + movimentação) e destino (só `investment`) |
| `effectuateInvestmentDefaults.ts` | Chaves `effectuateInvestment:source` / `:dest` |

Backend `backend/src/routes/investments.ts` + Zod existe; **produção não usa**. O schema Express **não** inclui `accountId` / `sourceAccountId`.

---

## Entidades e models

### Tabela: `investments`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `user_id` | UUID | Sim | RLS |
| `year_month` | TEXT | Sim | `YYYY-MM` |
| `description` | TEXT | Sim | |
| `value` | DECIMAL(15,2) | Sim | UI exige `> 0`; sem CHECK no banco |
| `tag` | TEXT | Sim | Create na UI grava `'—'`; efetivar grava o **nome** do destino |
| `date` | TEXT | Sim (insert) | `YYYY-MM-DD` |
| `invested` | BOOLEAN | Sim | Default `false` |
| `repeat_all_months` | BOOLEAN | Sim | Série no ano civil |
| `base_investment_id` | UUID | Não | Pai da série; `ON DELETE CASCADE` |
| `display_order` | INTEGER | Sim | Sem UI de reorder |
| `account_id` | UUID | Não | Destino (papel investimentos); `ON DELETE SET NULL` |
| `source_account_id` | UUID | Não | Origem movimentação; `null` = Saldo Livre; `ON DELETE SET NULL` |
| `created_at` / `updated_at` | timestamptz | Sim | |

Índices parciais em `account_id` e `source_account_id` quando não nulos.

### Tabela: `finance_settings` (recorte)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `investment_tags` | TEXT[] | Seed `DEFAULT_INVESTMENT_TAGS` (Banco A, Banco B, Corretora, Outros). Hook tem CRUD; **InvestmentSection não lista/edita tags** |

### Contrato TypeScript (`Investment`)

```ts
interface Investment {
  id: string;
  description: string;
  value: number;
  tag: string;
  date: string | null;
  invested: boolean;
  repeatAllMonths?: boolean;
  baseInvestmentId?: string;
  sourceAccountId?: string | null; // null = Saldo Livre
  accountId?: string;              // destino investimentos
  createdAt?: string;
}

const PENDING_INVESTMENT_TAG = '—'; // só no componente
```

`CreateInvestmentParams` = `Investment` sem `id` + `userId?`, `yearMonth`, `displayOrder?`.

O **create no adapter ignora** `invested` / carteiras do payload e grava sempre `invested: false`, `account_id: null`, `source_account_id: null`.

---

## Interface pública

Não há REST de produção.

| Operação | Onde | Auth | Input | Efeito |
| --- | --- | --- | --- | --- |
| Listar mês | `getInvestments(userId, yearMonth)` | JWT + RLS | `YYYY-MM` | `Investment[]` |
| Criar | `createInvestment` | idem | description, value, tag, date, repeat? | INSERT limpo; se repeat, clones nos outros 11 meses (`invested: false`, carteiras null, `base_investment_id`) |
| Atualizar | `updateInvestment` | idem | updates, `applyToAllMonths?` | Um id, ou série `year_month >=`; `omitPerMonthFields` tira `invested`, `account_id`, `source_account_id` |
| Excluir | `deleteInvestment` | idem | `applyToAllMonths?` | Um id ou série `>=` |
| Efetivar | `updateInvestment` (UI) | idem | `invested: true`, source, dest, tag=nome destino | Sem INSERT em `account_operations` |
| Tags (hook) | `updateInvestmentTags` / `updateInvestmentTagInInvestments` | idem | lista / old→new | Settings + `UPDATE investments SET tag` — **sem tela nesta seção** |
| Reorder | `reorderInvestments` | idem | lista do mês | Só serviço |

Ligar `repeatAllMonths` num registro que não é cópia: insere os outros meses. Desligar: apaga `base_investment_id = id`.

### Validação no cliente (`InvestmentSection`)

- Descrição não vazia
- Valor `> 0`
- Sem tag escolhida pelo usuário no create
- Dialog: destino obrigatório; origem sempre tem Saldo Livre; `sourceId !== destId`
- Sem Zod neste form

### UI / rotas

Mesma `/`. Aba `activeTab = 'investment'` (rótulo **Investimentos**). Sem URL própria.

| Superfície | Componente | Observação |
| --- | --- | --- |
| `/` · aba Investimentos | `InvestmentSection` | Form, lista, visão resumo agrupada por carteira destino; toggle investido |
| Dialog efetivar | `EffectuateInvestmentDialog` | Origem + destino; CTAs criar carteira |
| Dialog série | `ApplyToAllDialog` | Este mês vs seguintes |

Editar item **já investido** permite mudar o destino (`accountId`) e regrava `tag` com o nome da carteira.

### Erros comuns (toasts)

| Situação | Mensagem |
| --- | --- |
| Falha create | Erro ao adicionar investimento |
| Falha update | Erro ao atualizar investimento |
| Falha delete | Erro ao excluir investimento |

---

## Regras de negócio

Detalhe: [`../02_regras-de-negocio/regras-por-modulo/investimentos.md`](../02_regras-de-negocio/regras-por-modulo/investimentos.md). Gerais: RN-G02, RN-G03, RN-G04, RN-G05. Carteiras: RN-W02, RN-W04.

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-I01 | Nasce não investido, sem origem/destino | `createInvestment` força flags/carteiras null |
| RN-I02 | Efetivar: origem movimentação ou Saldo Livre; destino investimentos; distintos; caixa desconta | Dialog + `updateInvestment`; `calculateMonthTotals` filtra `invested` |
| RN-I03 | Sem papel, oferece criar carteira | `onRequestAddMovementAccount` / `onRequestAddInvestmentAccount` |
| RN-I04 | Legado: destino preenchido, origem nula — liquidez da origem pode estar errada até re-efetivar | Modelo permite `invested && !sourceAccountId`; métricas de movimentação só debitam `sourceAccountId` |
| RN-I05 | Série no ano civil; tags como entradas | Série: `calculateRemainingMonths` + `omitPerMonthFields`. Tags: CRUD na UI (`InvestmentSection`) + hook; efetivação **não** sobrescreve tag com nome do destino |
| RN-G03 | Saldo do mês subtrai aportes `invested` | `monthTotals.ts` |
| RN-G06 | Não excluir tag em uso | **Não aplicável na UI atual** de aportes |

**Código vs RN-I05:** CRUD de tags de aporte na aba Investimentos (espelha entradas). Tag classifica o hábito; carteira destino é independente. Exclusão de tag bloqueada se em uso em qualquer mês (adapter).

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — `user.id`; RLS
- [`carteiras.md`](./carteiras.md) — lista por papel; `onRequestAddAccount`; métricas leem estas linhas
- [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — não é dependência de escrita

### Serviços / integrações externas

- Supabase PostgREST (`investments`, `finance_settings`): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `@tanstack/react-query` | Bundle do mês |
| `sonner` | Toasts |
| `localStorage` `effectuateInvestment:source` / `:dest` | Última origem/destino (`EFFECTUATE_WALLET_FREE` = Saldo Livre) |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| Mutação `investments` | CRUD / efetivar | Bundle do mês (+ série) | Resumo, regra, chips de carteira |
| Efetivar aporte | toggle + dialog | Liquidez − origem; posição + destino (**sem** `account_operations`) | Módulo carteiras (`getAccountMonthTotals`) |
| N/A | — | Sem webhooks/jobs | — |

Resgate **não** emite daqui: carteiras criam operação + [`entradas.md`](./entradas.md).

---

## Configurações

Nenhuma env exclusiva. [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md).

| Chave | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `effectuateInvestment:source` | `localStorage` | Não | UUID ou sentinel de Saldo Livre |
| `effectuateInvestment:dest` | `localStorage` | Não | UUID da carteira de investimentos |
| `VITE_DATA_PROVIDER` | string | Não | Só muda o adapter |

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos deste módulo | `effectuateInvestmentDefaults.test.ts` |
| Relacionados | `seriesUpdates.test.ts`; caixa em `monthTotals.test.ts`; métricas em `accounts.test.ts` |
| UI / adapter `investments` | Nenhum spec |
| Cobertura | Não inventar % |

**Casos cobertos hoje:**

- [x] Default origem/destino (primeira de cada papel / Saldo Livre sem movimentação)
- [x] Persistência no `localStorage`; ignora id que não existe mais
- [x] `omitPerMonthFields` tira `invested`, `account_id`, `source_account_id`
- [x] Aporte `invested` entra no total efetivado e nas métricas de carteira

**Casos críticos (não automatizados hoje):**

- [ ] Create recusa descrição vazia / valor ≤ 0; grava `invested: false` e carteiras null
- [ ] Repeat clona 11 meses do mesmo ano sem efetivação
- [ ] Dialog exige destino investimentos e origem ≠ destino
- [ ] Sem carteira de investimentos, confirmação bloqueada + CTA criar
- [ ] Desefetivar limpa origem e destino
- [ ] Apply to following não copia carteiras
- [ ] Legado `invested` sem `sourceAccountId` (RN-I04)
- [x] CRUD de tags da regra RN-I05 (UI)

**Como rodar:**

```bash
npm test --workspace=frontend
```

---

## Histórico de mudanças

| Data | Versão | Descrição | Issue ID | Autor |
| --- | --- | --- | --- | --- |
| 2026-08-23 | 1.0 | Bootstrap da KB a partir do código | — | Technical Writer |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/investimentos.md`
- Índice: [`index.md`](./index.md)
- Jornada aportar: [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
