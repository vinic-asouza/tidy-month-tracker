---
type: regras-modulo
modulo: regra-financeira
ultima_atualizacao: 2026-08-21
---

# Regra financeira

`FinancialRuleDisplay`, `financialRuleCalculations.ts`. Uma configuração por usuário.

---

## RN-F01 — Três buckets

Essenciais, estilo de vida, investimentos. Percentuais somam **100%**. Padrão 50/30/20; personalizável.

## RN-F02 — Base (renda)

Modo efetivado: soma das entradas **recebidas** (inclui resgates — RN-G08).  
Modo planejado: todas as entradas do mês.  
Renda = 0 → percentuais atuais = 0 (sem divisão por zero).

## RN-F03 — Gastos na regra

Só gastos do modo ativo. Cada categoria mapeada = `essentials` ou `lifestyle`. Investimentos **não** passam por categoria de gasto: bucket próprio (% da renda sobre aportes efetivados/planejados).

## RN-F04 — Não classificado

Gastos (do modo ativo) em categoria **sem** mapeamento: entram no **saldo do mês**, linha **Não classificado** na regra, não nas barras de essenciais/estilo de vida. Alerta + CTA para mapear. Rodapé de reconciliação: classificados + não classificado.

## RN-F05 — Toggle

Mesmo modo do resumo (RN-R02).

## RN-F06 — Reset

Dá para excluir/resetar a regra na UI do resumo e na visão anual (`deleteRule`).
