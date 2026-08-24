---
type: regras-modulo
modulo: cartoes
ultima_atualizacao: 2026-08-21
---

# Cartões de crédito

`CreditCardStrip`, `PayInvoiceDialog`, `creditCards.ts`. Vínculo gasto↔cartão: [políticas](../politicas-e-restricoes.md).

---

## RN-C01 — Cadastro

Nome e cor. Limite e dia de vencimento opcionais. Excluir só se **nenhum** gasto (qualquer mês) usar aquele nome como forma de pagamento.

## RN-C02 — Fatura do mês

Chip = soma de **todos** os gastos daquele cartão no mês (visão de fatura). Não é o mesmo número do resumo efetivado.

## RN-C03 — Pagar a fatura

Escolhe carteira de **movimentação** (ou Saldo Livre, conforme o dialog). Um débito `invoice_payment` pelo **total**. Isso efetiva todos os gastos daquele cartão naquele mês para caixa, regra e estatísticas.

## RN-C04 — Desmarcar fatura

Reverte o pagamento; gastos voltam a não contar no efetivado; operação de pagamento some.

## RN-C05 — Vencimento e limite

Informativos. Alerta de vencimento com fatura pendente (`CREDIT_CARD_DUE_ALERT_DAYS = 3`). Limite: % da fatura do mês; não bloqueia lançamento.
