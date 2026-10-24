---
type: produto
titulo: Jornadas de usuário
ultima_atualizacao: 2026-10-24
---

# Jornadas de usuário

Fluxos que existem no frontend hoje. Telas reais: rotas `/auth` e `/` (`App.tsx`). Termos: [`glossario.md`](./glossario.md). Personas: [`personas-e-usuarios.md`](./personas-e-usuarios.md).

**Nota de UI:** a apresentação antiga cita um botão flutuante (+) global. No código, cada aba tem o próprio **adicionar** (`SectionAddItemButton`). Documentamos o app, não o diagrama desatualizado.

---

## Mapa da interface autenticada

Rota `/` (`Index.tsx`), protegida por `ProtectedRoute` (sem sessão → `/auth`).

Cabeçalho: marca, seletor do período, toggle **Mensal** / **Anual**, tema claro/escuro, sair. Em Mensal o seletor é o mês (`MonthNavigator`: setas + clique no centro abre grade de meses; “Ir para mês atual” quando aplicável). Em Anual é o ano (`YearNavigator`: setas + clique no centro abre seletor de anos; “Ir para ano atual” fora do ano corrente).

| Visão | Conteúdo principal |
| --- | --- |
| **Mensal** (`view = dashboard`) | `MonthSummarySection` → `MonthRecordsSection` |
| **Anual** (`view = statistics`) | `Statistics` — média e total do ano, gráfico mês a mês, regra e exportação do recorte na mesma janela |

Abas de registros (`RecordsTab`): **Entradas** · **Gastos** · **Investimentos** · **Desejos**. Cartões (`CreditCardStrip`) só na aba Gastos.

Rodapé: dialog **Como lemos seus números** (`FinancialGlossaryDialog`). Barra inferior: soma de itens selecionados (`SelectionBottomBar`) e exclusão em massa dos selecionados — desejos não entram.

---

## 1. Criar conta e entrar

**Persona:** qualquer uma, primeiro uso.

1. Abre `/auth` (`Auth.tsx`).
2. Alterna para cadastro: e-mail + senha (mín. 6, máx. 72) + confirmação.
3. Recebe e-mail de confirmação (Supabase Auth). Sem confirmar, o login pode falhar.
4. Entra; `Auth` redireciona para `/`.
5. Esqueceu a senha: fluxo de recuperação no mesmo `Auth` (link por e-mail).
6. Sair: botão no cabeçalho (`signOut`).

Não há convite, SSO nem perfil compartilhado.

---

## 2. Primeiro mês no painel

**Persona:** Marina (hábito) / aprendiz da regra.

1. Cai no **mês atual**, visão Mensal.
2. Se a conta ainda não tem regra nem lançamento, e o guia não foi encerrado, abre um diálogo opcional por cima do painel (quatro passos: propósito, regra, primeiro lançamento, leitura do resumo). Dá para pular um passo, fechar sem encerrar (o aviso **Continuar introdução** reabre) ou dispensar com **Agora não**. **Concluir** só existe no último passo. Encerrar o guia não é ativação — ativação continua sendo o primeiro lançamento ([`metricas-do-beta.md`](./metricas-do-beta.md)).
3. (Opcional) Abre a regra no resumo e mapeia categorias (essencial vs. estilo de vida). O passo da regra do guia abre esse mesmo wizard.
4. (Opcional) Cadastra cartões na aba Gastos.
5. Reserva minutos para lançar entradas, gastos e investimentos (ainda **planejados**). O passo de lançamento do guia só leva à aba Gastos.
6. Efetiva o que já aconteceu (jornadas 3–5).
7. Confere o resumo e a regra; se quiser, troca o toggle para **Planejados**.
8. Olha a visão **Anual** quando tiver alguns meses. O guia não abre nessa visão.

Conta que já tem regra ou lançamento, com o guia ainda no passo zero, não vê o diálogo.

---

## 3. Registrar e efetivar entrada ou gasto (não-cartão)

**Persona:** Rafael (várias entradas) / Marina (gastos do mês).

1. Aba Entradas ou Gastos.
2. Adiciona o lançamento (`IncomeSection` / `ExpenseSection`): valor, descrição, tag ou categoria, data. Gasto: tipo fixo / variável / parcelado; forma de pagamento.
3. Item nasce **não efetivado**.
4. Marca recebido ou pago com o toggle de status (`StatusToggleBadge`). Sem diálogo, sem carteira.
5. Resumo e (no gasto) regra atualizam no efetivado.

Recorrência: repetir no **ano civil**; editar/excluir só este mês ou os seguintes. Parcelas podem atravessar o ano.

---

## 4. Gastar no cartão e pagar a fatura

**Persona:** Marina / usuário de cartão.

1. Aba Gastos; faixa `CreditCardStrip`.
2. Lança gasto com aquele cartão. **Não** há checkbox “pago” no item — o status vem da fatura.
3. O gasto aparece na lista, mas **não** entra no caixa efetivado enquanto a fatura estiver aberta.
4. Marca a fatura paga (`PayInvoiceDialog` via strip): confirma o **total** da fatura. Não escolhe carteira.
5. O status mensal do cartão (`credit_card_monthly_status`) vira pago e todos os gastos daquele cartão naquele mês passam a efetivados.
6. Dá para desmarcar a fatura (`unpayCardInvoice`).

---

## 5. Aportar

**Persona:** André.

1. Aba Investimentos (`InvestmentSection`).
2. Lança o aporte do mês (ainda não investido): valor, descrição, tag, data.
3. Marca investido com o toggle de status. Sem origem, destino nem diálogo.
4. O **saldo do mês** desconta o aporte.

---

## 6. (Removida) Mover patrimônio: transferência e resgate

Jornada removida na DEV-151 (carteiras, transferência e resgate saíram do produto). O número 6 fica reservado para não quebrar referências cruzadas. Ver [`ADR-007`](../07_decisoes-tecnicas/ADR-007-remover-carteiras.md).

---

## 7. Planejar e conquistar um desejo

**Persona:** Camila.

1. Aba Desejos (`WishSection`): descrição, valor estimado, urgência, prazo (“conquistar até”).
2. O desejo **não** altera saldo, regra nem estatísticas.
3. Conquistar: só marcar, ou marcar **e** abrir gasto pré-preenchido. No não-cartão, o gasto pode nascer já pago; no cartão, espera a fatura.
4. Prazo vencido: renovar ou remover. Conquistado some da lista ativa.

---

## 8. Revisar o ano

**Persona:** Rafael (média) / André (disciplina de aportes).

1. Cabeçalho → **Anual**. O seletor passa a ser o ano e guarda o mês que estava aberto.
2. `Statistics`: cada card mostra a média da janela em destaque e o total dos 12 meses abaixo. Mês vazio sai do divisor. Sem mês na janela, a média mostra ausência. O gráfico de caixa continua mês a mês. Efetivados/Planejados vale para resumo, gráfico, regra, listas e gráficos das seções.
3. A regra anual usa a mesma média nas barras e oferece abas **Valores** | **Gráficos**. Abaixo, Entradas, Gastos, Método de pagamento e Investimentos também têm essas abas (evolução mês a mês com seletores). Desejos ficam só na lista, sem abas nem gráfico. Desejos não entram no caixa.
4. **Exportar CSV** ou **Exportar PDF** baixa o ano e o modo que estão na tela: resumo, série mensal, regra, entradas, gastos, tipo, pagamento e aportes. Desejos e os gráficos por seção ficam só na tela. A visão Mensal não oferece essas ações.
5. Volta a **Mensal** no mesmo mês do ano escolhido. A visão Mensal continua com um valor só.

---

## 9. Importar gastos via CSV (assistido)

**Persona:** Marina (fatura CSV) / Rafael (extrato com muitos Pix).

1. Aba **Gastos** → **Importar CSV** (`ImportExpensesCsvDialog`).
2. Escolhe origem: **conta** ou **cartão X**.
3. Sobe o arquivo; mapeia colunas Data / Valor / Descrição e, se houver, **Parcela** (preview; guess cobre C6 `Parcela`, Nubank `title`).
4. Revisa linhas: ação (variável, parcelado, fixo, associar existente, ignorar), badge `N/total` quando detectado, mês divergente se precisar, efetivar só em conta (default off).
5. **Importar selecionados** → relatório parcial. Nada grava antes deste passo.

Regras CSV-01…CSV-06: [`../02_regras-de-negocio/regras-por-modulo/gastos.md`](../02_regras-de-negocio/regras-por-modulo/gastos.md). Open Finance continua fora (DEV-96 adiada).

---

## Ritual contínuo (hábito)

Não é uma tela: é a jornada que o produto existe para formar.

Registrar → efetivar (marcar o que de fato aconteceu) → olhar resumo e regra → no tempo, olhar o ano → desejos antes da compra.

A importação CSV assistida (jornada 9) **acelera o volume com revisão**; se o uso virar só “conferir extrato sem decidir”, sai da visão do produto ([`visao-do-produto.md`](./visao-do-produto.md)).
