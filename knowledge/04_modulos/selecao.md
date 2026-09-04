---
type: modulo
nome: Seleção
status: Ativo
versao: "1.1"
owner: Development
ultima_atualizacao: 2026-09-04
tags: [selecao, frontend, ui]
dependencias: [autenticacao, entradas, gastos, investimentos, cartoes]
---

# Módulo — Seleção

Documento-base em `knowledge/04_modulos/selecao.md`. Atualize quando o escopo das listas, o critério efetivado da barra, a exclusão em massa ou o hint em `localStorage` mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/selecao.md`](../02_regras-de-negocio/regras-por-modulo/selecao.md). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Jornada: [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md). Critério efetivado de gasto: [`../02_regras-de-negocio/regras-por-modulo/gastos.md`](../02_regras-de-negocio/regras-por-modulo/gastos.md) / [`cartoes.md`](./cartoes.md) (`isExpenseEffectivelyPaid`).

---

## Overview

Soma **no cliente** os lançamentos que a pessoa tocou nas listas de entradas, gastos e investimentos, e mostra o resultado numa barra fixa no rodapé. A barra também permite **excluir os selecionados em massa** (RN-S04), reusando os deletes das seções. Não persiste seleção no banco. Não altera caixa, carteira nem regra por conta própria (a exclusão dispara os facades já existentes).

**Responsabilidade:** manter três `Set<string>` no `Index`, exibir totais efetivados (e, se divergir, o planejado) em `SelectionBottomBar`, e orquestrar exclusão em lote via `BulkDeleteConfirmDialog` + `utils/business/bulkDelete.ts`.

**Propósito no produto:** conferir um subconjunto do mês e limpar vários lançamentos de uma vez, sem misturar desejos nem o saldo do resumo (RN-S01–S04).

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
- **Excluir** na barra → modal de confirmação; itens por seção; escopo de série para bloqueantes; lote sequencial pelos deletes existentes (RN-S04)

### O que este módulo NÃO FAZ

- CRUD unitário de lançamentos ([`entradas.md`](./entradas.md), [`gastos.md`](./gastos.md), [`investimentos.md`](./investimentos.md)) — as seções continuam donas do formulário / exclusão por linha
- Efetivação ou exportação em lote
- Totais do resumo / gráfico anual ([`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — o toggle `tidy-summary-view-mode` **não** muda a fórmula da barra)
- Pagar fatura ([`cartoes.md`](./cartoes.md) — este módulo só **lê** `cardMonthlyStatus` no critério do gasto)
- Incluir desejos ([`desejos.md`](./desejos.md) — `WishSection` não recebe `selectedIds`) (RN-S01)
- Chips de carteira, regra 50/30/20, autenticação
- Persistência da seleção (refresh, outro dispositivo ou logout zera; só o hint fica no `localStorage`)
- Endpoint bulk / tabela / Express dedicados à seleção

---

## Estrutura de arquivos

```text
frontend/src/
  pages/Index.tsx                              # Sets; somas; limpa no mês; barra; orquestra bulk delete
  components/MonthRecordsSection.tsx           # encaminha selectedIds às três seções
  components/IncomeSection.tsx                 # clique na linha + borda
  components/ExpenseSection.tsx                # idem
  components/InvestmentSection.tsx             # idem
  components/SelectionBottomBar.tsx            # totais; Desmarcar; Excluir
  components/BulkDeleteConfirmDialog.tsx       # modal de exclusão em massa
  components/SelectionToggle.tsx               # checkbox; **não é importado por ninguém**
  utils/selectionHint.ts                       # toast + localStorage
  utils/business/bulkDelete.ts                 # classificação bloqueante + executeBulkDelete
  utils/business/monthTotals.ts                # isExpenseEffectivelyPaid (gasto)
```

| Arquivo | Descrição |
| --- | --- |
| `Index.tsx` | Estado, somas, `handleClearAllSelections`, `handleRequestBulkDelete` / `handleConfirmBulkDelete` |
| `SelectionBottomBar.tsx` | Copy, fatias, planejado, total, Desmarcar, Excluir |
| `BulkDeleteConfirmDialog.tsx` | Lista compacta; escopo por bloqueante; colunas multi-tipo |
| `bulkDelete.ts` | `buildBulkDeleteList`, `executeBulkDelete` (parcelado série → `deleteInstallmentExpense`) |
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
| `bulkDeleteOpen` / `bulkDeleteItems` | UI | Não | Snapshot do modal de exclusão |
| `tidy-selection-hint-seen` | string `'true'` | `localStorage` | Hint já mostrado |

IDs são os das linhas já carregadas. Exclusão **unitária** na linha **não** remove o id do Set automaticamente. Exclusão **em massa** (RN-S04) remove os ids com sucesso dos Sets. As somas só consideram o que ainda está em `monthData`.

### Contrato da barra (`SelectionSummary`)

```ts
export interface SelectionSummary {
  incomes: number;
  investments: number;
  expenses: number;
}

// props: summary, selectedCount, effectiveSelectedCount, plannedTotal, onClearAll, onRequestDelete?
```

**Enums:** nenhum.

---

## Interface pública

Sem API. Só UI na rota autenticada `/`.

| Superfície | Auth | Descrição |
| --- | --- | --- |
| Clique na linha (entradas / gastos / investimentos) | sessão | Toggle no Set correspondente |
| `SelectionBottomBar` | sessão | Totais; “Desmarcar todos”; “Excluir” |
| `BulkDeleteConfirmDialog` | sessão | Confirma lote; escopo de série |
| Troca de `currentMonth` | sessão | `handleClearAllSelections` |

**Erros:** deletes individuais via hooks (toast por falha possível); lote agrega toast de sucesso / falha parcial.

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
| RN-S04 | Exclusão em massa via barra + modal; bloqueantes exigem escopo | `BulkDeleteConfirmDialog` / `bulkDelete.ts` / deletes do hook |

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
- Bulk delete: default de bloqueantes = só este mês; parcelado + série **não** usa `deleteExpense(id, true)`.

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — a barra só existe no painel autenticado
- [`entradas.md`](./entradas.md) — lê `received` / `value` / `id`; chama `deleteIncome`
- [`gastos.md`](./gastos.md) — lê linhas; `deleteExpense` / `deleteInstallmentExpense`
- [`investimentos.md`](./investimentos.md) — lê `invested` / `value` / `id`; `deleteInvestment`
- [`cartoes.md`](./cartoes.md) — `creditCards` + `cardMonthlyStatus` para gasto no cartão
- [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — **não** é dependência: fórmulas paralelas; `isExpenseEffectivelyPaid` é util compartilhado

### Serviços / integrações externas

- Nenhuma específica da seleção. Deletes reusam adapters Supabase/API dos módulos acima.

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `isExpenseEffectivelyPaid` | Gasto efetivado |
| `bulkDelete.ts` | Lista + execução do lote |
| `formatCurrency` | Valores na barra / modal |
| `sonner` | Toast do hint e do lote |
| `localStorage` | `tidy-selection-hint-seen` |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| Toast info (1× por browser) | Primeira seleção (Set cresce ou toggle na seção) | `'Toque na linha para selecionar. Os totais aparecem na barra inferior.'` (5s) | Pessoa |
| Limpar Sets | Clique “Desmarcar todos” ou mudança de `currentMonth` | Três Sets vazios; barra some | `SelectionBottomBar` |
| Bulk delete | Confirmar no modal | Deletes sequenciais; limpa ids ok; toast agregado | Hooks de finanças |
| N/A (backend) | — | Sem job, webhook ou Realtime da seleção | — |

---

## Configurações

Nenhuma variável de ambiente específica.

| Chave | Tipo | Obrigatória | Valor padrão | Descrição |
| --- | --- | --- | --- | --- |
| `localStorage` `tidy-selection-hint-seen` | string | Não | ausente | Se `'true'`, não mostra o toast de novo |

`VITE_DATA_PROVIDER` não afeta a seleção em si (não há fetch próprio); os deletes seguem o provider dos módulos.

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos de teste deste módulo | `utils/business/__tests__/bulkDelete.test.ts` |
| Relacionados | `monthTotals.test.ts` cobre `isExpenseEffectivelyPaid` (caixa, não a barra) |
| Cobertura | Domínio do lote coberto; UI da barra/modal sem spec |

**Casos críticos:**

- [ ] Clique na linha seleciona; clique de novo desmarca
- [ ] Clique no toggle recebido/pago/investido ou em editar/excluir **não** seleciona
- [ ] Desejos não entram na barra
- [ ] Barra some com count 0; “Desmarcar todos” zera as três listas
- [ ] Gasto no cartão só soma se a fatura do mês estiver paga
- [ ] Total = soma das fatias, não saldo líquido
- [ ] Planejado só aparece se divergir do efetivado
- [ ] Troca de mês zera; troca de aba do mês não zera
- [ ] Hint uma vez por `localStorage`
- [ ] Excluir em massa: variáveis; fixo este mês vs série; parcela este vs todas; misto de seções

**Como rodar:**

```bash
npm test --workspace=frontend -- src/utils/business/__tests__/bulkDelete.test.ts
```

---

## Histórico de mudanças

| Data | Versão | Descrição | Issue ID | Autor |
| --- | --- | --- | --- | --- |
| 2026-09-04 | 1.1 | Exclusão em massa (RN-S04) | DEV-106 | Technical Writer |
| 2026-08-23 | 1.0 | Bootstrap da KB a partir do código | — | Technical Writer |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/selecao.md`
- Índice: [`index.md`](./index.md)
- Regras: [`../02_regras-de-negocio/regras-por-modulo/selecao.md`](../02_regras-de-negocio/regras-por-modulo/selecao.md)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
