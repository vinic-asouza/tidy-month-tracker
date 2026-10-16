---
type: regras-modulo
modulo: cartoes
ultima_atualizacao: 2026-10-16
---

# Cartões de crédito

`CreditCardStrip`, `PayInvoiceDialog`, `creditCards.ts`. Vínculo gasto↔cartão: [políticas](../politicas-e-restricoes.md).

---

## RN-C01 — Cadastro

Nome e cor. Limite e dia de vencimento opcionais. Excluir só se **nenhum** gasto (qualquer mês) usar aquele nome como forma de pagamento.

## RN-C02 — Fatura do mês

Chip = soma de **todos** os gastos daquele cartão no mês (visão de fatura). Não é o mesmo número do resumo efetivado.

## RN-C03 — Pagar a fatura

`PayInvoiceDialog` só confirma o **total da fatura**; não há carteira, Saldo Livre nem data de pagamento separada. Grava `credit_card_monthly_status` (`paid = true`) via `setCardMonthlyStatus`. Isso efetiva todos os gastos daquele cartão naquele mês para caixa, regra e estatísticas.

## RN-C04 — Desmarcar fatura

Reverte o status (`paid = false`); gastos voltam a não contar no efetivado.

## RN-C05 — Vencimento e limite

Informativos. Alerta de vencimento com fatura pendente (`CREDIT_CARD_DUE_ALERT_DAYS = 3`). Limite: % da fatura do mês; não bloqueia lançamento.
