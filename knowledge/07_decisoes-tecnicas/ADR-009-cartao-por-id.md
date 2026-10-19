---
type: adr
id: ADR-009
titulo: Gasto no cartão casa pelo credit_card_id
status: Aceito
data: 2026-10-19
autor: Development
decisores: [Development]
tags: [dados, integridade]
substitui: ADR-005
---

# ADR-009 — Gasto no cartão casa pelo credit_card_id

## Contexto e problema

ADR-005 casava gasto↔cartão por nome em `payment_method`. Rename e homônimos eram frágeis. DEV-144 elevou o P3 do roadmap.

## Decisão

**Decidimos** persistir `expenses.credit_card_id UUID NULL REFERENCES credit_cards(id) ON DELETE SET NULL` como **fonte de verdade**. `payment_method` permanece rótulo denormalizado (nome do cartão ou método padrão).

- Match/fatura: preferir `creditCardId`; fallback por nome só se `creditCardId` for null (legado).
- Id apontando para cartão inexistente: **não** usar fallback por nome.
- Rename: atualiza label dos gastos com aquele id (e associa legados por nome).
- Delete: bloqueado se há gastos com o id (ou legado por nome).

Migration: `add_expenses_credit_card_id_dev_144.sql`.

## Consequências

**Positivas:** rename estável; FK referencial; fatura não órfã por tipografia.

**Negativas:** dual-write id + label até o legado sumir; Express backend (se usado) ainda sem o campo.

## Notas

Substitui [ADR-005](./ADR-005-cartao-por-nome.md). Índice: [index.md](./index.md).
