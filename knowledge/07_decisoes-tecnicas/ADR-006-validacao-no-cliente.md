---
type: adr
id: ADR-006
titulo: Regras de valor e percentual no cliente
status: Parcialmente substituída
data: 2026-08-23
autor: Development
decisores: [Development]
tags: [seguranca, banco]
substituida_por: ADR-008
---

# ADR-006 — Regras de valor e percentual no cliente

> **Status:** parcialmente substituída por [ADR-008](./ADR-008-checks-integridade-lancamentos.md) (DEV-143): valor > 0, `year_month` e coerência de parcelas agora têm CHECK no Postgres. Validação de UX no cliente e listas dinâmicas (categoria/método) permanecem como nesta ADR.

## Contexto e problema

Valor > 0, soma 100% da regra, formulários: dá para pôr CHECK no Postgres ou só na UI.

**Problema técnico:** PostgREST aceita o que o schema aceitar; a anon key é pública (ADR-003).

**Por que registrar:** um cliente adulterado pode gravar `0` ou regra inválida **se** não houver CHECK. Aceito no beta; P4 no roadmap (antecipado em DEV-143 / ADR-008).

## Forças

- CHECK da regra financeira **existe** para soma exacta 100,00 (`financial_rule`)
- Valor > 0 em lançamentos **não** está em todos os CHECKs
- Beta / MVP: iterar form mais rápido que migration

## Decisão

**Decidimos** aplicar valor ≤ 0, percentuais da regra no wizard e campos obrigatórios **no cliente** (Zod no auth; forms financeiros nas seções). Não tratar isso como garantia de banco, excepto o CHECK já existente na soma da regra.

P4: constraints no Postgres. [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md), [`../03_arquitetura/seguranca.md`](../03_arquitetura/seguranca.md).

## Opções consideradas

### Opção 1: Validar no cliente _(escolhida agora)_

**Prós:** UX imediata; menos migrations no beta.  
**Contras:** não pára PostgREST malicioso; dívida P4.

### Opção 2: CHECK em toda tabela de valor _(adiada — P4)_

**Prós:** defesa no banco.  
**Contras:** alinhamento com todos os adapters; mensagens de erro PostgREST.

### Opção 3: Só Express valida _(inviável hoje)_

Produção não passa pelo Express (ADR-001).

## Justificativa

O CHECK da regra já cobre o invariante mais rígido. Lançamento `0` é risco de MVP documentado, não esquecimento silencioso.

## Consequências

**Positivas:** forms respondem na hora.

**Negativas:** schema permissivo ≠ produto permissivo; QA não pode só “confiar no banco”.

**Follow-up:** P4 → ADR nova; CHECKs + testes. Relacionado: inserts em série **sem** transação (consequência ADR-001), não resolvido aqui.

## Conformidade

| Mecanismo | Como |
| --- | --- |
| UI | bloqueio valor ≤ 0; regra ≠ 100% no save |
| Banco | não assumir CHECK de valor; assumir CHECK da soma da regra |

## Notas

Índice: [index.md](./index.md).
