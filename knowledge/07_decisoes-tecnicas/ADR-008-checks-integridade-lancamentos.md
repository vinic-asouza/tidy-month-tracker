---
type: adr
id: ADR-008
titulo: CHECKs de integridade em lançamentos no Postgres
status: Aceito
data: 2026-10-19
autor: Development
decisores: [Development]
tags: [seguranca, banco]
substitui_parcialmente: ADR-006
---

# ADR-008 — CHECKs de integridade em lançamentos no Postgres

## Contexto e problema

ADR-006 deixou valor > 0 e formato de mês só no cliente. Com anon key pública (ADR-003), PostgREST aceitava dados inválidos se o schema permitisse. DEV-143 elevou isso a P1.

## Forças

- Dados atuais limpos (audit sem outliers)
- CHECK da regra financeira (soma 100%) já existia
- Listas dinâmicas (categoria ∈ settings, método ∈ defaults∪cards) não cabem bem em CHECK estático

## Decisão

**Decidimos** adicionar no Postgres (migration `add_financial_integrity_checks_dev_143.sql`):

| Tabela | Constraint |
| --- | --- |
| expenses, incomes, investments | `value > 0` |
| expenses, incomes, investments | `year_month ~ '^\d{4}-\d{2}$'` |
| expenses | se `type = 'installment'`, `current`/`total` NOT NULL, ≥ 1 e `current ≤ total` |

**Permanece só na aplicação** (não CHECK): pertencimento de categoria às settings do usuário; método ∈ `DEFAULT_PAYMENT_METHODS` ∪ nomes/ids de cartão; regras de UX de formulário.

Validação no cliente **continua** para UX imediata; o banco é rede de segurança.

## Consequências

**Positivas:** invariantes financeiras essenciais não dependem só do cliente.

**Negativas:** erros PostgREST se um cliente antigo enviar inválido — forms já bloqueiam.

**Follow-up:** DEV-144 (`credit_card_id`); DEV-145 (RPCs atômicas). Relação com ADR-005 permanece até DEV-144.

## Conformidade

| Mecanismo | Como |
| --- | --- |
| Banco | CHECKs acima |
| UI | bloqueio valor ≤ 0; forms |
| App-only | categoria/método dinâmicos |

## Notas

Índice: [index.md](./index.md). ADR-006 marcada como parcialmente substituída.
