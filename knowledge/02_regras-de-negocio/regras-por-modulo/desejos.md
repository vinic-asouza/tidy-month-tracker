---
type: regras-modulo
modulo: desejos
ultima_atualizacao: 2026-08-21
---

# Lista de desejos

`WishSection`, `wishItems.ts`. Isolamento financeiro é regra de produto, não omissão.

---

## RN-D01 — Fora do caixa

Desejos não entram em resumo, regra, estatísticas, carteiras nem na barra de seleção.

## RN-D02 — Campos

Descrição obrigatória, valor > 0, urgência (baixa / média / alta), prazo (`targetMonth`). `startMonth` = mês em que foi criado.

## RN-D03 — Visibilidade

| Status | Onde aparece |
| --- | --- |
| `active` | Meses de `startMonth` até `targetMonth` |
| `expired` | Só no mês do prazo (renovar ou excluir) |
| `conquered` | Some da lista ativa; filtro opcional de conquistas do mês ou do ano (`ConqueredWishScope`) |

## RN-D04 — Expiração

Ao navegar para mês **depois** do prazo, `active` vira `expired` em lote.

## RN-D05 — Renovar

`expired` → `active` com novo `targetMonth`.

## RN-D06 — Conquistar

1. Só marcar: `conquered`; caixa inalterado.
2. Marcar e registrar gasto: desejo só fica `conquered` **depois** do gasto salvo (`linked_expense_id`). Cancelar o form cancela a pendência.

Gasto no fluxo de conquista: **não-cartão nasce pago**; **cartão** espera a fatura (`ExpenseSection`). O valor do gasto pode ser editado no form (pode divergir do valor do desejo — P3 no roadmap).

## RN-D07 — Conquista some de todos os meses

`status = conquered` → `isWishVisibleInMonth` é falso (exceto o filtro explícito de conquistas na UI).
