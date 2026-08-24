---
type: produto
titulo: Glossário
ultima_atualizacao: 2026-08-21
---

# Glossário

Termos do domínio Finto. Fonte cruzada: apresentação do produto e o dialog **Como lemos seus números** (`FinancialGlossaryDialog`). Regras: [`../02_regras-de-negocio/`](../02_regras-de-negocio/README.md).

Visão: [`visao-do-produto.md`](./visao-do-produto.md).

---

## Lançamentos e caixa do mês

| Termo | Significado |
| --- | --- |
| **Entradas** | Receitas do mês (salário, extras, rendimentos). Resgates de investimentos geram uma entrada automática já recebida. |
| **Gastos** | Despesas do mês (fixo, variável ou parcelado). |
| **Investimentos (seção)** | Aportes do mês — o hábito de investir naquele período, não o extrato da corretora. |
| **Planejado** | Soma dos lançamentos do mês, independente de estarem recebidos, pagos ou investidos. |
| **Efetivado** | Valores que de fato entraram, saíram ou foram investidos. Gasto no cartão só conta quando a **fatura** está paga. |
| **Saldo do mês** | Entradas efetivadas (incluindo resgates automáticos) − gastos efetivados − investimentos efetivados. Fluxo líquido **deste** mês — não é saldo de conta bancária. |
| **Saldo planejado** | Mesma fórmula sobre lançamentos planejados. Não inclui resgates (operações de carteira). Toggle **Planejados** no resumo. |
| **Repetição mensal** | Cópia do lançamento nos demais meses do **mesmo ano civil**. |
| **Parcela** | Parte de uma compra dividida em meses (pode atravessar o ano). |

---

## Três leituras de patrimônio

Medem coisas diferentes; as três são corretas.

| Termo | Significado |
| --- | --- |
| **Saldo do mês** | Resultado líquido do período (fluxo). Ver acima. |
| **Saldo estimado na carteira** | Posição naquela conta: declaração ou carry-forward + variação efetiva. Melhora com declarações; pode divergir do extrato. |
| **Saldo Livre** | Saldo estimado de movimentos efetivados **sem** carteira nomeada; também destino de resgates. O chip existe mesmo sem carteiras cadastradas. |
| **Patrimônio estimado** | Liquidez das carteiras de movimentação + posição das de investimentos + Saldo Livre. |

---

## Carteiras e operações

| Termo | Significado |
| --- | --- |
| **Carteira** | Conta onde o dinheiro está organizado, com um **papel** definido. |
| **Carteira de movimentação** | Liquidez do dia a dia: entradas, gastos, origem de aportes, pagamento de fatura. Chip ≈ entrou − saiu − enviado a investimentos. Reserva de emergência costuma ficar aqui. |
| **Carteira de investimentos** | Custódia da posição aplicada. Recebe aportes; origem de resgates. Chip ≈ aportado − resgatado. |
| **Carteira na efetivação** | Entradas e gastos (não-cartão) escolhem movimentação ou Saldo Livre ao efetivar. Investimentos exigem origem e destino no dialog de aporte. Cartão segue a fatura. |
| **Aporte (origem → destino)** | Ao marcar investido: de qual liquidez saiu e em qual carteira de investimentos ficou. Liquidez cai na origem; posição sobe no destino; o resumo do mês desconta o aporte. |
| **Resgate** | Sai da carteira de investimentos para movimentação ou Saldo Livre. Cria entrada automática (tag *Resgate de investimentos*), já recebida. Entra no resumo e na regra 50/30/20. |
| **Transferência** | Entre carteiras de movimentação (ou Saldo Livre). **Não** altera o resumo do mês nem a regra. Para aplicar dinheiro, use Investimentos (aporte). |

---

## Cartão de crédito

| Termo | Significado |
| --- | --- |
| **Fatura** | Total de compras daquele cartão no mês. Ao pagar, escolhe-se a carteira pagadora — um débito pelo **total**, não por lançamento. |
| **Fatura paga** | Status mensal que libera os gastos daquele cartão no caixa efetivado. |
| **Vencimento** | Dia informativo do cartão; não muda o cálculo da fatura. Com fatura pendente e data próxima, o chip alerta. |
| **Limite de crédito** | Opcional. O app mostra % da fatura do mês sobre o limite. Só informativo; não bloqueia lançamentos. |

---

## Regra e desejos

| Termo | Significado |
| --- | --- |
| **Regra 50/30/20** | Meta: 50% essenciais, 30% estilo de vida, 20% investimentos — sobre o que já foi **recebido** no mês (incluindo resgates). Percentuais podem ser personalizados (somam 100%). |
| **Não classificado** | Gastos efetivados em categorias ainda não mapeadas na regra. Entram no saldo do mês, não nas barras de Essenciais / Estilo de vida até o mapeamento. |
| **Desejo** | Meta de consumo com prazo e urgência. **Não** é movimento financeiro: não entra no saldo, na regra, nas estatísticas nem nas carteiras. |

---

## O que não confundir

- **Saldo do mês** ≠ saldo da conta no banco.
- **Seção Investimentos** = aportes do mês; **carteira de investimentos** = posição estimada.
- **Desejo** ≠ gasto. Conquistar pode abrir um gasto pré-preenchido; só o gasto (e a efetivação) mexe no caixa.
