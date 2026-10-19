---
type: adr
id: ADR-010
titulo: RPCs atômicas para séries e rename de cartão
status: Aceito
data: 2026-10-19
autor: Development
decisores: [Development]
tags: [banco, integridade, api]
---

# ADR-010 — RPCs atômicas para séries e rename de cartão

## Contexto e problema

Creates de série (fixo+repeat, parcelado) e rename de cartão faziam vários statements PostgREST. Falha no meio deixava estado parcial. Carteiras/transfers já removidos (ADR-007).

## Decisão

**Decidimos** expor RPCs `SECURITY INVOKER` (RLS preservada):

| Função | Papel |
| --- | --- |
| `create_expense_with_series` | raiz + clones/parcelas numa TX |
| `create_income_with_series` | raiz + clones do ano |
| `create_investment_with_series` | raiz + clones do ano |
| `rename_credit_card` | nome + sync de `payment_method` / legado |

Idempotência parcial: clones só inserem se não existir linha da série no mês (e parcela).

**Fora:** CSV lote (falha parcial intencional); `ensureRemainingInstallmentsExist` e type-change no update (follow-up).

Migration: `add_atomic_financial_rpcs_dev_145.sql`.

## Consequências

**Positivas:** tudo-ou-nada nas criações de série e rename de cartão.

**Negativas:** lógica de meses duplicada em SQL vs TS; updates compostos ainda multi-write.

## Notas

Índice: [index.md](./index.md). Issue DEV-145.
