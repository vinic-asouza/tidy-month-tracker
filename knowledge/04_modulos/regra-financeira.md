---
type: modulo
nome: Regra financeira
status: Ativo
versao: "1.0"
owner: Development
ultima_atualizacao: 2026-08-23
tags: [regra-financeira, 50-30-20, frontend, supabase]
dependencias: [autenticacao]
---

# Módulo — Regra financeira

Documento-base em `knowledge/04_modulos/regra-financeira.md`. Atualize quando buckets, base de renda, mapeamento de categorias, não classificado ou o toggle efetivado/planejado mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/regra-financeira.md`](../02_regras-de-negocio/regras-por-modulo/regra-financeira.md). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Persistência: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md). Hospedagem na UI: [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md). Categorias de gasto: [`gastos.md`](./gastos.md). Aportes: [`investimentos.md`](./investimentos.md). Resgate na base: [`entradas.md`](./entradas.md) (RN-G08).

---

## Overview

Uma **meta de alocação** por usuário: três buckets (essenciais, estilo de vida, investimentos) sobre a renda do período. Padrão 50/30/20; percentuais personalizáveis. Não é o caixa do mês — o resumo continua com as quatro métricas; este módulo compara o realizado (ou o planejado) com a meta.

**Responsabilidade única:** persistir `financial_rule` (percentuais + `category_mapping`) e calcular `FinancialRuleStats` no cliente.

**Propósito no produto:** a pessoa vê se está dentro da regra que escolheu, incluindo o aviso de gasto ainda sem bucket (RN-F01–F04).

---

## Bounded context

### O que este módulo FAZ

- Uma linha por `user_id` (UNIQUE): criar, editar, resetar/apagar (RN-F01, RN-F06)
- Três percentuais que somam 100%; default 50 / 30 / 20; `is_custom` quando o modelo não é o padrão
- Mapear **todas** as categorias de gasto atuais para `essentials` ou `lifestyle` no wizard (passo 2)
- Bucket **investimentos** = aportes do modo ativo (`invested` no efetivado; todos no planejado) / renda — **não** usa categoria de gasto (RN-F03)
- Base de renda (RN-F02): efetivado = entradas `received` (inclui resgate); planejado = todas as entradas; renda 0 → percentuais atuais 0
- Gastos na regra: só os do modo ativo; cartão no efetivado via `isExpenseEffectivelyPaid` (RN-F03, RN-F05)
- **Não classificado:** gasto do modo ativo cuja categoria não está no mapping; alerta + CTA; rodapé classificados + não classificado (RN-F04)
- Mesmo toggle do resumo (`viewMode` efetivado/planejado) (RN-F05)
- Visão anual: soma os meses e deriva os % (`calculateAnnualFinancialRuleStatsByMode`)
- Hint quando a base efetivada inclui resgate (`getResgateInflowFromIncomes`)

### O que este módulo NÃO FAZ

- Totais do caixa / gráfico anual ([`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) **hospeda** esta UI à direita / no anual)
- CRUD de categorias ([`gastos.md`](./gastos.md) — este módulo só lê `expense_categories`)
- CRUD de entradas, gastos, aportes ou faturas — só lê `MonthData`
- Incluir desejos, transferências ou operações `withdrawal` na conta (resgate entra **pela entrada**)
- Definir o toggle (dono: resumo, `localStorage` `tidy-summary-view-mode`)
- Recalcular patrimônio / Saldo Livre ([`carteiras.md`](./carteiras.md))
- Landing (`FinancialRulePreview`) — não é este bounded context
- Soma de itens selecionados ([`selecao.md`](./selecao.md))

---

## Estrutura de arquivos

```text
frontend/src/
  components/FinancialRuleDisplay.tsx          # barras, não classificado, hint de resgate
  components/FinancialRuleSetup.tsx            # wizard 2 passos (modelo + mapping)
  components/MonthSummarySection.tsx           # hospeda setup/display no mês (resumo)
  components/AnnualFinancialRuleSection.tsx    # mesma regra, stats do ano
  hooks/useFinancialRule.ts                    # GET/POST/PATCH/DELETE; estado local
  services/financialRule.ts                    # facade
  services/adapters/supabase/financialRule.ts  # PostgREST + validação 100% e mapping
  services/adapters/api/financialRule.ts       # Express /api/financial-rule
  types/domain.ts                              # FinancialRule, FinancialRuleStats
  utils/financialRuleCalculations.ts           # mês e ano, efetivado e planejado
  utils/__tests__/financialRuleCalculations.test.ts
```

| Arquivo | Descrição |
| --- | --- |
| `FinancialRuleSetup.tsx` | Passo 1: 50/30/20 ou custom; passo 2: select essenciais/estilo por categoria |
| `FinancialRuleDisplay.tsx` | Três barras; empty state se renda = 0 |
| `useFinancialRule.ts` | Sem React Query; um fetch por montagem |
| `financialRule.ts` (supabase) | UNIQUE por user; recusa soma ≠ 100 (±0,01); create/update de mapping exige **todas** as categorias atuais |

Backend `backend/src/routes/financialRule.ts` existe. **Produção** continua SPA → Supabase (não ligar `VITE_DATA_PROVIDER=api` como fonte única).

---

## Entidades e models

### Tabela: `financial_rule`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `user_id` | UUID | Sim | UNIQUE; RLS; `ON DELETE CASCADE` |
| `essentials_percentage` | DECIMAL(5,2) | Sim | Default 50 |
| `lifestyle_percentage` | DECIMAL(5,2) | Sim | Default 30 |
| `investments_percentage` | DECIMAL(5,2) | Sim | Default 20 |
| `category_mapping` | JSONB | Sim | `{ "Moradia": "essentials", "Lazer": "lifestyle", … }`; default `{}` |
| `is_custom` | BOOLEAN | Sim | Default `false` |
| `created_at` / `updated_at` | timestamptz | Sim | Trigger em update |

CHECK: `essentials + lifestyle + investments = 100.00` (igualdade exata no Postgres).

Índice: `user_id`. Sem FK para categorias (são strings em `finance_settings.expense_categories`).

### Contrato TypeScript

```ts
interface FinancialRule {
  id: string;
  userId: string;
  essentialsPercentage: number;
  lifestylePercentage: number;
  investmentsPercentage: number;
  categoryMapping: Record<string, 'essentials' | 'lifestyle'>;
  isCustom: boolean;
}

interface FinancialRuleStats {
  totalIncome: number;
  totalEffectiveExpenses: number; // gastos do modo ativo (nome legado)
  unclassifiedValue: number;
  essentials: BucketStats;
  lifestyle: BucketStats;
  investments: BucketStats;
}
```

`BucketStats`: `target` / `current` (%), `targetValue` / `currentValue` (R$), `difference` / `differenceValue`.

### Categorias default (se settings vazio)

`DEFAULT_EXPENSE_CATEGORIES` em `types/finance.ts` (Moradia, Mercado, Lazer, …). O adapter usa a lista salva em `finance_settings.expense_categories` quando não está vazia.

---

## Interface pública

Produção: PostgREST. Express espelha `/api/financial-rule`.

| Operação | Onde | Auth | Input | Efeito |
| --- | --- | --- | --- | --- |
| Ler | `getFinancialRule()` | JWT + RLS | — | Uma linha ou `null` |
| Criar | `createFinancialRule` | idem | % + mapping + `isCustom` | INSERT; falha se já existir UNIQUE |
| Atualizar | `updateFinancialRule` | idem | parcial | Merge; revalida 100%; se vier mapping, exige todas as categorias |
| Apagar | `deleteFinancialRule` | idem | — | DELETE; UI volta ao CTA “Configurar” |
| Stats mês | `calculateFinancialRuleStatsByMode` | cliente | modo + `MonthData` | `FinancialRuleStats` |
| Stats ano | `calculateAnnualFinancialRuleStatsByMode` | cliente | modo + `MonthData[]` | soma dos meses, % sobre renda anual |

### Wizard (`FinancialRuleSetup`)

1. Modelo padrão (força 50/30/20, `isCustom: false`) ou personalizado (três inputs; soma 100 no cliente).
2. Cada categoria da lista atual → `essentials` ou `lifestyle`. Submit bloqueado se faltar alguma (`allCategoriesMapped`).
3. Categorias novas desde o último save: `unmappedCategories` abre direto no passo 2.

### Validação

| Camada | O quê |
| --- | --- |
| UI | Soma 100%; todas as categorias mapeadas |
| Adapter | Soma 100% com tolerância `0.01`; mapping completo **só** no create ou se `categoryMapping` veio no update |
| Postgres | CHECK soma **exata** `100.00` |

### UI / rotas

Sem URL própria. Coluna da regra em `/` visão mensal (`MonthSummarySection`) e bloco no anual (`AnnualFinancialRuleSection`). Ambos chamam `useFinancialRule` (estado **não** compartilhado via cache).

| Superfície | Componente | Observação |
| --- | --- | --- |
| Sem regra | CTA Configurar | Empty, não calcula |
| Com regra | `FinancialRuleDisplay` | Badge “N categoria(s) sem mapeamento” |
| Reset | `DeleteConfirmDialog` | `deleteRule` |
| Renda 0 | Empty copy | Efetivado: marcar entradas recebidas; planejado: registrar entradas |

### Erros comuns (toasts)

| Situação | Mensagem |
| --- | --- |
| Create ok | Regra financeira criada com sucesso |
| Update ok | Regra financeira atualizada com sucesso |
| Delete ok | Regra financeira deletada com sucesso |
| Soma ≠ 100 (adapter) | `A soma dos percentuais deve ser 100%. Atual: X%` |
| Mapping incompleto (adapter) | `Todas as categorias devem estar mapeadas. Categorias não mapeadas: …` |
| Sem linha no update/delete | Regra financeira não encontrada |
| Falha genérica | Erro ao criar/atualizar/deletar regra financeira |

---

## Regras de negócio

Detalhe: [`../02_regras-de-negocio/regras-por-modulo/regra-financeira.md`](../02_regras-de-negocio/regras-por-modulo/regra-financeira.md). Gerais: RN-G02 (efetivado), RN-G08 (resgate = entrada). Resumo: RN-R02 (toggle).

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-F01 | Três buckets; soma 100%; default 50/30/20 | CHECK SQL + `validatePercentages` + wizard |
| RN-F02 | Base = renda do modo; renda 0 → current % = 0 | `buildFinancialRuleStats` |
| RN-F03 | Gastos mapeados só essenciais/estilo; aportes no bucket investimentos | `calculateFinancialRuleStats` / `calculatePlannedFinancialRuleStats` |
| RN-F04 | Sem mapping → não classificado; alerta + reconciliação | Display + testes de soma |
| RN-F05 | Mesmo modo do resumo | `viewMode` passado pelo pai |
| RN-F06 | Dá para apagar a regra | `deleteRule` no mês e no anual |

### Fórmulas (modo efetivado)

- Renda = Σ incomes `received`
- Gastos efetivos = `isExpenseEffectivelyPaid`
- Essenciais / estilo = soma desses gastos com mapping correspondente / renda × 100
- Investimentos = Σ investments `invested` / renda × 100
- Não classificado = gastos efetivos sem chave no mapping (não entra nas barras de essenciais/estilo)

Modo planejado: todas as linhas, sem flags.

### Código vs regra

- **Mapping completo no save:** o wizard não deixa “não classificado” no create. O bucket aparece quando a pessoa **cria ou renomeia** categoria em gastos **depois** — as chaves do JSON não acompanham o rename (`gastos.md` propaga `expenses.category`, não `financial_rule.category_mapping`).
- **CHECK 100.00 vs JS ±0,01:** valores que passam no adapter podem falhar no Postgres (e o contrário, com arredondamento DECIMAL).
- **Update só de percentuais:** não revalida mapping contra a lista atual de categorias (categorias novas continuam de fora até o usuário reabrir o passo 2).
- **Dois hooks:** mensal e anual não compartilham `rule` em memória; depois de salvar num, o outro só vê no próximo mount/`refreshRule`.

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — `user.id`; RLS
- [`entradas.md`](./entradas.md) — renda (`received` / todas); resgate já veio como entrada
- [`gastos.md`](./gastos.md) — linhas + lista de categorias; fatura via [`cartoes.md`](./cartoes.md) (`isExpenseEffectivelyPaid`)
- [`investimentos.md`](./investimentos.md) — aportes `invested`
- [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — **não** é dependência de persistência; **hospeda** a UI e entrega `viewMode` + `MonthData`

### Serviços / integrações externas

- Supabase PostgREST (`financial_rule`, leitura de `finance_settings.expense_categories`): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `sonner` | Toasts do hook |
| `@tanstack/react-query` | **Não** neste hook |
| `localStorage` `tidy-summary-view-mode` | Lido pelo resumo; este módulo só recebe a prop |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| INSERT/UPDATE/DELETE `financial_rule` | wizard / reset | Estado local do hook | Display na mesma árvore |
| N/A | — | Não invalida o bundle do mês | Resumo não recarrega por causa da regra |
| N/A | — | Sem webhooks/jobs | — |

---

## Configurações

Nenhuma env exclusiva. [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md).

| Chave | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `VITE_DATA_PROVIDER` | string | Não | `api` usa Express `/api/financial-rule` (existe; não é o deploy atual) |

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos deste módulo | `utils/__tests__/financialRuleCalculations.test.ts` |
| UI / hook / adapters | Nenhum spec |
| Cobertura | Não inventar % |

**Casos cobertos hoje:**

- [x] Essenciais + estilo + não classificado = gastos efetivados
- [x] Não classificado = 0 quando o mapping cobre as categorias usadas
- [x] Planejado soma linhas não efetivadas; efetivado ignora
- [x] Resgate `received` entra na renda e dilui os %

**Casos críticos (não automatizados hoje):**

- [ ] Create recusa soma ≠ 100 e mapping incompleto
- [ ] UNIQUE um `financial_rule` por user
- [ ] Wizard não submete com categoria faltando
- [ ] Categoria nova depois do save → badge + não classificado
- [ ] Rename de categoria em gastos **não** atualiza as chaves do mapping
- [ ] Toggle efetivado/planejado alinha com o resumo
- [ ] Ano agrega os 12 meses no mesmo modo
- [ ] Delete volta ao CTA; segundo create ok
- [ ] Renda 0 não divide por zero (current = 0)

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

- Destino deste doc: `knowledge/04_modulos/regra-financeira.md`
- Índice: [`index.md`](./index.md)
- Jornada anual (regra no ano): [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
