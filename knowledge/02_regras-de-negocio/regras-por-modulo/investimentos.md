---
type: regras-modulo
modulo: investimentos
ultima_atualizacao: 2026-10-16
---

# Investimentos (aportes do mês)

`InvestmentSection`. Não há posição acumulada nem carteira de destino (removidas na DEV-151).

Esta seção responde *“quanto aportei neste mês?”* — não substitui a corretora.

---

## RN-I01 — Nascimento

`invested = false`. Tag, descrição e valor > 0 obrigatórios.

## RN-I02 — Efetivação

Marcar investido é só o **toggle** de `invested` (`StatusToggleBadge`). Sem origem, destino, carteira ou diálogo. O **saldo do mês** desconta o valor quando investido (RN-G03).

## RN-I03 — Aporte como hábito

O Finto registra *quanto* foi aportado no mês. Onde o dinheiro foi parar (corretora, banco) fica fora do produto.

## RN-I05 — Repetição e tags

Ano civil (RN-G05). Tags: mesmas regras de exclusão/renomeação que entradas. Na visão Anual, os aportes do ano agrupam pela tag (RN-R06). Na lista mensal, a ordenação “Instituição” e o resumo por grupo usam a tag.
