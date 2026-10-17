---
type: produto
titulo: Glossário
ultima_atualizacao: 2026-10-16
---

# Glossário

Termos do domínio Finto. Fonte cruzada: apresentação do produto e o dialog **Como lemos seus números** (`FinancialGlossaryDialog`). Regras: [`../02_regras-de-negocio/`](../02_regras-de-negocio/README.md).

Visão: [`visao-do-produto.md`](./visao-do-produto.md).

---

## Lançamentos e caixa do mês

| Termo | Significado |
| --- | --- |
| **Entradas** | Receitas do mês (salário, extras, rendimentos). A tag *Resgate de investimentos* continua disponível; entradas antigas com ela são entradas normais. |
| **Gastos** | Despesas do mês (fixo, variável ou parcelado). |
| **Investimentos (seção)** | **Aporte** do mês — registro do hábito de investir naquele período, sem carteira de origem ou destino e sem extrato da corretora. Efetivar é marcar como investido. |
| **Planejado** | Soma dos lançamentos do mês, independente de estarem recebidos, pagos ou investidos. |
| **Efetivado** | Valores que de fato entraram, saíram ou foram investidos. Gasto no cartão só conta quando a **fatura** está paga. |
| **Saldo do mês** | Entradas efetivadas − gastos efetivados − investimentos efetivados. Fluxo líquido **deste** mês — não é saldo de conta bancária. |
| **Total do ano** | Soma dos 12 meses do ano civil, no modo efetivado ou planejado. Na visão Anual aparece junto da média, como número secundário. |
| **Média mensal do ano** | Soma da janela ÷ meses dessa janela com entrada, gasto ou investimento no modo ativo. Ano já encerrado: janela de 12 meses. Ano corrente: janeiro até o último mês completo. Ano futuro: nenhum mês completo. Mês vazio sai do divisor. Na visão Anual é o número em destaque dos cards, da regra e das seções. Sem mês na janela, mostra ausência. |
| **Saldo planejado** | Mesma fórmula sobre lançamentos planejados. Entradas com tag *Resgate de investimentos* ficam fora da renda planejada. Toggle **Planejados** no resumo. |
| **Repetição mensal** | Cópia do lançamento nos demais meses do **mesmo ano civil**. |
| **Parcela** | Parte de uma compra dividida em meses (pode atravessar o ano). |
| **Importação CSV assistida** | Fluxo em Gastos em que um CSV **propõe** linhas; a pessoa mapeia colunas, revisa e só então grava. Não é Open Finance nem lançamento automático. |
| **Exportação anual** | PDF ou CSV baixado na visão Anual, do ano selecionado e do modo ativo. Repete as leituras agregadas da tela (incluindo entradas e gastos), sem desejos e sem cada lançamento. Não grava nada. |
| **Resumo (aba)** | Em Entradas, Gastos e Investimentos na visão Mensal: lista agregada com barras + gráfico de pizza dos mesmos grupos. |

---

## Carteiras (removido)

Carteiras, Saldo Livre, patrimônio estimado, transferência, resgate de carteira e aporte origem → destino foram removidos na DEV-151 e **não são termos do produto**. Só o **saldo do mês** (acima) mede resultado. Notas de release antigas ainda os citam como histórico. Ver [`ADR-007`](../07_decisoes-tecnicas/ADR-007-remover-carteiras.md).

| Termo | Significado hoje |
| --- | --- |
| **Resgate de investimentos** | Apenas uma **tag** de entrada, ainda nas tags padrão. Entradas antigas com ela são normais; no efetivado contam na renda, no planejado ficam fora da base. Não há mais operação de resgate. |

---

## Cartão de crédito

| Termo | Significado |
| --- | --- |
| **Fatura** | Total de compras daquele cartão no mês. Ao pagar, confirma-se o **total** da fatura; o status vai para a fatura do mês, sem carteira pagadora. |
| **Fatura paga** | Status mensal que libera os gastos daquele cartão no caixa efetivado. |
| **Vencimento** | Dia informativo do cartão; não muda o cálculo da fatura. Com fatura pendente e data próxima, o chip alerta. |
| **Limite de crédito** | Opcional. O app mostra % da fatura do mês sobre o limite. Só informativo; não bloqueia lançamentos. |

---

## Regra e desejos

| Termo | Significado |
| --- | --- |
| **Regra 50/30/20** | Meta: 50% essenciais, 30% estilo de vida, 20% investimentos — sobre o que já foi **recebido** no mês. Percentuais podem ser personalizados (somam 100%). |
| **Não classificado** | Gastos efetivados em categorias ainda não mapeadas na regra. Entram no saldo do mês, não nas barras de Essenciais / Estilo de vida até o mapeamento. |
| **Desejo** | Meta de consumo com prazo e urgência. **Não** é movimento financeiro: não entra no saldo, na regra, nem nas estatísticas. |

---

## O que não confundir

- **Saldo do mês** ≠ saldo da conta no banco.
- **Seção Investimentos** = aportes do mês, não a posição na corretora.
- **Desejo** ≠ gasto. Conquistar pode abrir um gasto pré-preenchido; só o gasto (e a efetivação) mexe no caixa.
