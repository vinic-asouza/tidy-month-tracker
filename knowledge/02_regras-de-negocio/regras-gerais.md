---
type: regras-negocio
titulo: Regras gerais
ultima_atualizacao: 2026-10-16
---

# Regras gerais

Regras que atravessam vários módulos. Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Políticas (o que o produto recusa): [`politicas-e-restricoes.md`](./politicas-e-restricoes.md).

IDs `RN-G*` são estáveis para Issues e testes. Implementação de referência: `frontend/src/utils/business/` e `financialRuleCalculations.ts`.

---

## RN-G01 — Uma pessoa, só os próprios dados

Cada conta vê apenas lançamentos, cartões, desejos e regra daquele `user_id`. Sem família, convite ou papéis. Isolamento no banco por RLS.

## RN-G02 — Planejado vs. efetivado

Todo lançamento financeiro nasce **não efetivado**.

| Tipo | Flag de efetivado |
| --- | --- |
| Entrada | `received` |
| Gasto (não-cartão) | `paid` |
| Gasto no cartão | fatura do cartão paga naquele mês (`cardMonthlyStatuses`) |
| Investimento | `invested` |

Efetivar é **só marcar a flag** (toggle). Não há carteira, conta de origem/destino nem data de operação separada. Preferência do toggle do resumo: `localStorage` `tidy-summary-view-mode`.

## RN-G03 — Fórmulas do mês

Modo **efetivado** (`monthTotals.ts`):

`saldo = entradas recebidas − gastos efetivamente pagos − investimentos marcados investido`

Entradas recebidas incluem as com tag *Resgate de investimentos* (entradas históricas, tratadas como entradas normais).

Modo **planejado**: mesma fórmula sobre **todos** os lançamentos do mês, sem flags. Entradas com tag *Resgate de investimentos* **não** entram na renda do saldo planejado (`isResgateIncome`): só contam no efetivado.

Desejos **não** entram em nenhuma das fórmulas.

## RN-G04 — Valor mínimo

Entradas, gastos, investimentos e desejos exigem valor **> 0**. Descrição (e tag/categoria quando o módulo pede) é obrigatória. Validação hoje é **no cliente**; o banco não replica todas as constraints (ver políticas).

## RN-G05 — Repetição no ano civil

“Repetir nos meses do ano” copia o lançamento para os **outros 11 meses do mesmo ano** (`calculateRemainingMonths`) — inclusive meses **já passados** daquele ano. **Não** cria o ano seguinte. Parcelas são a exceção: podem atravessar o ano (RN no módulo Gastos).


## RN-G06 — Rótulos em uso

Não se exclui tag de entrada, categoria de gasto ou cartão que ainda tenha lançamento vinculado (qualquer mês). Renomear **propaga** para todos os lançamentos daquela pessoa.

## RN-G07 — Uma leitura de saldo: saldo do mês

O Finto mostra **uma** leitura de saldo: o **saldo do mês** — fluxo do período (RN-G03). Não existe saldo por carteira, Saldo Livre nem patrimônio estimado (removidos na DEV-151; ver [ADR-007](../07_decisoes-tecnicas/ADR-007-remover-carteiras.md)).

## RN-G08 — Tag *Resgate de investimentos* (histórico)

A tag continua nas tags padrão de entrada (`RESGATE_INCOME_TAG`). Entradas antigas com essa tag, criadas quando havia resgate de carteira, permanecem como **entradas normais** (sem vínculo com operação). Resumo, regra 50/30/20 e estatísticas as tratam como qualquer entrada recebida no efetivado; no planejado ficam fora da base de renda (RN-G03). Não existe mais resgate automático.
