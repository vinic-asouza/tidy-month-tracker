# Finto — Apresentação do Produto

Documento de visão geral do **Finto**, pensado para apresentar o produto a possíveis usuários, parceiros ou stakeholders. Resume as funcionalidades e regras de negócio descritas em [`ANALISE_FRONTEND_QA.md`](./ANALISE_FRONTEND_QA.md) e [`BUSINESS/relatorio-regras-negocio.md`](./BUSINESS/relatorio-regras-negocio.md), e incorpora a visão de produto de [`MARKETING/purpose.mdc`](./MARKETING/purpose.mdc) — sem entrar em detalhes técnicos de implementação. *Última revisão: julho/2026 (carteiras por papel e aporte origem/destino).*

---

## O que é o Finto?

O **Finto** é um aplicativo de **educação financeira prática** que ajuda você a construir **hábitos saudáveis** com o dinheiro. Ele acompanha **mês a mês** entradas, gastos e investimentos, organiza o dinheiro por **carteiras** (contas), controla **cartões de crédito**, planeja **desejos** de consumo e verifica se você está seguindo uma **regra financeira** — como a clássica 50/30/20 ou uma distribuição personalizada.

Tudo em português, com interface moderna, tema claro ou escuro, e visão **mensal** ou **anual** dos seus números.

> O Finto não é apenas mais um organizador financeiro. Suas funcionalidades existem para apoiar um processo maior: desenvolver **clareza**, **consciência**, **planejamento** e **disciplina** na relação com o dinheiro.

---

## Missão e filosofia

### Por que o Finto existe

A organização financeira não acontece só porque alguém consegue **ver os números**. Ela acontece quando a pessoa desenvolve o **hábito de refletir** sobre suas decisões financeiras — antes de gastar, ao registrar, ao planejar o mês.

Por isso o Finto foi projetado para incentivar uma **participação ativa** na própria gestão financeira. Cada interação com o app é um momento de educação:

| Ação no app | O que estimula |
|-------------|----------------|
| Registrar uma despesa | Refletir sobre o gasto |
| Registrar um investimento | Pensar nos objetivos de longo prazo |
| Registrar uma receita | Reforçar a percepção da origem do dinheiro |
| Organizar categorias | Entender onde o dinheiro realmente vai |
| Marcar o que foi efetivado | Separar planejamento de realidade |
| Planejar um desejo | Decidir com antecedência, não por impulso |

Mais do que gerar relatórios, o Finto estimula **consciência financeira**.

### O registro manual é intencional

Muitos apps financeiros automatizam quase tudo: conectam contas bancárias, importam transações e entregam dashboards prontos. Isso é conveniente, mas pode reduzir o envolvimento da pessoa com a própria vida financeira.

No Finto, a ausência de integração bancária e a necessidade de **registrar manualmente** não são limitações acidentais — fazem parte da estratégia do produto. Reservar alguns minutos do dia ou da semana para lançar movimentações é parte do processo de construir hábitos.

### O verdadeiro produto

| O Finto oferece | O Finto não vende apenas |
|-----------------|--------------------------|
| Clareza sobre a situação financeira | Um painel de números |
| Consciência sobre decisões | Um agregador de contas |
| Planejamento com antecedência | Automação sem reflexão |
| Disciplina e hábitos saudáveis | Controle de gastos passivo |
| Evolução contínua mês a mês | Relatórios descartáveis |

O objetivo final não é vender um software — é oferecer uma **nova forma de cuidar da vida financeira**.

---

## Para quem é?

Para quem quer **desenvolver uma relação mais consciente e sustentável** com o dinheiro — não apenas ver gráficos, mas entender de onde vem, para onde vai e se está no caminho certo. O Finto é ideal para quem:

- Quer **construir o hábito** de acompanhar as finanças com regularidade
- Busca **educação financeira prática**, aprendendo no dia a dia ao registrar e refletir
- Quer saber quanto entrou, saiu e foi investido em cada mês
- Precisa controlar faturas de cartão de crédito
- Deseja separar **liquidez** (conta corrente) de **investimentos** (posição aplicada) e acompanhar cada uma
- Quer planejar compras e metas sem misturar com o fluxo de caixa do dia a dia
- Busca acompanhar se está gastando dentro de uma proporção saudável da renda
- Prefere **envolvimento ativo** a dashboards automáticos que dispensam atenção

---

## Como o app se organiza

Depois de entrar na sua conta, você encontra o **painel principal** dividido em áreas:

```
┌─────────────────────────────────────────────────────────┐
│  Cabeçalho: navegação Mensal/Anual · mês · tema · sair  │
├─────────────────────────────────────────────────────────┤
│  Resumo do mês (entradas, gastos, investimentos, saldo) │
│  + Regra financeira (50/30/20 ou personalizada)         │
├─────────────────────────────────────────────────────────┤
│  Carteiras + Saldo Livre (patrimônio por conta)         │
├─────────────────────────────────────────────────────────┤
│  Registros do mês — abas:                               │
│    Entradas · Gastos · Investimentos · Desejos          │
│  (+ faixa de cartões de crédito na aba Gastos)          │
├─────────────────────────────────────────────────────────┤
│  Botão flutuante (+) para adicionar qualquer item       │
└─────────────────────────────────────────────────────────┘
```

Na **visão anual**, o mesmo painel mostra um resumo dos 12 meses do ano com gráficos e totais consolidados.

---

## Um conceito importante: planejado vs. efetivado

O Finto distingue dois momentos de cada lançamento:

| Conceito | O que significa | Exemplo |
|----------|-----------------|---------|
| **Planejado** | Você registrou o valor, mas ainda não aconteceu de fato | Salário lançado, mas ainda não caiu na conta |
| **Efetivado** | O dinheiro já entrou, saiu ou foi investido de verdade | Entrada marcada como *recebida*, gasto marcado como *pago*, investimento marcado como *investido* |

O **saldo do mês** no resumo usa por padrão apenas o que foi **efetivado**. Você também pode alternar para o modo **Planejados** e ver a soma de todos os lançamentos do mês — útil para comparar intenção com realidade.

> *Legenda no modo efetivado:* "Apenas itens marcados como recebido, pago ou investido."

As listas de entradas, gastos e investimentos mostram o **total planejado** em destaque, com o subtotal efetivado como informação complementar. Isso permite planejar o mês inteiro e, ao mesmo tempo, acompanhar o que já se concretizou.

Essa distinção reforça a filosofia do produto: **reflexão antes da ação**. Planejar é o primeiro passo; efetivar é o momento de confrontar a realidade — e aprender com ela.

---

## Módulos e funcionalidades

### Conta e acesso

- **Cadastro** com e-mail e senha (confirmação por e-mail)
- **Login** seguro com sessão persistente
- **Logout** a qualquer momento
- Cada usuário vê **apenas os próprios dados** — não há compartilhamento entre contas

---

### Dashboard mensal

O coração do app. Aqui você:

- **Navega entre meses** (anterior, próximo, voltar para o mês atual)
- Alterna entre visão **Mensal** e **Anual**
- Usa o botão **+** para adicionar rapidamente entradas, gastos, investimentos, cartões, carteiras ou desejos
- Alterna entre **tema claro e escuro**

Ao trocar de mês, todos os dados daquele período são recarregados automaticamente.

---

### Resumo do mês

Painel consolidado no topo da tela com quatro números principais e um **toggle Efetivados | Planejados**:

| Métrica | O que mostra (modo efetivado) |
|---------|------------------------------|
| **Entradas** | Total recebido no mês |
| **Gastos** | Total pago no mês |
| **Investimentos** | Total investido no mês |
| **Saldo** | Entradas − Gastos − Investimentos (efetivados) |

No modo **Planejados**, os totais incluem todos os lançamentos do mês, independente de status.

O saldo positivo aparece em verde; negativo, em vermelho.

Integra também a **regra financeira** (descrita abaixo) e alerta quando existem categorias de gasto ainda não classificadas na regra.

---

### Entradas (receitas)

Registre tudo que entra no seu bolso: salário, freelas, rendimentos, presentes, etc.

**O que você pode fazer:**

- Criar, editar e excluir entradas
- Marcar como **recebido** — ao efetivar, escolha uma **carteira de movimentação** ou **Saldo Livre**
- Classificar por **tags** personalizáveis (ex.: Salário, Extra, Rendimentos)
- Definir **data** e **valor**
- Repetir automaticamente em **todos os meses do ano** (ideal para salário fixo)
- Editar ou excluir apenas o mês atual ou **todos os meses seguintes** (para itens recorrentes)
- Ordenar a lista (por data, nome, categoria ou valor)
- Ver resumo por categoria (% e valor)
- Selecionar vários itens para somar na barra inferior

**Regras principais:**

- Toda nova entrada começa como **não recebida**; a carteira é definida na **efetivação**, não na criação
- Valor deve ser maior que zero; descrição e tag são obrigatórias
- A repetição mensal copia o lançamento para os demais meses do **mesmo ano civil**
- Não é possível excluir uma tag que ainda está em uso

---

### Gastos (despesas)

Controle tudo que sai do seu bolso, com três tipos de despesa:

| Tipo | Para que serve | Exemplo |
|------|----------------|---------|
| **Fixo** | Valor que se repete todo mês | Aluguel, plano de saúde, assinatura |
| **Variável** | Gasto pontual do mês | Supermercado, restaurante, presente |
| **Parcelado** | Compra dividida em parcelas | Eletrônico em 12x |

**O que você pode fazer:**

- Criar, editar e excluir gastos
- Marcar como **pago** (exceto gastos no cartão) — ao efetivar, escolha carteira de **movimentação** ou **Saldo Livre**
- Escolher **categoria**, **forma de pagamento** e **data**
- Repetir gastos fixos em todos os meses do ano
- Criar parcelas automaticamente nos meses futuros
- Editar ou excluir só este mês, ou **todas as parcelas / todos os meses seguintes**
- Gerenciar **categorias** personalizáveis (Moradia, Alimentação, Lazer, etc.)
- Ver resumo por categoria, ordenar e selecionar múltiplos itens

**Regras principais:**

- Todo novo gasto começa como **não pago**; a carteira é definida na **efetivação** (não-cartão)
- Gastos no cartão de crédito **não têm checkbox individual de "pago"** — o status vem da fatura do cartão
- Parcelas podem atravessar anos (ex.: parcela 10/12 em novembro continua em janeiro do ano seguinte)
- Não é possível excluir categoria ou cartão que ainda tenha gastos vinculados

---

### Cartões de crédito

Gerencie seus cartões e acompanhe a fatura de cada mês.

**O que você pode fazer:**

- Cadastrar cartões com **nome** e **cor**
- Ver o **total gasto no cartão** naquele mês (faixa de chips horizontal)
- Marcar a **fatura como paga** — escolha a **carteira de movimentação** que pagou o total; isso efetiva todos os gastos daquele cartão no mês
- Editar nome e cor; renomear atualiza automaticamente os gastos vinculados
- Excluir cartão (somente se não houver gastos associados)

**Regra importante:** um gasto no cartão só entra no **saldo do mês** e nas **estatísticas** quando você marca a **fatura como paga**. Enquanto a fatura estiver em aberto, os gastos aparecem na lista, mas não impactam o caixa efetivado.

---

### Investimentos

Registre seus aportes e acompanhe quanto você está investindo por mês — e **de onde saiu** o dinheiro e **onde ficou aplicado**.

**O que você pode fazer:**

- Criar, editar e excluir investimentos
- Marcar como **investido** — ao efetivar, informe **origem** (carteira de movimentação) e **destino** (carteira de investimentos)
- Repetir em todos os meses do ano (ex.: aporte mensal automático)
- Editar ou excluir com escopo de mês único ou todos os meses seguintes
- Ordenar, ver resumo por carteira destino e selecionar múltiplos itens

**Regras principais:**

- Todo novo investimento começa como **não investido**, sem carteiras vinculadas
- Na efetivação, origem e destino são **obrigatórios** e devem ser diferentes
- O valor **sai da liquidez** da carteira de movimentação e **entra na posição** da carteira de investimentos
- Se faltar carteira de um dos papéis, o app oferece atalho para criar

---

### Carteiras (contas)

Organize seu patrimônio por conta, com dois **papéis** distintos:

| Papel | Para que serve | Exemplo |
|-------|----------------|---------|
| **Movimentação** | Liquidez do dia a dia — entradas, gastos, origem de aportes | Nubank, C6, dinheiro |
| **Investimentos** | Posição aplicada — destino dos aportes | Corretora, Tesouro Direto |

**O que você pode fazer:**

- Criar carteiras escolhendo o **papel** (movimentação ou investimentos), com nome, tipo e cor
- Ver faixa de chips com **Saldo Livre** + suas carteiras
- Ver métricas do mês: **Entrou**, **Saiu**, **Aportado** (movimentação) ou **Resgatado** (investimentos)
- Ver o **saldo estimado** por carteira — **liquidez** ou **posição aplicada**, conforme o papel
- **Declarar saldo** manualmente no início do mês
- **Transferir** entre carteiras de movimentação
- **Resgatar** da carteira de investimentos para movimentação ou Saldo Livre
- Editar ou excluir carteira (excluir desvincula os movimentos, mas não os apaga)

**Três leituras de patrimônio:**

| Conceito | O que representa |
|----------|------------------|
| **Saldo do mês** (no resumo) | Fluxo líquido efetivado naquele mês |
| **Saldo da carteira** (no chip) | Patrimônio estimado na conta — liquidez ou posição, conforme o papel |
| **Saldo Livre** (chip dedicado) | Movimentos efetivados sem carteira nomeada + resgates para fora das carteiras |

O saldo das carteiras é uma **estimativa** baseada nas suas declarações e nos lançamentos vinculados — não é integração bancária em tempo real.

**Regras principais:**

- Ao marcar entrada, gasto ou investimento como efetivado, o app pede **onde** o dinheiro entrou ou saiu
- Entradas e gastos usam carteiras de **movimentação** ou **Saldo Livre**; investimentos usam **origem + destino**
- Sem declaração manual, o saldo é calculado automaticamente a partir dos meses anteriores
- Gastos no cartão de crédito só saem da carteira quando a **fatura está paga** — você informa qual carteira pagou

---

### Lista de desejos

Planeje compras e metas de consumo **sem misturar com o fluxo de caixa** do mês. É o módulo que mais explicita a ideia de **reflexão antes da ação**: você define o que quer, quanto custa e até quando — e só depois decide conquistar.

**O que você pode fazer:**

- Criar desejos com **descrição**, **valor estimado**, **urgência** (baixa, média ou alta) e **prazo** ("conquistar até")
- Acompanhar desejos mês a mês enquanto estiverem ativos
- **Conquistar** um desejo — apenas marcar, ou marcar e registrar um gasto pré-preenchido
- **Renovar** desejos que expiraram com um novo prazo
- Editar ou excluir a qualquer momento
- Ordenar por urgência, prazo, valor ou nome

**Regras principais:**

- Desejos **não entram** no saldo do mês, na regra financeira, nas estatísticas nem nas carteiras — são planejamento puro
- Um desejo ativo fica visível do mês em que foi criado até o mês do prazo
- Se o prazo passar sem conquista, o desejo **expira automaticamente** e aparece só no mês do prazo para renovar ou remover
- Ao conquistar, o desejo **some de todos os meses**
- Conquistar com gasto abre um formulário de despesa pré-preenchido; o gasto precisa ser salvo (e, se desejar, marcado como pago) para impactar o saldo

---

### Regra financeira (50/30/20)

Acompanhe se seus gastos estão dentro de uma proporção saudável da sua renda.

**O que você pode fazer:**

- Configurar a regra clássica **50/30/20** (50% essenciais, 30% estilo de vida, 20% investimentos) ou **percentuais personalizados**
- Mapear cada **categoria de gasto** como **Essencial** ou **Estilo de Vida**
- Ver barras de progresso comparando o **realizado** com a **meta**
- Receber alertas visuais quando ultrapassar os limites
- Editar a regra a qualquer momento

**Regras principais:**

- Os três percentuais devem somar **100%**
- Investimentos têm bucket próprio, separado dos gastos por categoria
- Os cálculos respeitam o mesmo toggle **Efetivados | Planejados** do resumo mensal
- Categorias de gasto ainda não mapeadas entram no saldo, mas podem não aparecer nas barras da regra — o app alerta quando isso acontece

---

### Estatísticas (visão anual)

Veja o panorama do ano inteiro em um só lugar.

**O que você pode fazer:**

- Alternar para a aba **Anual** no painel principal
- Ver cards com totais anuais de entradas, gastos e investimentos
- Explorar um **gráfico de barras** mês a mês
- Compartilhar o toggle **Efetivados | Planejados** com o resumo e a regra financeira

Ideal para entender tendências, comparar meses e avaliar o ano como um todo.

---

### Seleção de itens

Ferramenta prática para somar valores rapidamente.

- Clique nos itens das seções de **Entradas**, **Gastos** ou **Investimentos** para selecioná-los
- Uma **barra fixa na parte inferior** mostra a soma por tipo e o total geral
- Use **Desmarcar todos** para limpar a seleção
- Desejos não participam da seleção

---

### Personalização

| O que personalizar | Onde |
|---------------------|------|
| Tags de entrada | Seção Entradas |
| Categorias de gasto | Seção Gastos |
| Tema claro / escuro | Cabeçalho |
| Nome e cor de cartões | Faixa de cartões |
| Nome, papel, tipo e cor de carteiras | Faixa de carteiras |

Renomear uma tag ou categoria atualiza automaticamente todos os lançamentos que a utilizam. Não é possível excluir rótulos que ainda estão em uso.

---

## Glossário rápido

| Termo | Significado no Finto |
|-------|----------------------|
| **Efetivado** | Dinheiro que de fato entrou, saiu ou foi investido |
| **Planejado** | Lançamento registrado, mas ainda não concretizado |
| **Carteira de movimentação** | Conta de liquidez — recebe entradas, gastos e origem de aportes |
| **Carteira de investimentos** | Custódia da posição aplicada — recebe aportes |
| **Saldo Livre** | Movimentos efetivados sem carteira nomeada; destino de resgates |
| **Aporte (origem → destino)** | Ao investir: de qual conta saiu e em qual ficou aplicado |
| **Transferência** | Movimentação entre carteiras de movimentação (não afeta o saldo do mês) |
| **Resgate** | Retirada da carteira de investimentos para movimentação ou Saldo Livre |
| **Carteira** | Uma conta onde o dinheiro está organizado (com papel definido) |
| **Fatura paga** | Status mensal do cartão que libera seus gastos no caixa efetivado |
| **Repetição mensal** | Cópia automática do lançamento nos demais meses do ano |
| **Parcela** | Parte de uma compra dividida em meses |
| **Desejo** | Meta de consumo com prazo — não é movimento financeiro |
| **Regra 50/30/20** | Distribuição alvo: essenciais / estilo de vida / investimentos |

---

## O que o Finto não faz (hoje)

Para alinhar expectativas, o produto **não possui**:

- Conexão com banco (Open Finance)
- Importação ou exportação de planilhas
- Assinaturas ou cobrança integrada
- Múltiplos usuários ou perfis compartilhados
- Notificações push ou lembretes por WhatsApp
- Integração automática com corretoras ou faturas de cartão

Isso é **deliberado**. O Finto não compete na corrida da automação total — compete na qualidade do **envolvimento** que você tem com o próprio dinheiro. Sem atalhos que dispensam atenção, cada registro vira um pequeno ritual de consciência financeira.

O Finto é uma ferramenta de **organização manual e consciente** — você registra, classifica, reflete e acompanha seus números com autonomia.

---

## Jornada típica de um novo usuário

1. **Cria a conta** e confirma o e-mail
2. **Entra no painel** do mês atual
3. *(Opcional)* Configura a **regra financeira** e mapeia categorias — primeiro passo de **planejamento consciente**
4. *(Opcional)* Cadastra **cartões** e **carteiras** — pelo menos uma de **movimentação** e uma de **investimentos** para aportes completos
5. Reserva alguns minutos para **registrar manualmente** entradas, gastos e investimentos
6. Marca o que já foi **recebido**, **pago** ou **investido** — escolhendo carteiras na efetivação
7. Acompanha o **resumo** e a **regra** atualizarem em tempo real
8. Explora a **visão anual** para ver tendências e evolução
9. Planeja **desejos** para metas futuras de consumo — reflexão antes da compra

Com o tempo, o ritual de registrar e revisar vira **hábito** — e é aí que a organização financeira de fato acontece.

---

## Em uma frase

> O Finto não vende apenas controle financeiro — vende **clareza**, **consciência** e **hábitos saudáveis**. Ele ajuda você a entender para onde vai seu dinheiro, mês a mês, com envolvimento ativo na própria gestão financeira.

---

## Referências

- [Visão do fundador / propósito do produto](./MARKETING/purpose.mdc) — missão, filosofia e posicionamento
- [Análise técnica do frontend](./ANALISE_FRONTEND_QA.md) — documentação completa para desenvolvimento e QA
- [Relatório de regras de negócio](./BUSINESS/relatorio-regras-negocio.md) — auditoria de consistência entre módulos
- [Design system](./design-system.md) — cores, tipografia e identidade visual
