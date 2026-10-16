---
type: modulo
nome: Investimentos
status: Ativo
versao: "1.0"
owner: Development
ultima_atualizacao: 2026-10-16
tags: [investimentos, aportes, frontend, supabase]
dependencias: [autenticacao]
---

# Módulo — Investimentos

Documento-base em `knowledge/04_modulos/investimentos.md`. Atualize quando o CRUD de aportes, a efetivação (toggle) ou a série anual mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/investimentos.md`](../02_regras-de-negocio/regras-por-modulo/investimentos.md). Carteiras foram removidas (DEV-151): [`carteiras.md`](./carteiras.md) é só tombstone. Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Persistência: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md).

---

## Overview

Registra **aportes do mês** (“quanto apliquei neste período?”), não a carteira da corretora. Sem este módulo o resumo não desconta o hábito de investir (RN-G03).

**Responsabilidade única:** persistir linhas em `investments` e o toggle `invested`.

**Propósito no produto:** planejar o aporte e, ao efetivar (toggle), descontá-lo do saldo do mês. Sem origem, destino nem posição acumulada.

---

## Bounded context

### O que este módulo FAZ

- CRUD de aportes do mês (`description`, `value`, `date`, tag obrigatória escolhida na lista de tags — RN-I05)
- Nascer `invested = false` (RN-I01)
- Marcar investido / desmarcar pelo toggle `StatusToggleBadge` (só `invested`; sem diálogo) (RN-I02)
- Repetir nos outros 11 meses do **mesmo ano civil**; editar/excluir “só este mês” ou “este e os seguintes”; `invested` não se copia (RN-I05 / RN-G05)
- Agrupar o resumo da lista pela **tag** (ordenação “Instituição” = tag)

### O que este módulo NÃO FAZ

- Totais do mês / gráfico anual ([`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) lê `investments` com `invested`)
- Saldo por carteira, posição acumulada, resgate e transferência: **removidos** na DEV-151 ([`carteiras.md`](./carteiras.md), tombstone). Entradas históricas com tag *Resgate de investimentos* vivem em [`entradas.md`](./entradas.md)
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
  hooks/useSupabaseFinance.ts                  # add/update/deleteInvestment; tags no hook
  services/investments.ts                      # facade
  services/adapters/supabase/investments.ts    # PostgREST + série
  services/adapters/api/investments.ts         # Express (não é produção)
  services/adapters/supabase/settings.ts       # investment_tags (hook; UI desta seção não usa)
  types/domain.ts                              # Investment
  types/finance.ts                             # DEFAULT_INVESTMENT_TAGS
  utils/business/repeatMonths.ts
  utils/business/seriesUpdates.ts              # omitPerMonthFields
  utils/business/monthTotals.ts                # soma invested no caixa
```

| Arquivo | Descrição |
| --- | --- |
| `InvestmentSection.tsx` | Validação; série; tags; toggle de investido; resumo agrupado por tag |
| `investments.ts` (supabase) | INSERT sempre `invested: false`; clones da série; lote `year_month >=` |

Backend `backend/src/routes/investments.ts` + Zod existe; **produção não usa**.

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
| `tag` | TEXT | Sim | Tag escolhida no form; alinhada a `investment_tags` |
| `date` | TEXT | Sim (insert) | `YYYY-MM-DD` |
| `invested` | BOOLEAN | Sim | Default `false` |
| `repeat_all_months` | BOOLEAN | Sim | Série no ano civil |
| `base_investment_id` | UUID | Não | Pai da série; `ON DELETE CASCADE` |
| `display_order` | INTEGER | Sim | Sem UI de reorder |
| `created_at` / `updated_at` | timestamptz | Sim | |

### Tabela: `finance_settings` (recorte)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `investment_tags` | TEXT[] | Seed `DEFAULT_INVESTMENT_TAGS` (Banco A, Banco B, Corretora, Outros). CRUD de tags na seção e no hook |

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
  createdAt?: string;
}
```

`CreateInvestmentParams` = `Investment` sem `id` + `userId?`, `yearMonth`, `displayOrder?`.

O **create no adapter ignora** `invested` do payload e grava sempre `invested: false`.

---

## Interface pública

Não há REST de produção.

| Operação | Onde | Auth | Input | Efeito |
| --- | --- | --- | --- | --- |
| Listar mês | `getInvestments(userId, yearMonth)` | JWT + RLS | `YYYY-MM` | `Investment[]` |
| Criar | `createInvestment` | idem | description, value, tag, date, repeat? | INSERT limpo; se repeat, clones nos outros 11 meses (`invested: false`, `base_investment_id`) |
| Atualizar | `updateInvestment` | idem | updates, `applyToAllMonths?` | Um id, ou série `year_month >=`; `omitPerMonthFields` tira `invested` |
| Excluir | `deleteInvestment` | idem | `applyToAllMonths?` | Um id ou série `>=` |
| Efetivar | `updateInvestment` (UI) | idem | `invested: true` / `false` | Só a flag |
| Tags | `updateInvestmentTags` / `updateInvestmentTagInInvestments` | idem | lista / old→new | Settings + `UPDATE investments SET tag` |
| Reorder | `reorderInvestments` | idem | lista do mês | Só serviço |

Ligar `repeatAllMonths` num registro que não é cópia: insere os outros meses. Desligar: apaga `base_investment_id = id`.

### Validação no cliente (`InvestmentSection`)

- Descrição não vazia
- Valor `> 0`
- Tag obrigatória no create
- Sem Zod neste form

### UI / rotas

Mesma `/`. Aba `activeTab = 'investment'` (rótulo **Investimentos**). Sem URL própria.

| Superfície | Componente | Observação |
| --- | --- | --- |
| `/` · aba Investimentos | `InvestmentSection` | Form, lista, visão resumo agrupada por tag; toggle investido |
| Dialog série | `ApplyToAllDialog` | Este mês vs seguintes |

### Erros comuns (toasts)

| Situação | Mensagem |
| --- | --- |
| Falha create | Erro ao adicionar investimento |
| Falha update | Erro ao atualizar investimento |
| Falha delete | Erro ao excluir investimento |

---

## Regras de negócio

Detalhe: [`../02_regras-de-negocio/regras-por-modulo/investimentos.md`](../02_regras-de-negocio/regras-por-modulo/investimentos.md). Gerais: RN-G02, RN-G03, RN-G04, RN-G05.

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-I01 | Nasce não investido | `createInvestment` força `invested: false` |
| RN-I02 | Efetivar = toggle; caixa desconta | `handleToggleInvested` → `onUpdate({ invested })`; `calculateMonthTotals` filtra `invested` |
| RN-I03 | Aporte como hábito (sem carteira) | — |
| RN-I05 | Série no ano civil; tags como entradas | Série: `calculateRemainingMonths` + `omitPerMonthFields`. Tags: CRUD na UI (`InvestmentSection`) + hook |
| RN-G03 | Saldo do mês subtrai aportes `invested` | `monthTotals.ts` |
| RN-G06 | Não excluir tag em uso | **Não aplicável na UI atual** de aportes |

**Código vs RN-I05:** CRUD de tags de aporte na aba Investimentos (espelha entradas). A tag classifica o aporte (e agrupa o resumo da lista e a visão Anual). Exclusão de tag bloqueada se em uso em qualquer mês (adapter).

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — `user.id`; RLS
- [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — não é dependência de escrita

### Serviços / integrações externas

- Supabase PostgREST (`investments`, `finance_settings`): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `@tanstack/react-query` | Bundle do mês |
| `sonner` | Toasts |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| Mutação `investments` | CRUD / efetivar | Bundle do mês (+ série) | Resumo, regra |
| N/A | — | Sem webhooks/jobs | — |

Resgate não existe mais como operação (DEV-151); ver [`entradas.md`](./entradas.md) para a tag histórica.

---

## Configurações

Nenhuma env exclusiva. [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md).

| Chave | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `VITE_DATA_PROVIDER` | string | Não | Só muda o adapter |

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos deste módulo | Nenhum spec dedicado (`effectuateInvestmentDefaults.test.ts` removido na DEV-151) |
| Relacionados | `seriesUpdates.test.ts`; caixa em `monthTotals.test.ts` |
| UI / adapter `investments` | Nenhum spec |
| Cobertura | Não inventar % |

**Casos cobertos hoje:**

- [x] `omitPerMonthFields` tira `invested`
- [x] Aporte `invested` entra no total efetivado

**Casos críticos (não automatizados hoje):**

- [ ] Create recusa descrição vazia / valor ≤ 0; grava `invested: false`
- [ ] Repeat clona 11 meses do mesmo ano sem efetivação
- [ ] Toggle alterna só `invested`
- [ ] Apply to following não copia `invested`
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
| 2026-10-16 | 1.1 | Remove carteiras: sem origem/destino, `EffectuateInvestmentDialog` nem `account_id`; efetivar = toggle | DEV-151 | Technical Writer |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/investimentos.md`
- Índice: [`index.md`](./index.md)
- Jornada aportar: [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
