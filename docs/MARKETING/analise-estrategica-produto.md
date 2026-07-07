# Análise Estratégica de Produto — Finto

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-03 (revisão pós-decisões D1–D9 e gate de lançamento) |
| **Marca** | **Finto** (nome comercial e UI) · repositório técnico: `tidy-month-tracker` |
| **Papel** | Product Marketing Manager (imersão pré-Landing Page) |
| **Escopo** | Produto completo — visão do fundador, decisões fechadas, gate de lançamento, frontend |
| **Referências** | [purpose.mdc](./purpose.mdc), [plano-pre-lancamento.md](../DEV/plano-pre-lancamento.md), [relatorio-regras-negocio.md](../BUSINESS/relatorio-regras-negocio.md), [ANALISE_FRONTEND_QA.md](../ANALISE_FRONTEND_QA.md), [marketing-specialist.mdc](./marketing-specialist.mdc) |
| **Status do produto** | 🟢 **Gate implementado** — Fases 1, 2 e 2.5 concluídas; decisões D1–D9 fechadas. Divulgação pública ampla pendente: regressão manual, migration produção, copy/screenshots e termos |

---

## Visão e Filosofia do Produto

> Fonte: [purpose.mdc](./purpose.mdc) — **documento fundacional**. Toda comunicação de marketing, Landing Page e publicidade deve partir desta visão, não das funcionalidades isoladas.

### Missão

O **Finto** não nasceu para ser mais um aplicativo de controle financeiro. Sua missão é promover **Educação Financeira Básica através da construção de hábitos**.

### Crença central

Organização financeira **não acontece** apenas porque a pessoa consegue visualizar seus números. Ela acontece quando essa pessoa desenvolve o **hábito de refletir** sobre suas decisões financeiras.

Por isso, o Finto foi projetado para incentivar **participação ativa** do usuário em sua própria gestão financeira.

### Filosofia de produto (decisão estratégica, não limitação técnica)

Muitos apps financeiros automatizam quase todo o processo: conectam contas bancárias, importam transações e apresentam dashboards prontos. Embora conveniente, esse modelo **reduz o envolvimento** do usuário com sua própria vida financeira.

No Finto, algumas automações são **propositalmente limitadas**. Essa não é uma falha — é **estratégia de produto**.

O usuário deve reservar alguns minutos do dia ou da semana para registrar manualmente suas movimentações. Esse momento de interação **é parte do processo de educação financeira**:

| Ação no Finto | O que estimula no usuário |
|---------------|---------------------------|
| Registrar uma despesa | Reflexão sobre o gasto |
| Registrar um investimento | Pensar nos objetivos de longo prazo |
| Registrar uma receita | Reforçar a percepção da origem do dinheiro |
| Organizar categorias | Entender onde realmente está gastando |
| Marcar o que foi efetivado | Separar intenção de realidade |
| Planejar um desejo com prazo | Reflexão antes da ação de compra |

Mais do que gerar relatórios, o Finto quer estimular **consciência financeira**.

### O verdadeiro produto

O Finto **não vende** apenas controle financeiro. O Finto vende:

- **Clareza** — enxergar a situação real
- **Consciência** — entender o impacto de cada decisão
- **Planejamento** — antecipar antes de agir
- **Disciplina** — manter o hábito ao longo do tempo
- **Hábitos financeiros saudáveis** — evolução contínua

As funcionalidades existem para **apoiar** esse processo, não para substituí-lo.

### Filtro de comunicação (usar em toda copy e LP)

Antes de publicar qualquer mensagem, perguntar:

> *"Essa comunicação transmite apenas funcionalidades ou comunica a transformação que o produto proporciona?"*

**Sempre priorizar a transformação.** O objetivo final não é vender um software — é vender uma **nova forma de cuidar da vida financeira**.

### O que priorizar na comunicação

- Construção de hábitos
- Educação financeira
- Consciência sobre o dinheiro
- Planejamento financeiro
- Reflexão antes da ação
- Clareza sobre a situação financeira
- Evolução contínua

### O que evitar como posicionamento principal

- ❌ "Um organizador financeiro"
- ❌ "Um app de controle de gastos"
- ❌ "Um agregador de contas"
- ❌ "Uma ferramenta de automação financeira"

Essas descrições existem no produto, mas **não representam a essência**. Funcionalidades são meios; hábito e consciência são o fim.

---

## Resumo Executivo

O **Finto** é uma plataforma de **educação financeira prática** disfarçada de organizador mensal: cada interação — lançar, categorizar, marcar como efetivado, planejar um desejo — é um convite à reflexão. O painel mensal, a regra 50/30/20, os cartões por fatura, as carteiras e a lista de desejos são **ferramentas de hábito**, não fins em si.

**Potencial comercial:** alto para um nicho que o mercado automatizado ignora — pessoas que **querem** se envolver com o próprio dinheiro e buscam método, não apenas extrato importado. O Finto não compete em conveniência de sync bancário; compete em **transformação comportamental**.

**Diferencial mais forte:** o **registro manual intencional** como pedagogia — reforçado por **caixa efetivado** no resumo (D1), modelo em duas camadas **Investimentos + Carteiras + Saldo Livre** (D4), **resgate e transferência** entre contas (D9), e lista de desejos com conquista que reflete o caixa (D5).

**Estado pós-gate:** inconsistências P1 corrigidas (regra com bucket "Não classificado", hierarquia efetivado/planejado, visão anual sincronizada, glossário expandido, Saldo Livre, dialogs de resgate/transferência). A comunicação pode ser **mais assertiva** — desde que respeite a tabela *Pode prometer / Não prometer* abaixo.

**Risco principal para conversão:** visitantes acostumados com Mobills/Organizze podem interpretar a ausência de Open Finance como **defeito**, não como **escolha pedagógica**. A comunicação precisa reenquadrar o manual como virtude antes que o visitante compare feature por feature.

**Veredito de marketing:** posicionar como **"o app que te ensina a cuidar do seu dinheiro — um hábito de cada vez"**. A Landing Page deve vender a **transformação** primeiro; o produto agora sustenta promessas concretas sobre carteiras, resgate, transferência e clareza do caixa efetivado.

---

## Imersão por Módulo

Cada módulo abaixo foi analisado pela perspectiva do usuário, do mercado e da **filosofia do fundador** — qual hábito ou momento de reflexão cada um estimula. Funcionalidade é meio; educação financeira é fim.

---

### Módulo: Autenticação

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Garantir acesso seguro e individual aos dados financeiros do usuário. |
| **Problema que resolve** | Dados financeiros são sensíveis; o usuário precisa de conta própria e isolada. |
| **Benefício** | Privacidade e continuidade — os dados ficam salvos e acessíveis de qualquer dispositivo com navegador. |
| **Valor percebido** | Confiança básica de um produto SaaS sério (login, sessão persistente, confirmação de e-mail). |
| **Público que mais se beneficia** | Qualquer usuário; sem distinção de perfil. |
| **Diferenciais** | Cadastro simples (e-mail + senha), sem burocracia. Não exige CPF, banco ou integração na entrada. |
| **Argumentos de venda** | "Comece em segundos, sem conectar sua conta bancária." / "Seus dados são só seus." |
| **Objeções** | "É seguro?" / "Preciso dar acesso ao banco?" |
| **Momento de reflexão** | O ato de criar conta e entrar no app é o primeiro compromisso com a própria organização financeira. |
| **Oportunidades na Landing Page** | "Seus dados, seu ritmo — sem conectar o banco." Privacidade como consequência da filosofia de envolvimento ativo, não só como feature de segurança. |

---

### Módulo: Dashboard (Visão Mensal)

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Ser o centro de comando do mês: navegar no tempo, ver resumo, registrar movimentos e alternar para visão anual. |
| **Problema que resolve** | Finanças pessoais ficam espalhadas (apps do banco, planilha, notas, cartão de crédito). O usuário não tem **um lugar** para enxergar o mês inteiro. |
| **Benefício** | Visão unificada e navegável — "como estou neste mês?" respondido em uma tela. |
| **Valor percebido** | Sensação de controle e organização sem sobrecarga de informação. |
| **Público que mais se beneficia** | Profissionais autônomos, assalariados com múltiplas fontes de renda, casais que organizam finanças manualmente. |
| **Diferenciais** | Navegação por mês como eixo central (não extrato infinito); FAB de ação rápida; alternância Mensal/Anual no mesmo contexto. |
| **Argumentos de venda** | "Todo o seu mês financeiro em uma tela." / "Navegue entre meses como num calendário — sem perder o fio." |
| **Objeções** | "Parece planilha com cara bonita?" / "Preciso abrir várias telas?" |
| **Momento de reflexão** | Abrir o dashboard é o ritual semanal ou diário de "como estou com meu dinheiro?" — o hábito de olhar antes de gastar. |
| **Oportunidades na Landing Page** | Posicionar como **ritual financeiro**, não só painel; screenshot/GIF do dashboard com resumo + carteiras + abas. |

---

### Módulo: Resumo do Mês

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Consolidar o **caixa efetivado** do mês (D1) e exibir pendências (*A receber · A pagar · A investir*) como leitura complementar — sem diluir a promessa de clareza do realizado. |
| **Problema que resolve** | O usuário mistura compromissos futuros com dinheiro que já passou — e toma decisões erradas achando que "ainda tem saldo". |
| **Benefício** | Clareza do **caixa realizado** + visibilidade do que ainda falta efetivar no mês. |
| **Valor percebido** | Confiança nos números; saldo principal reflete realidade efetivada; pendências educam sem confundir. |
| **Público que mais se beneficia** | Quem recebe em datas diferentes, usa cartão de crédito e investe com regularidade. |
| **Diferenciais** | Critério unificado de efetivado; pendências derivadas (planejado − efetivado); glossário com 12 entradas; subtítulo fixo *"Baseado no que você marcou como recebido, pago ou investido"*. |
| **Argumentos de venda** | "Veja quanto sobrou **de verdade** — e o que ainda está pendente neste mês." |
| **Objeções** | "Meu saldo não bate com o app do banco." → resposta aprovada no FAQ (saldo do mês ≠ extrato bancário). |
| **Momento de reflexão** | Marcar efetivado + enxergar pendências = separar **intenção de realidade** e antecipar o que falta cumprir no mês. |
| **Oportunidades na Landing Page** | Hero secundário: *"Clareza do que de fato aconteceu"* + mini-explicação de pendências. |

---

### Módulo: Entradas (Receitas)

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Registrar e acompanhar todas as fontes de renda do mês, com tags, repetição e marcação de recebimento. |
| **Problema que resolve** | Rendas variáveis (freelance, extras, benefícios) se perdem; o usuário não sabe quanto de fato entrou no mês. |
| **Benefício** | Visão completa da renda — fixa e variável — com controle do que já caiu na conta. |
| **Valor percebido** | Previsibilidade e histórico; base sólida para a regra 50/30/20. |
| **Público que mais se beneficia** | Autônomos, freelancers, quem tem múltiplas fontes (salário + extra + aluguel). |
| **Diferenciais** | Tags personalizáveis; repetição no **ano civil** (D3) com aviso no formulário; efetivado primário nos headers (D1). |
| **Argumentos de venda** | "Cada entrada registrada é um lembrete de quanto você trabalhou e conquistou." |
| **Objeções** | "Repetição não continua em janeiro?" → FAQ: *"Repetição dentro do ano civil"* (D3). |
| **Momento de reflexão** | Registrar receita reforça **de onde vem o dinheiro** — combate a sensação de "o salário sumiu" sem saber por quê. |
| **Oportunidades na Landing Page** | Copy: "Cada entrada registrada é um lembrete de quanto você trabalhou e conquistou." |

---

### Módulo: Gastos (Despesas)

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Controlar despesas fixas, variáveis e parceladas, com categorias, formas de pagamento e vínculo opcional a carteiras. |
| **Problema que resolve** | Gastos pequenos somam sem perceber; parcelas se esquecem; fixos do mês não são visíveis de uma vez. |
| **Benefício** | Organização por tipo (fixo/variável/parcelado) e categoria — o usuário enxerga **para onde o dinheiro vai**. |
| **Valor percebido** | Controle granular sem planilha; parcelas criadas automaticamente nos meses futuros. |
| **Público que mais se beneficia** | Quem tem financiamentos, assinaturas, compras parceladas e gastos variáveis frequentes. |
| **Diferenciais** | Três tipos de gasto; parcelas cross-year; cartão por fatura com tooltip; alerta ao salvar sem carteira → Saldo Livre (D7); formas de pagamento padrão (D8). |
| **Argumentos de venda** | "Parcelou? O app cria as parcelas nos meses certos." / "Separe o que é fixo do que é impulso." |
| **Objeções** | "Formas de pagamento fixas?" → fora do MVP (D8); documentar no FAQ. |
| **Momento de reflexão** | Registrar despesa manualmente é o **ponto central da filosofia Finto** — cada gasto lançado é um segundo de reflexão: "preciso disso? onde isso se encaixa?" |
| **Oportunidades na Landing Page** | **Não pedir desculpas pelo manual.** Copy: "Registrar o gasto leva 10 segundos. Ignorar onde seu dinheiro vai custa muito mais." |

---

### Módulo: Cartões de Crédito

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Cadastrar cartões, ver fatura do mês e controlar quando a fatura foi paga — sem marcar item por item. |
| **Problema que resolve** | Cartão de crédito distorce o fluxo de caixa: o usuário "gasta" no mês da compra, mas só paga na fatura. Apps genéricos misturam os dois momentos. |
| **Benefício** | Modelo mental correto: **fatura como unidade de pagamento**; compras no cartão só impactam o saldo quando a fatura é paga. |
| **Valor percebido** | Alívio cognitivo — não precisa marcar 30 compras como "pagas"; marca a fatura uma vez. |
| **Público que mais se beneficia** | Quem usa um ou mais cartões de crédito como principal meio de consumo. |
| **Diferenciais** | Chip com rótulo **"Fatura"** + tooltip; checkbox fatura paga por mês. |
| **Argumentos de venda** | "Controle de cartão do jeito certo: marque a fatura como paga, não cada compra." / "Veja quanto comprometeu no cartão este mês antes de pagar." |
| **Objeções** | "Por que o total do cartão é diferente do resumo de gastos?" / "Não sincroniza com o banco?" |
| **Momento de reflexão** | Marcar a fatura como paga é o momento de assumir o compromisso real do cartão — consciência de dívida vs. consumo. |
| **Oportunidades na Landing Page** | Educação: cartão não é dinheiro extra; fatura é o evento que importa para o caixa. |

---

### Módulo: Investimentos

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Registrar **aportes mensais** vinculados a carteiras (D4) — responde *"Quanto aportei este mês?"*, não posição patrimonial total. |
| **Problema que resolve** | Investir sem acompanhar o hábito; confundir aporte mensal com saldo acumulado na corretora. |
| **Benefício** | Disciplina de aporte visível; cada registro declara prioridade com o futuro. |
| **Valor percebido** | Progresso mensal em direção ao bucket de investimentos da regra 50/30/20. |
| **Público que mais se beneficia** | Investidores iniciantes e intermediários com aportes mensais. |
| **Diferenciais** | Carteira obrigatória; banner pedagógico (*"Aportes do mês — saldo total em Carteiras"*); separação clara fluxo vs. posição (D4). |
| **Argumentos de venda** | "Registre quanto destinou às suas carteiras **neste mês** — o hábito de investir começa aqui." |
| **Objeções** | "Não substitui minha corretora." / "E resgate?" → resgate via Carteiras → Saldo Livre (D9), não tag manual. |
| **Momento de reflexão** | Registrar aporte = **declarar compromisso** com objetivos de longo prazo. |
| **Oportunidades na Landing Page** | Copy aprovada: *"Este espaço registra seus aportes mensais. O saldo total de cada conta está em Carteiras."* |

---

### Módulo: Carteiras (Accounts)

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Organizar movimentos por conta e exibir **saldo estimado** cumulativo (D6), com **resgate** e **transferência** entre carteiras (D9). |
| **Problema que resolve** | "Quanto tenho estimado em cada conta?" / "Como registro resgate sem bagunçar o mês?" / "Como movo dinheiro entre contas sem distorcer a regra?" |
| **Benefício** | Patrimônio com endereço; operações patrimoniais sem distorcer caixa mensal nem 50/30/20. |
| **Valor percebido** | Organização consciente — sabe onde está, de onde saiu e para onde foi. |
| **Público que mais se beneficia** | Multi-conta (corrente + poupança + corretora + dinheiro). |
| **Diferenciais** | Saldo estimado + declaração manual; **resgate** → Saldo Livre; **transferência** com impacto líquido zero no resumo; dialogs dedicados. |
| **Argumentos de venda** | "Seu dinheiro com endereço — aporte, resgate e transferência entre contas." |
| **Objeções** | "Saldo não bate com o banco." → *"Saldo estimado"* com declaração consciente, não espelho de extrato. |
| **Momento de reflexão** | Declarar saldo, resgatar ou transferir = **decisão patrimonial consciente**, não lançamento automático. |
| **Oportunidades na Landing Page** | Seção Carteiras com screenshots dos dialogs de resgate/transferência; copy D9 aprovada. |

---

### Módulo: Saldo Livre

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Agrupar movimentos efetivados **sem carteira** + entradas de **resgate** (D7) — responde *"O que passou pelo mês sem endereço?"* |
| **Problema que resolve** | Dinheiro "some" da visão por conta; resgates ficavam duplicados ou manuais via tag em Entradas. |
| **Benefício** | Nenhum movimento fica invisível; resgate tem fluxo claro (carteira → Saldo Livre → resumo). |
| **Valor percebido** | Acolhimento — *Saldo Livre* soa menos punitivo que "Não vinculados"; destino natural de resgates. |
| **Público que mais se beneficia** | Quem ainda não vincula tudo a carteiras; quem resgata de investimentos/poupança. |
| **Diferenciais** | Chip dedicado na faixa de carteiras; dialog com detalhes; toast ao salvar sem carteira incentivando vínculo (D7). |
| **Argumentos de venda** | "Movimentos sem carteira? Ficam no Saldo Livre — nada se perde." |
| **Objeções** | "Saldo Livre é minha conta bancária?" → **Não** — agrupamento de movimentos do mês sem `accountId` + resgates. |
| **Momento de reflexão** | Ver Saldo Livre alto = convite a **organizar** — vincular movimentos às carteiras. |
| **Oportunidades na Landing Page** | FAQ obrigatório; explicar diferença Saldo Livre vs. saldo estimado vs. saldo do mês. |

---

### Módulo: Lista de Desejos

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Planejar metas de consumo (compras desejadas) com valor, urgência e prazo — **sem impactar o saldo do mês**. |
| **Problema que resolve** | Compras por impulso e "lista mental" de coisas que se quer comprar, misturadas com gastos reais e sem prazo. |
| **Benefício** | Espaço seguro para desejar sem distorcer o fluxo de caixa; consciência de prioridade (urgência) e prazo. |
| **Valor percebido** | Autocontrole emocional — separar "quero" de "gastei"; celebrar conquistas. |
| **Público que mais se beneficia** | Consumidores conscientes, jovens adultos formando hábito financeiro, quem faz "wish list" de compras grandes. |
| **Diferenciais** | **Isolamento do fluxo de caixa**; conquista com gasto que **efetiva automaticamente** Pix/Débito/Dinheiro (D5); cartão aguarda fatura. |
| **Argumentos de venda** | "Conquistou? O gasto reflete no caixa — exceto cartão, que respeita a fatura." |
| **Objeções** | "Por que não entra no orçamento?" / "É só uma lista de tarefas?" |
| **Momento de reflexão** | **Reflexão antes da ação** — o desejo fica no papel (digital) antes de virar gasto; prazo e urgência forçam a pergunta "ainda quero isso?" |
| **Oportunidades na Landing Page** | **Hero de transformação emocional** — "Quer comprar? Primeiro pense. Depois decida." Poucos concorrentes têm equivalente. |

---

### Módulo: Regra Financeira (50/30/20)

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Aplicar método de distribuição de renda (essenciais / estilo de vida / investimentos) mapeando as categorias reais do usuário. |
| **Problema que resolve** | O usuário sabe a regra 50/30/20 de ouvir falar, mas não consegue aplicá-la aos seus gastos reais. |
| **Benefício** | Feedback visual imediato: "estou gastando demais em estilo de vida?" / "estou investindo o suficiente?" |
| **Valor percebido** | Método financeiro reconhecido (Elizabeth Warren) traduzido em barras de progresso pessoais. |
| **Público que mais se beneficia** | Iniciantes em educação financeira, quem quer estrutura sem consultoria, jovens profissionais. |
| **Diferenciais** | Wizard + percentuais personalizados; bucket **"Não classificado"** com reconciliação (D2); reset da regra na UI. |
| **Argumentos de venda** | "A regra 50/30/20 nas **suas** categorias — com transparência do que ainda falta mapear." |
| **Objeções** | "As barras não batem." → se houver categorias novas, bucket Não classificado explica o gap (D2). |
| **Momento de reflexão** | Mapear categorias e ver as barras é **educação financeira aplicada** — o usuário aprende a regra fazendo, não só lendo. |
| **Oportunidades na Landing Page** | Posicionar como "escola financeira no bolso" — método reconhecido + feedback visual imediato. |

---

### Módulo: Estatísticas (Visão Anual)

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Mostrar tendências dos 12 meses do ano em cards e gráfico de barras (entradas, gastos, investimentos efetivados). |
| **Problema que resolve** | Visão de curto prazo (mês) esconde padrões — gastos crescentes, meses atípicos, evolução de investimentos. |
| **Benefício** | Perspectiva de longo prazo para decisões melhores ("estou melhorando?"). |
| **Valor percebido** | Sensação de progresso e accountability anual. |
| **Público que mais se beneficia** | Usuários com 3+ meses de uso; quem faz revisão financeira periódica. |
| **Diferenciais** | Mesmo critério efetivado do resumo mensal; gráfico visual limpo; alternância Mensal/Anual sem sair do app. |
| **Argumentos de venda** | "Enxergue o ano inteiro — onde você melhorou e onde escorregou." |
| **Objeções** | "Preciso de meses de dados para valer a pena." / "Não exporta relatório?" |
| **Momento de reflexão** | Olhar o ano inteiro é o hábito de **evolução contínua** — "estou melhorando ou repetindo os mesmos erros?" |
| **Oportunidades na Landing Page** | Prova de transformação ao longo do tempo — gráfico como recompensa visual do hábito mantido. |

---

### Módulo: Configurações (Tags e Categorias)

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Personalizar taxonomia financeira: tags de entrada, categorias de gasto, tags de investimento. |
| **Problema que resolve** | Apps rígidos com categorias que não refletem a vida real do usuário brasileiro. |
| **Benefício** | O app se adapta ao usuário, não o contrário. |
| **Valor percebido** | Propriedade e relevância dos dados. |
| **Público que mais se beneficia** | Usuários com rotina financeira específica (MEI, múltiplos freelances, categorias de nicho). |
| **Diferenciais** | CRUD inline nas seções; renomear propaga para histórico; defaults já pensados para o Brasil (Mercado, Combustível, Assinaturas…). |
| **Argumentos de venda** | "Categorias que fazem sentido para você — crie, renomeie, organize." |
| **Objeções** | "Métodos de pagamento customizáveis?" → fora do MVP (D8); listar opções padrão no FAQ. |
| **Momento de reflexão** | Organizar categorias faz o usuário **entender onde realmente gasta** — o mapa mental do próprio comportamento financeiro. |
| **Oportunidades na Landing Page** | "Categorias que contam a sua história financeira, não a de um template genérico." |

---

### Módulo: Seleção de Itens

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Somar rapidamente itens selecionados nas listas de entradas, gastos e investimentos. |
| **Problema que resolve** | "Quanto gastei nesses itens específicos?" sem exportar para calculadora. |
| **Benefício** | Consulta ad hoc para análise pontual. |
| **Valor percebido** | Utilidade prática em momentos de revisão. |
| **Público que mais se beneficia** | Usuário avançado que audita categorias ou conferências. |
| **Diferenciais** | Barra fixa inferior com totais por tipo. |
| **Argumentos de venda** | Baixa prioridade comercial — feature de suporte, não de conversão. |
| **Objeções** | "Selecionei itens e deu zero." → contador *"N selecionados · M efetivados"* esclarece (corrigido). |
| **Oportunidades na Landing Page** | Não destacar na Landing Page principal. |

---

### Módulo: Shell / Preferências (Tema, Layout)

| Dimensão | Análise |
|----------|---------|
| **Objetivo** | Experiência global agradável: marca, tema claro/escuro, responsividade mobile. |
| **Problema que resolve** | Apps financeiros muitas vezes são feios ou cansativos — o usuário abandona por fricção visual. |
| **Benefício** | Conforto de uso diário; app utilizável no celular via navegador. |
| **Valor percebido** | Produto moderno e cuidadoso. |
| **Público que mais se beneficia** | Todos; especialmente quem usa à noite (dark mode). |
| **Diferenciais** | UI shadcn/Tailwind consistente; tema persistente; layout responsivo. |
| **Argumentos de venda** | "Interface limpa que você quer abrir todo dia." |
| **Objeções** | "Tem app na App Store?" (não — web responsiva) |
| **Momento de reflexão** | Interface agradável reduz fricção do hábito — o usuário **quer** voltar, não é obrigado. |
| **Oportunidades na Landing Page** | "Um lugar que você gosta de abrir para cuidar do seu dinheiro." Screenshots light/dark. |

---

## Proposta de Valor

### O que é o produto

O **Finto** é uma plataforma de **educação financeira por hábitos**. Cada funcionalidade — entradas, gastos, investimentos, cartões, carteiras, desejos, regra 50/30/20 — existe para criar um **momento de reflexão** sobre o dinheiro, não para substituir o envolvimento do usuário.

Não é um agregador bancário. Não é uma planilha. Não é um dashboard automático. É um **companheiro de consciência financeira** que transforma minutos de registro manual em clareza, disciplina e evolução contínua.

### Para quem ele é

| Segmento primário | Perfil |
|-------------------|--------|
| **Construtor de hábitos** | Quer desenvolver relação consciente com dinheiro; aceita (ou deseja) o registro manual como parte do aprendizado |
| **Aprendiz financeiro** | Conhece 50/30/20 de ouvir falar; busca aplicar na prática com feedback, não só teoria |
| **Ex-usuário de apps automáticos** | Conectou o banco, viu extrato, mas não mudou comportamento — busca envolvimento real |
| **Consumidor impulsivo em recuperação** | Precisa de espaço para refletir antes de comprar (lista de desejos, prazo, urgência) |

| Segmento secundário | Perfil |
|---------------------|--------|
| **Autônomo / freelancer** | Múltiplas entradas por mês, tags personalizadas |
| **Usuário de cartão** | Um ou mais cartões; precisa de controle por fatura |
| **Ex-usuário de planilha** | Quer estrutura sem manutenção de fórmulas |

### Qual transformação entrega

| De (estado atual) | Para (estado desejado) |
|-------------------|------------------------|
| Olhar extrato sem entender para onde vai o dinheiro | **Consciência de cada real** — sabe origem, destino e impacto |
| Automatizar e continuar gastando igual | **Hábito de reflexão** — registra, pensa, decide |
| Ansiedade com dinheiro ("não sei se posso comprar") | **Clareza e planejamento** — sabe o que pode, o que quer e o que já fez |
| Compras por impulso | **Reflexão antes da ação** — desejos com prazo, não gastos automáticos |
| Regra 50/30/20 só na teoria | **Método vivido no dia a dia** — barras que mostram se está no caminho |
| Relação distante ou culposa com dinheiro | **Relação saudável e sustentável** — cuidado ativo, evolução contínua |

**Promessa em uma frase:** *"Desenvolva hábitos financeiros saudáveis — com clareza, consciência e método, um registro de cada vez."*

**Promessa alternativa (foco educação):** *"Aprenda a cuidar do seu dinheiro fazendo — não só olhando um extrato."*

---

## Público-alvo

### Persona 1: Marina — A Organizada em Formação

| Atributo | Descrição |
|----------|-----------|
| **Idade / contexto** | 28 anos, analista, mora sozinha, usa 2 cartões de crédito |
| **Objetivos** | Desenvolver hábito financeiro; parar de estourar o cartão; investir com consciência |
| **Dores** | App do banco mostra extrato mas ela continua gastando igual; culpa no fim do mês |
| **Necessidades** | Ritual de reflexão semanal; método 50/30/20; espaço para pensar antes de comprar |
| **Motivações** | Relação mais saudável com dinheiro; reduzir ansiedade |
| **Objeções** | "Mobills importa tudo sozinho" → precisa entender que **manual é o método, não o obstáculo** |

### Persona 2: Rafael — O Autônomo em Busca de Consciência

| Atributo | Descrição |
|----------|-----------|
| **Idade / contexto** | 35 anos, designer freelancer, renda variável |
| **Objetivos** | Separar entradas por cliente/projeto; provisionar impostos e investimentos |
| **Dores** | Meses bons mascaram meses ruins; não sabe média real de gastos |
| **Necessidades** | Tags de entrada; visão anual; categorias customizáveis |
| **Motivações** | Cada registro de entrada é reconhecimento do próprio trabalho — alinhado à filosofia Finto |
| **Objeções** | "Renda irregular quebra a regra?" → reenquadrar: cada mês é uma nova reflexão |

### Persona 3: Camila — A Consumidora Consciente

| Atributo | Descrição |
|----------|-----------|
| **Idade / contexto** | 32 anos, CLT, planeja comprar apartamento e reformar |
| **Objetivos** | Refletir antes de comprar; alinhar desejos com prioridades reais |
| **Dores** | Compras por impulso; lista mental de "quero comprar" que vira dívida |
| **Necessidades** | Lista de desejos com prazo; regra financeira; despesas fixas visíveis |
| **Motivações** | Comprar casa sem endividar; consumo alinhado a valores |
| **Objeções** | "Lista de desejos não é só wishlist?" → é **reflexão antes da ação**, core da visão |

### Persona 4: André — O Investidor que Quer Disciplina

| Atributo | Descrição |
|----------|-----------|
| **Idade / contexto** | 40 anos, aporta mensalmente em corretora e Tesouro |
| **Objetivos** | Garantir que aportes não ficam de fora em meses apertados |
| **Dores** | Corretora mostra posição, não hábito de aporte; mistura contas |
| **Necessidades** | Carteiras por instituição; bucket de investimentos na regra; visão anual |
| **Motivações** | Registrar aporte = declarar compromisso com o futuro — filosofia do produto |
| **Objeções** | "Não substitui a corretora" → correto; Finto constrói o **hábito**, a corretora guarda o ativo |

---

## Como a Filosofia se Manifesta no Produto

Mapa direto entre [purpose.mdc](./purpose.mdc) e decisões de produto já implementadas — útil para copy e publicidade:

| Princípio da visão | Decisão no produto | Mensagem para marketing |
|--------------------|--------------------|-------------------------|
| Participação ativa | Lançamentos manuais | "Você no comando — não um extrato passivo" |
| Reflexão ao registrar gasto | CRUD de despesas com categorias | "Cada gasto registrado é um instante de consciência" |
| Pensar nos objetivos | Módulo de investimentos + 50/30/20 | "Investir começa com intenção" |
| Perceber origem do dinheiro | Entradas com tags | "De onde vem cada real?" |
| Entender onde gasta | Categorias personalizáveis + regra | "Seu mapa financeiro, não um template" |
| Reflexão antes da ação | Lista de desejos isolada do caixa | "Querer não é gastar" |
| Automação limitada de propósito | Sem Open Finance no MVP | "Envolvimento > conveniência" |
| Evolução contínua | Visão anual | "O hábito se vê no tempo" |
| Clareza e consciência | Critério de efetivados + pendências (D1) | "O que aconteceu — e o que ainda falta" |
| Patrimônio consciente | Carteiras + resgate + transferência (D4/D9) | "Seu dinheiro com endereço e movimentação honesta" |
| Movimentos órfãos visíveis | Saldo Livre (D7) | "Nada some — organize quando quiser" |
| Conquista com impacto real | Gasto efetivado por forma de pagamento (D5) | "Conquistar também reflete no caixa" |
| Transparência na regra | Bucket Não classificado (D2) | "Saiba o que falta mapear — sem surpresas" |

---

## Modelo de Produto — Investimentos + Carteiras + Saldo Livre (D4)

Decisão expandida conforme [plano-pre-lancamento.md](../DEV/plano-pre-lancamento.md). Resolve a ambiguidade *"investimento é fluxo ou posição?"* sem misturar papéis:

| Camada | Pergunta | Copy de marketing |
|--------|----------|-------------------|
| **Resumo do mês** | *"Quanto sobrou de fato?"* | Caixa efetivado do período |
| **Seção Investimentos** | *"Quanto aportei este mês?"* | Hábito de aporte mensal |
| **Carteiras** | *"Quanto tenho estimado em cada conta?"* | Patrimônio com endereço + resgate + transferência |
| **Saldo Livre** | *"O que passou sem carteira?"* | Movimentos sem endereço + resgates |

**Mensagem unificada para LP e ads:** *"Aportes no mês. Patrimônio nas Carteiras. Tudo consciente, nada automático."*

---

## Benefícios

Priorizados por impacto na **transformação** do usuário (benefícios antes de funcionalidades), alinhados à [visão do fundador](./purpose.mdc):

| # | Benefício | Por que importa |
|---|-----------|----------------|
| 1 | **Hábito de reflexão financeira** | Cada registro manual é um segundo de consciência — o verdadeiro produto |
| 2 | **Educação financeira na prática** | Aprende fazendo: categorias, regra 50/30/20, efetivados — não só lendo artigos |
| 3 | **Clareza sobre a situação real** | Sabe o que entrou, saiu e sobrou de fato — sem ilusão de extrato |
| 4 | **Consciência antes de gastar** | Lista de desejos e prazos criam pausa entre impulso e compra |
| 5 | **Disciplina de investimento** | Registrar aportes conecta o hoje aos objetivos de longo prazo |
| 6 | **Planejamento com método** | Regra 50/30/20 traduzida nas categorias reais — estrutura sem consultoria |
| 7 | **Evolução contínua** | Visão anual mostra progresso do hábito ao longo dos meses |
| 8 | **Relação saudável com dinheiro** | De culpa/ansiedade para cuidado ativo e sustentável |
| 9 | **Privacidade e envolvimento** | Sem Open Finance — seus dados, seu ritmo, sua responsabilidade |
| 10 | **Simplicidade que convida ao retorno** | Interface que reduz fricção do hábito diário/semanal |

---

## Diferenciais Competitivos

### O diferencial raiz (filosofia)

| Aspecto | Apps automáticos (Mobills, Organizze…) | Finto |
|---------|------------------------------------------|-------|
| **Premissa** | Conveniência — importar e pronto | Envolvimento — registrar e refletir |
| **Papel do usuário** | Espectador do extrato | Protagonista da gestão |
| **Educação financeira** | Derivada (se houver) | **Central e intencional** |
| **Open Finance** | Vantagem competitiva deles | **Escolha pedagógica nossa** — o manual não é bug, é feature |
| **Resultado esperado** | Ver para onde foi | **Mudar comportamento** |

### O que nos torna diferentes na prática

| Diferencial | vs. Concorrentes | vs. Planilha |
|-------------|------------------|--------------|
| **Registro manual intencional** | Eles automatizam; nós **ensinamos** | Planilha é manual mas sem método nem reflexão guiada |
| **Mentalidade mensal + ritual** | Extrato contínuo passivo | Mensal mas exige manutenção e fórmulas |
| **50/30/20 integrado às suas categorias** | Raro com mapeamento personalizado | Usuário cria fórmulas sozinho |
| **Lista de desejos (reflexão antes da ação)** | **Inexistente** nos líderes BR | Não existe nativamente |
| **Cartão por fatura** | Maioria trata transação a transação | Manual e propenso a erro |
| **Efetivado como pedagogia** | Importados misturam tudo | Depende da disciplina do usuário |
| **Carteiras com resgate e transferência** | Operações patrimoniais sem distorcer o mês | Único entre apps BR de hábito manual |
| **Saldo Livre** | Visibilidade de movimentos sem carteira | Acolhedor; destino de resgates |

### Oportunidades de diferenciação pós-lançamento

| Oportunidade | Benefício potencial | Impacto comercial |
|--------------|---------------------|-------------------|
| **Onboarding guiado** (regra + primeiro mês + carteira) | Reduz abandono na primeira semana | Alto |
| **Exportação PDF/CSV do mês** | Confiança para usuários avançados | Médio |
| **PWA / instalação no celular** | Reduz objeção "sem app" | Alto |
| **Notificações de hábito** (fechamento do mês, prazo de desejo) | Reforço pedagógico | Médio |
| **Recorrência cross-year** (D3 evolução) | Retém usuários de longo prazo | Médio |

---

## Funcionalidades com Maior Potencial Comercial

Ordenadas por impacto na decisão de compra — **sempre comunicar a transformação que cada uma viabiliza**, não a feature em si:

| # | Funcionalidade | Transformação que vende | Por que converte |
|---|----------------|-------------------------|------------------|
| 1 | **Registro manual guiado** | De espectador a protagonista do próprio dinheiro | Diferencial filosófico; reenquadra a objeção #1 |
| 2 | **Regra 50/30/20 personalizada** | De teoria a método vivido | SEO forte; resultado visual imediato |
| 3 | **Lista de desejos** | De impulso a reflexão antes da compra | Emocional; único no mercado BR |
| **Carteiras + resgate + transferência** | De patrimônio opaco a contas com movimentação consciente | Diferencial pós-gate; promessa concreta |
| **Saldo Livre** | Nada "some" — tudo visível, organizável | Reduz objeção de incompletude |
| **Resumo efetivado + pendências** | Clareza do realizado + o que falta | D1 implementado |
| 7 | **Cartões por fatura** | De ilusão de crédito a consciência de compromisso | Dor real; explicável em 1 frase |
| 8 | **Visão anual** | De mês isolado a evolução contínua | Prova do hábito ao longo do tempo |

**Em segundo plano na comunicação inicial:** seleção de itens, CRUD de tags, detalhes técnicos de repetição, glossário como seção de apoio (não hero).

---

## Pontos Fortes

1. **Visão de produto clara** — educação financeira por hábitos ([purpose.mdc](./purpose.mdc)).
2. **Decisões D1–D9 fechadas** — produto e marketing alinhados ([plano-pre-lancamento.md](../DEV/plano-pre-lancamento.md)).
3. **Gate de confiança implementado** — números reconciliáveis; glossário com 12 entradas.
4. **Modelo D4 coerente** — Investimentos (fluxo) + Carteiras (posição estimada) + Saldo Livre.
5. **Resgate e transferência** — promessas concretas para LP e ads (D9).
6. **Registro manual como vantagem estratégica** — reforçado, não enfraquecido, pelas decisões.
7. **Lista de desejos + conquista com efetivação inteligente** (D5).
8. **Regra 50/30/20 com bucket Não classificado** — transparência pedagógica (D2).
9. **67 testes unitários** no gate — copy pode citar confiabilidade dos cálculos.
10. **Marca Finto** definida na UI com proposta transformacional clara.

---

## Pontos Fracos

### Lacunas de mercado (objeções que o visitante pode ter)

| Lacuna | Impacto | Como a filosofia ajuda |
|--------|---------|-------------------------|
| **Open Finance / sync bancário** | Principal comparação com concorrentes | Reposicionar: "Eles importam. Nós transformam." |
| **App nativo** | Expectativa do mercado BR | PWA + "funciona no celular"; hábito não exige app nativo |
| **Prova social** | Zero depoimentos/métricas | Beta com early adopters que valorizam hábito, não automação |
| **Monetização definida** | Sem CTA de compra claro | Vender transformação primeiro; preço depois |

### Lacunas de produto remanescentes (pós-gate)

| Lacuna | Impacto | Fase |
|--------|---------|------|
| Exportação / importação | Usuários avançados | P4 / pós-lançamento |
| Conta compartilhada / familiar | Casais | Backlog |
| Notificações / lembretes de hábito | Reforço pedagógico | Oportunidade |
| Métodos de pagamento customizáveis (D8) | Perfis nicho | Fora do MVP — FAQ |
| Vínculo cartão por nome (#5) | Integridade silenciosa | Fase 3 |
| Valor desejo vs. gasto divergente (#14) | Reconciliação conquista | Fase 3 |
| Monetização (preço, trial) | CTA de conversão paga | Decisão comercial pendente |

### Itens resolvidos (não tratar como fraqueza na comunicação)

| Item anterior | Resolução |
|---------------|-----------|
| Categorias não mapeadas vs. regra | Bucket "Não classificado" + reconciliação (D2) |
| Visão anual desatualizada | `refreshAffectedYearMonths` (Fase 1.2) |
| Resumo vs. listas conflitantes | Hierarquia efetivado primário + pendências (D1) |
| Dois saldos sem educação | Glossário expandido + rótulos "Saldo estimado" |
| Movimentos sem carteira invisíveis | Saldo Livre (D7) |
| Transferências ausentes | TransferDialog (D9) |
| Resgate desconectado | WithdrawalDialog → Saldo Livre (D9) |
| Conquista sem efetivar gasto | `paid: true` automático exceto cartão (D5) |
| Seleção confusa | Contador N selecionados · M efetivados |
| deleteRule sem UI | Reset exposto no resumo e visão anual |

### Comunicação desalinhada da visão

A Landing Page rascunho (`landing/`) posiciona o Finto como **"organizador financeiro"** e **"controle de gastos"** — exatamente o que [purpose.mdc](./purpose.mdc) manda evitar. Menciona visão por mês, 50/30/20, cartões e estatísticas, mas **não comunica:**

- Educação financeira por hábitos
- Registro manual como virtude pedagógica
- Lista de desejos e reflexão antes da compra
- Carteiras e consciência patrimonial
- A transformação (clareza, consciência, disciplina)

**Ação:** reescrever a LP com a hierarquia transformação → método → funcionalidades.

### Falta de argumentos comerciais prontos

- Sem pricing, garantia, trial ou oferta de lançamento
- Sem FAQ estruturado
- Sem comparativo honesto com concorrentes
- Sem métricas ("X usuários", "Y milhões organizados")

---

## Oportunidades

### Valor percebido

| Ação | Impacto esperado |
|------|------------------|
| Comunicar **"educação financeira por hábitos"** como categoria própria | Diferencia de 100% dos concorrentes BR |
| Hero sobre **transformação** (clareza, consciência, disciplina) | Alinha LP à visão do fundador |
| Destacar **lista de desejos** como reflexão antes da ação | Diferenciação emocional |
| Seção **"Por que manual?"** — honesta e pedagógica | Converte objeção em vantagem |

### Conversão

| Ação | Impacto esperado |
|------|------------------|
| **Trial gratuito** ou freemium (1 carteira, regra básica) | Reduz barreira de entrada |
| **Oferta de lançamento** (preço especial early adopters) | Urgência |
| **CTA claro** na Landing → app em produção (`tidy-month-tracker.vercel.app`) | Funil direto |
| **FAQ** com "Por que não conecta no banco?" | Reduz bounce; educa sobre a filosofia |
| **Vídeo de 60s** mostrando o ritual: registrar → refletir → enxergar | Vende transformação, não tela |

### Confiança

| Ação | Impacto esperado |
|------|------------------|
| Publicar **política de privacidade** e **termos** | Obrigatório para SaaS |
| Explicar **onde os dados ficam** (Supabase, RLS) | Segurança |
| **Beta fechado → depoimentos** | Prova social de transformação comportamental (pendente) |
| **Screenshots pós-gate** | Saldo Livre, resgate, transferência, pendências (pendente) |
| **Migration produção** | Gate técnico final (pendente ops) |

### Posicionamento

| Ação | Impacto esperado |
|------|------------------|
| Criar categoria: **"educação financeira por hábitos"** | SEO e branding únicos |
| Conteúdo: por que manual ensina mais que extrato automático | Aquisição orgânica alinhada à visão |
| Parcerias com educadores financeiros (não influencers de tech) | Credibilidade pedagógica |

### Competitividade

| Ação | Impacto esperado |
|------|------------------|
| **PWA** para instalação no celular | Neutraliza "não tem app" |
| **Export CSV** do mês | Retém usuários avançados |
| Avaliar **Open Finance** no roadmap de longo prazo | Não no MVP de comunicação |

---

## Possíveis Objeções

| # | Objeção | Como combater na comunicação |
|---|---------|------------------------------|
| 1 | "Preciso lançar tudo manualmente?" | **Reenquadrar:** "É assim que você aprende. Cada registro é um segundo de reflexão — apps que importam tudo não mudam seu comportamento. Leva minutos por dia; parcelas e repetições fazem o grosso." |
| 2 | "Mobills/Organizze conectam no banco" | "Eles mostram **onde foi**. O Finto te ajuda a entender **por quê** e a mudar. São complementares — mas se você quer transformação, não só extrato, o Finto é para você." |
| 3 | "Os números vão bater com meu banco?" | "Saldo do mês = caixa efetivado. Carteiras = **saldo estimado** com declaração consciente. Saldo Livre = movimentos sem carteira + resgates — **não é extrato bancário**." |
| 4 | "O que é Saldo Livre?" | "Movimentos do mês que não estão em nenhuma carteira, mais valores de resgate. Não é sua conta corrente — é organização consciente." |
| 5 | "Resgate e transferência funcionam como?" | "Resgate: sai da carteira, entra no Saldo Livre e no resumo. Transferência: move entre carteiras **sem alterar** saldo do mês nem a regra 50/30/20." |
| 6 | "Repetição não continua em janeiro?" | "No MVP, repetição é **dentro do ano civil**. Em janeiro, duplique ou recrie — FAQ e aviso no formulário (D3)." |
| 7 | "É seguro?" | "Seus dados, seu controle. Sem acesso ao banco. Isolamento por usuário." |
| 8 | "Formas de pagamento customizáveis?" | "Fora do MVP — Pix, Débito, Dinheiro, Boleto + cartões cadastrados (D8)." |
| 9 | "Funciona para renda irregular?" | "Sim — a regra usa o que você **efetivamente recebeu** naquele mês. Cada mês é uma nova reflexão." |
| 10 | "Não tem app?" | "Funciona no celular pelo navegador. O hábito está no registro, não na loja de apps. PWA em roadmap." |
| 11 | "Já tentei app e abandonei" | "Apps automáticos não criam hábito. O Finto te envolve de propósito." |
| 12 | "Planilha é de graça" | "Planilha não ensina, não tem 50/30/20, desejos, cartão por fatura, resgate nem transferência." |
| 13 | "Posso confiar nos cálculos?" | "Lógica auditada — 67 testes no gate. Glossário explica cada número." |
| 14 | "Não tenho tempo" | "5 minutos, 3 vezes por semana. Menos tempo do que a culpa no fim do mês." |

---

## Posicionamento

### Categoria de mercado

**Educação financeira básica por hábitos** — com ferramentas de organização mensal como meio, não como fim.

Subcategoria: entre planilha (sem método) e agregador bancário (sem envolvimento).

### O que o Finto é e o que não é

| O Finto é | O Finto não é |
|-----------|---------------|
| Companheiro de consciência financeira | Substituto do app do banco |
| Ferramenta de construção de hábitos | Agregador automático de contas |
| Método 50/30/20 na prática | Robô de investimentos |
| Convite à reflexão diária/semanal | Dashboard passivo de extrato |
| Caminho para relação saudável com dinheiro | Planilha com UI bonita |

### Promessa principal

> **"Desenvolva hábitos financeiros saudáveis — com clareza, consciência e disciplina, um registro de cada vez."**

### Promessas secundárias (por contexto)

| Contexto | Mensagem |
|----------|----------|
| Hero / topo de funil | "Aprenda a cuidar do seu dinheiro fazendo — não só olhando." |
| Comparação com concorrentes | "Eles importam. Nós transformam." |
| Objeção manual | "Cada registro é um segundo de reflexão." |
| Lista de desejos | "Quer comprar? Primeiro pense." |
| Regra 50/30/20 | "O método que você ouviu falar — agora na sua vida real." |

### Hierarquia de benefícios na comunicação

**Primeiro plano (hero e primeiras seções) — TRANSFORMAÇÃO:**
1. Hábitos financeiros saudáveis
2. Consciência e clareza sobre o dinheiro
3. Educação financeira na prática

**Segundo plano — MÉTODO:**
4. Regra 50/30/20 nas suas categorias
5. Reflexão antes da ação (lista de desejos)
6. Registro manual intencional (seção "Por que manual?")

**Terceiro plano — FERRAMENTAS:**
7. Resumo efetivado e visão mensal
8. Cartão por fatura
9. Carteiras por conta
10. Visão anual e evolução

**Quarto plano (FAQ, rodapé):**
11. Parcelas, tags, categorias
12. Privacidade / sem Open Finance
13. Glossário técnico

### Tom de voz

- **Pedagógico** — ensina sem ser professoral
- **Acolhedor** — finanças geram ansiedade; o tom tranquiliza
- **Honesto** — não promete automação nem saldo bancário exato
- **Transformacional** — fala de quem o usuário pode se tornar, não só do que o app faz
- **Brasileiro** — Pix, boleto, categorias e contexto local

### Concorrentes de referência (para messaging)

| Concorrente | Finto | Eles |
|-------------|-------|------|
| Mobills / Organizze | Transformação comportamental | Automação e extrato |
| Planilha Google | Método + hábito guiado | Flexível mas sem pedagogia |
| YNAB (global) | Mesma filosofia de envolvimento ativo | Caro, em inglês, sem desejos BR |
| Apps de banco | Consciência e educação | Conveniência e produtos financeiros |

---

## Mapa de Mensagens por Módulo (referência para Landing Page)

Cada linha deve passar pelo **filtro de comunicação**: transformação primeiro, funcionalidade depois.

| Módulo | Transformação (hero) | Ferramenta (apoio) |
|--------|----------------------|-------------------|
| Filosofia | "Cuide do seu dinheiro com consciência" | Registro manual intencional |
| Resumo | "Saiba o que de fato aconteceu" | Totais efetivados |
| Regra 50/30/20 | "O método na sua vida real" | Barras + mapeamento de categorias |
| Desejos | "Quer comprar? Primeiro pense." | Lista com prazo e urgência |
| Gastos | "Cada gasto registrado é uma reflexão" | Fixo / variável / parcelado |
| Cartões | "Crédito com consciência" | Fatura como unidade de pagamento |
| Carteiras | "Seu dinheiro com endereço" | Resgate, transferência, saldo estimado |
| Saldo Livre | "Nada se perde — organize no seu ritmo" | Movimentos sem carteira + resgates |
| Investimentos | "O hábito de aportar todo mês" | Aportes vinculados a carteiras |
| Estatísticas | "Veja sua evolução" | Gráfico anual |
| Entradas | "De onde vem seu dinheiro" | Tags e recebimento |

---

## Estrutura Sugerida para Landing Page (pré-copy)

Baseada na visão do fundador + [marketing-specialist.mdc](./marketing-specialist.mdc). Ordem orientada a **transformação → método → ferramentas**:

| # | Seção | Objetivo |
|---|-------|----------|
| 1 | **Hero** | Promessa transformacional (hábitos, consciência, clareza) — não "controle financeiro" |
| 2 | **Problema** | Apps automáticos mostram extrato mas não mudam comportamento; planilhas não ensinam |
| 3 | **Filosofia** | "Por que manual?" — registro como pedagogia, não limitação |
| 4 | **Como funciona** | Ritual: registrar → refletir → enxergar → evoluir |
| 5 | **Benefícios** | Clareza, consciência, disciplina, planejamento, evolução |
| 6 | **Método 50/30/20** | Educação financeira aplicada |
| 7 | **Lista de desejos** | Reflexão antes da ação (diferencial emocional) |
| 8 | **Demonstração** | Screenshots/GIF do produto real |
| 9 | **Cartões + Carteiras + Saldo Livre** | Fatura, resgate, transferência, patrimônio estimado |
| 10 | **Evolução anual** | Gráfico como recompensa do hábito |
| 11 | **Prova social** | Depoimentos de transformação comportamental |
| 12 | **FAQ** | Manual, efetivado, fatura, saldo estimado, **Saldo Livre**, resgate, transferência, repetição anual, formas de pagamento |
| 13 | **CTA final** | "Comece seu hábito financeiro" — não "Comece grátis" genérico |

---

## Decisões de Produto — FECHADAS ✅

Fonte: [plano-pre-lancamento.md](../DEV/plano-pre-lancamento.md). **Todas implementadas ou documentadas** — a comunicação deve refletir estas escolhas.

| # | Decisão | Escolha | Implicação para marketing |
|---|---------|---------|---------------------------|
| **D1** | Caixa efetivado vs. planejado | ✅ Só efetivado no resumo + pendências (*A receber · A pagar · A investir*) | Vender *"clareza do que de fato aconteceu"* |
| **D2** | Categorias não mapeadas | ✅ Bucket **"Não classificado"** visível | Regra explica gastos **mapeados**; alertar gap restante |
| **D3** | Repetição cruza ano? | ✅ **Ano civil** + aviso no formulário e FAQ | *"Repetição dentro do ano civil"* — não prometer infinita |
| **D4** | Investimentos + Carteiras | ✅ **Duas camadas** — aportes vs. posição estimada | Investimentos = hábito mensal; Carteiras = patrimônio |
| **D5** | Conquista efetiva gasto? | ✅ Automático Pix/Débito/Dinheiro; cartão aguarda fatura | Conquista reflete caixa — copy no dialog de desejos |
| **D6** | Carteiras = saldo real? | ✅ **Estimativa** | *"Saldo estimado"* — não espelha extrato |
| **D7** | Movimentos sem carteira | ✅ Alertar + agrupar em **Saldo Livre** | Incentivar vínculo; nada desaparece |
| **D8** | Métodos de pagamento custom | ✅ **Fora do MVP** | FAQ com opções padrão |
| **D9** | Resgate + Transferência | ✅ **No gate** — Fase 2.5 | Prometer movimentação entre carteiras e resgate |

### Pode prometer / Não prometer (pós-gate)

Após Fases 1 + 2 + 2.5, a comunicação **pode** afirmar:

| ✅ Pode prometer | ❌ Não prometer |
|-----------------|----------------|
| Clareza do **caixa efetivado** | Saldo bancário espelhado 1:1 |
| Regra 50/30/20 nas **suas** categorias | *"Explica 100% dos gastos"* sem ressalva de mapeamento |
| Cartão por **fatura** | Sync bancário / Open Finance |
| Lista de desejos como **reflexão antes da ação** | Gestão de carteira de ativos / corretora |
| **Aportes mensais** + **Carteiras** com saldo estimado | Ledger bancário automático |
| **Resgate** da carteira → Saldo Livre | Resgate automático da corretora |
| **Transferência** entre carteiras sem distorcer o mês | Open Finance |
| **Saldo Livre** para movimentos sem carteira | Saldo Livre = conta bancária |
| Visão anual do **hábito ao longo do tempo** | Recorrência automática entre anos |
| Pendências (*A receber · A pagar · A investir*) | Toggle global planejado/realizado |
| Glossário com 12 conceitos financeiros | Métodos de pagamento customizáveis |

---

## Próximos Passos (marketing pós-gate)

1. **Reescrever Landing Page** — hero transformacional; seção Carteiras com resgate/transferência; FAQ completo (tabela acima)
2. **Produzir screenshots/GIFs pós-gate** — Saldo Livre, dialogs de resgate/transferência, pendências no resumo, bucket Não classificado
3. **Publicar termos e privacidade** — requisito para divulgação pública
4. **Coletar depoimentos** — foco em mudança de comportamento, não em features
5. **Definir monetização** — trial, freemium ou assinatura (única decisão comercial aberta)
6. **Conteúdo SEO** — 50/30/20, caixa efetivado, Saldo Livre, por que manual ensina mais que extrato
7. **Aguardar gate final** — regressão manual browser + migration produção antes de campanha ampla

---

## Referências

- **[Visão do Fundador](./purpose.mdc)** — documento fundacional; prevalece sobre análises técnicas
- **[Plano Pré-Lançamento](../DEV/plano-pre-lancamento.md)** — decisões D1–D9, gate e alinhamento marketing ↔ produto
- [Relatório de Regras de Negócio](../BUSINESS/relatorio-regras-negocio.md)
- [Análise Frontend QA](../ANALISE_FRONTEND_QA.md)
- [Proposta Carteiras](../DEV/proposta-feature-contas.md)
- [Marketing Specialist](./marketing-specialist.mdc)
- [Landing rascunho](../../landing/src/App.tsx) — **requer alinhamento à visão**
- [Glossário no produto](../../frontend/src/components/FinancialGlossaryDialog.tsx)
- [Marca Finto](../../frontend/src/components/brand/BrandMark.tsx)

---

*Documento estratégico para base de marketing, Landing Page e publicidade. A [visão do fundador](./purpose.mdc) é o eixo — funcionalidades são meios, transformação é o fim. Não é copy final.*
