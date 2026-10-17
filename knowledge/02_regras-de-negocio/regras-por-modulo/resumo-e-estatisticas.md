---
type: regras-modulo
modulo: resumo-e-estatisticas
ultima_atualizacao: 2026-10-17
---

# Resumo do mês e estatísticas anuais

Componentes: `MonthSummarySection`, `Statistics`. Cálculo: `monthTotals.ts`. Séries dos gráficos por seção: `annualMonthlySeries.ts`.

---

## RN-R01 — Quatro números

Entradas, gastos, investimentos e saldo, conforme o modo do toggle (RN-G03). Saldo positivo em verde; negativo em vermelho.

## RN-R02 — Toggle compartilhado

Efetivados (padrão) | Planejados. O mesmo modo alimenta resumo, gráfico de caixa, regra financeira, listas de Valores e gráficos das seções de dinheiro da visão Anual (RN-R06, RN-R08). Na visão Anual a barra acima das seções tem só esse controle. Não há seletor Total/Média. A visão Mensal tem a própria instância; o `localStorage` alinha a próxima montagem, não as duas ao vivo.

## RN-R03 — Pendências (modo efetivado)

Linhas secundárias: a receber, a pagar, a investir — planejado do tipo **menos** efetivado daquele tipo. Pendência de entradas usa renda **recebida**, sem misturar entradas com tag *Resgate de investimentos* (histórico) na conta de “a receber”.

## RN-R04 — Visão anual

O cabeçalho troca o seletor de mês por setas de ano. Fora do ano-calendário de hoje, aparece o atalho para o ano atual. O mês aberto fica guardado: ao voltar para Mensal, é o mesmo mês nesse ano.

Efetivados/Planejados segue a RN-R02. Os quatro cards mostram as duas leituras ao mesmo tempo: a média da janela é o número principal e o total dos 12 meses fica abaixo. A cor do saldo segue o sinal da média. Sem média, o card mostra ausência e não pinta um zero. O gráfico continua um valor por mês.

Janela da média, sem olhar o mês selecionado:

- Ano anterior ao de hoje: 12 meses.
- Ano corrente: só meses já encerrados (em 13 de outubro, janeiro a setembro).
- Ano futuro: nenhum mês completo; não divide por zero.

Mês vazio dentro da janela sai do divisor. Vazio significa que, no modo ativo, entrada, gasto e investimento somam zero. Um mês que só tem entrada continua no divisor das médias de gasto. O total dos 12 meses não muda. O mês aberto e os meses futuros continuam fora da janela. Divisor zero: cards, regra e seções de dinheiro mostram ausência de média (`—`), sem dividir por zero e sem exibir R$ 0,00 no lugar da média. O total dos 12 meses continua visível.

Quando a quantidade de meses com lançamento é menor que a janela, o rótulo diz quantos meses entraram (por exemplo, “Média de 2 meses com lançamentos, até setembro”). Se coincidem, o rótulo continua o da janela inteira.

Mesma regra de gasto no cartão (só conta com fatura paga, no modo efetivado). O eixo X destaca o mês de hoje quando o ano visto é o ano-calendário; nos outros anos, não destaca.

## RN-R05 — Sem desejos no caixa

Desejos não entram nos quatro números, no gráfico nem na regra. A visão Anual lista o histórico do ano (RN-R06) sem somar no caixa.

## RN-R06 — Seções da visão Anual

Abaixo dos cards, do gráfico de caixa e da regra, somente leitura, nesta ordem: Categorias, Método de pagamento, Investimentos, Desejos.

Regra Financeira, Categorias, Método de pagamento e Investimentos têm abas **Valores** (default) e **Gráficos** (RN-R08). Desejos e o Resumo Anual **não** têm essas abas.

Na aba **Valores** das três seções de dinheiro, cada linha mostra total e média ao mesmo tempo. Total soma os 12 meses. Média usa a janela e o divisor da RN-R04. Linha com total zero no modo ativo some. Ordenação: maior total, empate por nome em pt-BR.

- Categorias: gastos por categoria. No mesmo bloco, os mesmos gastos em fixo, parcelado e variável. Um gasto entra na categoria e no tipo, sem somar duas vezes dentro do mesmo recorte. Tipo de gasto só na aba Valores.
- Método de pagamento: uma linha por forma usada. Cartão é a forma cujo nome coincide com um cartão cadastrado. Abaixo das linhas, o sub-bloco Cartões soma só essas formas, com a mesma média e o mesmo total do ano. Sem cartão no modo ativo, o sub-bloco não aparece. Pix e as demais formas ficam de fora da soma.
- Investimentos: aportes agrupados pela tag (RN-I05). Tag em branco, só espaços, `—` ou `-` vira Sem classificação. Efetivado exige `invested`. Planejado inclui todos os aportes do ano.
- Desejos, três grupos, fora do caixa: conquistado com mês de conquista no ano; ativo cujo intervalo do mês de criação até o prazo cruza o ano; expirado com prazo no ano. A lista não expira nem grava status.

## RN-R07 — Exportação anual

Na visão Anual, **Exportar CSV** e **Exportar PDF** baixam o ano selecionado e o modo ativo (RN-R02). Um arquivo por ação.

O arquivo repete as leituras já exibidas: resumo (média da janela e total dos 12 meses), série dos 12 meses, regra financeira, categorias, tipo, método de pagamento, soma dos cartões e aportes por tag. Média ausente continua `—`, não R$ 0,00. Linha com total zero no modo ativo continua de fora. Seção vazia permanece vazia. Sem regra configurada, o arquivo diz isso, sem faixas inventadas.

Desejos ficam só na tela (RN-R05). Não entram lançamentos linha a linha, visão Mensal, os dois modos juntos nem envio do arquivo. Nada é gravado.

A ação espera o ano com 12 meses, o fim do carregamento do ano e o fim do carregamento da regra. Ano futuro ou ano vazio, já exibidos, podem ser exportados. Nome: `finto-anual-{ano}-efetivados` ou `finto-anual-{ano}-planejados`.

Os gráficos por seção (RN-R08) **não** entram no PDF/CSV nesta versão.

## RN-R08 — Gráficos por seção (visão Anual)

Nas seções Regra Financeira, Categorias, Método de pagamento e Investimentos, a aba **Gráficos** mostra evolução mês a mês (12 meses, linhas), no modo ativo (RN-R02). O Resumo Anual (Entradas/Gastos/Investimentos/Saldo) e Desejos ficam de fora.

Defaults e seletores (estado local; sem persistência):

- **Regra:** Essenciais, Estilo de vida e Investimentos; série **Não classificado** só se houver valor no ano. Sem seletor.
- **Categorias:** default = top 3 pela média da janela (RN-R04); seletor para uma categoria ou voltar ao top 3. Paleta vermelho/rosa.
- **Método de pagamento:** default = todas as séries com cartões agrupados em “Cartões”; seletor: Todas, Cartões, cada forma não-cartão e cada cartão nomeado. Paleta laranja/amarelo/marrom.
- **Investimentos:** default = todas as tags; seletor Todas ou uma tag. Paleta azul.

No hover de cada mês, a lista do tooltip ordena os itens do **maior para o menor** valor.
