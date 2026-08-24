---
type: regras-modulo
modulo: investimentos
ultima_atualizacao: 2026-08-21
---

# Investimentos (aportes do mês)

`InvestmentSection`, `EffectuateInvestmentDialog`. Posição acumulada: [`carteiras.md`](./carteiras.md).

Esta seção responde *“quanto aportei neste mês?”* — não substitui a corretora.

---

## RN-I01 — Nascimento

`invested = false`, sem origem nem destino.

## RN-I02 — Efetivação (origem → destino)

Obrigatórios e **diferentes**:

- **Origem:** carteira de movimentação ou Saldo Livre (`source_account_id` nulo = Saldo Livre)
- **Destino:** carteira de investimentos (`account_id`)

Liquidez cai na origem; posição sobe no destino; o **saldo do mês** desconta o valor (RN-G03).

## RN-I03 — Sem carteira do papel

O app oferece criar carteira (`onRequestAddAccount`) se faltar movimentação ou investimentos.

## RN-I04 — Legado

Investimento antigo só com destino, origem nula: liquidez da origem pode estar errada até re-efetivar no dialog atual.

## RN-I05 — Repetição e tags

Ano civil (RN-G05). Tags: mesmas regras de exclusão/renomeação que entradas.
