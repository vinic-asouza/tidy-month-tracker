# Briefing — Espelho Finto no Notion (v1)

Você é um construtor de workspaces Notion. Sua tarefa é **criar um modelo operacional** (databases, propriedades, relações, fórmulas, views e uma página-dashboard) que reproduza o gerenciamento financeiro do app **Finto**, na medida do que o Notion consegue fazer bem.

Trabalhe **somente** com o escopo abaixo. Não invente módulos. Não peça confirmação para o que já está decidido. Se algo for impossível no Notion, implemente o equivalente mais próximo e deixe uma callout na página de instruções.

Idioma da UI: **português**. Moeda: **R$ (BRL)**. Uso: **uma pessoa**, workspace pessoal. Registro **manual** é intencional (não há Open Finance, importação bancária nem sync de corretora).

---

## 0. O que este modelo é (e o que não é)

O Finto é educação financeira pela construção de hábitos: a pessoa **planeja** o mês e depois **confirma o que de fato aconteceu**.

Conceito central (obrigatório):

| Estado | Significado |
| --- | --- |
| **Planejado** | Lançamento registrado; ainda não aconteceu de fato |
| **Efetivado** | Entrada recebida, gasto pago, ou aporte investido. Gasto no **cartão** só é efetivado quando a **fatura daquele mês** está paga |

**Saldo do mês** (fluxo do período, **não** é saldo de conta bancária):

```
saldo efetivado  = entradas recebidas − gastos efetivamente pagos − investimentos marcados como investido
saldo planejado  = soma de TODAS as entradas − TODOS os gastos − TODOS os investimentos (ignora flags)
```

Saldo ≥ 0 deve aparecer em verde; saldo < 0 em vermelho (via fórmula + cor condicional nas views, se o Notion permitir).

---

## 1. Escopo desta versão

### Incluir

1. Cadastro e gestão de **Entradas** (receitas do mês)
2. Cadastro e gestão de **Gastos** (fixo, variável, parcelado)
3. Cadastro e gestão de **Investimentos** = **aportes do mês** (“quanto apliquei neste período?”), **não** extrato de corretora
4. **Resumo do mês** e **visão anual** (totais + gráfico se o Notion permitir; senão tabela mês a mês)
5. Toggle conceitual **Efetivados vs Planejados** (duas colunas de fórmula no resumo, sempre visíveis)
6. **Pendências** no modo efetivado: a receber, a pagar, a investir
7. **Cartões de crédito + fatura do mês** (simplificado: sem escolher “de onde saiu o dinheiro”)
8. Tags de entrada, categorias de gasto, tags de investimento
9. Repetição no **ano civil** e parcelas que **podem cruzar o ano**
10. Página de instruções de uso (ritual mensal)

### Não incluir (proibido nesta versão)

- Carteiras / contas / papéis (movimentação vs investimentos)
- Saldo Livre
- Transferência entre contas
- Resgate de investimentos e entrada automática “Resgate de investimentos”
- Regra 50/30/20, percentuais personalizados, mapeamento essencial vs estilo de vida, “não classificado”
- Desejos / wishlist
- Autenticação, multi-usuário, família, convites
- Open Finance, CSV, sync de banco/corretora
- Barra de seleção múltipla (soma de itens clicados)
- Patrimônio estimado / saldo de conta

Adaptação obrigatória: **efetivar é só marcar um checkbox** (Recebido / Pago / Investido). Não existe dialog de origem/destino. No cartão, o checkbox “Pago” **não existe no item**; o status vem da fatura.

---

## 2. Arquitetura Notion (criar nesta ordem)

Crie **uma página-mãe** chamada `Finto — Finanças pessoais` com esta estrutura:

```
Finto — Finanças pessoais
├── 📘 Como usar (instruções)
├── 🏠 Painel do mês          ← dashboard principal
├── 📅 Visão anual
├── 🗂 Databases
│     ├── Meses
│     ├── Entradas
│     ├── Gastos
│     ├── Investimentos
│     ├── Cartões
│     ├── Faturas
│     ├── Tags de entrada
│     ├── Categorias de gasto
│     └── Tags de investimento
└── 🧩 Templates (páginas-modelo, se usar)
```

Relação-mestre: **tudo se ancora em `Meses`**. Um mês = uma linha `YYYY-MM`. Navegação do painel = filtrar pelo mês corrente.

---

## 3. Databases — especificação completa

### 3.1 Meses

Uma linha por mês civil. Esta é a âncora de navegação e de rollups.

| Propriedade | Tipo | Obrigatório | Notas |
| --- | --- | --- | --- |
| Nome | Title | sim | Formato `Agosto 2026` |
| Ano-mês | Text (ou Formula) | sim | `YYYY-MM`, único. Ex.: `2026-08` |
| Data início | Date | sim | Primeiro dia do mês (para filtros/calendário) |
| Ano | Number ou Formula | sim | Extraído de Ano-mês |
| Mês | Number ou Formula | sim | 1–12 |
| Entradas | Relation → Entradas | | bidirecional |
| Gastos | Relation → Gastos | | bidirecional |
| Investimentos | Relation → Investimentos | | bidirecional |
| Faturas | Relation → Faturas | | bidirecional |
| Total entradas efetivadas | Rollup / Formula | | soma Entradas onde Recebido = true |
| Total gastos efetivados | Formula | | ver §5 (cartão usa fatura) |
| Total investimentos efetivados | Rollup / Formula | | soma Investimentos onde Investido = true |
| **Saldo efetivado** | Formula | | entradas efet. − gastos efet. − inv. efet. |
| Total entradas planejadas | Rollup | | soma de todas as entradas do mês |
| Total gastos planejados | Rollup | | soma de todos os gastos do mês |
| Total investimentos planejados | Rollup | | soma de todos os aportes do mês |
| **Saldo planejado** | Formula | | planejado entradas − gastos − investimentos |
| A receber | Formula | | max(0, planejado entradas − efetivado entradas) |
| A pagar | Formula | | max(0, planejado gastos − efetivado gastos) |
| A investir | Formula | | max(0, planejado investimentos − efetivado investimentos) |

**Seed:** crie os 12 meses do ano civil corrente (2026) e, se fácil, do ano seguinte. Não crie anos vazios além disso.

**Views de Meses:**

- Tabela “Ano corrente” filtrada por Ano
- Galeria ou lista para o Painel escolher o mês

---

### 3.2 Tags de entrada

Lista mestra (não misturar com categorias de gasto).

| Propriedade | Tipo | Notas |
| --- | --- | --- |
| Nome | Title | único |
| Em uso | Checkbox ou Formula | se o Notion não der para travar exclusão, documentar: “não apague tag com lançamentos” |

**Opções iniciais (criar as linhas):**
`Salário`, `Benefício`, `Extra`, `Bonificação`, `Pagamento de terceiros`, `Freelance`, `Rendimentos`, `Presente`, `Outros`

Não criar `Resgate de investimentos` (módulo de carteira fora de escopo).

---

### 3.3 Categorias de gasto

| Propriedade | Tipo |
| --- | --- |
| Nome | Title (único) |

**Opções iniciais:**
`Moradia`, `Contas pessoais`, `Compras Gerais`, `Vestuário`, `Assinaturas`, `Trabalho`, `Serviços Gerais`, `Mercado`, `Lanches`, `Combustível`, `Transporte`, `Carro`, `Presentes`, `Lazer`, `Estilo de Vida`, `Consultas Médicas`, `Suplementação`, `Remédios`, `Educação`, `Viagem`, `Empréstimos`, `Doação`, `Taxas`

---

### 3.4 Tags de investimento

Como não há carteira-destino, a tag é o endereço do aporte (corretora/banco).

| Propriedade | Tipo |
| --- | --- |
| Nome | Title (único) |

**Opções iniciais:** `Banco A`, `Banco B`, `Corretora`, `Outros`

A pessoa pode renomear/adicionar. Renomear **não** precisa propagar automaticamente (limitação Notion); na página de instruções: “se renomear, atualize os lançamentos à mão ou filtre pela tag antiga”.

---

### 3.5 Cartões

Cadastro **global** (não por mês).

| Propriedade | Tipo | Obrigatório | Notas |
| --- | --- | --- | --- |
| Nome | Title | sim | único; é a forma de pagamento dos gastos |
| Cor | Select | sim | violet, orange, emerald, blue, pink, yellow, slate, cyan, red |
| Dia de vencimento | Number | não | 1–31; só informativo |
| Limite | Number | não | só informativo; **não** bloqueia lançar gasto |
| Faturas | Relation → Faturas | | |
| Gastos | Relation → Gastos | | |

**Regras:**

- Não excluir cartão se existir gasto vinculado (instruir o usuário; Notion não bloqueia delete com a mesma força do app).
- Dois cartões com o mesmo nome **não** podem existir (o app casa gasto↔cartão pelo **nome**).
- Limite e vencimento **não** impedem criar gasto. Alerta de vencimento (~3 dias, só no mês corrente, fatura pendente) é opcional (view filtrada ou fórmula).

---

### 3.6 Faturas

Uma linha por **(Cartão × Mês)**. Sem linha = fatura **não paga**.

| Propriedade | Tipo | Obrigatório | Notas |
| --- | --- | --- | --- |
| Nome | Title | sim | `Fatura {Cartão} — {Mês por extenso}` |
| Cartão | Relation → Cartões | sim | |
| Mês | Relation → Meses | sim | |
| Paga | Checkbox | sim | default desmarcado |
| Data do pagamento | Date | não | preenchida ao marcar Paga |
| Total da fatura | Rollup | | soma dos Gastos daquele cartão naquele mês (todos, pagos ou não) |
| % do limite | Formula | | Total / Limite do cartão; vazio se sem limite |

**Regras da fatura:**

- Chip/fatura = soma de **todos** os gastos daquele cartão no mês (visão de comprometido). **Não** é o mesmo número do resumo efetivado.
- Marcar **Paga** efetiva **todos** os gastos daquele cartão naquele mês no caixa efetivado.
- Desmarcar **Paga** tira esses gastos do caixa efetivado.
- Fatura zerada (sem gastos) pode ser marcada paga (status só); não precisa de valor.
- A fatura é do **mês de navegação** (`YYYY-MM`), não de um ciclo bancário de fechamento. Não invente “fechamento dia 10 / vencimento dia 17” como regra de soma.

---

### 3.7 Entradas

| Propriedade | Tipo | Obrigatório | Default | Notas |
| --- | --- | --- | --- | --- |
| Descrição | Title | sim | | |
| Valor | Number (R$) | sim | | **> 0** (validar na instrução; Notion não impede 0) |
| Tag | Relation → Tags de entrada | sim | | |
| Data | Date | sim | | |
| Mês | Relation → Meses | sim | | derivar da Data (template/botão) |
| Recebido | Checkbox | sim | `false` | efetivação |
| Repetir no ano | Checkbox | | `false` | ver §4.4 |
| Série | Relation → Entradas (self) | | | agrupa copias do mesmo lançamento |
| É cópia | Checkbox | | `false` | clones da série |
| Notas | Text | | | opcional |

**Nascimento:** sempre `Recebido = false`.

**Views:**

- Tabela do mês (filtro: Mês = este mês do painel), ordenar por Data
- Agrupada por Tag (resumo)
- Filtro “A receber” (`Recebido` desmarcado)
- Calendário por Data

---

### 3.8 Gastos

| Propriedade | Tipo | Obrigatório | Default | Notas |
| --- | --- | --- | --- | --- |
| Descrição | Title | sim | | |
| Valor | Number (R$) | sim | | **> 0** |
| Tipo | Select | sim | | `Fixo` / `Variável` / `Parcelado` |
| Categoria | Relation → Categorias de gasto | sim | | |
| Forma de pagamento | Select | sim* | | `Dinheiro`, `Pix`, `Débito`, `Boleto` |
| Cartão | Relation → Cartões | | | preenchido **em vez** de Forma de pagamento quando for crédito |
| É cartão | Formula | | | Cartão não vazio |
| Data | Date | sim | | |
| Mês | Relation → Meses | sim | | |
| Pago | Checkbox | | `false` | **só vale se NÃO for cartão**. No cartão, ignorar este campo |
| Efetivado | Formula | | | ver §5.1 — esta é a fonte do caixa |
| Repetir no ano | Checkbox | | `false` | só faz sentido em **Fixo** |
| Parcela atual | Number | se Parcelado | | 1-based |
| Total de parcelas | Number | se Parcelado | | ≥ parcela atual |
| Série | Relation → Gastos (self) | | | fixo repetido **ou** grupo de parcelas |
| É cópia | Checkbox | | `false` | |
| Fatura | Relation → Faturas | | | preencher quando for cartão (mesmo cartão + mesmo mês) |
| Notas | Text | | | |

\* Forma de pagamento **ou** Cartão: um dos dois é obrigatório. Se Cartão preenchido, Forma de pagamento pode ficar vazia (ou um select extra `Cartão de crédito` — escolha uma convenção e seja consistente).

**Tipos:**

| Tipo | Uso | Recorrência |
| --- | --- | --- |
| Fixo | Aluguel, streaming, etc. | Repete nos outros 11 meses do **mesmo ano civil** se “Repetir no ano” |
| Variável | Pontual no mês | Não repete |
| Parcelado | Compra dividida | Gera N linhas, **pode atravessar o ano** |

**Nascimento:** `Pago = false`. Sem cartão no item até o usuário escolher.

**Views:**

- Tabela do mês agrupada por Tipo (Fixo / Variável / Parcelado)
- Agrupada por Categoria
- Filtro “A pagar” (Efetivado = false)
- Por cartão (relação)
- Calendário

---

### 3.9 Investimentos (aportes do mês)

Esta database responde *“quanto aportei neste mês?”*. **Não** é posição da corretora, cotação nem rendimento.

| Propriedade | Tipo | Obrigatório | Default | Notas |
| --- | --- | --- | --- | --- |
| Descrição | Title | sim | | |
| Valor | Number (R$) | sim | | **> 0** |
| Tag | Relation → Tags de investimento | sim | | destino lógico (banco/corretora) |
| Data | Date | sim | | |
| Mês | Relation → Meses | sim | | |
| Investido | Checkbox | sim | `false` | efetivação |
| Repetir no ano | Checkbox | | `false` | ano civil |
| Série | Relation self | | | |
| É cópia | Checkbox | | `false` | |
| Notas | Text | | | |

**Nascimento:** sempre `Investido = false`. Sem origem/destino de carteira.

**Views:**

- Tabela do mês
- Agrupada por Tag
- Filtro “A investir”
- Calendário

---

## 4. Regras de negócio (traduzidas para o Notion)

Use estes IDs nas descrições das databases (property description) e na página “Como usar”.

### 4.1 Gerais

**RN-G01 — Uma pessoa.** Este workspace é pessoal. Não criar permissões por “família” ou papéis.

**RN-G02 — Planejado vs efetivado.** Todo lançamento financeiro **nasce não efetivado**.

| Tipo | Flag de efetivado |
| --- | --- |
| Entrada | checkbox `Recebido` |
| Gasto não-cartão | checkbox `Pago` |
| Gasto no cartão | Fatura do cartão naquele mês com `Paga = true` |
| Investimento | checkbox `Investido` |

**RN-G03 — Fórmulas do mês.** Ver §5. Desejos não existem neste modelo.

**RN-G04 — Valor mínimo.** Valor deve ser **> 0**. Descrição obrigatória. Tag/categoria obrigatória no tipo correspondente. Forma de pagamento ou cartão obrigatório no gasto.

**RN-G05 — Repetição no ano civil.** “Repetir no ano” copia o lançamento para os **outros 11 meses do mesmo ano**, **inclusive meses já passados** daquele ano. **Não** cria o ano seguinte. Parcelas são a exceção (§4.3).

Ao copiar: clones nascem **não efetivados**. Efetivação é **por mês**, nunca se copia.

Editar/excluir: oferecer na instrução duas intenções:

- só este mês
- este mês e os seguintes da série (`Ano-mês >= mês atual`, mesma Série)

**RN-G06 — Rótulos em uso.** Não apagar tag/categoria/cartão que ainda tenha lançamento (qualquer mês). Renomear no app propaga; no Notion, documentar a limitação.

### 4.2 Entradas

**RN-E01** — Nova entrada: `Recebido = false`. Tag + descrição; valor > 0.

**RN-E02** — Marcar `Recebido` efetua. Desmarcar volta a planejado. (Sem carteira.)

**RN-E03** — Repetição ano civil. Efetivação não se copia.

**RN-E04** — **Não implementar** (resgate automático depende de carteira).

**RN-E05** — CRUD de tags na database Tags de entrada. Excluir tag em uso: bloquear na instrução.

### 4.3 Gastos

**RN-X01** — Três tipos: Fixo, Variável, Parcelado.

**RN-X02** — Nasce `Pago = false`. Categoria, descrição, valor > 0, e (forma de pagamento **ou** cartão).

**RN-X03** — Não-cartão: checkbox `Pago` efetiva. Desmarcar desefetiva.

**RN-X04** — Cartão: **esconder / ignorar** `Pago` no item. Status vem da **Fatura** daquele cartão × mês. O gasto aparece na lista e no total da fatura imediatamente; **não** entra no saldo efetivado enquanto a fatura estiver aberta.

**RN-X05 — Parcelas:**

- Ao criar Parcelado com `Total de parcelas = N` e `Parcela atual = K` (em geral K=1): gerar as parcelas `K…N` em meses consecutivos, **podendo cruzar o ano** (ex.: Nov/2026 + 3 parcelas → Jan/2027).
- Cada linha: mesmo Valor (parcela), mesma Categoria, mesma forma/cartão, `Pago = false`, Série compartilhada, `Parcela atual` incrementando.
- Excluir “este mês”: só a linha; a série pode ficar com buraco (ok).
- Excluir “todas”: apagar todas as linhas da Série.
- Editar “todas as parcelas”: atualizar descrição/categoria/valor da série; **não** copiar `Pago`.

**RN-X06** — CRUD de categorias. Em uso: não excluir.

### 4.4 Investimentos

**RN-I01** — Nasce `Investido = false`.

**RN-I02** — Efetivar = marcar `Investido`. O saldo do mês **desconta** o valor. Sem origem/destino.

**RN-I03 / RN-I04** — Não se aplicam (sem carteiras).

**RN-I05** — Repetição ano civil. Tags na database Tags de investimento (aqui a tag **é** escolhida no create, diferente do app que grava `"—"` até efetivar).

### 4.5 Cartões / faturas

**RN-C01** — Nome + cor. Limite e vencimento opcionais. Não excluir se houver gasto.

**RN-C02** — Total da fatura = soma de **todos** os gastos daquele cartão no mês. Diferente do resumo efetivado.

**RN-C03** — Marcar fatura Paga efetiva os gastos daquele cartão naquele mês. Sem debitar carteira.

**RN-C04** — Desmarcar reverte.

**RN-C05** — Vencimento e limite informativos. Não bloquear lançamento. Alerta ~3 dias (opcional).

### 4.6 Resumo

**RN-R01** — Quatro números: Entradas, Gastos, Investimentos, Saldo (nas duas leituras).

**RN-R02** — Mostrar **sempre** as duas leituras (Efetivado e Planejado) lado a lado. O Notion não tem toggle persistente tão limpo quanto o app; não simule com duas páginas se puder mostrar os oito números no Painel.

**RN-R03** — Pendências (a receber / a pagar / a investir) visíveis no Painel.

**RN-R04** — Visão anual: totais dos 12 meses do ano civil + tabela (e gráfico se disponível). Mesma regra de fatura no efetivado.

**RN-R05** — Sem desejos.

---

## 5. Fórmulas (implementar de verdade)

### 5.1 Gasto.Efetivado (fórmula na database Gastos)

Pseudocódigo — traduzir para Notion Formula 2.0:

```
se Cartão não vazio:
    se existe Fatura relacionada e Fatura.Paga = true → true
    senão → false
senão:
    Pago
```

Garanta que, ao criar um gasto com Cartão, a relação `Fatura` aponte para a linha Cartão×Mês (crie a Fatura se não existir). Sem isso a fórmula quebra.

### 5.2 Totais no Mês

Use rollups + fórmulas. O ponto crítico é **não** somar `Gastos.Pago` no efetivado; somar `Gastos.Efetivado`.

```
entradas_efet  = sum(Entradas.Valor where Recebido)
gastos_efet    = sum(Gastos.Valor where Efetivado)
inv_efet       = sum(Investimentos.Valor where Investido)
saldo_efet     = entradas_efet − gastos_efet − inv_efet

entradas_plan  = sum(Entradas.Valor)
gastos_plan    = sum(Gastos.Valor)
inv_plan       = sum(Investimentos.Valor)
saldo_plan     = entradas_plan − gastos_plan − inv_plan

a_receber  = max(0, entradas_plan − entradas_efet)
a_pagar    = max(0, gastos_plan − gastos_efet)
a_investir = max(0, inv_plan − inv_efet)
```

### 5.3 Visão anual

Na database Meses, view filtrada pelo Ano, com as colunas de totais. Página “Visão anual” com linked database + (se possível) gráfico de barras Entradas / Gastos / Investimentos / Saldo por mês.

---

## 6. Fluxos de usuário (o bot deve deixar isso usável)

### 6.1 Ritual do mês (página Como usar)

1. Abrir **Painel do mês** no mês corrente (criar o Mês se não existir).
2. Lançar entradas, gastos e aportes ainda **planejados**.
3. Conforme a vida acontece, marcar Recebido / Pago / Investido (ou pagar a fatura).
4. Olhar os quatro números efetivados vs planejados e as pendências.
5. No fim do mês (ou quando quiser), abrir Visão anual.

Copy da instrução: o valor do modelo é o **hábito de registrar e confrontar intenção vs realidade**, não automação.

### 6.2 Registrar entrada

1. Painel → Entradas → Nova.
2. Descrição, valor > 0, tag, data. Mês preenchido a partir da data.
3. Opcional: “Repetir no ano” → criar os outros 11 meses do mesmo ano, todos `Recebido = false`, mesma Série.
4. Item nasce não recebido.
5. Quando o dinheiro cair: marcar Recebido.

### 6.3 Registrar gasto não-cartão

1. Painel → Gastos → Nova.
2. Tipo, categoria, descrição, valor, forma (`Dinheiro` / `Pix` / `Débito` / `Boleto`), data.
3. Se Fixo + Repetir no ano: clonar 11 meses, todos `Pago = false`.
4. Se Parcelado: gerar a série de parcelas (pode cruzar o ano).
5. Marcar Pago quando sair o dinheiro.

### 6.4 Gastar no cartão e pagar a fatura

1. Ter o Cartão cadastrado.
2. Lançar gasto com relação Cartão (sem marcar Pago).
3. O valor entra na Fatura daquele cartão×mês na hora.
4. O gasto **não** entra no saldo efetivado.
5. Quando pagar a fatura no banco: abrir Fatura → marcar **Paga** (+ data). Todos os gastos daquele cartão naquele mês passam a `Efetivado = true`.
6. Dá para desmarcar Paga.

### 6.5 Aportar

1. Painel → Investimentos → Nova.
2. Descrição, valor, tag (Banco/Corretora), data. Nasce não investido.
3. Opcional: repetir no ano civil.
4. Quando aplicar de fato: marcar Investido. O saldo do mês cai nesse valor.

### 6.6 Primeiro uso

1. Conferir tags/categorias (já seedadas).
2. Cadastrar os cartões que a pessoa usa (se usar crédito).
3. Garantir que o mês atual existe em Meses.
4. Lançar o que já está planejado para o mês.

---

## 7. Páginas de interface (criar views concretas)

### 7.1 Painel do mês (página principal)

Layout sugerido, de cima para baixo:

1. **Callout** com o mês corrente e link para mudar de mês (linked view de Meses).
2. **Resumo** — linked view da linha do Mês mostrando:
   - Efetivado: Entradas | Gastos | Investimentos | Saldo
   - Planejado: Entradas | Gastos | Investimentos | Saldo
   - Pendências: A receber | A pagar | A investir
3. **Cartões** — linked view de Faturas filtrada pelo mês (nome, total, Paga, % limite).
4. Três linked databases filtradas pelo mês atual:
   - Entradas (botão “Nova entrada”)
   - Gastos (botão “Novo gasto”) — agrupar por Tipo
   - Investimentos (botão “Novo aporte”)

Botões de template Notion (“New” com template) devem:

- Relacionar ao Mês da página (se usar synced filter) **ou**
- Instruir: “sempre escolha o Mês; a Data deve cair nesse mês”

Se o Notion permitir **buttons** com automação: “Marcar recebido”, “Pagar fatura”, “Gerar parcelas”, “Repetir no ano”. Se não permitir com a API disponível, documente o procedimento manual na página Como usar.

### 7.2 Visão anual

- Linked database Meses do ano, 12 linhas
- Colunas: os totais efetivados e o saldo
- Gráfico se disponível
- Filtro de ano

### 7.3 Como usar

Página com:

- Conceito planejado vs efetivado
- Fórmula do saldo (e o aviso: **não é saldo bancário**)
- Investimentos = hábito de aportar, não a corretora
- Cartão: lista ≠ caixa efetivado
- Como repetir no ano e como parcelar
- O que esta versão **não** tem (carteiras, 50/30/20, desejos, resgate)
- Checklist do ritual mensal

---

## 8. Templates de página (dentro de cada database)

Criar templates:

**Entrada**

- Recebido desmarcado; Repetir no ano desmarcado

**Gasto variável**

- Tipo = Variável; Pago desmarcado

**Gasto fixo (recorrente)**

- Tipo = Fixo; Repetir no ano marcado; Pago desmarcado
- (se não puder auto-clonar 11 meses, callout no template: “depois de salvar, duplique para os outros meses do ano e ligue na mesma Série”)

**Gasto parcelado**

- Tipo = Parcelado; Parcela atual = 1; Pago desmarcado
- callout: “preencha Total de parcelas e crie as linhas seguintes, uma por mês, mesma Série”

**Aporte**

- Investido desmarcado

**Fatura do mês**

- Paga desmarcada

---

## 9. Limitações do Notion — seja honesto na página Como usar

O bot **deve** criar uma seção “O que o Notion não replica do app”:

| No app Finto | Neste modelo Notion |
| --- | --- |
| Dialog de carteira na efetivação | Só checkbox |
| Aporte origem → destino (liquidez vs posição) | Só “Investido” + tag |
| Resgate gera entrada automática | Inexistente |
| Transferência entre carteiras | Inexistente |
| Toggle efetivado/planejado persistente | Duas colunas sempre visíveis |
| Impedir excluir tag em uso | Só instrução |
| Clonar 11 meses com um clique | Botão/automação se possível; senão procedimento manual |
| Parcelas com rollback se um insert falhar | Manual |
| Isolamento RLS por usuário | Workspace pessoal |
| Soma de itens selecionados (barra inferior) | Inexistente |
| Tema claro/escuro do app | Tema do Notion |

Não tente “emular carteira” com uma property escondida. Fora de escopo.

---

## 10. Ordem de implementação (siga nesta sequência)

1. Página-mãe `Finto — Finanças pessoais`
2. Databases mestras: Tags de entrada, Categorias de gasto, Tags de investimento, Cartões
3. Database Meses + seed dos 12 meses de 2026
4. Database Faturas (relação Cartão + Mês)
5. Database Entradas + templates + views
6. Database Gastos + fórmula `Efetivado` + templates + views
7. Database Investimentos + templates + views
8. Rollups e fórmulas em Meses (resumo)
9. Página Painel do mês
10. Página Visão anual
11. Página Como usar (fluxos + limitações + ritual)
12. Conferir com o checklist §11 e corrigir relações/fórmulas quebradas

---

## 11. Checklist de aceite (validar antes de terminar)

Marque cada item criando dados de exemplo no mês corrente e apagando-os no fim **ou** deixando um mês `2026-01` como “sandbox” claramente nomeado `SANDBOX — pode apagar`.

- [ ] Existem as 9 databases da §2
- [ ] Tags/categorias seedadas conforme listas (sem “Resgate de investimentos”)
- [ ] Criar entrada sem Recebido: **não** entra em Saldo efetivado; entra em Saldo planejado e em A receber
- [ ] Marcar Recebido: entra no efetivado; A receber diminui
- [ ] Valor da entrada visível no Painel
- [ ] Gasto Pix: Pago desmarcado não entra no efetivado; marcado entra
- [ ] Gasto no cartão: aparece na Fatura; **não** entra no efetivado até Fatura.Paga
- [ ] Marcar Fatura Paga: gastos daquele cartão entram no efetivado de uma vez
- [ ] Desmarcar Fatura: saem do efetivado
- [ ] Aporte não investido: não desconta o saldo efetivado; desconta o planejado
- [ ] Marcar Investido: saldo efetivado cai o valor
- [ ] Fórmula: `saldo = entradas − gastos − investimentos` nas duas leituras
- [ ] Pendências batem com a conta max(0, planejado − efetivado)
- [ ] Saldo do mês **não** é apresentado como “saldo da conta”
- [ ] Não existem databases/views de carteira, 50/30/20 ou desejos
- [ ] Painel filtra pelo mês; mudar de mês muda as três listas
- [ ] Visão anual lista 12 meses
- [ ] Página Como usar descreve os 4 fluxos (§6.2–6.5) e as limitações (§9)

---

## 12. Dados de exemplo (criar e deixar no SANDBOX, não no mês atual)

No mês `SANDBOX` (use janeiro de um ano qualquer, nome da linha de Meses = `SANDBOX — pode apagar`):

1. Entrada `Salário` R$ 5.000, não recebida
2. Entrada `Freelance` R$ 800, recebida
3. Gasto fixo `Aluguel` categoria Moradia, Pix, R$ 1.500, não pago
4. Gasto variável `Mercado`, Pix, R$ 200, pago
5. Cartão `Nubank` (cor violet); gasto `Farmácia` R$ 120 nesse cartão; fatura **não** paga
6. Aporte `Tesouro` tag Corretora R$ 500, não investido

Conferência esperada no SANDBOX:

| Métrica | Efetivado | Planejado |
| --- | --- | --- |
| Entradas | 800 | 5.800 |
| Gastos | 200 (farmácia fora) | 1.820 |
| Investimentos | 0 | 500 |
| Saldo | 600 | 3.480 |
| A receber | 5.000 | — |
| A pagar | 1.620 | — |
| A investir | 500 | — |

Depois de marcar a fatura Paga, gastos efetivados viram 320 e a pagar vira 1.500.

---

## 13. Tom e nomenclatura (obrigatório)

Usar os termos oficiais do Finto, em português:

- Entradas, Gastos, Investimentos (aportes)
- Planejado, Efetivado
- Saldo do mês (fluxo), nunca “saldo bancário”
- Fatura, Fatura paga
- Repetição no ano civil, Parcela
- Tag (entradas/investimentos), Categoria (gastos)

Não chamar o modelo de “organizador financeiro” no título da home. Título: **Finto — Finanças pessoais**. Subtítulo ok: “Clareza mês a mês: planejar, registrar, efetivar.”

---

## 14. Quando terminar

Responda ao usuário com:

1. Link da página-mãe
2. O que foi criado (databases e views)
3. O que o Notion não cobriu
4. Como usar o Painel no primeiro dia
5. Resultado do checklist §11 (passou / falhou o quê)

Não crie páginas extras de “especificação”. O workspace **é** a implementação.
