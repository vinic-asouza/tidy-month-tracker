---
type: regras-negocio
titulo: Regras gerais
ultima_atualizacao: 2026-08-21
---

# Regras gerais

Regras que atravessam vários módulos. Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Políticas (o que o produto recusa): [`politicas-e-restricoes.md`](./politicas-e-restricoes.md).

IDs `RN-G*` são estáveis para Issues e testes. Implementação de referência: `frontend/src/utils/business/` e `financialRuleCalculations.ts`.

---

## RN-G01 — Uma pessoa, só os próprios dados

Cada conta vê apenas lançamentos, carteiras, cartões, desejos e regra daquele `user_id`. Sem família, convite ou papéis. Isolamento no banco por RLS.

## RN-G02 — Planejado vs. efetivado

Todo lançamento financeiro nasce **não efetivado**.

| Tipo | Flag de efetivado |
| --- | --- |
| Entrada | `received` |
| Gasto (não-cartão) | `paid` |
| Gasto no cartão | fatura do cartão paga naquele mês (`cardMonthlyStatuses`) |
| Investimento | `invested` |

Carteira (quando aplicável) é escolhida **na efetivação**, não na criação. Preferência do toggle do resumo: `localStorage` `tidy-summary-view-mode`.

## RN-G03 — Fórmulas do mês

Modo **efetivado** (`monthTotals.ts`):

`saldo = entradas recebidas − gastos efetivamente pagos − investimentos marcados investido`

Entradas recebidas **incluem** resgates (entrada automática já recebida).

Modo **planejado**: mesma fórmula sobre **todos** os lançamentos do mês, sem flags. Resgates via operação de carteira **não** entram no saldo planejado (não são lançamentos planejados).

Desejos **não** entram em nenhuma das fórmulas.

## RN-G04 — Valor mínimo

Entradas, gastos, investimentos e desejos exigem valor **> 0**. Descrição (e tag/categoria quando o módulo pede) é obrigatória. Validação hoje é **no cliente**; o banco não replica todas as constraints (ver políticas).

## RN-G05 — Repetição no ano civil

“Repetir nos meses do ano” copia o lançamento para os **outros 11 meses do mesmo ano** (`calculateRemainingMonths`) — inclusive meses **já passados** daquele ano. **Não** cria o ano seguinte. Parcelas são a exceção: podem atravessar o ano (RN no módulo Gastos).

Editar/excluir com “todos os meses seguintes / toda a série” não propaga a carteira do mês: vínculo de carteira é **por efetivação**.

## RN-G06 — Rótulos em uso

Não se exclui tag de entrada, categoria de gasto ou cartão que ainda tenha lançamento vinculado (qualquer mês). Renomear **propaga** para todos os lançamentos daquela pessoa.

## RN-G07 — Três leituras de patrimônio

Na mesma tela coexistem, de propósito:

1. **Saldo do mês** — fluxo do período (RN-G03)
2. **Saldo estimado da carteira** — posição naquela conta
3. **Saldo Livre** — efetivados sem carteira nomeada (+ destino de resgate)

Não são bugs de reconciliação. Ver glossário.

## RN-G08 — Fonte única de resgate no caixa

Resgate cria entrada em Entradas (`received = true`, tag *Resgate de investimentos*), ligada à operação. Resumo, regra 50/30/20 e estatísticas usam essa entrada — não somam a operação `withdrawal` de novo no caixa do mês.
