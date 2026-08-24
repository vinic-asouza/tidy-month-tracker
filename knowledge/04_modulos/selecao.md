---
type: modulo
nome: Seleção
status: Ativo
versao: "1.0"
owner: Development
ultima_atualizacao: 2026-08-23
tags: [selecao, frontend, ui]
dependencias: [autenticacao, entradas, gastos, investimentos, cartoes]
---

# Módulo — Seleção

Documento-base em `knowledge/04_modulos/selecao.md`. Atualize quando o escopo das listas, o critério efetivado da barra ou o hint em `localStorage` mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/selecao.md`](../02_regras-de-negocio/regras-por-modulo/selecao.md). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Jornada: [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md). Critério efetivado de gasto: [`../02_regras-de-negocio/regras-por-modulo/gastos.md`](../02_regras-de-negocio/regras-por-modulo/gastos.md) / [`cartoes.md`](./cartoes.md) (`isExpenseEffectivelyPaid`).

---

## Overview

Soma **no cliente** os lançamentos que a pessoa tocou nas listas de entradas, gastos e investimentos, e mostra o resultado numa barra fixa no rodapé. Não persiste seleção no banco. Não altera caixa, carteira nem regra.

**Responsabilidade única:** manter três `Set<string>` no `Index` e exibir totais efetivados (e, se divergir, o planejado) em `SelectionBottomBar`.

**Propósito no produto:** conferir um subconjunto do mês sem misturar desejos nem o saldo do resumo (RN-S01, RN-S02).

---

## Bounded context

### O que este módulo FAZ

- Selecionar / deselecionar pelo **clique na linha** (exceto botões da linha e o toggle recebido/pago/investido) (RN-S01)
- Visual: borda colorida no item (`border-income/60`, `border-expense/60`, `border-investment/60`)
- Barra inferior só se `selectedCount > 0`; some com “Desmarcar todos” (RN-S03)
- Soma **por tipo** (entradas, investimentos, gastos) só com valor efetivado `> 0`
- **Total efetivado** = soma das três fatias efetivadas — **não** é fluxo líquido (entrada − gasto − aporte)
- Contar selecionados vs efetivados; hint âmbar se a soma efetivada for `0`
- Mostrar **Planejado** só se a soma nominal dos selecionados for `> 0` e **diferente** do total efetivado
- Toast de hint na primeira seleção (`localStorage` `tidy-selection-hint-seen`)
- Zerar os três Sets ao trocar o mês de navegação
- `pb-24` no root da página enquanto há seleção (espaço para a barra)

### O que este módulo NÃO FAZ

- CRUD de lançamentos ([`entradas.md`](./entradas.md), [`gastos.md`](./gastos.md), [`investimentos.md`](./investimentos.md)) — as seções só encaminham `selectedIds` / `onSelectionChange`
- Totais do resumo / gráfico anual ([`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — o toggle `tidy-summary-view-mode` **não** muda a fórmula da barra)
- Pagar fatura ([`cartoes.md`](./cartoes.md) — este módulo só **lê** `cardMonthlyStatus` no critério do gasto)
- Incluir desejos ([`desejos.md`](./desejos.md) — `WishSection` não recebe `selectedIds`) (RN-S01)
- Chips de carteira, regra 50/30/20, autenticação
- Persistência da seleção (refresh, outro dispositivo ou logout zera; só o hint fica no `localStorage`)
- Ação em lote (apagar, efetivar ou exportar os selecionados)
- REST / tabela / Express

---

## Estrutura de arquivos

```text
frontend/src/
  pages/Index.tsx                              # três Sets; somas; limpa no mês; monta a barra
  components/MonthRecordsSection.tsx           # encaminha selectedIds às três seções
  components/IncomeSection.tsx                 # clique na linha + borda
  components/ExpenseSection.tsx                # idem
  components/InvestmentSection.tsx             # idem
  components/SelectionBottomBar.tsx            # UI da barra (return null se count = 0)
  components/SelectionToggle.tsx               # checkbox; **não é importado por ninguém**
  utils/selectionHint.ts                       # toast + localStorage
  utils/business/monthTotals.ts                # isExpenseEffectivelyPaid (gasto)
```

| Arquivo | Descrição |
| --- | --- |
| `Index.tsx` | Estado, `selectionSummary`, `effectiveSelectedCount`, `selectionPlannedTotal`, `handleClearAllSelections` |
| `SelectionBottomBar.tsx` | Copy, fatias por tipo, planejado, total, botão limpar |
| `selectionHint.ts` | Uma vez por origem (`'true'` na chave); toast 5s |
| `SelectionToggle.tsx` | Residual; o clique na linha substitui o checkbox |
| Seções | `toggleItemSelection` + `handleItemClick` (ignora `button` e `[role="checkbox"]`) |

Não há adapter, rota Express nem pasta `backend/` deste domínio.

---

## Entidades e models

Não há tabela. A seleção vive em memória no `Index`.

### Estado no cliente

| Peça | Tipo | Persistência | Descrição |
| --- | --- | --- | --- |
| `selectedIncomeIds` | `Set<string>` | Não | IDs de `incomes` do mês aberto |
| `selectedExpenseIds` | `Set<string>` | Não | IDs de `expenses` |
| `selectedInvestmentIds` | `Set<string>` | Não | IDs de `investments` |
| `tidy-selection-hint-seen` | string `'true'` | `localStorage` | Hint já mostrado |

IDs são os das linhas já carregadas. Apagar um lançamento **não** remove o id do Set: `selectedCount` pode ficar maior que as linhas visíveis; as somas só consideram o que ainda está em `monthData`.

### Contrato da barra (`SelectionSummary`)

```ts
export interface SelectionSummary {
  incomes: number;
  investments: number;
  expenses: number;
}

// props: summary, selectedCount, effectiveSelectedCount, plannedTotal, onClearAll
```

**Enums:** nenhum.

---

## Interface pública

Sem API. Só UI na rota autenticada `/`.

| Superfície | Auth | Descrição |
| --- | --- | --- |
| Clique na linha (entradas / gastos / investimentos) | sessão | Toggle no Set correspondente |
| `SelectionBottomBar` | sessão | Totais; “Desmarcar todos” |
| Troca de `currentMonth` | sessão | `handleClearAllSelections` |

**Erros:** não há request. Toast só informativo no hint.

**UI / rotas**

| Rota | Componente | Observação |
| --- | --- | --- |
| `/` | `Index` + `SelectionBottomBar` | A barra fica **fora** do ternary dashboard/estatísticas: se houver seleção e a pessoa abrir a visão anual, a barra **continua** visível (as listas desmontam; não dá para clicar itens até voltar ao dashboard) |
| `/` abas do mês | `MonthRecordsSection` | Trocar Entradas ↔ Gastos ↔ Investimentos **não** zera os Sets |
| `/` aba Desejos | `WishSection` | Sem seleção |

---

## Regras de negócio

**→** [`../02_regras-de-negocio/regras-por-modulo/selecao.md`](../02_regras-de-negocio/regras-por-modulo/selecao.md)

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-S01 | Clique seleciona; desejos fora | `handleItemClick` nas três seções; `WishSection` sem props de seleção |
| RN-S02 | Soma por tipo + total; critério efetivado; contar efetivados vs selecionados | `selectionSummary` / `effectiveSelectedCount` / `SelectionBottomBar` |
| RN-S03 | “Desmarcar todos” zera as **três** listas | `handleClearAllSelections` |

### Critério efetivado (barra)

Alinhado ao caixa, **independente** do toggle Efetivados/Planejados do resumo:

| Tipo | Entra na fatia efetivada se |
| --- | --- |
| Entrada | `income.received` |
| Investimento | `investment.invested` |
| Gasto | `isExpenseEffectivelyPaid(expense, creditCards, cardMonthlyStatus)` — cartão só com fatura paga no mês; senão `expense.paid` |

**Planejado da barra:** soma `value` de todos os ids selecionados ainda presentes em `monthData`, sem flags.

### Código vs regra

- **Total da barra** soma as três fatias; não reproduz o saldo do mês.
- Fatia por tipo some da UI se o efetivado daquele tipo for `0` (itens selecionados não efetivados não mostram a linha “Entradas: R$ 0”).
- Hint: as seções chamam `showSelectionHintIfNeeded` **em todo** toggle; o `Index` chama de novo só quando o Set **cresce**. A chave no `localStorage` garante uma única vez.
- Clique em editar / excluir / `StatusToggleBadge` usa `stopPropagation` (ou o guard de `button`) — não alterna seleção.
- `SelectionToggle` (checkbox) **não está ligado**; o guard `[role="checkbox"]` é residual.

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — a barra só existe no painel autenticado
- [`entradas.md`](./entradas.md) — lê `received` / `value` / `id`
- [`gastos.md`](./gastos.md) — lê linhas; efetivação não-cartão via `paid`
- [`investimentos.md`](./investimentos.md) — lê `invested` / `value` / `id`
- [`cartoes.md`](./cartoes.md) — `creditCards` + `cardMonthlyStatus` para gasto no cartão
- [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — **não** é dependência: fórmulas paralelas; `isExpenseEffectivelyPaid` é util compartilhado

### Serviços / integrações externas

- Nenhuma. Sem PostgREST deste módulo.

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `isExpenseEffectivelyPaid` | Gasto efetivado |
| `formatCurrency` | Valores na barra |
| `sonner` | Toast do hint |
| `localStorage` | `tidy-selection-hint-seen` |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| Toast info (1× por browser) | Primeira seleção (Set cresce ou toggle na seção) | `'Toque na linha para selecionar. Os totais aparecem na barra inferior.'` (5s) | Pessoa |
| Limpar Sets | Clique “Desmarcar todos” ou mudança de `currentMonth` | Três Sets vazios; barra some | `SelectionBottomBar` |
| N/A (backend) | — | Sem job, webhook ou Realtime | — |

---

## Configurações

Nenhuma variável de ambiente específica.

| Chave | Tipo | Obrigatória | Valor padrão | Descrição |
| --- | --- | --- | --- | --- |
| `localStorage` `tidy-selection-hint-seen` | string | Não | ausente | Se `'true'`, não mostra o toast de novo |

`VITE_DATA_PROVIDER` não afeta este módulo (não há fetch).

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos de teste deste módulo | Nenhum (`SelectionBottomBar`, `selectionHint`, Sets no `Index` sem spec) |
| Relacionados | `monthTotals.test.ts` cobre `isExpenseEffectivelyPaid` (caixa, não a barra) |
| Cobertura | Lacuna — não inventar % |

**Casos críticos (não automatizados hoje):**

- [ ] Clique na linha seleciona; clique de novo desmarca
- [ ] Clique no toggle recebido/pago/investido ou em editar/excluir **não** seleciona
- [ ] Desejos não entram na barra
- [ ] Barra some com count 0; “Desmarcar todos” zera as três listas
- [ ] Gasto no cartão só soma se a fatura do mês estiver paga
- [ ] Total = soma das fatias, não saldo líquido
- [ ] Planejado só aparece se divergir do efetivado
- [ ] Troca de mês zera; troca de aba do mês não zera
- [ ] Hint uma vez por `localStorage`

**Como rodar** (quando existirem testes deste módulo):

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

- Destino deste doc: `knowledge/04_modulos/selecao.md`
- Índice: [`index.md`](./index.md)
- Regras: [`../02_regras-de-negocio/regras-por-modulo/selecao.md`](../02_regras-de-negocio/regras-por-modulo/selecao.md)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
