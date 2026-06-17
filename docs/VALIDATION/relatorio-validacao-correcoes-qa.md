# Relatório de Validação — Correções QA Frontend

| Campo | Valor |
|-------|-------|
| **Data** | 2026-06-17 |
| **Agente** | Validation Engineer (`docs/VALIDATION/validation-specialist.mdc`) |
| **Entrada QA** | `docs/QA/relatorios/01`–`12`, `99-transversal` |
| **Entrada Dev** | `docs/DEV/relatorio-correcoes-qa.md` |
| **Escopo validado** | `frontend/src` (provider Supabase) |
| **Build** | `npm run build` — OK (sem erros TypeScript) |

---

## Resumo executivo

A entrega do desenvolvimento **resolve a causa raiz** da maioria dos achados de severidade Alta e Média identificados pelo QA. As correções financeiras seguem uma cadeia coerente via `monthTotals.ts`, alinhando resumo mensal, regra financeira, seleção e estatísticas anuais ao critério de **valores efetivados**.

| Classificação | Quantidade |
|---------------|------------|
| **Aprovado** | 32 achados / itens corrigidos |
| **Aprovado com ressalvas** | 6 achados |
| **Reprovado / pendente** | 8 itens (escopo futuro ou não endereçados) |
| **Código morto removido** | 3 artefatos confirmados |

### Veredito geral

**Aprovado com ressalvas** — as correções estão tecnicamente sólidas e o build permanece íntegro, mas a validação foi feita por **auditoria estática de código** (sem testes manuais em browser nem E2E). Há riscos residuais em atomicidade de parcelas, pendências de produto documentadas e ausência de suite automatizada.

---

## Validação de build

| Verificação | Resultado |
|-------------|-----------|
| `npm run build` | OK |
| Artefatos mortos removidos (`useFinanceData`, `SummaryCards`, `calculateProjection`) | Confirmado — sem referências no código |
| Schema de banco alterado | Não |
| Padrões do projeto (hooks → serviços → adaptadores) | Preservados |

---

## Validação por módulo

### 01 — Autenticação

#### Achado: Mapeamento de erros depende de strings em inglês (Alto)

| Campo | Conteúdo |
|-------|----------|
| **Problema original** | `Auth.tsx` usava `error.message.includes()` com strings fixas em inglês. |
| **Solução implementada** | `authErrors.ts` mapeia por `error.code` com fallback regex + mensagem genérica PT-BR. |
| **Análise técnica** | Causa raiz tratada. Fallback por regex mantém compatibilidade retroativa sem depender exclusivamente de códigos. |
| **Cenários validados** | Login inválido, e-mail não confirmado, usuário já cadastrado, erro desconhecido → mensagem PT-BR. |
| **Possíveis regressões** | Códigos Supabase novos sem mapeamento caem no fallback genérico (aceitável). |
| **Resultado** | **Aprovado** |

#### Achado: Ausência de recuperação de senha (Médio)

| Campo | Conteúdo |
|-------|----------|
| **Problema original** | Sem fluxo "Esqueci minha senha". |
| **Solução implementada** | UI `isForgotPassword` + `resetPassword` em `AuthContext` via `resetPasswordForEmail`. |
| **Análise técnica** | Implementação mínima e alinhada ao Supabase Auth. `redirectTo` aponta para `/auth`. |
| **Cenários validados** | Envio com e-mail válido; erro mapeado; retorno ao login. |
| **Possíveis regressões** | Fluxo de atualização de senha pós-link (tela de nova senha) não auditado nesta rodada. |
| **Resultado** | **Aprovado com ressalvas** — envio do link validado estaticamente; fluxo completo pós-e-mail requer teste manual. |

#### Achado: E-mail sem normalização (Médio)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | `email.trim().toLowerCase()` antes de `signIn`, `signUp` e `resetPassword`. |
| **Resultado** | **Aprovado** |

#### Achado: Logout sem tratamento de erro (Médio)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | `signOut` lança em erro; `Index.handleSignOut` usa try/catch com toast condicional. |
| **Resultado** | **Aprovado** |

#### Achados Baixos (toggle campos, env vars, navigate redundante, senha max)

| Achado | Solução | Resultado |
|--------|---------|-----------|
| Campos sensíveis ao alternar login/cadastro | Limpa e-mail e senhas no toggle | **Aprovado** |
| Env Supabase ausente | Guard clause em `client.ts` | **Aprovado** |
| Navegação dupla pós-login | Removido `navigate` no submit; mantido `useEffect` | **Aprovado** |
| Senha sem limite máximo | Zod `.max(72)` | **Aprovado** |

---

### 02 — Dashboard

#### Achado: Status mensal de cartões não carrega no primeiro acesso (Alto)

| Campo | Conteúdo |
|-------|----------|
| **Problema original** | Race condition: `fetchCardMonthlyStatus` rodava em paralelo com `fetchCreditCards` quando `creditCards` ainda era `[]`. |
| **Solução implementada** | Sequenciamento no load inicial: `await fetchCreditCards()` → `await fetchCardMonthlyStatus(currentMonth)`. |
| **Análise técnica** | Resolve causa raiz. `fetchCardMonthlyStatus` depende de `creditCards` no callback — ordem correta garante dados. |
| **Cenários validados** | Primeiro acesso com cartões existentes; troca de mês (efeito separado mantém paralelismo seguro pois cartões já carregados). |
| **Possíveis regressões** | Adição de cartão após load inicial dispara `fetchCreditCards` — status do novo cartão depende de efeito subsequente (verificar manualmente). |
| **Resultado** | **Aprovado** |

#### Achado: Estatísticas anuais não atualizam ao marcar fatura paga (Alto)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | `cardMonthlyStatus` incluído no hash de debounce de `yearData` em `Index.tsx` L152-157. |
| **Análise técnica** | Correção precisa — gastos em cartão não alteram `expense.paid`, mas alteram status efetivo via cartão. |
| **Resultado** | **Aprovado** |

#### Achado: `canDeleteCardSync` ignora gastos em outros meses (Alto)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | `CreditCardStrip` usa `canDeleteCard` async com `checkingDelete` e `AlertDialog` de bloqueio. |
| **Análise técnica** | Wrapper síncrono removido do fluxo de exclusão. Consulta serviço que verifica todos os meses. |
| **Resultado** | **Aprovado** |

#### Achados Médios

| Achado | Solução | Resultado |
|--------|---------|-----------|
| Erros settings/cartões/status silenciosos | Toasts em catches de `useSupabaseFinance` | **Aprovado** |
| `yearData` stale ao mudar ano | Reset de `yearData` + `lastMonthDataRef` quando `currentYear` muda | **Aprovado** |
| Seleções persistem ao trocar mês | `useEffect` em `currentMonth` chama `handleClearAllSelections` | **Aprovado** |
| Logout toast incondicional | Ver módulo 01 | **Aprovado** |

#### Achado: FAB oculto na visão anual (Baixo)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | FAB visível em `statistics`; ao abrir, redireciona para dashboard. |
| **Resultado** | **Aprovado** |

---

### 03 — Resumo do Mês

#### Achado: Totais usam valores brutos (Alto)

| Campo | Conteúdo |
|-------|----------|
| **Problema original** | `MonthSummarySection` somava todos os valores sem filtrar flags. |
| **Solução** | `calculateEffectiveMonthTotals` de `monthTotals.ts`; legenda "Apenas itens marcados como recebido, pago ou investido". |
| **Cadeia financeira** | Origem: `monthData` + `cardMonthlyStatuses` → filtro `received`/`paid`/`invested` + `isExpenseEffectivelyPaid` → agregação → UI. |
| **Resultado** | **Aprovado** |

#### Achado: Dialog da regra fecha em erro (Médio)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | `handleComplete` com try/catch mantém wizard aberto; toast via hook. |
| **Resultado** | **Aprovado** |

---

### 04 — Entradas | 05 — Gastos | 07 — Investimentos

#### Achado transversal: Dialog fecha antes de persistir (Médio)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | Handlers retornam `Promise<boolean>`; `isSubmitting` bloqueia submit; dialog só fecha em `success !== false`. |
| **Arquivos** | `IncomeSection`, `ExpenseSection`, `InvestmentSection`, `CreditCardStrip`, `MonthRecordsSection`, `useSupabaseFinance`. |
| **Análise técnica** | Padronização correta. Optimistic update + rollback no hook permanecem. |
| **Resultado** | **Aprovado** |

#### Achado: Exclusão de tag/categoria em uso sem feedback (Médio)

| Módulo | Solução | Resultado |
|--------|---------|-----------|
| Entradas | Toast + `title` no botão desabilitado | **Aprovado** |
| Gastos | Toast em `handleDeleteCategory` | **Aprovado** |
| Investimentos | Toast em `handleDeleteTag` | **Aprovado** |

#### Achado: INSERTs de parcelas não atômicos (Alto — Gastos)

| Campo | Conteúdo |
|-------|----------|
| **Problema original** | Loop de INSERTs sem transação; falha parcial deixa série incompleta. |
| **Solução** | `rollbackExpenseSeries` no catch de `createExpense` após primeiro INSERT bem-sucedido. |
| **Análise técnica** | Compensação no cliente — **não é atomicidade de banco**. Janela de inconsistência menor, mas rollback pode falhar em rede instável. |
| **Cenários não cobertos** | `updateExpense` com criação de réplicas ainda sem rollback compensatório. |
| **Resultado** | **Aprovado com ressalvas** — melhoria significativa; RPC Postgres seria solução definitiva. |

#### Achado: Excluir parcela "este mês" apagava série inteira (Alto — Gastos)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | `handleConfirmDelete` chama `onDelete(deleteExpense.id, false)`; série completa usa `onDeleteInstallment`. |
| **Análise técnica** | Matriz delete corrigida conforme QA. |
| **Resultado** | **Aprovado** |

#### Achado: Toggle "pago" em gasto de cartão (Médio — Gastos)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | `handleTogglePaid` retorna cedo se `isExpenseLinkedToCard(expense)`. |
| **Resultado** | **Aprovado** |

#### Itens Baixos documentados como intencionais

| Achado | Status |
|--------|--------|
| Repetição limitada ao ano civil | Pendente — regra de negócio documentada |
| `reorderIncomes/Expenses/Investments` sem UI | Pendente — fora do escopo |

---

### 06 — Cartões de Crédito

| Achado QA | Correção Dev | Validação |
|-----------|--------------|-----------|
| `canDeleteCard` só mês atual | Async no `CreditCardStrip` | **Aprovado** |
| Status incorreto no load | Sequenciamento no hook | **Aprovado** |
| `setCardPaidStatus` sem feedback | Toast se retorno `false` | **Aprovado** |
| Campo `paid` global não usado | Não alterado | **Pendente** (documentação) |
| Status mensais órfãos ao excluir cartão | Não alterado | **Pendente** (depende FK/cascade DB) |

---

### 08 — Configurações

| Achado | Solução | Resultado |
|--------|---------|-----------|
| Upsert parcial sobrescrevia colunas | `updateSettingsColumn`: UPDATE explícito + INSERT só se linha inexistente | **Aprovado** |
| Tags duplicadas no serviço | `normalizeTagList` com deduplicação case-insensitive | **Aprovado** |
| Métodos de pagamento não editáveis | Não implementado | **Pendente** (feature nova) |

---

### 09 — Regra Financeira

#### Achado: Cálculos usam valores não efetivados (Alto)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | `calculateFinancialRuleStats` usa `isExpenseEffectivelyPaid` e filtra `received`/`invested`. |
| **Cadeia financeira** | `FinancialRuleDisplay` recebe `creditCards` + `cardMonthlyStatuses` → cálculo alinhado ao resumo e estatísticas. |
| **Resultado** | **Aprovado** |

#### Achado: Validação ignora categorias vazias (Médio)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | `getExpenseCategories` retorna `DEFAULT_EXPENSE_CATEGORIES` quando lista vazia; `validateCategoryMapping` sempre executado. |
| **Resultado** | **Aprovado** |

#### Itens não endereçados

| Achado | Status |
|--------|--------|
| `deleteRule` sem UI | Pendente |
| `calculateProjection` sem uso | **Resolvido** — função removida |

---

### 10 — Estatísticas Anuais

| Achado | Solução | Resultado |
|--------|---------|-----------|
| Debounce ignora status de cartão | `cardMonthlyStatus` no hash | **Aprovado** |
| `yearData` stale ao mudar ano | Reset em `currentYear` | **Aprovado** |
| Eixo Y "0k" para valores < 1000 | `formatAxisValue` | **Aprovado** |
| `getYearData` silencia erro | Toast por mês em catch | **Aprovado** |
| Gráfico some durante recarga | Overlay com dados anteriores + `isLoading` parcial | **Aprovado** |

---

### 11 — Seleção de Itens

#### Achado: Seleções persistem ao trocar mês (Médio)

| Resultado | **Aprovado** — ver Dashboard |

#### Achado: Soma usa valor nominal (Médio)

| Campo | Conteúdo |
|-------|----------|
| **Solução** | `selectionSummary` filtra por `received`/`invested`/`isExpenseEffectivelyPaid`; label "Itens selecionados (efetivados)". |
| **Análise técnica** | Comportamento alterado: itens selecionados mas não efetivados **não entram no total** — barra pode ficar oculta mesmo com seleção ativa. Coerente com taxonomia unificada, mas pode surpreender usuário. |
| **Resultado** | **Aprovado com ressalvas** — alinhamento correto com produto; UX de seleção de itens não efetivados merece teste manual. |

#### Achado: Sem ações em lote (Baixo)

| Resultado | **Pendente** — feature nova |

---

### 12 — Shell

| Achado | Solução | Resultado |
|--------|---------|-----------|
| 404 em inglês | Textos PT-BR + `Link` React Router | **Aprovado** |
| Sheet `modal={false}` | Prop removida — comportamento modal padrão | **Aprovado** |
| Overlay tema 400ms | Reduzido para 150ms | **Aprovado** |
| 404 acessível sem auth | Não alterado | Aceitável — link redireciona para auth |

---

### 99 — Transversal

| Tema | Validação |
|------|-----------|
| Consistência de totais | **Aprovado** — `monthTotals.ts` como fonte única |
| Código morto | **Aprovado** — 3 artefatos removidos |
| Padrão dialog/async | **Aprovado** |
| Feedback silencioso | **Aprovado** nas seções auditadas |
| Resiliência erros | **Aprovado com ressalvas** — parcelas parcialmente compensadas |
| Modo API | **Pendente** — fora do escopo |

---

## Análise de regressão

### Fluxos que devem ser retestados manualmente

1. **Primeiro login** — status de fatura de cartões exibido corretamente.
2. **Marcar fatura paga** → alternar para visão anual → gráfico atualiza em até 2s (debounce).
3. **Criar gasto parcelado** (12x) — simular falha de rede no meio (devtools) e verificar rollback.
4. **Excluir parcela "apenas este mês"** vs **"todas as parcelas"**.
5. **Selecionar itens não efetivados** — verificar se barra inferior se comporta conforme esperado.
6. **Esqueci minha senha** — recebimento de e-mail e fluxo de redefinição.
7. **Excluir cartão** com gastos em mês anterior — bloqueio com mensagem.
8. **Configurar regra** com categorias vazias no DB — validação com defaults.
9. **Trocar ano** na visão estatística sem sair da view.
10. **Logout com rede offline** — toast de erro, usuário permanece logado.

### Riscos residuais identificados

| Risco | Severidade | Mitigação sugerida |
|-------|------------|-------------------|
| Rollback de parcelas só em `createExpense` | Média | Estender compensação a updates ou RPC Postgres |
| Sem testes E2E | Alta (release) | Smoke test manual pré-release |
| Modo `VITE_DATA_PROVIDER=api` não validado | Média | Regressão quando backend reativar |
| `deleteRule` / CRUD métodos pagamento ausentes | Baixa | Backlog de produto |
| Seleção de não-efetivados sem feedback na barra | Baixa | Tooltip ou contador "X selecionados, Y efetivados" |

---

## Sugestões de testes

### Unitários — `monthTotals.ts`

```typescript
// isExpenseEffectivelyPaid
- gasto sem cartão + paid=true → true
- gasto sem cartão + paid=false → false
- gasto com cartão + fatura paga → true
- gasto com cartão + fatura não paga → false
- cardMonthlyStatuses undefined → usa expense.paid

// calculateEffectiveMonthTotals
- mistura de received/paid/invested → totais e saldo corretos
- mês vazio → zeros
```

### Unitários — `authErrors.ts`

```typescript
- código invalid_credentials → mensagem PT-BR
- código desconhecido + message em inglês conhecida → fallback regex
- erro genérico → mensagem padrão PT-BR
```

### Unitários — `expenses.ts` (createExpense)

```typescript
- sucesso em parcela 12x → 12 registros
- falha no 6º INSERT → rollback remove série
```

### Integração / E2E (prioridade)

1. Login → dashboard → marcar cartão pago → estatísticas refletem gasto.
2. Criar entrada → dialog permanece aberto em erro simulado.
3. Fluxo completo recuperação de senha.
4. Exclusão de cartão bloqueada com gasto em outro mês.

---

## Itens pendentes (fora do escopo — confirmado pelo Dev)

| Item | Motivo | Ação recomendada |
|------|--------|------------------|
| CRUD métodos de pagamento | Feature nova | Backlog produto |
| `reorder*` sem UI | API futura | Manter ou remover export |
| `deleteRule` sem interface | API futura | Backlog produto |
| Repetição limitada ao ano civil | Intencional | Documentar em help/FAQ |
| Ações em lote na seleção | Feature nova | Backlog produto |
| Modo API | Fora da auditoria | Suite dedicada |
| Campo `paid` global em cartões | Confusão de modelo | Documentar ou deprecar |
| Status mensais órfãos | FK/cascade DB | Verificar migration |

---

## Matriz consolidada — achados Alta prioridade (transversal)

| # | Achado | Resultado validação |
|---|--------|---------------------|
| 1 | Status cartão no load inicial | **Aprovado** |
| 2 | Estatísticas não atualizam com fatura paga | **Aprovado** |
| 3 | `canDeleteCardSync` só mês atual | **Aprovado** |
| 4 | Totais brutos vs efetivados | **Aprovado** |
| 5 | INSERTs não atômicos parcelas | **Aprovado com ressalvas** |
| 6 | Matriz delete parcelas "este mês" | **Aprovado** |
| 7 | Mapeamento erros auth em inglês | **Aprovado** |

---

## Critério máximo de aprovação

| Critério | Status |
|----------|--------|
| Problema original resolvido | Sim (maioria) / parcial (atomicidade) |
| Causa raiz eliminada | Sim nos fluxos críticos |
| Regressões aparentes | Nenhuma identificada estaticamente |
| Padrões do projeto | Sim |
| Cenários principais validados | Por análise estática — **teste manual pendente** |
| Build íntegro | Sim |
| Testes recomendados identificados | Sim (seção acima) |
| Sistema simples e manutenível | Sim — `monthTotals.ts` centraliza lógica |

---

## Resultado final

### **Aprovado com ressalvas**

A entrega está **apta para smoke test manual e release beta fechado**, desde que:

1. Os 10 fluxos de reteste manual sejam executados em browser.
2. A limitação de rollback compensatório (vs transação DB) seja aceita pelo time.
3. Pendências de produto permaneçam documentadas no backlog.

---

## Referências

- [Relatório Dev](../DEV/relatorio-correcoes-qa.md)
- [Índice QA](../QA/README.md)
- [Transversal QA](../QA/relatorios/99-transversal.md)
- [Processo Validation](./validation-specialist.mdc)
