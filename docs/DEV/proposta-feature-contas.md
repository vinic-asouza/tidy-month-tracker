# Proposta de Feature: Contas

> **Status:** 🟡 Discovery / Rascunho — documento vivo, refinar em conjunto.
> **Última atualização:** julho/2026 — Fase 2.1 (Investimentos ↔ Carteiras) implementada
> **Autor:** Feature Solution Architect (assistido por IA)
> **Data:** julho/2026
> **Referências:** [`ANALISE_FRONTEND_QA.md`](../ANALISE_FRONTEND_QA.md), [`software-engineer.mdc`](./software-engineer.mdc), [`PLANO_FRONTEND_DIRETO_SUPABASE.md`](../PLANO_FRONTEND_DIRETO_SUPABASE.md)

Este documento **não é** um plano de implementação fechado. Ele existe para **refinar a ideia**, questionar premissas, mapear impactos e alinhar decisões antes de escrever qualquer código. As seções marcadas com ❓ são **decisões abertas** que precisamos resolver juntos.

## Decisões alinhadas (todas fechadas ✅)

| # | Decisão | Escolha |
|---|---------|---------|
| 1 | Nível de ambição | ✅ **Nível 1** (conta como organização/rótulo; sem ledger) |
| — | Dor principal | ✅ **Organizar movimentos** ("esse gasto saiu da conta X") — não é saldo real absoluto |
| 2 | Módulos vinculados no MVP | ✅ **Gastos + Investimentos + Entradas** (cartão fica para depois) |
| 3 | Débito vs. conta | ✅ **Conta como forma de pagamento** (ex.: `Débito: Nubank`), no padrão dos cartões — ver reconciliação abaixo |
| 4 | Posicionamento na UI | ✅ **Strip/faixa global**, no padrão dos cartões de crédito |
| 5 | Nome da feature | ✅ **"Carteiras"** (UI). Domínio/código em inglês: `Account` (ver nota de naming) |
| 6 | Exclusão de conta com movimentos | ✅ **`SET NULL`** — permite excluir e apenas desvincula |
| 7 | Investimento no saldo da carteira | ✅ **Fase 2.1:** aporte **soma** na carteira vinculada (quando `invested`); não subtrai do saldo estimado |
| 8 | Investimento ↔ Carteira no formulário | ✅ **Fase 2.1:** substituir "Instituição" (`tag`) por **Carteira obrigatória** (`account_id`) |
| — | Tipos de conta no MVP | ✅ Conta Corrente, Poupança, Corretora/Investimentos, **Dinheiro** (ex-"Carteira") |

> **Consequência da dor = organização:** o chip da carteira exibe **saldo estimado** (declarado + variação efetiva do mês). Entradas e gastos seguem a lógica líquida habitual; **aportes de investimento somam** na carteira vinculada — ver seções 8 e 13.

> **⚠️ Reconciliação da Decisão 3 (conta como forma de pagamento):** para **gastos**, a conta é escolhida via seletor dedicado "Carteira" (`account_id`). Para **entradas**, o seletor é **opcional**. Para **investimentos**, o seletor **substitui** o campo "Instituição" e é **obrigatório** — ver Decisão 8 e seção 13.

> **⚠️ Nota de naming:** a feature se chama **"Carteiras"** na UI, mas um dos tipos era "Carteira (dinheiro físico)". Para evitar colisão, esse tipo passa a se chamar **"Dinheiro"**. No código, mantemos o domínio em inglês (`Account`, `accounts`) por consistência com `Income`, `Expense`, `CreditCard`, `Investment` — apenas os **rótulos** exibidos ficam em PT-BR ("Carteiras").

---

## 1. Problema

Hoje o Tidy Month Tracker registra **movimentos** (entradas, gastos, investimentos, desejos) sempre **escopados por mês** (`year_month`). O usuário não tem uma resposta para perguntas como:

- "Quanto eu **tenho** na poupança / conta corrente / corretora agora?"
- "Esse gasto no débito saiu de **qual** conta?"
- "Meu investimento está em **qual** instituição/conta e quanto já acumulei ali?"
- "Os rendimentos dessa conta entraram como receita?"

O que existe de mais próximo hoje:

| Conceito atual | Papel | Limitação |
|----------------|-------|-----------|
| `paymentMethods` (Dinheiro, Pix, Débito, Boleto) | Rótulo de "como pagou" | Genérico; "Débito" não diz de qual conta saiu |
| `credit_cards` | Entidade global do usuário | É **crédito** (fatura mensal), não uma conta com saldo |
| `investment_tags` (Banco A, Corretora...) | Rótulo da instituição do aporte | Será **substituído por Carteira** no formulário de investimento (Fase 2.1); tags permanecem em settings para compatibilidade até migração completa |

**Resumo do problema:** falta uma entidade que represente **onde o dinheiro está** (conta corrente, poupança, corretora, carteira) e que permita vincular movimentos a ela.

---

## 2. Objetivo (a validar)

Dar ao usuário visibilidade e organização sobre **onde** seu dinheiro está e por **quais** contas seus movimentos passam, mantendo a simplicidade e a natureza mensal do app.

❓ **Decisão fundamental (ver seção 4):** o objetivo é apenas **organizar/rotular** movimentos por conta, ou também **controlar saldo real acumulado** por conta? A resposta muda drasticamente a complexidade.

---

## 3. Perguntas de Descoberta (Etapa 1)

Preciso das suas respostas para calibrar o escopo. Minhas hipóteses/recomendações estão marcadas com 💡.

1. **Qual a dor principal hoje?** Você sente mais falta de:
   - (a) saber o saldo real de cada conta a qualquer momento, ou
   - (b) apenas organizar os movimentos ("esse gasto foi da conta X")?
   - 💡 Suspeito que o valor real esteja em (a) para poupança/investimento e (b) para débito.

2. **Você quer que o saldo da conta seja calculado automaticamente** a partir dos movimentos do app, ou **informado/ajustado manualmente** por você (ex.: "hoje tenho R$ 5.000 na poupança")?
   - 💡 Recomendo começar com **saldo informado manualmente** (snapshot), evitando a complexidade de um livro-razão (ledger). Ver seção 4.

3. **Quais tipos de conta importam?** Ex.: Conta Corrente, Poupança, Corretora/Investimentos, Carteira (dinheiro físico), Cripto, Reserva de emergência.
   - 💡 Sugiro um conjunto enxуто e um campo "tipo" extensível.

4. **Frequência de uso:** você atualizaria/consultaria contas diariamente, no fechamento do mês, ou eventualmente?
   - 💡 Isso define se contas merecem destaque no dashboard ou uma área/aba própria.

5. **Rendimentos:** hoje você já lança rendimento como uma "Entrada" manual? Quer automatizar isso a partir da conta?
   - 💡 Cuidado com dupla contagem (ver seção 8 — regras de negócio).

6. **Multiusuário/compartilhamento:** contas são sempre individuais (RLS por `user_id`), certo? 💡 Assumo que sim.

---

## 4. Refinamento — A decisão que define tudo (Etapa 2)

Existe uma **tensão arquitetural central** que precisa ser resolvida antes de qualquer coisa:

> O app é **fotográfico por mês** (cada tabela tem `year_month`, sem estado acumulado). "Conta com saldo" é **cumulativa no tempo** (saldo = tudo que entrou − tudo que saiu, desde sempre). São modelos mentais diferentes.

Há três níveis possíveis de ambição. Recomendo fortemente começar pelo **Nível 1** (KISS/YAGNI) e evoluir sob demanda.

### Nível 1 — Conta como rótulo/organização ✅ (ESCOLHIDO)

- Conta é uma **entidade leve global do usuário** (nome, tipo, cor/ícone), no mesmo espírito de `credit_cards`.
- Movimentos passam a **poder** referenciar uma conta (`account_id` opcional em `incomes`, `expenses`, `investments`).
- Como a dor é **organização**, o MVP mostra, no máximo, um **total movimentado no mês por conta** (informativo), sem prometer "saldo real". Métrica derivada, sem persistir saldo.
- **Não** há saldo global acumulado nem transferências.
- **Prós:** encaixa 100% no modelo atual e no padrão adapter; baixo risco; entrega valor de organização já.
- **Contras:** não responde "quanto tenho hoje na poupança" de forma absoluta (aceitável — não é a dor atual).

### Nível 2 — Conta com saldo informado (snapshot mensal)

- Além do Nível 1, o usuário informa um **saldo inicial** e/ou um **saldo declarado por mês** (ex.: `account_balances(account_id, year_month, balance)`).
- App mostra "saldo declarado" e "variação do mês" (movimentos vinculados), sem exigir que batam.
- **Prós:** responde "quanto tenho" sem precisar de ledger completo e reconciliação; ainda simples.
- **Contras:** exige disciplina do usuário para atualizar; dois números (declarado vs. calculado) podem confundir.

### Nível 3 — Livro-razão completo (ledger) ❌ (não recomendado agora)

- Cada movimento vira lançamento contábil; saldo = soma histórica; transferências entre contas; reconciliação.
- **Prós:** precisão contábil real.
- **Contras:** contradiz o modelo mensal atual; alto custo; operações não atômicas já são um risco conhecido (ver `ANALISE_FRONTEND_QA.md` → Pontos de Atenção). **YAGNI** para o momento.

❓ **Decisão 1 — Nível de ambição:** Nível 1, 2 ou 3? (Recomendo **1** como primeira entrega, com o schema já pensado para permitir o 2 depois.)

---

## 5. Vínculos com outros módulos (Etapa 2)

Sua ideia cita vincular contas a débitos, investimentos e rendimentos. Análise crítica de cada um:

| Vínculo proposto | Como encaixa | Recomendação |
|------------------|--------------|--------------|
| **Gasto (débito) → conta** | ✅ Cada conta aparece **como forma de pagamento** (`Débito: Nubank`), no padrão dos cartões (`Crédito: X`). | Persistir `account_id` (resolvido da seleção), não o texto. Mantém `paymentMethod` para os métodos genéricos (Pix, Boleto, Dinheiro). |
| **Investimento → conta** | Hoje instituição é a `tag` (texto). | 🔄 **Fase 2.1:** `account_id` **obrigatório**; campo "Instituição" vira "Carteira" no formulário. Aporte **soma** no saldo da carteira (não subtrai). `tag` deixa de ser input do usuário (pode derivar do nome da carteira ou ser fixada internamente). |
| **Rendimento → entrada** | Já existe tag "Rendimentos"/"Resgate de investimentos" em entradas. | 💡 Manter como Entrada normal, mas permitir vinculá-la à conta de origem. **Não** automatizar cálculo de rendimento (evita dupla contagem). |
| **Entrada (salário etc.) → conta** | Salário cai em uma conta corrente. Natural adicionar `account_id` à entrada. | 💡 Incluir no mesmo padrão dos demais. |
| **Cartão de crédito → conta de pagamento da fatura** | A fatura é paga por uma conta. Poderia vincular `credit_card → account`. | ⚠️ Deixar para depois (YAGNI). Só se houver demanda clara. |

**Princípio:** `account_id` é **opcional** em entradas e gastos. Em **investimentos**, `account_id` passa a ser **obrigatório** (Fase 2.1). Nenhum fluxo existente de entrada/gasto quebra se o usuário não usar carteiras.

✅ **Decisão 2 (fechada):** vínculos no MVP = **Gastos + Investimentos + Entradas**. Cartão para depois.

🔄 **Decisão 8 (refinada — Fase 2.1):** investimentos usam **Carteira obrigatória** no lugar de "Instituição"; vínculo sempre por `account_id`.

✅ **Decisão 3 (fechada):** seletor de conta dedicado nos três módulos. Gastos e entradas mantêm carteira opcional; investimentos exigem carteira.

---

## 6. Onde a feature vive na UI (Etapa 2/3)

Opções de posicionamento:

| Opção | Descrição | Prós | Contras |
|-------|-----------|------|---------|
| **A. Nova aba "Contas"** em `MonthRecordsSection` | Ao lado de Entradas/Gastos/Investimentos/Desejos | Consistente com o padrão atual; fácil descoberta | Aba é mensal por natureza; contas são globais |
| **B. Faixa/strip global** (como `CreditCardStrip`) no topo do dashboard | Chips de contas com saldo do mês | Reaproveita padrão de cartões; visão rápida | Espaço no topo é concorrido |
| **C. Área/rota de "Configurações & Contas"** | Página dedicada | Bom para gestão (CRUD) + visão global | App só tem 1 rota principal hoje; adicionaria complexidade de navegação |

✅ **Decisão 4 (fechada):** **B — strip global de "Carteiras"**, com gestão via dialog, espelhando o padrão testado dos cartões de crédito. Uma aba mensal (A) pode vir depois se quisermos listar movimentos por conta.

✅ **Decisão 5 (fechada):** nome na UI = **"Carteiras"**. No código: `Account`/`accounts` (ver nota de naming no topo).

---

## 7. Impacto Arquitetural (Etapa 3)

O padrão do projeto é bem definido; a feature deve segui-lo à risca (referência: módulo **Cartões de Crédito** e **Lista de Desejos**, os mais recentes).

### 7.1 Banco de Dados

**Nova tabela `accounts`** (espelhando `credit_cards` + `wish_items`):

```sql
-- Rascunho (Nível 1). Revisar antes de aplicar.
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'checking'
    -- checking=Conta Corrente, savings=Poupança, investment=Corretora/Investimentos, cash=Dinheiro
    -- 'other' mantido apenas como fallback seguro/extensível (não exibido no MVP)
    CHECK (type IN ('checking','savings','investment','cash','other')),
  color TEXT,                          -- reaproveitar CARD_COLORS
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- + índice em (user_id) e RLS auth.uid() = user_id (4 policies)
```

**Vínculos opcionais** (uma migração por tabela, todas reversíveis):

```sql
ALTER TABLE public.incomes     ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.expenses    ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.investments ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
-- Índices parciais em account_id para os JOINs/somatórios
```

- ✅ **Decisão 6 (fechada):** `ON DELETE SET NULL` — excluir conta **não** apaga movimentos, apenas os desvincula. Menos fricção que bloquear (diferente dos cartões). A UI deve avisar quantos movimentos serão desvinculados antes de confirmar.
- (Nível 2, futuro) tabela `account_balances(account_id, year_month, balance)`.

### 7.2 Camada de Serviços (padrão adapter)

Seguir exatamente o padrão de `wishItems`/`creditCards`:

- `src/services/accounts.ts` — facade
- `src/services/adapters/supabase/accounts.ts`
- `src/services/adapters/api/accounts.ts` (mesmo que o backend Express ainda não exista, manter simetria)
- `src/services/adapters/select.ts` — registrar seletor
- `src/services/adapters/mappers.ts` — `snake_case ↔ camelCase`

### 7.3 Domínio e Tipos

- `src/types/domain.ts`: `Account`, `AccountType`, `CreateAccountInput`, `UpdateAccountInput`.
- `src/types/finance.ts`: `DEFAULT_ACCOUNT_TYPES` (checking, savings, investment, cash), reaproveitar `CARD_COLORS`.
- `Income`/`Expense`: campo opcional `accountId?`.
- `Investment`: campo **obrigatório** `accountId` (Fase 2.1). `tag` deixa de ser escolhida pelo usuário no formulário.
- Regenerar `src/integrations/supabase/types.ts` após migração.

### 7.4 Hook / Estado

- `useSupabaseFinance`: carregar `accounts` no `loadInitialData` (como `creditCards`), expor `addAccount/updateAccount/deleteAccount` e um seletor de saldo do mês por conta.
- Alternativa: hook próprio `useAccounts` (como `useWishItems`). 💡 Como contas são globais e poucas, seguir o padrão de `creditCards` dentro de `useSupabaseFinance` é mais coerente.

### 7.5 Componentes (Frontend)

- `AccountStrip` / `AccountChip` (espelho de `CreditCardStrip`), com dialog de CRUD ("Carteiras"). Tipos com ícone/label; cor de `CARD_COLORS`.
- **Gastos / Entradas:** select de carteira **opcional**.
- **Investimentos (Fase 2.1):** select **"Carteira" obrigatório** no lugar do campo "Instituição". Sem carteiras cadastradas, o formulário de investimento exibe empty state orientando a criar uma carteira (tipo Corretora/Investimentos recomendado).
- Empty state, loading, error state, feedback (toasts), acessibilidade e responsividade — conforme checklist do `software-engineer.mdc`.

### 7.6 Produto / Métricas

- **Resumo mensal:** contas **não** alteram saldo (é a mesma soma; conta é só rótulo). ⚠️ Garantir que vincular conta não cause dupla contagem.
- **Estatísticas anuais:** opcional — filtro/visão por conta (fase 2).
- **Regra financeira:** **sem impacto** (continua sobre categorias). Confirmar.

---

## 8. Regras de Negócio (rascunho)

- Conta tem **nome obrigatório** e **único** por usuário (case-insensitive), como cartões.
- `account_id` é **opcional** em entradas e gastos; **obrigatório** em investimentos (Fase 2.1).
- Movimentos contam no saldo da carteira **somente quando efetivados** (`received` / `paid` ou fatura paga / `invested`), alinhado ao resumo mensal.
- **Saldo estimado no chip** = saldo declarado + variação líquida efetiva do mês.
- **Variação líquida efetiva por carteira:**
  - `+` entradas recebidas vinculadas
  - `−` gastos pagos vinculados
  - `+` aportes investidos vinculados (**soma**, não subtrai — o dinheiro entra na carteira de investimento)
- Fórmula: `saldoEstimado = saldoDeclarado + entrouEfetivo − saiuEfetivo + aportadoEfetivo`
- Breakdown no chip mantém as três linhas informativas: Entrou / Saiu / Aportado (todos efetivados).
- **Rendimento:** continua sendo **Entrada** manual. Não haverá cálculo automático de rendimento no MVP (evita imprecisão e dupla contagem). Precisão > automação.
- Excluir conta: ver Decisão 6.
- Renomear conta: propaga apenas o nome (o vínculo é por `id`, então nada a propagar em movimentos — vantagem sobre o modelo de tags por texto).
- Itens recorrentes: cada mês é linha independente com status próprio; `account_id` deve propagar nas cópias ao ativar repeat.

---

## 9. Alternativas Consideradas

1. **Reutilizar `paymentMethods` como contas** — insuficiente: é texto solto, sem tipo/cor/saldo e sem vínculo por id.
2. **Reutilizar `investment_tags`/`credit_cards`** — cartão é crédito (fatura), não conta; tag é rótulo textual. Não atendem.
3. **Ledger completo (Nível 3)** — poderoso, mas contradiz o modelo mensal e viola KISS/YAGNI agora.
4. **Nova entidade leve `accounts` + `account_id` opcional (escolhida)** — encaixa no padrão adapter, baixo risco, evolutiva para Nível 2.

---

## 10. Riscos

| Risco | Mitigação |
|-------|-----------|
| **Dupla contagem** ao somar movimentos por conta vs. totais gerais | Conta é rótulo; nunca criar movimento novo ao vincular |
| **Confusão saldo declarado vs. calculado** | Rótulos claros ("saldo estimado"); saldo declarado é snapshot manual |
| **Confusão investimento subtrai vs. soma** | Decisão 7 refinada: aporte **soma** na carteira vinculada; fórmula explícita na seção 8 |
| **Escopo escorregar para ledger/transferências** | Congelar no Nível 1; transferências só com demanda explícita |
| **Operações não atômicas** (risco já existente no app) | MVP não faz operações compostas em contas (CRUD simples) |
| **Migração** adicionando colunas em tabelas grandes | Colunas nullable + índice; migração reversível; sem backfill |
| **Poluição da UI** dos formulários | Carteira opcional em entrada/gasto; obrigatória só em investimento (Fase 2.1) |

---

## 11. Plano de Implementação Faseado (proposta)

**Fase 0 — Alinhamento (este documento).** Resolver Decisões 1–7.

**Fase 1 — MVP "Contas como organização" (Nível 1):**
1. Migração `accounts` + RLS + índices.
2. Migrações `account_id` opcional em `incomes`/`expenses`/`investments`.
3. Tipos de domínio + mappers + adapters (supabase/api) + facade + `select`.
4. CRUD de contas no `useSupabaseFinance` + `AccountStrip`/dialog.
5. Select de conta (opcional) nos formulários dos 3 módulos.
6. Saldo do mês por conta (métrica derivada) no chip.
7. Testes unitários da lógica pura (padrão `wishItems.test.ts`) + checklist pós-implementação (build, lint, tipos).
8. Atualizar `ANALISE_FRONTEND_QA.md` com o novo módulo.

**Fase 2.1 (✅ implementada — ver seção 13):** acoplamento Investimentos ↔ Carteiras (carteira obrigatória; aporte soma no saldo).

**Fase 2 (sob demanda):** ~~saldo declarado~~ ✅ implementado; visão anual por conta, vínculo cartão→conta de pagamento.

---

## 12. Decisões (todas fechadas ✅)

| # | Decisão | Escolha final |
|---|---------|--------------|
| 1 | Nível de ambição | Nível 1 (schema pronto para evoluir ao Nível 2) |
| 2 | Módulos vinculados no MVP | Gastos + Investimentos + Entradas |
| 3 | Débito vs. conta | Conta como forma de pagamento; persiste `account_id` |
| 4 | Posicionamento na UI | Strip global ("Carteiras"), padrão dos cartões |
| 5 | Nome da feature | "Carteiras" (UI) / `Account` (código) |
| 6 | Exclusão de conta com movimentos | `SET NULL` (desvincula, não bloqueia) |
| 7 | Investimento no saldo da carteira | Aporte **soma** na carteira (quando `invested`); não subtrai |
| 8 | Investimento ↔ Carteira | "Instituição" substituída por Carteira **obrigatória** |

---

### Status: ✅ Fase 1 Implementada (Jul/2026)

A Fase 1 foi implementada integralmente. Detalhes da implementação em `docs/ANALISE_FRONTEND_QA.md` (seção "Módulo: Carteiras — Fase 1").

**Nota de design confirmada:** O seletor "Carteira" nos três formulários (entrada, gasto, investimento) usa `account_id` direto — independente da forma de pagamento. Substitui a ideia anterior de embutir a carteira no dropdown de pagamento (`Débito: Nome`).

---

### Status: ✅ Fase 2 Implementada (Jul/2026)

A Fase 2 (Nível 2: saldo declarado) foi implementada integralmente. Detalhes em `docs/ANALISE_FRONTEND_QA.md` (seção "Módulo: Carteiras — Fase 2").

**Resumo do que foi entregue:**
- Nova tabela `public.account_balances` (snapshot mensal por carteira, ON DELETE CASCADE, RLS, índice)
- Novos tipos: `AccountBalance`, `UpsertAccountBalanceInput` em `types/domain.ts`
- Camada de serviço completa: facade `accountBalances.ts`, adapters supabase/api, registrado em `select.ts`
- Lógica pura: `getAccountDeclaredBalance`, `getAccountLastKnownBalance`, `getAccountNetVariation` + testes unitários
- Hook: estado `accountBalances`, `fetchAccountBalances` (carregado no init), `upsertAccountBalance` com optimistic update
- UI: campo "Saldo inicial" no dialog de criação, opção "Declarar saldo" no menu do chip, saldo estimado no chip (efetivados + declarado)

**Gap conhecido (corrigir na Fase 2.1):** ~~Formulário de investimento ainda usa "Instituição"~~ ✅ corrigido na Fase 2.1.

**Fora de escopo (backlog):**
- Visão anual por carteira
- Vínculo cartão de crédito → carteira de pagamento
- Rendimento automático de investimentos

---

## 13. Refinamento Fase 2.1 — Investimentos ↔ Carteiras (✅ implementada)

> **Contexto:** após Fase 2 (saldo declarado + efetivados), identificou-se que investimentos e carteiras devem estar **totalmente acoplados** — a instituição do aporte é a própria carteira onde o dinheiro fica.

### Status: ✅ Implementada (Jul/2026)

**Resumo do que foi entregue:**
- `getAccountNetVariation`: fórmula `inflow - outflow + invested` (aporte soma na carteira)
- `InvestmentSection`: campo "Instituição" removido; select **Carteira obrigatório**; `tag` derivada do nome da carteira no submit
- Empty state no dialog quando `accounts.length === 0` + atalho `onRequestAddAccount` → dialog de nova carteira
- Lista/resumo/ordenação por carteira (`getAccountLabel` com fallback `tag` para legados)
- Correção de `handleEditCurrentMonth` / `handleEditAllMonths` para restaurar `accountId`
- Props simplificadas: removidos `tags`, `onAddTag`, `onUpdateTag`, `onDeleteTag` de `InvestmentSection`
- Testes unitários atualizados em `accounts.test.ts`

### 13.1 Mudanças de produto

| Aspecto | Comportamento atual | Comportamento desejado |
|---------|---------------------|------------------------|
| Campo no formulário | "Instituição" (`tag`, texto livre) + Carteira opcional | **Apenas "Carteira"** (`account_id`), **obrigatório** |
| `investment_tags` em settings | Usuário gerencia lista de instituições | Deixa de alimentar o formulário; pode permanecer para dados legados |
| Efeito no saldo da carteira | Aporte **subtrai** na variação líquida (`inflow − outflow − invested`) | Aporte **soma** na carteira vinculada (`+ aportadoEfetivo`) |
| Tipos de carteira | Qualquer tipo pode receber investimento | Recomendar tipo `investment` (Corretora/Investimentos), mas não bloquear outros tipos no MVP |

### 13.2 Fluxo de usuário (investimento)

1. Usuário abre "Novo Investimento".
2. Se não há carteiras: empty state + atalho para criar carteira (idealmente tipo Corretora/Investimentos).
3. Campos: descrição, valor, data, **Carteira** (obrigatório), repetir meses (opcional).
4. Ao marcar como investido (`invested`), o valor **entra** no saldo estimado da carteira escolhida.
5. Chip da carteira reflete: `saldoDeclarado + entrou − saiu + aportado`.

### 13.3 Impacto técnico previsto (quando implementar)

**Lógica (`accounts.ts`):**
- Alterar `getAccountNetVariation`: `inflow - outflow + invested` (sinal do aporte invertido).
- Atualizar testes e `getAccountProjectedBalance`.

**UI (`InvestmentSection.tsx`):**
- Remover select de "Instituição" / gerenciador de tags do formulário.
- Tornar select "Carteira" obrigatório; validar antes do submit.
- Bloquear criação se `accounts.length === 0`.

**Domínio / persistência:**
- `Investment.accountId` obrigatório na criação (validação frontend + adapter).
- `tag` pode ser preenchida automaticamente com o nome da carteira (compatibilidade com listagens/estatísticas que ainda usam `tag`).
- Dados existentes sem `account_id`: exigir edição manual ou script de migração (decidir na implementação).

**Resumo mensal / regra financeira:**
- Investimentos continuam no módulo e nos totais globais de investimento do mês — **sem dupla contagem** no saldo geral.
- O efeito de "somar na carteira" é **escopo da carteira**, não altera o saldo consolidado do mês.

### 13.4 Critérios de aceite

- [x] Formulário de investimento não exibe "Instituição"; exibe "Carteira" obrigatória.
- [x] Não é possível salvar investimento sem carteira.
- [x] Aporte marcado como investido **aumenta** o saldo estimado da carteira vinculada.
- [x] Aporte não investido não altera saldo da carteira.
- [x] Entradas e gastos mantêm carteira opcional; comportamento inalterado.
- [x] Testes unitários cobrem nova fórmula de variação.

---

## 14. Refinamento Fase 2.2 — Saldo cumulativo entre meses (✅ implementada)

> **Contexto:** o saldo declarado em um mês não era propagado para o mês seguinte; ao navegar, o chip voltava ao último snapshot estático, ignorando movimentações intermediárias.

### Status: ✅ Implementada (Jul/2026)

**Semântica:**
- **Saldo inicial** = declaração manual no mês **ou** saldo final do mês anterior (carry-forward calculado)
- **Saldo atual** = saldo inicial + variação efetiva do mês
- Declaração manual = reconciliação no **início** do mês (reset)

**Fórmula cumulativa:**
```
saldoInicial(M) = declarado(M) ?? saldoFinal(M-1)
saldoFinal(M)   = saldoInicial(M) + entrouEfetivo − saiuEfetivo + aportadoEfetivo
```

**Resumo técnico:**
- `getAccountOpeningBalance`, `getAccountClosingBalance`, `getMonthsInRange`, `getAccountHistoryFetchRange` em `accounts.ts`
- `fetchMonthsRange` em `financeQueries.ts` + query `accountHistory` em `useSupabaseFinance`
- Chip exibe saldo atual (destaque) + "Início: R$ …" com indicador "declarado" ou "↳ mês anterior"
- Dialog "Declarar saldo" esclarece que o valor é no início do mês; **alerta contextual** quando há movimentações no mês (substitui carry-forward, movimentos continuam valendo, preview do saldo atual)

### 14.1 Critérios de aceite

- [x] Saldo final de julho alimenta saldo inicial de agosto (sem nova declaração)
- [x] Declaração em agosto reseta o saldo inicial (não usa carry-forward)
- [x] Chip mostra saldo inicial e saldo atual separados
- [x] Sem declaração: saldo = soma cumulativa das variações
- [x] Testes unitários cobrem carry-forward
