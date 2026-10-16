---
type: adr
id: ADR-007
titulo: Remover carteiras do produto e do schema
status: Aceito
data: 2026-10-16
autor: Development
decisores: [Development]
tags: [produto, banco]
---

# ADR-007 — Remover carteiras do produto e do schema

## Contexto e problema

O Finto tinha um módulo de **carteiras** (movimentação vs. investimentos), com Saldo Livre, declaração de saldo, transferência, resgate, aporte origem → destino e pagamento de fatura debitando carteira. Isso exigia `accounts`, `account_balances`, `account_operations` e colunas de vínculo em `incomes`, `expenses` e `investments`.

**Problema:** o módulo empurrava o produto para rastrear saldo por conta e patrimônio, longe do foco em hábito e fluxo do mês (visão do produto), e espalhava efeitos colaterais (diálogos de efetivação, operações, carry-forward) por vários módulos.

**Por que registrar:** é remoção de funcionalidade **e** de schema com perda intencional de dados de carteira; precisa ficar explícito para não ser “restaurada” por engano.

## Forças

- A leitura única de caixa é o **saldo do mês** (RN-G03); as outras leituras de patrimônio (RN-G07 antiga) eram custo de explicação
- Entradas históricas *Resgate de investimentos* não podem sumir ao dropar `account_operations` (a FK antiga era `ON DELETE CASCADE`)
- Pagar fatura já tinha o status próprio em `credit_card_monthly_status`

## Decisão

**Decidimos** remover o módulo de carteiras por inteiro:

- **Produto:** sem carteiras, Saldo Livre, patrimônio estimado, transferência, resgate de carteira nem aporte origem → destino. Efetivar entrada, gasto ou aporte é só o **toggle** da flag (`received`, `paid`, `invested`), sem conta.
- **Fatura:** pagar/desmarcar usa só `credit_card_monthly_status`; sem `invoice_payment`.
- **Histórico:** entradas com a tag *Resgate de investimentos* ficam como **entradas normais**; a tag continua nas tags padrão.
- **Schema:** `DROP` de `accounts`, `account_balances` e `account_operations` e das colunas `account_id` / `source_operation_id` / `source_account_id`, via `supabase/migrations/remove_wallets_dev_151.sql`, desvinculando `incomes.source_operation_id` **antes** do drop.

Regras e módulo: [`../02_regras-de-negocio/regras-por-modulo/carteiras.md`](../02_regras-de-negocio/regras-por-modulo/carteiras.md), [`../04_modulos/carteiras.md`](../04_modulos/carteiras.md) (tombstones). Banco: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md).

## Opções consideradas

### Opção 1: Remover módulo e tabelas _(escolhida)_

**Prós:** menos superfície; efetivar fica simples; schema coerente com o produto.  
**Contras:** dados de carteira (nomes, saldos declarados, operações) são **perdidos** na migration; reverter exige novo trabalho de produto.

### Opção 2: Esconder a UI e manter o schema _(descartada)_

**Prós:** reversível.  
**Contras:** código e tabelas mortos; risco de drift; RLS e índices para nada.

### Opção 3: Simplificar carteiras (só rótulo, sem saldo) _(descartada)_

Mantém o custo de modelo sem entregar o hábito que o produto quer.

## Justificativa

Decisão de produto alinhada à visão (fluxo do mês e hábito, não patrimônio). Preservar as entradas de resgate evita perder histórico de caixa efetivado.

## Consequências

**Positivas:** uma leitura de saldo; toggle simples; menos tabelas e testes.

**Negativas:** quem usava carteiras perde esses dados e fluxos. Notas de release `v0.1`–`v0.8` continuam citando carteiras como foto histórica.

**Follow-up:** se carteiras voltarem, crie **ADR nova** (substitui esta) e novas migrations; não reaplique `create_accounts.sql` e correlatas sobre o schema atual sem revisão.

## Conformidade

| Mecanismo | Como |
| --- | --- |
| Migration | `remove_wallets_dev_151.sql` aplicada no Supabase remoto antes/junto do deploy |
| Código | Sem `AccountStrip`, facades `accounts*` nem `account_id` em `types/domain.ts` |
| Release | [`../releases/v0.9.0-2026-10-16.md`](../releases/v0.9.0-2026-10-16.md) |

## Notas

Índice: [index.md](./index.md).
