---
type: produto
titulo: Visão do produto
ultima_atualizacao: 2026-10-16
---

# Visão do produto

**Marca:** Finto  
**Repositório:** `tidy-month-tracker`

O **Finto** é um aplicativo de **educação financeira prática**. Ajuda a construir hábitos com o dinheiro: acompanha **mês a mês** entradas, gastos e investimentos, controla **cartões de crédito**, planeja **desejos** de consumo e verifica uma **regra financeira** (50/30/20 ou percentuais personalizados).

Interface em português, tema claro ou escuro, visão **mensal** ou **anual**.

Não é apenas um organizador financeiro. As funcionalidades existem para desenvolver **clareza**, **consciência**, **planejamento** e **disciplina**.

Termos oficiais: [`glossario.md`](./glossario.md). Público: [`personas-e-usuarios.md`](./personas-e-usuarios.md). Fluxos: [`jornadas-de-usuario.md`](./jornadas-de-usuario.md).

---

## Missão

Promover educação financeira básica **pela construção de hábitos**.

Organização financeira não acontece só porque a pessoa **vê os números**. Acontece quando ela desenvolve o hábito de **refletir** sobre decisões — antes de gastar, ao registrar, ao planejar o mês.

O Finto foi desenhado para **participação ativa**. Cada interação é um momento de educação:

| Ação no app | O que estimula |
| --- | --- |
| Registrar uma despesa | Refletir sobre o gasto |
| Registrar um investimento | Pensar nos objetivos de longo prazo |
| Registrar uma receita | Perceber a origem do dinheiro |
| Organizar categorias | Entender para onde o dinheiro vai |
| Marcar o que foi efetivado | Separar planejamento de realidade |
| Planejar um desejo | Decidir com antecedência, não por impulso |

---

## Registro manual é intencional

A ausência de Open Finance e a necessidade de lançar movimentações **à mão** não são lacunas acidentais. Fazem parte da estratégia: alguns minutos do dia ou da semana para registrar são parte do hábito.

O Finto não compete na automação total. Compete na qualidade do **envolvimento** com o próprio dinheiro.

---

## O que o produto oferece (e o que não vende só)

| O Finto oferece | O Finto não vende apenas |
| --- | --- |
| Clareza sobre a situação financeira | Um painel de números |
| Consciência sobre decisões | Um agregador de contas |
| Planejamento com antecedência | Automação sem reflexão |
| Disciplina e hábitos saudáveis | Controle de gastos passivo |
| Evolução contínua mês a mês | Relatórios descartáveis |

Em uma frase: o Finto vende **clareza**, **consciência** e **hábitos saudáveis** — um registro de cada vez.

---

## Conceito central: planejado vs. efetivado

Cada lançamento tem dois momentos:

- **Planejado** — registrado, ainda não aconteceu de fato.
- **Efetivado** — recebido, pago ou investido (no cartão, quando a **fatura** está paga).

O **saldo do mês** usa o efetivado por padrão. Dá para alternar para planejados e comparar intenção com realidade. Planejar é o primeiro passo; efetivar é confrontar o que de fato ocorreu.

---

## O que o produto cobre hoje

- Conta individual (e-mail e senha; sessão persistente; cada pessoa vê só os próprios dados)
- Painel do mês: resumo, regra financeira, registros (entradas, gastos, investimentos, desejos)
- Cartões de crédito com fatura mensal
- Aportes como registro do hábito de investir (sem carteira de origem ou destino)
- Visão anual (média e total juntos, gráfico mês a mês, seletor de ano e exportação do recorte anual)
- Personalização de tags, categorias, nome/cor de cartões, tema claro/escuro

---

## Fora do escopo (hoje)

Deliberado, não “falta técnica”:

- Open Finance / conexão bancária
- Importação **automática** de extrato/fatura (sem revisão humana)
- Exportação de planilhas, CSV ou PDF fora do recorte anual agregado (roadmap P4)
- Assinaturas ou gateway de pagamento
- Múltiplos usuários ou contas compartilhadas
- Push, WhatsApp ou e-mail transacional além da confirmação de cadastro (Supabase Auth)
- Integração com corretoras ou sync automático de faturas
- Administração de usuários, analytics de produto

**Exceções alinhadas à visão:**

- Importação **CSV assistida de gastos** (fase 0) — o arquivo propõe; a pessoa mapeia e confirma. Não é agregador passivo.
- Exportação **anual agregada** (DEV-150) — na visão Anual, PDF ou CSV do ano e do modo que estão na tela. É leitura do que já aparece, sem desejos, sem lançamento linha a linha e sem gravar nada. Não abre extrato, visão Mensal nem Open Finance.

Política: [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md).

Carteiras, Saldo Livre e patrimônio estimado foram **removidos** (DEV-151): o Finto lê o **fluxo do mês**, não posição por conta. Decisão: [`ADR-007`](../07_decisoes-tecnicas/ADR-007-remover-carteiras.md).

---

## Nome e fase

- **Finto** é o nome do produto na UI e na comunicação.
- O repositório e a URL de produção ainda usam `tidy-month-tracker`.
- Produção atual: frontend na Vercel com Supabase direto. Estado e próximos passos: [`roadmap.md`](./roadmap.md).
