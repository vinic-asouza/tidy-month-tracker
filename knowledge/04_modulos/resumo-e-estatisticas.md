---
type: modulo
nome: Resumo e estatísticas
status: Ativo
versao: "1.4"
owner: Development
ultima_atualizacao: 2026-10-17
tags: [resumo, estatisticas, caixa, frontend]
dependencias: [autenticacao]
---

# Módulo — Resumo e estatísticas

Documento-base em `knowledge/04_modulos/resumo-e-estatisticas.md`. Atualize quando as fórmulas do mês, o toggle, a visão anual ou os gráficos por seção mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/resumo-e-estatisticas.md`](../02_regras-de-negocio/regras-por-modulo/resumo-e-estatisticas.md). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md).

---

## Overview

Mostra o **fluxo de caixa do período** (mês ou ano civil): quatro números, toggle efetivado/planejado e gráfico anual. Não persiste lançamentos — só lê o `MonthData` já carregado e agrega no cliente.

**Responsabilidade única:** calcular e exibir entradas, gastos, investimentos e saldo (mais pendências no mês efetivado) e, na visão Anual, baixar esse recorte agregado.

**Propósito no produto:** a pessoa vê se o mês “fechou” no caixa efetivado, sem misturar isso com desejos (RN-G07, RN-R05). O saldo do mês é a única leitura de saldo do produto.

---

## Bounded context

### O que este módulo FAZ

- Quatro métricas do mês: entradas, gastos, investimentos, saldo (RN-R01)
- Toggle **Efetivados** / **Planejados**, persistido e compartilhado (RN-R02)
- Linhas de pendência no modo efetivado: a receber, a pagar, a investir (RN-R03)
- Visão anual: os quatro cards mostram a média da janela em destaque e o total dos 12 meses abaixo, com mês vazio fora do divisor, mais gráfico mês a mês de caixa (RN-R04)
- Seções somente leitura abaixo da regra: entradas por tag, gastos por categoria/tipo, forma de pagamento, aportes por tag e desejos do ano (RN-R06). Regra, Entradas, Gastos, Pagamento e Investimentos têm abas Valores | Gráficos (RN-R08). Desejos não entram no caixa (RN-R05)
- Na visão Mensal, aba Resumo de Entradas/Gastos/Investimentos: lista (~70%) + pizza (~30%) lado a lado no desktop (RN-R09)
- Exportar PDF e CSV do ano e do modo ativos, sem desejos, sem gráficos por seção e sem gravar o arquivo (RN-R07)
- Seletor de mês/ano no header (clique no centro + setas); o mês fica guardado para a volta à visão Mensal
- Legenda do que o modo está somando
- Hint de entradas efetivadas com a tag histórica *Resgate de investimentos* (quando há valor)
- Destacar o mês de hoje no eixo X quando o ano visto é o ano-calendário

### O que este módulo NÃO FAZ

- CRUD de entradas ([`entradas.md`](./entradas.md)), gastos ([`gastos.md`](./gastos.md)), cartões ([`cartoes.md`](./cartoes.md)), investimentos ([`investimentos.md`](./investimentos.md)) ou desejos ([`desejos.md`](./desejos.md))
- Saldo por carteira, Saldo Livre ou patrimônio: **removidos** na DEV-151 ([`carteiras.md`](./carteiras.md), tombstone)
- Configurar ou calcular a regra 50/30/20 ([`regra-financeira.md`](./regra-financeira.md)). A UI do resumo **hospeda** a regra na coluna direita; o anual hospeda `AnnualFinancialRuleSection` — contratos e persistência ficam naquele módulo
- Soma de itens selecionados ([`selecao.md`](./selecao.md) — o toggle deste módulo **não** altera a fórmula da barra)
- Incluir desejos nos totais ou no arquivo anual (RN-R05, RN-R07)
- Exportar a visão Mensal, cada lançamento ou os dois modos no mesmo arquivo

---

## Estrutura de arquivos

```text
frontend/src/
  pages/Index.tsx                              # view dashboard | statistics; lazy de Statistics
  components/MonthSummarySection.tsx           # bloco mensal (métricas + hospeda a regra)
  components/Statistics.tsx                    # média, total, gráfico e exportação do ano
  components/AnnualExportActions.tsx           # Exportar CSV e Exportar PDF
  components/AnnualYearSections.tsx            # categorias, pagamento, investimentos, desejos (+ abas/gráficos)
  components/AnnualChartTabs.tsx               # abas Valores | Gráficos + seletor
  components/AnnualSectionChart.tsx            # LineChart das seções + tooltip ordenado
  components/YearNavigator.tsx                 # setas de ano no cabeçalho anual
  components/SummaryViewModeToggle.tsx         # Efetivados | Planejados
  components/layout/SummaryTotalsLegend.tsx    # texto do modo
  components/layout/MetricTile.tsx             # tile numérico (compartilhado)
  hooks/useSummaryViewMode.ts                  # estado + localStorage
  utils/business/monthTotals.ts                # fórmulas
  utils/business/annualAverage.ts              # janela da média anual e meses com lançamento
  utils/business/annualBreakdown.ts            # categoria, tipo, pagamento e tag
  utils/business/annualMonthlySeries.ts        # séries mês a mês dos gráficos por seção
  utils/business/annualExportDocument.ts       # modelo do PDF/CSV anual
  utils/business/annualExportCsv.ts
  utils/business/annualExportPdf.ts            # jspdf só no clique
  utils/business/__tests__/annualExportDocument.test.ts
  utils/business/__tests__/annualAverage.test.ts
  utils/business/__tests__/annualBreakdown.test.ts
  utils/business/__tests__/annualMonthlySeries.test.ts
  utils/business/__tests__/monthTotals.test.ts
  services/financeQueries.ts                   # fetchMonthBundle / fetchYearData
  hooks/useSupabaseFinance.ts                  # yearQuery só com statisticsEnabled
  utils/business/yearDataSync.ts               # patch do cache anual após mutação
  lib/utils.ts                                 # formatSummaryMonthTitle
```

| Arquivo | Descrição |
| --- | --- |
| `monthTotals.ts` | `calculateMonthTotals`, pendências, gasto efetivo no cartão, tag de resgate (histórico) nas entradas |
| `MonthSummarySection.tsx` | Quatro tiles + pendências; coluna direita é regra financeira |
| `Statistics.tsx` | Cards anuais (média e total) + `LineChart` (recharts); exportação; abaixo, regra anual e `AnnualYearSections`. Lê a regra uma vez e repassa à seção |
| `annualExportDocument.ts` | Mesmas seções da tela, sem desejos. CSV e PDF só formatam esse modelo |
| `annualAverage.ts` | Janela: 12 meses no ano encerrado; meses completos no ano corrente; zero no ano futuro. O divisor conta só os meses da janela com fluxo no modo ativo |
| `annualBreakdown.ts` | Total dos 12 meses e média da janela por categoria, tipo, forma de pagamento e tag |
| `annualMonthlySeries.ts` | Séries mês a mês + defaults/seletores (top 3, cartões agrupados, todas as tags) |
| `AnnualChartTabs.tsx` / `AnnualSectionChart.tsx` | UI das abas e do gráfico; tooltip ordena do maior para o menor |
| `useSummaryViewMode.ts` | Chave `tidy-summary-view-mode` |
| `financeQueries.ts` | 12 `fetchMonthBundle` em paralelo para o ano |
| `Index.tsx` | Nav **Mensal** / **Anual** na mesma rota `/` |

---

## Entidades e models

Este módulo **não tem tabela própria**. Consome o agregado em memória `MonthData` (lançamentos do mês + status das faturas). Schema das tabelas: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md) e os módulos de lançamento.

### Agregado: `MonthData`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `incomes` | `Income[]` | Sim | Inclui entradas antigas com tag de resgate (`tag`) |
| `expenses` | `Expense[]` | Sim | Cartão identificado por `paymentMethod` = **nome** do cartão |
| `investments` | `Investment[]` | Sim | Aportes do mês |
| `cardMonthlyStatuses` | `Record<cardId, boolean>` | Não | Fatura paga naquele mês |

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

- Entradas: `received === true` (inclui entrada recebida com tag de resgate)
- Gastos: `isExpenseEffectivelyPaid` — se `paymentMethod` casa com `creditCards[].name` e há `cardMonthlyStatuses`, vale o status da **fatura**; senão vale `expense.paid`
- Investimentos: `invested === true`
- Saldo: entradas − gastos − investimentos

Modo **planejado** (`calculatePlannedMonthTotals`): soma lançamentos do array **exceto** entradas com tag de resgate (`isResgateIncome`). Alinhado a RN-G03.

Pendências (`calculatePendingMonthTotals`, só na UI efetivada):

```
pendingIncome       = max(0, soma(incomes) − soma(incomes.received))
pendingExpenses     = max(0, soma(expenses) − gastos efetivos)
pendingInvestments  = max(0, soma(investments) − investimentos efetivos)
```

Usar a renda **recebida** (incluindo entradas com tag de resgate) no subtraendo evita inflar “a receber” com elas (RN-R03; coberto por teste).

Hint no tile: `getResgateInflowFromIncomes` — só tag `Resgate de investimentos` **e** `received`. Só no modo efetivado.

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
| `/` · `view = dashboard` (rótulo **Mensal**) | `MonthSummarySection` | Primeiro bloco; abaixo vêm os registros |
| `/` · `view = statistics` (rótulo **Anual**) | `Statistics` | Ano = parte `YYYY` de `currentMonth` |
| Nav desktop/mobile | `Index.tsx` | Ícones `Wallet` / `BarChart3` (lucide; `Wallet` é só ícone da visão Mensal) |

Título mensal: `formatSummaryMonthTitle` → “Resumo de Mês de {mês}”.

Saldo ≥ 0 em verde (`text-income`); negativo em vermelho (`text-expense`), com `+` só se positivo.

Gráfico anual: linhas Entradas, Gastos, Investimentos, Saldo (stroke âmbar no Saldo; dots verde/vermelho conforme o sinal). Não entra na média. Estado vazio se os três totais do ano são 0; os cards continuam visíveis. Overlay de loading se o ano já tem cache e está refetching.

A janela é calculada uma vez em `Statistics` (`today` do mount). A média dos cards soma a fatia `averageWindow.monthCount` e divide por `activeMonthCount`. Divisor zero devolve ausência, não o zero de uma divisão. A regra recebe o tamanho da janela, o divisor e `averageWindowLabel`. As seções de dinheiro usam o mesmo divisor. `Index` não guarda modo Total/Média. `Index` repassa a lista de desejos já carregada; `groupWishesForYear` só lê. A soma dos cartões está em `sumCardPaymentRows`.

### Erros comuns

Não há API própria. Falha ao montar um mês em `fetchYearData` vira `getEmptyMonthData()` naquele índice — o gráfico não quebra.

---

## Regras de negócio

Detalhe: [`../02_regras-de-negocio/regras-por-modulo/resumo-e-estatisticas.md`](../02_regras-de-negocio/regras-por-modulo/resumo-e-estatisticas.md). Gerais: [`../02_regras-de-negocio/regras-gerais.md`](../02_regras-de-negocio/regras-gerais.md) (RN-G02, RN-G03, RN-G07 saldo do mês, RN-G08 tag histórica). Cartão no caixa efetivado: [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md).

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-R01 | Quatro números; saldo colorido | `MonthSummarySection`, `Statistics` `StatCard` |
| RN-R02 | Toggle compartilhado (resumo, regra, anual) | `useSummaryViewMode` |
| RN-R03 | Pendências só no efetivado; “a receber” sem misturar tag de resgate | `calculatePendingMonthTotals` + UI oculta no planejado |
| RN-R04 | Média da janela em destaque e total dos 12 meses juntos; mês vazio fora do divisor; gráfico mês a mês; seletor mês/ano no header | `annualAverage.ts`, `Statistics`, `MonthNavigator`, `YearNavigator` |
| RN-R05 | Desejos fora do caixa; histórico só na seção anual | ausência em `monthTotals.ts`; `groupWishesForYear` |
| RN-R06 | Seções anuais Entradas, Gastos, pagamento (com soma dos cartões), aportes e desejos; abas Valores | `annualBreakdown.ts`, `AnnualYearSections.tsx` |
| RN-R07 | PDF/CSV do ano e do modo ativos; desejos e gráficos por seção de fora; sem gravação | `annualExportDocument.ts`, `AnnualExportActions.tsx` |
| RN-R08 | Gráficos por seção (Regra, Entradas, Gastos, Pagamento, Investimentos) | `annualMonthlySeries.ts`, `AnnualChartTabs`, `AnnualSectionChart`, `AnnualFinancialRuleSection` |
| RN-R09 | Pizza ao lado do Resumo mensal (Entradas, Gastos, Investimentos) | `SummaryPieChart.tsx`, seções mensais |
| RN-G03 | Fórmulas efetivado / planejado | `monthTotals.ts` |
| RN-G08 | Tag de resgate = entrada normal (efetivado conta; planejado fora) | `getResgateInflowFromIncomes`; `isResgateIncome` |

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — `ProtectedRoute` / sessão; sem user o hook não busca
- [`entradas.md`](./entradas.md), [`gastos.md`](./gastos.md), [`investimentos.md`](./investimentos.md), [`cartoes.md`](./cartoes.md) — este módulo só lê o que eles persistem (`MonthData`, faturas)

### Módulos que este hospeda na UI (não são deste bounded context)

- [`regra-financeira.md`](./regra-financeira.md) — `FinancialRuleDisplay` / `FinancialRuleSetup` no resumo; `AnnualFinancialRuleSection` no anual; mesmo `viewMode`

### Serviços / integrações externas

- Supabase Postgres via facades (`incomes`, `expenses`, `investments`, `creditCards`): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `@tanstack/react-query` | `monthQuery` / `yearQuery` |
| `recharts` | gráfico anual |
| `jspdf` + `jspdf-autotable` | PDF anual; import dinâmico no clique de Exportar PDF |
| `sonner` | toast se a exportação falhar |

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
| Arquivos de teste | `monthTotals.test.ts`, `annualAverage.test.ts`, `annualBreakdown.test.ts`, `annualMonthlySeries.test.ts`, `annualExportDocument.test.ts` |
| UI (`MonthSummarySection` / `Statistics`) | Nenhum spec |
| Cobertura | Só as funções puras listadas abaixo — não inventar % |
| Coleções / manuais | Jornada 2 em [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md) |

**Casos cobertos hoje:**

- [x] Entrada com tag de resgate recebida entra em `totalIncome` efetivado
- [x] Entrada com tag de resgate não recebida não entra no efetivado
- [x] `getResgateInflowFromIncomes` soma só tag de resgate recebida
- [x] Pendência de entradas não infla com entrada de resgate já recebida
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
| 2026-10-14 | 1.1 | Exportação anual agregada em PDF e CSV (RN-R07) | DEV-150 | Technical Writer |
| 2026-10-16 | 1.2 | Remove carteiras: sem `accountOperations` no `MonthData`; saldo do mês como única leitura | DEV-151 | Technical Writer |
| 2026-10-16 | 1.3 | Gráfico anual: `BarChart` → `LineChart` (evolução mês a mês) | DEV-152 | Technical Writer |
| 2026-10-17 | 1.4 | Abas Valores/Gráficos e séries mês a mês por seção (RN-R08) | DEV-153 | Technical Writer |
| 2026-10-17 | 1.5 | Entradas no anual + rename Gastos; seletor mês/ano; pizza no Resumo mensal (RN-R06–R09) | DEV-154, DEV-155, DEV-156 | Technical Writer |
| 2026-10-19 | 1.6 | Pizza do Resumo: proporção desktop ~30% (RN-R09) | DEV-155 | Technical Writer |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/resumo-e-estatisticas.md`
- Índice: [`index.md`](./index.md)
- Autenticação: [`autenticacao.md`](./autenticacao.md)
- Saldo do mês (única leitura de saldo): RN-G07 + glossário
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
