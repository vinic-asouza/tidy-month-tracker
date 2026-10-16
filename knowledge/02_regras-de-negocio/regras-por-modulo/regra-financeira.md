---
type: regras-modulo
modulo: regra-financeira
ultima_atualizacao: 2026-10-16
---

# Regra financeira

`FinancialRuleDisplay`, `financialRuleCalculations.ts`. Uma configuração por usuário.

---

## RN-F01 — Três buckets

Essenciais, estilo de vida, investimentos. Percentuais somam **100%**. Padrão 50/30/20; personalizável.

## RN-F02 — Base (renda)

Modo efetivado: soma das entradas **recebidas** (inclui entradas com tag histórica *Resgate de investimentos* — RN-G08).  
Modo planejado: entradas do mês **exceto** as com essa tag.  
Renda = 0 → percentuais atuais = 0 (sem divisão por zero).

## RN-F03 — Gastos na regra

Só gastos do modo ativo. Cada categoria mapeada = `essentials` ou `lifestyle`. Investimentos **não** passam por categoria de gasto: bucket próprio (% da renda sobre aportes efetivados/planejados).

## RN-F04 — Não classificado

Gastos (do modo ativo) em categoria **sem** mapeamento: entram no **saldo do mês**, linha **Não classificado** na regra, não nas barras de essenciais/estilo de vida. Alerta + CTA para mapear. Rodapé de reconciliação: classificados + não classificado.

## RN-F05 — Toggle

Mesmo modo do resumo (RN-R02).

## RN-F06 — Reset

Dá para excluir/resetar a regra na UI do resumo e na visão anual (`deleteRule`).

## RN-F07 — Média anual

A visão Anual mostra as duas leituras ao mesmo tempo. Não há modo Média. A regra soma a mesma janela do resumo (RN-R04) para a média e soma os 12 meses para o total do ano. Só os valores em R$ da média são divididos pela quantidade de meses dessa janela que tiveram entrada, gasto ou investimento no modo ativo. Mês vazio não muda a soma e sai do divisor. Os percentuais e as barras usam a renda dessa janela, não a média dos percentuais de cada mês e não um segundo conjunto de barras para o total. O total dos 12 meses pode divergir do percentual porque inclui o mês aberto.

Em cada faixa (essenciais, estilo de vida, investimentos) o número grande é o gasto ou o aporte da média; o total do ano fica à direita. Limite ou meta aparece numa linha menor, com os dois valores. A diferença em R$ não é uma linha própria: o selo da barra diz se passou ou faltou. Não classificado, quando há valor, segue o mesmo par. A visão Anual não repete o rodapé de reconciliação. A visão Mensal continua com um valor, o separador, o selo da diferença em R$ e o rodapé (RN-F04).

Janela vazia (ano futuro ou janeiro do ano corrente): as barras não aparecem, a média mostra ausência e não há divisão por zero. O total do ano continua visível.
