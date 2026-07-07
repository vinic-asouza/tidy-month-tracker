# Plano de Melhorias Pré-Lançamento — Finto

| Campo | Valor |
|-------|-------|
| **Status** | 🟢 Gate implementado — correções QA validadas ([validação](../VALIDATION/relatorio-validacao-gate-correcoes-qa.md)) |
| **Data** | 2026-07-03 (revalidação pós-correções #1–#2, #4–#5) |
| **Autor** | Feature Solution Architect (seguindo [software-engineer.mdc](./software-engineer.mdc)) |
| **Objetivo** | Fechar lacunas que bloqueiam confiança nos números e alinhar produto ↔ marketing antes da divulgação pública |
| **Referências** | [novas-propostas.md](./novas-propostas.md), [analise-estrategica-produto.md](../MARKETING/analise-estrategica-produto.md), [relatorio-regras-negocio.md](../BUSINESS/relatorio-regras-negocio.md), [purpose.mdc](../MARKETING/purpose.mdc) |

---

## Resumo executivo

O Finto está **aprovado para beta fechado**. As Fases **1**, **2** e **2.5** estão implementadas e os achados **Médio** do QA foram corrigidos (revalidação 2026-07-03). A **divulgação pública ampla** depende de: regressão manual no browser, migration em produção e checklist de marketing.

P3/P4 ficam pós-lançamento — não bloqueiam a primeira campanha.

**Esforço restante até go-live público:** regressão manual + marketing (~1–3 dias).

### Princípio orientador

A [visão do fundador](../MARKETING/purpose.mdc) define o produto como **educação financeira por hábitos**, com **caixa efetivado** como pedagogia central. As melhorias devem **reforçar essa narrativa**, não transformar o Finto em agregador passivo nem em planilha com dois modos concorrentes.

### O que já evoluiu desde o relatório de negócio

| Área | Estado atual no código | Implicação para o plano |
|------|------------------------|-------------------------|
| Categorias não mapeadas | Linha **Não classificado** + rodapé reconciliação em `FinancialRuleDisplay`; visão anual herda componente | ✅ Fase 1.1 |
| Headers das seções | Efetivado primário + pendências; `receivedIncome` isolado de resgates | ✅ Fase 1.3 |
| Visão anual apply-to-all | `getYearRefreshMonths` + `refreshAffectedYearMonths` em delete/update | ✅ Fase 1.2 |
| Glossário | 12 entradas incl. saldo estimado, Saldo Livre, resgate, transferência, não classificado | ✅ Fases 1.4, 2, 2.5 |
| Seleção | Contador *"N selecionados · M efetivados"* + destaque âmbar | ✅ Fase 2.2 |
| Saldo Livre | Chip renomeado + dialog + toasts alinhados | ✅ Fase 2 |
| Resgate + transferência | `account_operations`, dialogs, exclusão UI (Saldo Livre + Operações do mês) | ✅ Fase 2.5 |
| Reset da regra | `deleteRule` exposto em `MonthSummarySection` e visão anual | P4 #12 **já resolvido** — fora do escopo |
| Conquista + efetivação | `ExpenseSection` marca `paid: true` automaticamente no fluxo de conquista para meios que não são cartão | **D5 fechado** |

---

## Decisões de produto — FECHADAS ✅

| # | Decisão | Escolha | Implicação para copy |
|---|---------|---------|----------------------|
| **D1** | Caixa efetivado vs. planejado + realizado | ✅ **Só efetivado no resumo** + linhas secundárias de pendência (*A receber · A pagar · A investir*) | Vender *"clareza do que de fato aconteceu"* |
| **D2** | Categorias não mapeadas na regra | ✅ **Bucket visível "Não classificado"** com valor; gastos continuam no saldo | Regra explica gastos **quando categorias estão mapeadas**; alertar gap |
| **D3** | Repetição cruza ano? | ✅ **Ano civil no MVP** + aviso no formulário e FAQ | *"Repetição dentro do ano civil"* — não prometer recorrência infinita |
| **D4** | Investimentos + Carteiras | ✅ **Modelo em duas camadas** (ver seção abaixo) | Investimentos = hábito de aporte mensal; Carteiras = patrimônio estimado |
| **D5** | Conquista efetiva gasto? | ✅ **Já implementado** — ver nota abaixo | Conquista com gasto reflete caixa para Pix/Débito/Dinheiro; cartão segue fatura |
| **D6** | Carteiras = organização ou saldo real? | ✅ **Estimativa** (alinha com D4) | *"Saldo estimado"* — não espelha extrato bancário |
| **D7** | Movimentos sem carteira | ✅ **Alertar ao salvar** + agrupar em *Saldo Livre* | Incentivar vínculo; movimentos órfãos não "somem" |
| **D8** | Métodos de pagamento customizáveis | ✅ **Fora do MVP** | Documentar no FAQ |
| **D9** | Resgate + Transferência no lançamento | ✅ **Incluir no gate** — Fase 2.5 obrigatória antes da divulgação pública | Prometer movimentação entre carteiras e resgate para Saldo Livre |

### D5 — já está feito?

**Sim, na prática.** A recomendação original era perguntar no dialog; o produto adotou uma variante **mais simples e equivalente**:

1. **`WishSection`** — o dialog de conquista já explica: *"Gastos em débito ou dinheiro serão marcados como pagos; no cartão, o impacto ocorre ao pagar a fatura."*
2. **`ExpenseSection`** — no fluxo de conquista, ao salvar: `paid = !isCardPayment` (Pix, Débito e Dinheiro nascem pagos; cartão aguarda fatura).

Não há pergunta explícita *"já saiu do caixa?"*, mas o comportamento automático por forma de pagamento atinge o mesmo objetivo pedagógico. **Nenhum trabalho adicional previsto**, salvo copy fina se necessário.

---

## D4 — Modelo Investimentos + Carteiras (decisão expandida)

### Separação de responsabilidades

O fundador definiu um modelo em **duas camadas** que resolve a ambiguidade *"investimento é fluxo ou posição?"* sem misturar os dois papéis na mesma tela:

```
┌─────────────────────────────────────────────────────────────┐
│  RESUMO DO MÊS — caixa efetivado do período                 │
│  Entradas − Gastos − Aportes investidos                     │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│ SEÇÃO INVESTIMENTOS │    │ CARTEIRAS                        │
│ Aportes do mês      │    │ Saldo estimado por conta         │
│ (fluxo → carteira)  │    │ + Resgate + Transferência        │
└─────────────────────┘    └─────────────────────────────────┘
         │                              │
         └──────────┬───────────────────┘
                    ▼
         ┌─────────────────────┐
         │ SALDO LIVRE         │
         │ Movimentos sem      │
         │ carteira + destino  │
         │ de resgates         │
         └─────────────────────┘
```

| Camada | Pergunta que responde | O que registra |
|--------|----------------------|----------------|
| **Seção Investimentos** | *"Quanto aportei este mês?"* | Aportes mensais **obrigatoriamente** vinculados a uma carteira |
| **Carteiras** | *"Quanto tenho estimado em cada conta?"* | Saldo cumulativo estimado + operações patrimoniais (resgate, transferência) |
| **Saldo Livre** | *"O que passou pelo mês sem endereço?"* | Entradas/gastos efetivados sem carteira + entradas de resgate |

### Decisões derivadas de D4

| Regra | Status | Ação |
|-------|--------|------|
| Investimentos exigem carteira | ✅ Implementado | Manter validação em `InvestmentSection` |
| Entradas/gastos sem vínculo → **Saldo Livre** | ✅ Implementado | Chip **Saldo Livre** + dialog + toasts |
| Seção Investimentos = só aportes mensais | ✅ Implementado | Banner pedagógico em `InvestmentSection` |
| **Resgate** na carteira → cai em Saldo Livre | ✅ Implementado | `WithdrawalDialog` + cálculos — ver QA #2 (exclusão sem UI) |
| **Transferência** entre carteiras | ✅ Implementado | `TransferDialog` + par atômico no adapter |
| Tag *"Resgate de investimentos"* em Entradas | 🟡 Legado | Manter para lançamentos manuais; resgate via Carteiras substitui o fluxo ideal |

### Copy sugerida — Seção Investimentos

> **Aportes do mês** — registre quanto você destinou às suas carteiras de investimento neste mês. Para ver o saldo estimado de cada conta, aportes acumulados e movimentações patrimoniais, use **Carteiras**.

Variante curta (banner compacto):

> Este espaço registra seus **aportes mensais**. O saldo total de cada conta está em **Carteiras**.

### Nomenclatura: "Saldo Livre" vs. "Não vinculados"

| Opção | Prós | Contras |
|-------|------|---------|
| Não vinculados | Técnico, preciso | Soa como erro ou pendência |
| **Saldo Livre (escolhida)** | Acolhedor; combina com destino de resgates | Pode sugerir "dinheiro disponível" — exige subtítulo |
| Fora das carteiras | Descritivo | Menos memorável |

**Decisão:** renomear chip para **"Saldo Livre"** com subtítulo **"Sem carteira"** ou **"Movimentos fora das carteiras"**. Atualizar glossário, toasts e `UnlinkedMovementsDialog`.

> **Nota de precisão:** Saldo Livre **não é** saldo bancário — é o agrupamento de movimentos efetivados do mês que não estão atribuídos a nenhuma carteira (mais resgates futuros). O glossário deve deixar isso explícito.

### Especificação — Resgate (Fase 2.5)

**Intenção:** registrar saída de uma carteira de investimento/poupança sem distorcer o resumo mensal nem exigir tag manual em Entradas.

| Aspecto | Comportamento |
|---------|---------------|
| Onde | Ação na carteira de origem (menu do chip ou dialog dedicado) |
| Efeito na carteira origem | Reduz saldo estimado (como saída efetivada interna) |
| Efeito no mês | Cria entrada efetivada em **Saldo Livre** (sem `accountId`) |
| Resumo do mês | +entrada em Saldo Livre; **não** altera bucket de investimentos da regra |
| Regra 50/30/20 | Entrada em Saldo Livre **não** entra automaticamente em nenhum bucket — usuário pode categorizar se quiser vincular manualmente |
| Efetivação | Operação nasce efetivada (evento já ocorreu) |

**Alternativa rejeitada:** resgate como tag *"Resgate de investimentos"* em Entradas — mantém dupla contagem e não atualiza carteira de origem.

### Especificação — Transferência entre carteiras (Fase 2.5)

**Intenção:** mover valor entre contas do mesmo usuário sem distorcer caixa do mês nem categorias de gasto.

| Aspecto | Comportamento |
|---------|---------------|
| Onde | Ação entre duas carteiras (origem → destino) |
| Resumo do mês | **Impacto líquido zero** — não é entrada nem gasto |
| Carteira origem | −valor (saída efetivada) |
| Carteira destino | +valor (entrada efetivada) |
| Regra 50/30/20 | **Sem impacto** |
| Modelo de dados | Par atômico vinculado (`transfer_id` ou tabela `account_transfers`) — evitar duas edições independentes |

### Refinamentos aplicados às ideias do fundador

| Ideia original | Veredito | Ajuste |
|----------------|----------|--------|
| Entradas/gastos sem vínculo → Saldo Livre | ✅ Faz sentido | Já existe como chip; só renomear e educar |
| Investimentos obrigatórios em carteira | ✅ Já feito | Reforçar via copy da seção |
| Seção Investimentos só gerencia aportes | ✅ Faz sentido | Alinha D4 com D6; posição fica em Carteiras |
| Aviso na seção Investimentos | ✅ Faz sentido | Implementar banner (Fase 2) |
| Resgate → Saldo Livre | ✅ Faz sentido | **Gate de lançamento** — Fase 2.5 |
| Transferência entre carteiras | ✅ Faz sentido | **Gate de lançamento** — Fase 2.5 |
| Renomear para Saldo Livre | ✅ Com ressalva | Adotar com subtítulo explicativo no glossário |

**O que não fazer agora:** transformar Carteiras em ledger bancário completo (declaração manual + estimativa permanecem — D6).

---

## Roadmap por fases

### Gate de lançamento público 🚪

**Só divulgar após concluir:** Fase 1 + Fase 2 + Fase 2.5.

```
Fase 0 ─ Decisões de produto ✅
    │
Fase 1 ─ Sprint de confiança · P1 ──────────────┐
    │                                          │
Fase 2 ─ Clareza + copy D4 + Saldo Livre ─────┤── GATE DE LANÇAMENTO
    │                                          │
Fase 2.5 ─ Resgate + Transferência (D4/D9) ────┘
    │
Fase 3 ─ Hardening · P3 (pós-lançamento)
    │
Fase 4 ─ Backlog · P4 + exportação, PWA
```

| Fase | Escopo | Esforço | Bloqueia lançamento? | Critério de pronto |
|------|--------|---------|----------------------|-------------------|
| **0** | D1–D9 | ✅ | — | Decisões registradas |
| **1** | P1 (#1, #2, #3, #15) | 3–5 dias | **Sim** | Números reconciliáveis (resumo, regra, anual, glossário) |
| **2** | P2 + copy D4 + Saldo Livre | 3–5 dias | **Sim** | Fluxos confusos endereçados; investimentos vs carteiras explicados |
| **2.5** | Resgate + Transferência | 5–8 dias | **Sim** | Operações patrimoniais sem distorcer resumo/regra |
| **3** | P3 (#5, #14, #17) | 5–8 dias | Não | Integridade e edge cases |
| **4** | P4 + exportação, PWA | Contínuo | Não | Roadmap público |

---

## Fase 1 — Sprint de confiança (P1)

### 1.1 Categorias não mapeadas vs. regra (#1)

#### Problema
Gastos efetivados em categorias sem mapeamento entram no saldo mensal, mas não nas barras da regra 50/30/20 — o usuário percebe que *"os números não batem"*.

#### Objetivo
Permitir reconciliação explícita: *essenciais + estilo de vida + investimentos + não classificado = gastos efetivados relevantes*.

#### Solução proposta
1. Exibir linha **"Não classificado"** em `FinancialRuleDisplay` quando `stats.unclassifiedValue > 0` (valor + % da renda).
2. Rodapé de reconciliação: *"Gastos efetivados no mês: R$ X · Classificados na regra: R$ Y · Não classificado: R$ Z"*.
3. Manter alerta existente com CTA *"Mapear categorias"*.
4. Adicionar entrada no glossário: *"Não classificado — gastos em categorias ainda não vinculadas à regra"*.

#### Alternativas consideradas
| Opção | Prós | Contras |
|-------|------|---------|
| Excluir não mapeados do saldo | Regra sempre fecha | Quebra expectativa de caixa; pune uso antes do wizard |
| Obrigar mapeamento antes de lançar | Integridade máxima | Fricção alta; contradiz flexibilidade pedagógica |
| **Bucket visível (escolhida)** | Transparente; sem bloquear | Exige educação mínima |

#### Impacto arquitetural

| Camada | Mudança |
|--------|---------|
| **Frontend** | `FinancialRuleDisplay.tsx`, `FinancialGlossaryDialog.tsx`; opcional `AnnualFinancialRuleSection.tsx` |
| **Backend** | Nenhuma |
| **Banco** | Nenhuma |
| **Cálculo** | `financialRuleCalculations.ts` — já expõe `unclassifiedValue`; só UI |

#### Riscos
- Usuário pode ignorar bucket e achar regra "errada" — mitigar com alerta persistente enquanto `unclassifiedValue > 0`.

#### Plano de implementação
1. Componente `RuleReconciliationFooter` (inline em `FinancialRuleDisplay`).
2. Teste unitário: soma dos buckets + unclassified = totalEffectiveExpenses.
3. Validar visão anual com mesmo padrão.

---

### 1.2 Visão anual desatualizada em apply-to-all (#2)

#### Problema
Operações *"todos os meses seguintes"* em edição/exclusão invalidam só o mês corrente no cache da visão anual; gráfico pode divergir da navegação mensal.

#### Objetivo
Qualquer mutação multi-mês deve atualizar **todos os meses afetados** na visão anual.

#### Solução proposta
1. **Correção imediata (bug):** em `useSupabaseFinance.ts`, `deleteIncome`, `deleteExpense` e `deleteInvestment` com `applyToAllMonths` devem chamar `refreshYearMonths` com os meses afetados — hoje só chamam `invalidateCurrentMonth`.
2. **Padronizar helper** `refreshAffectedYearMonths(currentMonth, applyToAllMonths, extraMonths?)` para evitar divergência entre add/update/delete.
3. Para parcelas que cruzam ano, reutilizar lista de meses retornada pelo serviço (ou `calculateInstallmentMonths`) em vez de só `calculateRemainingMonths`.

#### Evidência no código

```427:429:frontend/src/hooks/useSupabaseFinance.ts
        if (applyToAllMonths) {
          await invalidateCurrentMonth();
        }
```

`updateIncome` com `applyToAllMonths` já chama `refreshYearMonths` — `deleteIncome` não.

#### Impacto arquitetural

| Camada | Mudança |
|--------|---------|
| **Frontend** | `useSupabaseFinance.ts` — delete* e unify refresh |
| **Backend** | Opcional: retornar `affectedMonths[]` nas APIs de update/delete para precisão |
| **Testes** | Teste de integração ou unitário do helper de meses afetados |

#### Riscos
- Refresh de 12 meses pode aumentar chamadas — aceitável no MVP; otimizar com batch se necessário.

#### Cenários testados
- Editar valor de salário com *aplicar a todos* → todos os meses do ano no gráfico atualizam.
- Excluir gasto fixo com *aplicar a todos* → meses zerados no anual.
- Parcela 10/12 editada em novembro → meses futuros incluindo janeiro do ano seguinte.

---

### 1.3 Resumo efetivado vs. totais nas listas (#3)

#### Problema
O resumo mostra só efetivados; as seções mostram *Planejado* em destaque e efetivado como linha secundária — o usuário compara valores diferentes sem entender o vínculo.

#### Objetivo
Tornar óbvio que **o resumo reflete o efetivado** e que o planejado é leitura complementar.

#### Solução proposta (depende de D1 = caixa efetivado)
1. **Inverter hierarquia** em `SectionTotalsHeader`: linha primária = efetivado (rótulo *Recebido/Pago/Investido*); secundária = planejado em `text-muted-foreground`.
2. **Resumo do mês:** subtítulo fixo abaixo do título — *"Baseado no que você marcou como recebido, pago ou investido"* + link para glossário (já existe padrão em `MonthSummarySection`).
3. **Métricas de pendência no resumo** (extensão leve de D1): três mini-valores *A receber · A pagar · A investir* = planejado − efetivado por tipo. Não altera o saldo; só educa.

#### Alternativas consideradas
| Opção | Veredito |
|-------|----------|
| Resumo também mostrar planejado em igual destaque | Rejeitada — dilui promessa de clareza do realizado |
| Toggle global planejado/realizado | Adiar para pós-MVP (complexidade de estado) |
| **Hierarquia + pendências (escolhida)** | Simples; alinhada à filosofia |

#### Impacto arquitetural

| Camada | Mudança |
|--------|---------|
| **Frontend** | `SectionTotalsHeader.tsx`, `IncomeSection.tsx`, `ExpenseSection.tsx`, `InvestmentSection.tsx`, `MonthSummarySection.tsx` |
| **Utils** | `calculateEffectiveMonthTotals` + função `calculatePendingMonthTotals` (derivada, pura) |
| **Backend / DB** | Nenhum |

#### Riscos
- Usuários acostumados com planejado em destaque podem estranhar — mitigar com microcopy na primeira visita (toast ou tooltip único).

---

### 1.4 Dois conceitos de saldo (#15)

#### Problema
Saldo do mês (fluxo efetivado) e saldo estimado na carteira (cumulativo) coexistem na mesma tela sem ponte visual suficiente.

#### Objetivo
Eliminar percepção de bug; alinhar com promessa de marketing *"organização com estimativa"*.

#### Solução proposta
1. **Glossário:** entrada já existe — adicionar *"Por que são diferentes?"* com exemplo numérico de uma linha.
2. **`AccountStrip`:** rótulo explícito *"Saldo estimado"* em cada chip (não só "Saldo").
3. **`MonthSummarySection`:** hint no card de saldo (já parcial) — padronizar ícone `HelpCircle` abrindo glossário na seção correta.
4. **Marketing:** manter FAQ *"Os números vão bater com meu banco?"* com resposta aprovada.

#### Impacto
Somente frontend/copy; sem migração.

---

## Fase 2 — Clareza e retenção (P2)

### 2.1 Repetição mensal não cruza ano (#4)

#### Problema
`calculateRemainingMonths` limita repetição ao ano civil — janeiro pode ficar sem aluguel/salário criado em dezembro.

#### Solução proposta (D3 = manter ano civil no MVP)
1. **Copy no formulário** ao marcar *"Repetir todos os meses"*: *"Cria lançamentos nos demais meses deste ano. Em janeiro, duplique ou crie novamente para o ano seguinte."*
2. **FAQ + onboarding** alinhados à [analise-estrategica-produto.md](../MARKETING/analise-estrategica-produto.md).
3. **Backlog Fase 3+:** opção *"Repetir indefinidamente"* ou extensão automática ao virar o ano (exige modelo de série/recorrência — não trivial).

#### Alternativa futura
Tabela `recurrence_rules` ou flag `repeat_indefinitely` — **YAGNI até validar demanda pós-lançamento**.

---

### 2.2 Seleção vs. efetivados (#6)

#### Problema
Usuário seleciona itens não efetivados e vê total R$ 0.

#### Solução proposta
1. Contador na barra: *"4 selecionados · 1 efetivado · R$ 0 efetivados"*.
2. Se `selectedCount > 0 && effectiveTotal === 0`, destaque âmbar na sublinha (já existe texto — reforçar com contagem).
3. Opcional: desabilitar checkbox de seleção para não efetivados — **rejeitado** (limita auditoria de planejado).

---

### 2.3 Chip cartão vs. resumo (#9)

#### Problema
Chip soma fatura total; resumo só conta quando fatura paga.

#### Solução proposta
1. Confirmar rótulo *"Fatura"* no chip (`CreditCardStrip` — já presente).
2. Adicionar tooltip: *"Valor comprometido no cartão neste mês. Entra no saldo do resumo quando você marcar a fatura como paga."*
3. Glossário: entrada *"Fatura"* já existe — cross-link no tooltip.

---

### 2.4 Planejado vs. realizado consolidado (#10)

#### Problema
Não há visão única de execução do mês.

#### Solução proposta
Implementar **pendências no resumo** (item 1.3) em vez de painel comparativo completo — atende 80% do valor com 20% do esforço.

Se D1 evoluir para toggle no futuro, extrair `MonthExecutionSummary` como componente.

---

### 2.5 Posicionamento Investimentos vs. Carteiras + Saldo Livre (D4)

#### Problema
Usuário confunde aportes mensais com posição patrimonial; chip *"Não vinculados"* soa negativo e não comunica o papel de destino de resgates.

#### Solução proposta
1. **Banner** em `InvestmentSection` com copy aprovada na seção D4.
2. **Renomear** chip e dialog: *Não vinculados* → **Saldo Livre** (`AccountStrip`, `UnlinkedMovementsDialog`, glossário, toasts).
3. **Glossário:** entradas *Saldo Livre*, *Aporte*, *Resgate* (antecipar copy mesmo antes da Fase 2.5).
4. **Toasts** em `IncomeSection`/`ExpenseSection`: *"Salvo em Saldo Livre — vincule a uma carteira para ver no saldo estimado por conta."*

#### Status
- Chip + totais + toast: ✅ implementado
- Rename + banner + glossário: ✅ implementado (Fase 2 — QA 2026-07-03)

---

### 2.6 Movimentos sem carteira → Saldo Livre (#16 + D7)

#### Problema
Movimentos sem `accountId` entram no resumo mas ficavam invisíveis nos chips de carteira.

#### Solução
✅ **Implementado** — `getUnlinkedMonthTotals`, chip clicável e dialog de detalhes.

#### Status (Fase 2)
1. ✅ Renomeado para **Saldo Livre** (item 2.5).
2. ✅ Toasts alinhados em `IncomeSection` e `ExpenseSection`.

---

## Fase 2.5 — Carteiras avançadas (D4 + D9) 🚪 *Gate de lançamento*

Operações patrimoniais que completam o modelo **Investimentos (fluxo) + Carteiras (posição estimada) + Saldo Livre (sem carteira)**. Sem esta fase, o módulo Carteiras fica incompleto para quem movimenta dinheiro entre contas — risco direto de distorção na regra 50/30/20 (achado #18).

### Arquitetura proposta

#### Modelo de dados — tabela `account_operations`

```sql
-- supabase/migrations/create_account_operations.sql (rascunho)

CREATE TABLE public.account_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('withdrawal', 'transfer_out', 'transfer_in')),
  source_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  transfer_group_id UUID,  -- mesmo UUID para par transfer_out + transfer_in
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  year_month TEXT NOT NULL,  -- "YYYY-MM"
  operation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: user_id = auth.uid() em SELECT/INSERT/DELETE (sem UPDATE — operações são imutáveis)
```

| Tipo | `source_account_id` | `destination_account_id` | Efeito |
|------|---------------------|--------------------------|--------|
| `withdrawal` | Carteira de origem | `NULL` | Saída na carteira; entrada no Saldo Livre |
| `transfer_out` | Origem | `NULL` | Saída na carteira origem (par) |
| `transfer_in` | `NULL` | Destino | Entrada na carteira destino (par) |

> **Por que três tipos em vez de uma linha com origem+destino?** Transferência exige par atômico com sinais opostos nos cálculos de `getAccountMonthTotals`. `transfer_group_id` vincula o par para exclusão e auditoria.

#### Resgate — fluxo técnico

1. Usuário aciona *"Registrar resgate"* no menu da carteira.
2. Service cria `account_operation` tipo `withdrawal` (efetivada na hora).
3. **Cálculos estendidos** (sem poluir `incomes` com tag manual):
   - `getAccountMonthTotals` → `outflow += amount` na carteira origem.
   - `getUnlinkedMonthTotals` → `inflow += amount` (Saldo Livre).
   - `calculateEffectiveMonthTotals` → `totalIncome += amount` (entra no resumo do mês).
4. `UnlinkedMovementsDialog` lista resgates com badge *"Resgate"* além de entradas/gastos órfãos.
5. Regra 50/30/20: resgate **não** entra em buckets automaticamente.

**Opcional (UX):** espelhar resgate como linha read-only na seção Entradas com badge *"Via Carteiras"* — avaliar na implementação; não é bloqueador se Saldo Livre estiver claro.

#### Transferência — fluxo técnico

1. Usuário aciona *"Transferir"* (menu global da faixa ou da carteira origem).
2. Service cria **duas** operações com mesmo `transfer_group_id`:
   - `transfer_out` na origem
   - `transfer_in` no destino
3. **Sem impacto** em `monthTotals`, regra 50/30/20 ou Saldo Livre.
4. Chips atualizam: origem −valor, destino +valor (via `getAccountMonthTotals`).

#### Exclusão

- Operações são **imutáveis**; exclusão permitida com confirmação (reverte efeito nos cálculos).
- Excluir transferência remove o par pelo `transfer_group_id`.

---

### 2.5.1 Resgate — implementação

| Etapa | Entrega |
|-------|---------|
| 1 | Migration `create_account_operations.sql` + tipos em `domain.ts` |
| 2 | Adapter Supabase: `accountOperations.ts` (create, delete, listByMonth) |
| 3 | Service + hook: `useSupabaseFinance` expõe `createWithdrawal`, `deleteOperation` |
| 4 | `accounts.ts`: estender `getAccountMonthTotals`, `getUnlinkedMonthTotals`, `getUnlinkedMovements` |
| 5 | `monthTotals.ts`: incluir resgates em `totalIncome` |
| 6 | UI: `WithdrawalDialog.tsx` + item no menu do chip em `AccountStrip.tsx` |
| 7 | Testes unitários: resgate não duplica; resumo e Saldo Livre batem |

### 2.5.2 Transferência — implementação

| Etapa | Entrega |
|-------|---------|
| 1 | Service: `createTransfer` atômico (par out/in, mesmo `transfer_group_id`) |
| 2 | `accounts.ts`: `transfer_out` → outflow; `transfer_in` → inflow |
| 3 | UI: `TransferDialog.tsx` (origem, destino, valor, data, descrição opcional) |
| 4 | Validação: origem ≠ destino; carteiras do mesmo usuário |
| 5 | Testes: resumo mensal inalterado; chips origem/destino simétricos |

### 2.5.3 UI — pontos de entrada

| Local | Ação |
|-------|------|
| Menu do chip de carteira | *Registrar resgate* · *Transferir desta carteira* |
| Faixa `AccountStrip` (header) | Botão *Transferir* (abre dialog com origem pré-selecionável) |
| `Saldo Livre` dialog | Listar resgates do mês com origem (carteira) |

### Copy de produto (Fase 2.5)

| Contexto | Texto |
|----------|-------|
| Dialog resgate | *"Registre a saída desta carteira. O valor entra no Saldo Livre do mês — como se o dinheiro voltasse para o caixa sem carteira definida."* |
| Dialog transferência | *"Mova valor entre suas carteiras. Não altera seu saldo do mês nem a regra 50/30/20."* |
| Glossário — Resgate | *"Saída registrada em uma carteira que aparece no Saldo Livre do mês."* |
| Glossário — Transferência | *"Movimentação interna entre carteiras. Não é entrada nem gasto do mês."* |

### Critério de pronto (gate)

- [x] Resgate reduz carteira origem e aparece em Saldo Livre **e** no resumo (entradas efetivadas).
- [x] Transferência move saldo entre chips com **impacto líquido zero** no resumo e na regra.
- [x] Exclusão de operação reverte cálculos corretamente — UI em Saldo Livre + `AccountMonthOperationsDialog` (revalidado 2026-07-03).
- [x] Testes unitários em `accounts.ts` e `monthTotals.ts` (67 testes gate passando).
- [x] RLS: migration com políticas SELECT/INSERT/DELETE por `user_id` (aplicação remota não auditada).

### Cenários de teste

| Cenário | Resultado esperado |
|---------|-------------------|
| Resgate R$ 1.000 da corretora | Chip corretora −1.000; Saldo Livre +1.000; resumo entradas +1.000 |
| Transferência R$ 500 Nubank → Poupança | Resumo inalterado; Nubank −500; Poupança +500 |
| Resgate + transferência no mesmo mês | Cálculos independentes; sem dupla contagem |
| Excluir transferência | Par removido; chips voltam ao estado anterior |
| Resgate com carteira excluída depois | `source_account_id` SET NULL; operação preservada no histórico |

### Riscos

| Risco | Mitigação |
|-------|-----------|
| Complexidade de cálculo | Funções puras centralizadas em `accounts.ts` + testes |
| Usuário confunde resgate com entrada manual | Badge *Resgate* no Saldo Livre; deprecar fluxo via tag em FAQ |
| Operação órfã se insert parcial falhar | Transação atômica no adapter (transferência) |

---

## Fase 3 — Hardening (P3)

| Item | Ação resumida | Complexidade |
|------|---------------|--------------|
| **#5 Vínculo cartão por nome** | Migração `expenses.credit_card_id` (FK); manter `payment_method` como display; script de backfill por nome | Alta — planejar migration Supabase |
| **#14 Valor desejo vs. gasto** | Ao salvar conquista, se \|valor gasto − valor desejo\| > threshold, dialog de confirmação | Baixa |
| **#17 Carry-forward** | Garantir `refreshEarliestMovementMonthIfAccountLinked` em todos os paths; teste cross-year | Média |
| **#7 Métodos de pagamento** | Fora do MVP (D8) — documentar em Settings | — |
| **#8 Resgate vs. investimento** | ✅ Absorvido por D4 — resgate via Carteiras (Fase 2.5) | Média |

---

## Fase 4 — Backlog (P4 e lacunas de mercado)

| Item | Ação | Prioridade pós-lançamento |
|------|------|---------------------------|
| **#11 Validação só no client** | Documentar risco MVP; constraints DB para `value > 0` e percentuais da regra | Média |
| **#12 deleteRule sem UI** | ✅ Resolvido | — |
| **#18 Transferências entre carteiras** | ✅ Absorvido por D4 — Fase 2.5 | Média |
| **D3 Desejo sem carteira** | Sugerir carteira no draft se houver investimentos/gastos recentes na mesma categoria | Baixa |
| **Exportação CSV/PDF** | [analise-estrategica-produto.md](../MARKETING/analise-estrategica-produto.md) — retenção avançada | Média |
| **PWA** | Neutraliza objeção "sem app" | Alta comercial / média técnica |

---

## Alinhamento marketing ↔ produto

Após o **gate de lançamento** (Fases 1 + 2 + 2.5), a comunicação pode afirmar:

| Pode prometer | Não prometer |
|---------------|--------------|
| Clareza do **caixa efetivado** | Saldo bancário espelhado 1:1 |
| Regra 50/30/20 nas **suas** categorias | *"Explica 100% dos gastos"* sem ressalva de mapeamento |
| Cartão por **fatura** | Sync bancário / Open Finance |
| Lista de desejos como **reflexão antes da ação** | Gestão de carteira de ativos / corretora |
| **Aportes mensais** + **Carteiras** com saldo estimado | Ledger bancário automático |
| **Resgate** da carteira para o Saldo Livre | Resgate automático da corretora |
| **Transferência** entre carteiras sem distorcer o mês | Open Finance |
| **Saldo Livre** para movimentos sem carteira | Saldo Livre = conta bancária |
| Visão anual do **hábito ao longo do tempo** | Recorrência automática entre anos (sem aviso) |

### Ajustes na Landing Page (paralelo ao dev)
1. Reescrever hero conforme [purpose.mdc](../MARKETING/purpose.mdc) — transformação antes de feature.
2. FAQ obrigatório: manual, efetivado, fatura, saldo estimado, saldo livre, resgate, transferência, repetição anual.
3. Seção Carteiras: *"Seu dinheiro com endereço — aporte, resgate e transferência entre contas."*
4. Não usar *"organizador financeiro"* como headline principal.

---

## Checklist de validação pré-lançamento

### Produto (gate)
- [x] Decisões D1–D9 registradas
- [x] Fase 1 — P1 implementado e testado
- [x] Fase 2 — copy D4, Saldo Livre, fluxos P2
- [x] Fase 2.5 — resgate, transferência e exclusão funcionais
- [x] Glossário: planejado, efetivado, fatura, saldo do mês, saldo estimado, saldo livre, aporte, resgate, transferência, não classificado
- [x] Fluxo conquista → gasto → saldo (D5)

### Técnico
- [x] Build e lint passando (lint: 0 erros)
- [x] Testes unitários: `financialRuleCalculations`, `accounts`, `monthTotals`, `repeatMonths` — 67/67
- [ ] Migration `account_operations` aplicada com RLS no ambiente de produção
- [ ] Regressão manual: cartão por fatura, parcelas cross-year, carteiras carry-forward, apply-to-all no gráfico anual

### Marketing
- [ ] Copy alinhada à tabela *Pode prometer* (inclui resgate + transferência)
- [ ] Screenshots com Saldo Livre, dialogs de resgate/transferência
- [ ] Política de privacidade e termos publicados

---

## Ordem sugerida de implementação (dev)

```
GATE DE LANÇAMENTO — executar na ordem:

1. ✅ Decisões D1–D9 fechadas

── Fase 1 (confiança nos números) ── ✅
2. ✅ #2 Visão anual — bug delete apply-to-all
3. ✅ #1 Reconciliação regra + não classificado
4. ✅ #3 + #10 Pendências e hierarquia SectionTotalsHeader
5. ✅ #15 Glossário + rótulos saldo estimado

── Fase 2 (clareza + D4 copy) ── ✅
6. ✅ Saldo Livre (rename) + banner Investimentos
7. ✅ #6 #9 Seleção e chip cartão
8. ✅ #4 Copy repetição anual

── Fase 2.5 (carteiras — D9) ── ✅ (ressalvas QA)
9.  ✅ Migration account_operations + tipos + adapter
10. ✅ Cálculos: accounts.ts + monthTotals.ts + testes
11. ✅ WithdrawalDialog + integração AccountStrip
12. ✅ TransferDialog + createTransfer + testes
13. ✅ Saldo Livre dialog: listar resgates
14. ⏳ Regressão manual do gate (browser)
```

---

## Arquivos previstos (consolidado)

| Arquivo | Fases |
|---------|-------|
| `supabase/migrations/create_account_operations.sql` | 2.5 |
| `frontend/src/types/domain.ts` | 2.5 |
| `frontend/src/services/adapters/supabase/accountOperations.ts` | 2.5 |
| `frontend/src/services/accountOperations.ts` | 2.5 |
| `frontend/src/hooks/useSupabaseFinance.ts` | 1.2, 2.5 |
| `frontend/src/components/WithdrawalDialog.tsx` | 2.5 *(novo)* |
| `frontend/src/components/TransferDialog.tsx` | 2.5 *(novo)* |
| `frontend/src/components/FinancialRuleDisplay.tsx` | 1.1 |
| `frontend/src/components/MonthSummarySection.tsx` | 1.3, 1.4 |
| `frontend/src/components/layout/SectionTotalsHeader.tsx` | 1.3 |
| `frontend/src/components/IncomeSection.tsx` | 1.3, 2.5 |
| `frontend/src/components/ExpenseSection.tsx` | 1.3 |
| `frontend/src/components/InvestmentSection.tsx` | 1.3, 2 |
| `frontend/src/components/FinancialGlossaryDialog.tsx` | 1.1, 1.4, 2, 2.5 |
| `frontend/src/components/AccountStrip.tsx` | 1.4, 2, 2.5 |
| `frontend/src/components/UnlinkedMovementsDialog.tsx` | 2, 2.5 |
| `frontend/src/components/SelectionBottomBar.tsx` | 2.2 |
| `frontend/src/components/CreditCardStrip.tsx` | 2.3 |
| `frontend/src/utils/business/monthTotals.ts` | 1.3, 2.5 |
| `frontend/src/utils/business/accounts.ts` | 2.5 |
| `frontend/src/utils/business/__tests__/accounts.test.ts` | 2.5 |
| `frontend/src/utils/financialRuleCalculations.ts` | 1.1 (testes) |

Migração Fase 3: `expenses.credit_card_id`, adapters Supabase.

---

## Próximo passo

1. **QA manual:** regressão browser — apply-to-all no gráfico anual, resgate/transferência/exclusão E2E, cartão por fatura.
2. **Ops:** confirmar migration `account_operations` aplicada no Supabase de produção.
3. **Marketing:** copy alinhada, screenshots (Saldo Livre, dialogs), termos/privacidade.
4. **Backlog opcional:** transação atômica em `createTransfer` (QA #3, Baixo).
5. **Não divulgar publicamente** até checklist 100% e regressão manual concluída.

---

*Documento de planejamento. Não substitui tickets de implementação. Atualizar status das fases conforme entregas.*
