---
type: regras-modulo
modulo: resumo-e-estatisticas
ultima_atualizacao: 2026-10-14
---

# Resumo do mês e estatísticas anuais

Componentes: `MonthSummarySection`, `Statistics`. Cálculo: `monthTotals.ts`.

---

## RN-R01 — Quatro números

Entradas, gastos, investimentos e saldo, conforme o modo do toggle (RN-G03). Saldo positivo em verde; negativo em vermelho.

## RN-R02 — Toggle compartilhado

Efetivados (padrão) | Planejados. O mesmo modo alimenta resumo, gráfico, regra financeira e as seções de dinheiro da visão Anual (RN-R06). Total/Média alimenta só os cards, o gráfico e a regra. Na visão Anual os dois controles ficam na barra acima das seções. A visão Mensal tem a própria instância; o `localStorage` alinha a próxima montagem, não as duas ao vivo.

## RN-R03 — Pendências (modo efetivado)

Linhas secundárias: a receber, a pagar, a investir — planejado do tipo **menos** efetivado daquele tipo. Pendência de entradas usa renda **recebida**, sem misturar resgate na conta de “a receber”.

## RN-R04 — Visão anual

O cabeçalho troca o seletor de mês por setas de ano. Fora do ano-calendário de hoje, aparece o atalho para o ano atual. O mês aberto fica guardado: ao voltar para Mensal, é o mesmo mês nesse ano.

Dois eixos independentes. Efetivados/Planejados segue a RN-R02. Total (padrão) soma os 12 meses. Média soma só a janela e divide pelo tamanho dela. O gráfico continua um valor por mês.

Janela da média, sem olhar o mês selecionado:

- Ano anterior ao de hoje: 12 meses.
- Ano corrente: só meses já encerrados (em 13 de outubro, janeiro a setembro).
- Ano futuro: nenhum mês completo; não divide por zero.

Mês vazio dentro da janela sai do divisor. Vazio significa que, no modo ativo, entrada, gasto e investimento somam zero. Um mês que só tem entrada continua no divisor das médias de gasto. O total dos 12 meses não muda. O mês aberto e os meses futuros continuam fora da janela. Divisor zero: as seções de dinheiro mostram ausência de média; cards e regra não dividem por zero.

Quando a quantidade de meses com lançamento é menor que a janela, o rótulo diz quantos meses entraram (por exemplo, “Média de 2 meses com lançamentos, até setembro”). Se coincidem, o rótulo continua o da janela inteira.

Total/Média vive na página, não no `localStorage`: permanece ao trocar o ano e volta para Total ao sair da visão Anual.

Mesma regra de gasto no cartão (só conta com fatura paga, no modo efetivado). O eixo X destaca o mês de hoje quando o ano visto é o ano-calendário; nos outros anos, não destaca.

## RN-R05 — Sem desejos no caixa

Desejos não entram nos quatro números, no gráfico nem na regra. A visão Anual lista o histórico do ano (RN-R06) sem somar no caixa.

## RN-R06 — Seções da visão Anual

Abaixo dos cards, do gráfico e da regra, somente leitura, nesta ordem: Categorias, Método de pagamento, Investimentos, Desejos. Não há seção de carteiras.

Nas três seções de dinheiro, cada linha mostra total e média ao mesmo tempo. Total soma os 12 meses. Média usa a janela e o divisor da RN-R04. Linha com total zero no modo ativo some. Ordenação: maior total, empate por nome em pt-BR.

- Categorias: gastos por categoria. No mesmo bloco, os mesmos gastos em fixo, parcelado e variável. Um gasto entra na categoria e no tipo, sem somar duas vezes dentro do mesmo recorte.
- Método de pagamento: uma linha por forma usada. Cartão é a forma cujo nome coincide com um cartão cadastrado.
- Investimentos: aportes agrupados pela tag (RN-I05), não pela carteira de destino. Tag em branco, só espaços, `—` ou `-` vira Sem classificação. Efetivado exige `invested`. Planejado inclui todos os aportes do ano.
- Desejos, três grupos, fora do caixa: conquistado com mês de conquista no ano; ativo cujo intervalo do mês de criação até o prazo cruza o ano; expirado com prazo no ano. A lista não expira nem grava status.
