---
type: modulo
nome: Resumo e estatísticas
status: Ativo
versao: "1.0"
owner: Development
ultima_atualizacao: 2026-08-22
tags: [resumo, estatisticas, caixa, frontend]
dependencias: [autenticacao]
---

# Módulo — Resumo e estatísticas

Documento-base em `knowledge/04_modulos/resumo-e-estatisticas.md`. Atualize quando as fórmulas do mês, o toggle ou a visão anual mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/resumo-e-estatisticas.md`](../02_regras-de-negocio/regras-por-modulo/resumo-e-estatisticas.md). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md).

---

## Overview

Mostra o **fluxo de caixa do período** (mês ou ano civil): quatro números, toggle efetivado/planejado e gráfico anual. Não persiste lançamentos — só lê o `MonthData` já carregado e agrega no cliente.

**Responsabilidade única:** calcular e exibir entradas, gastos, investimentos e saldo (mais pendências no mês efetivado).

**Propósito no produto:** a pessoa vê se o mês “fechou” no caixa efetivado, sem misturar isso com saldo de carteira nem com desejos (RN-G07, RN-R05).

---

## Bounded context

### O que este módulo FAZ

- Quatro métricas do mês: entradas, gastos, investimentos, saldo (RN-R01)
- Toggle **Efetivados** / **Planejados**, persistido e compartilhado (RN-R02)
- Linhas de pendência no modo efetivado: a receber, a pagar, a investir (RN-R03)
- Visão anual: soma dos 12 meses + gráfico mês a mês (RN-R04)
- Legenda do que o modo está somando
- Hint de resgates nas entradas efetivadas (quando há valor)
- Destacar o mês da navegação no eixo X do gráfico anual

### O que este módulo NÃO FAZ

- CRUD de entradas ([`entradas.md`](./entradas.md)), gastos ([`gastos.md`](./gastos.md)), cartões ([`cartoes.md`](./cartoes.md)), investimentos ([`investimentos.md`](./investimentos.md)), carteiras ([`carteiras.md`](./carteiras.md)) ou desejos ([`desejos.md`](./desejos.md))
- Saldo estimado da carteira, Saldo Livre ou patrimônio (`AccountStrip` — [`carteiras.md`](./carteiras.md))
- Configurar ou calcular a regra 50/30/20 ([`regra-financeira.md`](./regra-financeira.md)). A UI do resumo **hospeda** a regra na coluna direita; o anual hospeda `AnnualFinancialRuleSection` — contratos e persistência ficam naquele módulo
- Soma de itens selecionados ([`selecao.md`](./selecao.md) — o toggle deste módulo **não** altera a fórmula da barra)
- Incluir desejos nos totais (RN-R05)
- Somar operação `withdrawal` no caixa: a fonte de resgate é a **entrada** (RN-G08)

---

## Estrutura de arquivos

```text
frontend/src/
  pages/Index.tsx                              # view dashboard | statistics; lazy de Statistics
  components/MonthSummarySection.tsx           # bloco mensal (métricas + hospeda a regra)
  components/Statistics.tsx                    # totais + gráfico do ano
  components/SummaryViewModeToggle.tsx         # Efetivados | Planejados
  components/layout/SummaryTotalsLegend.tsx    # texto do modo
  components/layout/MetricTile.tsx             # tile numérico (compartilhado)
  hooks/useSummaryViewMode.ts                  # estado + localStorage
  utils/business/monthTotals.ts                # fórmulas
  utils/business/__tests__/monthTotals.test.ts
  services/financeQueries.ts                   # fetchMonthBundle / fetchYearData
  hooks/useSupabaseFinance.ts                  # yearQuery só com statisticsEnabled
  utils/business/yearDataSync.ts               # patch do cache anual após mutação
  lib/utils.ts                                 # formatSummaryMonthTitle
```

| Arquivo | Descrição |
| --- | --- |
| `monthTotals.ts` | `calculateMonthTotals`, pendências, gasto efetivo no cartão, resgate nas entradas |
| `MonthSummarySection.tsx` | Quatro tiles + pendências; coluna direita é regra financeira |
| `Statistics.tsx` | Cards anuais + `BarChart` (recharts); abaixo, regra anual |
| `useSummaryViewMode.ts` | Chave `tidy-summary-view-mode` |
| `financeQueries.ts` | 12 `fetchMonthBundle` em paralelo para o ano |
| `Index.tsx` | Nav **Mensal** / **Anual** na mesma rota `/` |

---

## Entidades e models

Este módulo **não tem tabela própria**. Consome o agregado em memória `MonthData` (lançamentos do mês + status das faturas). Schema das tabelas: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md) e os módulos de lançamento.

### Agregado: `MonthData`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `incomes` | `Income[]` | Sim | Inclui entradas de resgate (`tag` / `sourceOperationId`) |
| `expenses` | `Expense[]` | Sim | Cartão identificado por `paymentMethod` = **nome** do cartão |
| `investments` | `Investment[]` | Sim | Aportes do mês |
| `cardMonthlyStatuses` | `Record<cardId, boolean>` | Não | Fatura paga naquele mês |
| `accountOperations` | `AccountOperation[]` | Não | **Não** entra nas fórmulas deste módulo |

### Contratos TypeScript

```ts
type SummaryViewMode = 'effective' | 'planned';

interface EffectiveMonthTotals {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  balance: number; // income - expenses - investments
}

interface PendingMonthTotals {
  pendingIncome: number;
  pendingExpenses: number;
  pendingInvestments: number;
}
```

`MonthTotals` é alias de `EffectiveMonthTotals` (o mesmo shape serve aos dois modos).

### Fórmulas (código)

Modo **efetivado** (`calculateEffectiveMonthTotals`):

- Entradas: `received === true` (inclui resgate recebido)
- Gastos: `isExpenseEffectivelyPaid` — se `paymentMethod` casa com `creditCards[].name` e há `cardMonthlyStatuses`, vale o status da **fatura**; senão vale `expense.paid`
- Investimentos: `invested === true`
- Saldo: entradas − gastos − investimentos

Modo **planejado** (`calculatePlannedMonthTotals`): soma lançamentos do array **exceto** resgates (`isResgateIncome`). Não soma `accountOperations`. Alinhado a RN-G03.

Pendências (`calculatePendingMonthTotals`, só na UI efetivada):

```
pendingIncome       = max(0, soma(incomes) − soma(incomes.received))
pendingExpenses     = max(0, soma(expenses) − gastos efetivos)
pendingInvestments  = max(0, soma(investments) − investimentos efetivos)
```

Usar a renda **recebida** (incluindo resgate) no subtraendo evita inflar “a receber” com o resgate (RN-R03; coberto por teste).

Hint de resgate no tile: `getResgateInflowFromIncomes` — só tag `Resgate de investimentos` **e** `received`. Só no modo efetivado.

### Enums

| Enum / constante | Valores |
| --- | --- |
| `SummaryViewMode` | `effective` (padrão), `planned` |
| `RESGATE_INCOME_TAG` | `'Resgate de investimentos'` |

---

## Interface pública

Não há REST para o resumo. Produção = funções puras + TanStack Query + React.

| Operação | Onde | Auth | Request / input | Response |
| --- | --- | --- | --- | --- |
| Totais do mês | `calculateMonthTotals(mode, monthData, creditCards, statuses)` | sessão já exigida em `/` | `MonthData` + cartões | `EffectiveMonthTotals` |
| Pendências | `calculatePendingMonthTotals(...)` | idem | idem | `PendingMonthTotals` |
| Bundle do mês | `fetchMonthBundle(userId, yearMonth, creditCards)` | JWT + RLS | mês `YYYY-MM` | `MonthBundle` |
| Ano civil | `fetchYearData(userId, year, creditCards)` | JWT + RLS | ano numérico | `MonthData[12]` (falha de um mês → mês vazio) |
| Toggle | `useSummaryViewMode()` | — | `'effective' \| 'planned'` | persiste no `localStorage` |

Query anual (`useSupabaseFinance`): `enabled` só com `statisticsEnabled` (aba **Anual**). `staleTime` 5 min. Chave: `financeKeys.year(userId, year)` + `creditCards.length`.

`Statistics` entra via `React.lazy` em `Index.tsx`.

### UI / rotas

Mesma rota autenticada `/`. O estado `view` **não** vai para a URL.

| Rota / vista | Componente | Observação |
| --- | --- | --- |
| `/` · `view = dashboard` (rótulo **Mensal**) | `MonthSummarySection` | Primeiro bloco; abaixo vêm carteiras e registros |
| `/` · `view = statistics` (rótulo **Anual**) | `Statistics` | Ano = parte `YYYY` de `currentMonth` |
| Nav desktop/mobile | `Index.tsx` | `Wallet` / `BarChart3` |

Título mensal: `formatSummaryMonthTitle` → “Resumo de Mês de {mês}”.

Saldo ≥ 0 em verde (`text-income`); negativo em vermelho (`text-expense`), com `+` só se positivo.

Gráfico anual: barras Entradas, Gastos, Investimentos, Saldo (cor do saldo por sinal). Estado vazio se os três totais do ano são 0. Overlay de loading se o ano já tem cache e está refetching.

### Erros comuns

Não há API própria. Falha ao montar um mês em `fetchYearData` vira `getEmptyMonthData()` naquele índice — o gráfico não quebra.

---

## Regras de negócio

Detalhe: [`../02_regras-de-negocio/regras-por-modulo/resumo-e-estatisticas.md`](../02_regras-de-negocio/regras-por-modulo/resumo-e-estatisticas.md). Gerais: [`../02_regras-de-negocio/regras-gerais.md`](../02_regras-de-negocio/regras-gerais.md) (RN-G02, RN-G03, RN-G07, RN-G08). Cartão no caixa efetivado: [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md).

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-R01 | Quatro números; saldo colorido | `MonthSummarySection`, `Statistics` `StatCard` |
| RN-R02 | Toggle compartilhado (resumo, regra, anual) | `useSummaryViewMode` |
| RN-R03 | Pendências só no efetivado; “a receber” sem misturar resgate | `calculatePendingMonthTotals` + UI oculta no planejado |
| RN-R04 | 12 meses do ano civil + gráfico; mesma regra de fatura | `fetchYearData` + `calculateMonthTotals` por mês |
| RN-R05 | Desejos fora | ausência em `monthTotals.ts` |
| RN-G03 | Fórmulas efetivado / planejado | `monthTotals.ts` |
| RN-G08 | Resgate no caixa = entrada, não operação | `getResgateInflowFromIncomes`; `accountOperations` ignorado |

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — `ProtectedRoute` / sessão; sem user o hook não busca
- [`entradas.md`](./entradas.md), [`gastos.md`](./gastos.md), [`investimentos.md`](./investimentos.md), [`cartoes.md`](./cartoes.md) — este módulo só lê o que eles persistem (`MonthData`, faturas)
- [`carteiras.md`](./carteiras.md) — **não** é dependência de escrita; transferência não entra no caixa; resgate entra pela entrada

### Módulos que este hospeda na UI (não são deste bounded context)

- [`regra-financeira.md`](./regra-financeira.md) — `FinancialRuleDisplay` / `FinancialRuleSetup` no resumo; `AnnualFinancialRuleSection` no anual; mesmo `viewMode`

### Serviços / integrações externas

- Supabase Postgres via facades (`incomes`, `expenses`, `investments`, `creditCards`, `accountOperations`): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `@tanstack/react-query` | `monthQuery` / `yearQuery` |
| `recharts` | gráfico anual |
| `sonner` | não neste módulo (toasts ficam nos CRUDs) |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| `localStorage` `tidy-summary-view-mode` | clique no toggle | `'effective'` ou `'planned'` | novas montagens de `useSummaryViewMode` (resumo, estatísticas, regra) |
| Invalidação / patch do cache `finance.year` | mutação de lançamento (hook financeiro) | `yearDataSync.patchYearDataMonth` | aba Anual, se já carregada |
| N/A | — | Sem webhooks/jobs | — |

Cada chamada a `useSummaryViewMode` tem estado React próprio; a persistência no `localStorage` alinha o **próximo** mount, não sincroniza duas instâncias ao vivo na mesma tela (resumo e regra compartilham o mesmo componente pai no mês).

---

## Configurações

Nenhuma env exclusiva. Precisa do mesmo `VITE_SUPABASE_*` (e sessão) que o restante do painel. [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md).

| Variável / chave | Tipo | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- | --- |
| `tidy-summary-view-mode` | `localStorage` | Não | `effective` | Só `'planned'` ativa o modo planejado; qualquer outro valor vira efetivado |

`VITE_DATA_PROVIDER` muda **de onde** vêm os lançamentos, não a fórmula.

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos de teste | `frontend/src/utils/business/__tests__/monthTotals.test.ts` |
| UI (`MonthSummarySection` / `Statistics`) | Nenhum spec |
| Cobertura | Só as funções puras listadas abaixo — não inventar % |
| Coleções / manuais | Jornada 2 em [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md) |

**Casos cobertos hoje:**

- [x] Entrada de resgate recebida entra em `totalIncome` efetivado
- [x] Resgate não recebido e operação sem entrada vinculada não entram no efetivado
- [x] `getResgateInflowFromIncomes` soma só tag de resgate recebida
- [x] Pendência de entradas não infla com resgate já recebido
- [x] Planejado soma o array; efetivado só `received`
- [x] `calculateMonthTotals` despacha pelo modo

**Casos críticos (não automatizados hoje):**

- [ ] Gasto no cartão só entra no efetivado com fatura paga (`isExpenseEffectivelyPaid`)
- [ ] Toggle persiste e reabre no mesmo modo
- [ ] Aba Anual não dispara `yearQuery` enquanto `view === dashboard`
- [ ] Desejos não alteram os quatro números
- [ ] Gráfico vazio quando o ano não tem lançamentos no modo ativo

**Como rodar:**

```bash
npm run test --workspace=frontend
# ou, na pasta frontend:
npm test
```

---

## Histórico de mudanças

| Data | Versão | Descrição | Issue ID | Autor |
| --- | --- | --- | --- | --- |
| 2026-08-22 | 1.0 | Bootstrap da KB a partir do código | — | Technical Writer |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/resumo-e-estatisticas.md`
- Índice: [`index.md`](./index.md)
- Autenticação: [`autenticacao.md`](./autenticacao.md)
- Três leituras de patrimônio: RN-G07 + glossário
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
