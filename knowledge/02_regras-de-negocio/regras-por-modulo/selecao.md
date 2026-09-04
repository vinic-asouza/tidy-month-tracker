---
type: regras-modulo
modulo: selecao
ultima_atualizacao: 2026-09-04
---

# Seleção de itens

`SelectionBottomBar` em Entradas, Gastos e Investimentos.

---

## RN-S01 — Escopo

Clique seleciona o lançamento. Desejos **não** participam.

## RN-S02 — Soma

Barra inferior: soma por tipo e total. Critério alinhado ao efetivado (gasto no cartão só se a fatura estiver paga), com indicação de quantos selecionados estão efetivados vs. o total selecionado.

## RN-S03 — Limpar

“Desmarcar todos” zera a seleção das três listas.

## RN-S04 — Exclusão em massa (DEV-106)

Com seleção ativa, a barra oferece **Excluir**. Abre modal de confirmação com os itens ainda presentes no `monthData`, agrupados por seção (Entradas / Gastos / Investimentos). Com mais de um tipo, as seções ficam lado a lado.

- Itens **sem série**: exclusão só do registro do mês ativo.
- Itens **bloqueantes** (entrada/investimento com repetição ou `base_*`; gasto fixo com série; gasto parcelado): escolha explícita por item entre **só este mês** (default) e **série vinculada**, com atalho para aplicar a todos os bloqueantes.
- Semântica da série = exclusão unitária: fixo/recorrente → `applyToAllMonths`; parcelado → `deleteInstallmentExpense` (série pelo `base_expense_id`).
- Após sucesso: remove os ids excluídos dos Sets; toast agregado; falha parcial mantém os que falharam.
- Efetivar / exportar em lote continua fora de escopo.
