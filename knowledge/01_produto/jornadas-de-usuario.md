---
type: produto
titulo: Jornadas de usuário
ultima_atualizacao: 2026-09-03
---

# Jornadas de usuário

Fluxos que existem no frontend hoje. Telas reais: rotas `/auth` e `/` (`App.tsx`). Termos: [`glossario.md`](./glossario.md). Personas: [`personas-e-usuarios.md`](./personas-e-usuarios.md).

**Nota de UI:** a apresentação antiga cita um botão flutuante (+) global. No código, cada aba tem o próprio **adicionar** (`SectionAddItemButton`). Documentamos o app, não o diagrama desatualizado.

---

## Mapa da interface autenticada

Rota `/` (`Index.tsx`), protegida por `ProtectedRoute` (sem sessão → `/auth`).

Cabeçalho: marca, `MonthNavigator` (mês anterior/próximo; “Ir para mês atual”), toggle **Mensal** / **Anual**, tema claro/escuro, sair.

| Visão | Conteúdo principal |
| --- | --- |
| **Mensal** (`view = dashboard`) | `MonthSummarySection` → `AccountStrip` → `MonthRecordsSection` |
| **Anual** (`view = statistics`) | `Statistics` — totais e gráfico do ano |

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
2. (Opcional) Abre a regra no resumo e mapeia categorias (essencial vs. estilo de vida).
3. (Opcional) Cadastra carteiras em `AccountStrip` — pelo menos uma de **movimentação** e uma de **investimentos** se for aportar.
4. (Opcional) Cadastra cartões na aba Gastos.
5. Reserva minutos para lançar entradas, gastos e investimentos (ainda **planejados**).
6. Efetiva o que já aconteceu (jornadas 3–5).
7. Confere o resumo e a regra; se quiser, troca o toggle para **Planejados**.
8. Olha a visão **Anual** quando tiver alguns meses.

---

## 3. Registrar e efetivar entrada ou gasto (não-cartão)

**Persona:** Rafael (várias entradas) / Marina (gastos do mês).

1. Aba Entradas ou Gastos.
2. Adiciona o lançamento (`IncomeSection` / `ExpenseSection`): valor, descrição, tag ou categoria, data. Gasto: tipo fixo / variável / parcelado; forma de pagamento.
3. Item nasce **não efetivado**.
4. Marca recebido ou pago → `EffectuateWalletDialog`: carteira de **movimentação** ou **Saldo Livre**.
5. Resumo, chips de carteira e (no gasto) regra atualizam no efetivado.

Recorrência: repetir no **ano civil**; editar/excluir só este mês ou os seguintes. Parcelas podem atravessar o ano.

---

## 4. Gastar no cartão e pagar a fatura

**Persona:** Marina / usuário de cartão.

1. Aba Gastos; faixa `CreditCardStrip`.
2. Lança gasto com aquele cartão. **Não** há checkbox “pago” no item — o status vem da fatura.
3. O gasto aparece na lista, mas **não** entra no caixa efetivado enquanto a fatura estiver aberta.
4. Marca a fatura paga (`PayInvoiceDialog` via strip): escolhe a carteira de movimentação que pagou o **total**.
5. Todos os gastos daquele cartão naquele mês passam a efetivados; a carteira reflete o débito único da fatura.
6. Dá para desmarcar a fatura (`unpayCardInvoice`).

---

## 5. Aportar (origem → destino)

**Persona:** André.

1. Aba Investimentos (`InvestmentSection`).
2. Lança o aporte do mês (ainda não investido).
3. Marca investido → `EffectuateInvestmentDialog`: **origem** (movimentação ou Saldo Livre) e **destino** (carteira de investimentos), obrigatórios e diferentes.
4. Liquidez cai na origem; posição sobe no destino; o **saldo do mês** desconta o aporte.

Se faltar carteira de um dos papéis, o fluxo oferece criar (`onRequestAddAccount`).

---

## 6. Mover patrimônio: transferência e resgate

**Persona:** André / multi-conta.

1. Menu da carteira em `AccountStrip`.
2. **Transferência** (`TransferDialog`): entre movimentação (ou Saldo Livre). Não mexe no resumo nem na regra.
3. **Resgate** (`WithdrawalDialog`): da carteira de investimentos para movimentação ou Saldo Livre. Gera entrada automática já recebida; entra no resumo e na regra.

Exclusão de operações: Saldo Livre e “operações do mês” na carteira.

---

## 7. Planejar e conquistar um desejo

**Persona:** Camila.

1. Aba Desejos (`WishSection`): descrição, valor estimado, urgência, prazo (“conquistar até”).
2. O desejo **não** altera saldo, regra, estatísticas nem carteiras.
3. Conquistar: só marcar, ou marcar **e** abrir gasto pré-preenchido. No não-cartão, o gasto pode nascer já pago; no cartão, espera a fatura.
4. Prazo vencido: renovar ou remover. Conquistado some da lista ativa.

---

## 8. Revisar o ano

**Persona:** Rafael (média) / André (disciplina de aportes).

1. Cabeçalho → **Anual**.
2. `Statistics`: totais do ano, gráfico mês a mês, mesma lógica efetivado/planejado e regra anual (`AnnualFinancialRuleSection`).
3. Volta a **Mensal** para agir no mês corrente.

---

## 9. Importar gastos via CSV (assistido)

**Persona:** Marina (fatura CSV) / Rafael (extrato com muitos Pix).

1. Aba **Gastos** → **Importar CSV** (`ImportExpensesCsvDialog`).
2. Escolhe origem: **conta** ou **cartão X**.
3. Sobe o arquivo; mapeia colunas Data / Valor / Descrição (preview).
4. Revisa linhas: ação (variável, parcelado, fixo, associar existente, ignorar), mês divergente se precisar, efetivar só em conta (default off).
5. **Importar selecionados** → relatório parcial. Nada grava antes deste passo.

Regras CSV-01…CSV-05: [`../02_regras-de-negocio/regras-por-modulo/gastos.md`](../02_regras-de-negocio/regras-por-modulo/gastos.md). Open Finance continua fora (DEV-96 adiada).

---

## Ritual contínuo (hábito)

Não é uma tela: é a jornada que o produto existe para formar.

Registrar → efetivar (escolher onde o dinheiro está) → olhar resumo e regra → no tempo, olhar o ano → desejos antes da compra.

A importação CSV assistida (jornada 9) **acelera o volume com revisão**; se o uso virar só “conferir extrato sem decidir”, sai da visão do produto ([`visao-do-produto.md`](./visao-do-produto.md)).
