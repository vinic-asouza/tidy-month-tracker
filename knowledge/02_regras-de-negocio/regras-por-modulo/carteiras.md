---
type: regras-modulo
modulo: carteiras
ultima_atualizacao: 2026-08-21
---

# Carteiras

`AccountStrip`, `accounts.ts`, `accountRoles.ts`, `account_operations`.

---

## RN-W01 — Papel obrigatório

Toda carteira nasce `movement` ou `investment`. Trocar papel: bloqueado se já houver movimentos. Subtipo (corrente, poupança, etc.) só faz sentido em movimentação.

## RN-W02 — Métricas do mês (efetivados)

- **Movimentação:** Entrou / Saiu / Enviado (aportes que saíram da liquidez)
- **Investimentos:** Aportado / Resgatado / posição

Paridade de critério com o resumo (flags efetivadas + fatura paga).

## RN-W03 — Abertura do mês

Declaração manual = saldo de abertura. Sem declaração: carry-forward do fechamento anterior. Aviso se declarar com movimentos efetivados no mês.

## RN-W04 — Variação

- Movimentação: `inflow − outflow` (aportes enviados saem da liquidez)
- Investimentos: aportes + transfer_in − resgates (posição)

## RN-W05 — Transferência

`TransferDialog`: par `transfer_out` + `transfer_in` entre movimentação e/ou Saldo Livre. Origem ≠ destino; valor > 0. **Não** altera resumo nem regra 50/30/20. Para aplicar em investimento, use aporte (RN-I02).

## RN-W06 — Resgate

`WithdrawalDialog`: origem = carteira de investimentos; destino = movimentação ou Saldo Livre. Gera entrada automática (RN-G08, RN-E04).

## RN-W07 — Saldo Livre

Chip sempre visível. Acumula efetivados sem `account_id` e resgates para fora das carteiras nomeadas. Ao efetivar, a pessoa confirma Saldo Livre ou escolhe carteira.

## RN-W08 — Excluir carteira

Movimentos permanecem; vínculo some. Não apaga histórico financeiro.

## RN-W09 — Patrimônio estimado

Soma dos fechamentos das carteiras + Saldo Livre (`getTotalEstimatedPatrimony`). Continua sendo estimativa (RN-G07).
