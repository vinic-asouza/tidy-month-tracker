---
type: regras-modulo
modulo: gastos
ultima_atualizacao: 2026-08-21
---

# Gastos

`ExpenseSection`. Cartão: [`cartoes.md`](./cartoes.md). Conquista de desejo: [`desejos.md`](./desejos.md).

---

## RN-X01 — Tipos

| Tipo | Uso |
| --- | --- |
| Fixo | Recorre no ano civil (RN-G05) |
| Variável | Pontual no mês |
| Parcelado | Série com `installmentNumber` / total; **pode cruzar o ano** (`installments.ts`) |

## RN-X02 — Nascimento

`paid = false`, sem carteira (não-cartão). Categoria, forma de pagamento, descrição e valor > 0 obrigatórios.

## RN-X03 — Efetivação não-cartão

Checkbox pago → `EffectuateWalletDialog` (movimentação ou Saldo Livre).

## RN-X04 — Gasto no cartão

Sem checkbox pago no item. Status vem da **fatura** daquele mês. Não vincula carteira por lançamento; o débito é o `invoice_payment` ao pagar a fatura.

## RN-X05 — Parcelas

- Excluir “este mês”: só o registro corrente; a série pode ficar com buraco.
- Excluir “todas”: série pelo `base_expense_id`.
- Editar “todas as parcelas / meses seguintes”: escopo da série, sem copiar carteira.

## RN-X06 — Categorias

CRUD na seção. Em uso: não exclui. Renomear: propaga. Mapeamento na regra financeira é outro passo ([`regra-financeira.md`](./regra-financeira.md)).
