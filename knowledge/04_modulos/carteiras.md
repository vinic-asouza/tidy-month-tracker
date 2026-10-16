---
type: modulo
nome: Carteiras
status: Removido
versao: "removido"
owner: Development
ultima_atualizacao: 2026-10-16
tags: [carteiras, removido, dev-151]
dependencias: []
---

# Módulo — Carteiras (removido)

**Status: Removido.** O módulo saiu do Finto na **DEV-151** (2026-10-16). Este arquivo existe só como marcador; não descreve comportamento atual.

Decisão permanente: [`ADR-007`](../07_decisoes-tecnicas/ADR-007-remover-carteiras.md). Release: [`v0.9.0`](../releases/v0.9.0-2026-10-16.md).

## O que foi removido

- Cadastro de carteiras (papéis movimentação / investimentos) e a faixa de chips na visão mensal
- Saldo Livre, declaração de saldo de abertura e patrimônio estimado
- Transferência entre carteiras, resgate de carteira de investimentos e aporte origem → destino
- Efetivação com escolha de carteira (movimentação) e diálogos de efetivar entrada/aporte/gasto com carteira
- Vínculo de fatura paga com carteira (`account_operations` de pagamento)
- Tabelas `accounts`, `account_balances` e `account_operations` e as colunas `account_id` / `source_operation_id` / `source_account_id` nos lançamentos (migration `supabase/migrations/remove_wallets_dev_151.sql`)
- Regras RN-W01…RN-W09

## O que permanece

Nada do módulo. O que ficou nos outros módulos:

- Efetivar entrada, gasto ou aporte é só o **toggle** de status (flag), sem conta de origem/destino
- Fatura de cartão paga só via `credit_card_monthly_status` (módulo [cartões](./cartoes.md))
- Entradas históricas com a tag **Resgate de investimentos** continuam como entradas normais (a tag ainda existe nas tags padrão de entrada)
- Leitura de caixa do mês: [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md)

## Histórico

Notas de release anteriores (`v0.1`–`v0.8`) ainda citam carteiras; são fotos históricas e não foram reescritas.
