---
type: adr
id: ADR-005
titulo: Gasto no cartão casa pelo nome
status: Aceito
data: 2026-08-23
autor: Development
decisores: [Development]
tags: [dados, integridade]
---

# ADR-005 — Gasto no cartão casa pelo nome

## Contexto e problema

Gasto no crédito precisa entrar na fatura do cartão. O schema de `expenses` guarda `payment_method` (texto), não FK.

**Problema técnico:** como ligar linha de gasto ↔ `credit_cards`.

**Por que registrar:** dois cartões homônimos e rename são armadilhas; P3 no roadmap quer `credit_card_id`.

## Forças

- Lista de pagamento = métodos default **mais** nomes dos cartões (D8: sem CRUD extra de métodos)
- Fatura do mês = soma dos gastos cujo texto = `credit_card.name`
- Renomear cartão já **propaga** `expenses.payment_method` no código atual

## Decisão

**Decidimos** casar gasto e cartão por **igualdade de nome** (`paymentMethod === creditCard.name`), não por UUID. É decisão de **MVP/beta**, não o modelo alvo.

Política: [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md). Módulo: [`../04_modulos/cartoes.md`](../04_modulos/cartoes.md). Roadmap P3: [`../01_produto/roadmap.md`](../01_produto/roadmap.md).

## Opções consideradas

### Opção 1: Match por nome _(escolhida agora)_

**Prós:** simples; rename tratado no adapter.  
**Contras:** colisão de nomes; rename falho = fatura órfã; não é integridade referencial.

### Opção 2: `credit_card_id` FK _(adiada — P3)_

**Prós:** sem homônimo.  
**Contras:** migration + UI de todos os gastos no cartão.

### Opção 3: Nome imutável _(descartada)_

Pior UX; não resolve duplicata na criação.

## Justificativa

O produto já opera assim; FK é mudança de schema combinada, não um “fix silencioso”.

## Consequências

**Positivas:** um campo só na linha de gasto.

**Negativas:** risco de integridade (homônimos); não é bug de **auth** (ADR-003).

**Follow-up:** quando P3 for puxado no Linear, **ADR-007+** substitui esta; não reescrever a ADR-005.

## Conformidade

| Mecanismo | Como |
| --- | --- |
| Código | `isCreditCardExpense` / match por nome |
| UI | recusa nome duplicado (case-insensitive) na criação |

## Notas

Índice: [index.md](./index.md).
