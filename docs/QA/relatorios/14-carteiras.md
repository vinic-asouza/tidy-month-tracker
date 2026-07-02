# Relatório QA — 14 Carteiras (Accounts)

| Campo | Valor |
|-------|-------|
| **Módulo** | Carteiras (Accounts) — Fases 1, 2, 2.1 e 2.2 |
| **Data** | 2026-06-17 |
| **Metodologia** | Auditoria estática de código |
| **Referência** | [ANALISE_FRONTEND_QA.md](../../ANALISE_FRONTEND_QA.md) (linhas 661–751) |
| **Arquivos analisados** | `frontend/src/components/AccountStrip.tsx`, `frontend/src/utils/business/accounts.ts`, `frontend/src/utils/business/__tests__/accounts.test.ts`, `frontend/src/hooks/useSupabaseFinance.ts`, `frontend/src/services/financeQueries.ts`, `frontend/src/services/adapters/supabase/accounts.ts`, `frontend/src/services/adapters/supabase/accountBalances.ts`, `frontend/src/services/adapters/supabase/incomes.ts`, `frontend/src/services/adapters/supabase/expenses.ts`, `frontend/src/services/adapters/supabase/investments.ts`, `frontend/src/pages/Index.tsx`, `frontend/src/components/IncomeSection.tsx`, `frontend/src/components/ExpenseSection.tsx`, `frontend/src/components/InvestmentSection.tsx`, `supabase/migrations/create_accounts.sql`, `supabase/migrations/create_account_balances.sql`, `supabase/migrations/add_account_id_to_movements.sql` |

---

## Resumo executivo

**Objetivo do módulo:** Organizar movimentos por carteira global do usuário, exibir métricas efetivadas do mês, declarar saldos iniciais e calcular saldo cumulativo (carry-forward) entre meses, com investimentos obrigatoriamente vinculados a uma carteira.

**Veredito geral:** Aprovado com ressalvas — arquitetura sólida (camadas, RLS, testes unitários extensivos), UI alinhada à ANALISE e integração com Entradas/Gastos/Investimentos presente; há riscos em carry-forward cross-year, sincronização local pós-exclusão e tratamento de erros em declaração de saldo.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 1 |
| Médio | 4 |
| Baixo | 3 |

> **Revalidação (2026-06-17):** ver [seção Revalidação](#revalidação-2026-06-17) — 8/8 achados corrigidos; veredito atualizado para **Aprovado** com 2 achados baixos residuais.
>
> **Validação lacunas C1–C6 (2026-07-02):** ver [seção Validação plano C1–C6](#validação-plano-c1c6-2026-07-02) — plano implementado; veredito **Aprovado** (2 Baixos opcionais).

---

## Mapa de fluxos validados

| # | Fluxo / Checklist (ANALISE) | Status | Observação |
|---|----------------------------|--------|------------|
| 1 | CRUD de carteira (nome, tipo, cor) | OK | Dialog + validação de nome |
| 2 | Rejeitar nome duplicado | OK com ressalva | Só no client; update valida no adapter |
| 3 | Exclusão com SET NULL nos movimentos | OK com ressalva | DB correto; estado local pode ficar stale |
| 4 | FAB "Carteira" + posição no dashboard | OK | Entre resumo e registros |
| 5 | Métricas efetivadas (Entrou/Saiu/Aportado) | OK | `getAccountMonthTotals` + `isExpenseEffectivelyPaid` |
| 6 | Seletor opcional em Entradas/Gastos | OK | Quando `accounts.length > 0` |
| 7 | Carteira obrigatória em Investimentos | OK | Validação + empty state com atalho |
| 8 | `tag` derivada do nome da carteira | OK | `InvestmentSection` L438–439 |
| 9 | Declarar saldo (início do mês) | OK com ressalva | Dialog fecha mesmo em falha |
| 10 | Saldo inicial na criação | OK com ressalva | `pendingInitialBalance` sem feedback de erro |
| 11 | Carry-forward entre meses | Achado | Limitado ao ano civil sem âncora |
| 12 | Alerta contextual ao declarar saldo | OK | `getBalanceDeclarationWarning` + preview |
| 13 | Saldo atual + início (declarado / mês anterior) | OK | Fase 2.2 implementada |
| 14 | `account_id` em repetições | OK | Propagado nos adapters; `omitEffectiveStatus` em status |
| 15 | RLS / permissões | Não verificável | Políticas nas migrations |

Legenda: **OK** — consistente com regras documentadas; **Achado** — ver seção Achados; **Não verificável** — requer runtime ou ambiente Supabase.

---

## Áreas obrigatórias de validação

### 1. Fluxo do usuário

Jornada principal coerente: criar carteira → vincular movimentos → ver chip com saldo e breakdown → declarar saldo quando necessário. FAB e botão "Novo" na faixa facilitam criação. Dialog de investimento sem carteiras redireciona para criação (`onRequestAddAccount`). Alerta âmbar ao declarar saldo com movimentações efetivadas é claro e inclui preview reativo.

### 2. Regras de negócio

Totais mensais consideram apenas itens efetivados, alinhados ao resumo. Aporte investido **soma** na variação líquida (`inflow − outflow + invested`). Exclusão de carteira não apaga movimentos (SET NULL no DB). Saldo declarado representa **início do mês**; fechamento = abertura + variação efetiva. Lacuna: carry-forward sem declaração depende do intervalo histórico carregado.

### 3. Validações

Nome obrigatório e duplicata checados no `AccountStrip`. Investimento exige carteira. Saldo inicial e declaração aceitam `0` (válido). DB não impõe `UNIQUE` em `accounts.name`.

### 4. Tratamento de erros

`addAccount`, `updateAccount`, `deleteAccount` e `upsertAccountBalance` exibem toast e fazem rollback otimista no hook. `AccountStrip` não verifica retorno de `onUpsertBalance` no efeito de saldo inicial nem no dialog de declaração.

### 5. Estados da interface

Empty state com CTA tracejado; chips com scroll horizontal; ordenação no header; spinner no submit. Sem loading dedicado na faixa (dados globais do hook).

### 6. Consistência da experiência

`SectionSurface`, dialogs e ordenação seguem padrão de `CreditCardStrip`. Cores reutilizam `CARD_COLORS`. Terminologia "Carteira" consistente nos formulários.

### 7. Persistência e dados

UPSERT em `account_balances` com `onConflict`. Histórico via React Query (`accountHistoryMonths`). `deleteAccount` não invalida bundle do mês nem limpa `accountBalances` local.

### 8. Código e implementação

Separação facade → adapter → mapper. Testes cobrem visibilidade, carry-forward, warning e fetch range. `getAccountProjectedBalance` marcado deprecated em favor de closing balance.

### 9. Casos de borda

Movimentos sem `accountId` ignorados nos totais. Usuário com histórico em ano anterior sem declaração. Duplo submit na criação. Declarar saldo `0` com movimentos (alerta de preview não aparece). Renomear carteira antes do efeito de saldo inicial aplicar.

### 10. Segurança funcional

Queries filtram por `user_id`; RLS em `accounts` e `account_balances`. Sem exposição cross-user no código analisado.

---

## Achados

### Carry-forward ignorando movimentos de anos anteriores sem declaração

**Severidade:** Alto

**Módulo:** Carteiras (Fase 2.2)

**Fluxo afetado:** Visualizar saldo cumulativo em mês sem declaração manual e sem âncora de saldo no ano corrente

**Evidência:**

Arquivos:
- `frontend/src/utils/business/accounts.ts` (L42–62, L189–197)
- `frontend/src/hooks/useSupabaseFinance.ts` (L139–172)

`getAccountHistoryFetchRange` sem âncora de saldo usa `from = ${ano}-01` (início do ano civil). `getAccountOpeningBalance` sem declaração soma apenas chaves presentes em `monthDataByMonth` anteriores ao mês visualizado.

**Comportamento atual:** Usuário com movimentos efetivados em 2025, sem saldo declarado, ao navegar para 2026-03 vê abertura calculada só com variações de 2026-01 e 2026-02 — movimentos de 2025 não entram no carry-forward.

**Comportamento esperado:** Saldo inicial reflete toda a cadeia desde o primeiro movimento vinculado à carteira, ou o produto exige declaração explícita ao virar o ano (com UX que oriente isso).

**Impacto:** Saldo exibido no chip pode estar significativamente errado para usuários de longa data sem declaração; decisões financeiras baseadas em número incorreto.

**Recomendação:** Estender `getAccountHistoryFetchRange` para buscar desde o primeiro mês com movimento/`account_id`, ou exigir declaração de saldo ao detectar virada de ano; documentar limitação se intencional.

---

### Exclusão de carteira não sincroniza movimentos nem saldos no estado local

**Severidade:** Médio

**Módulo:** Carteiras

**Fluxo afetado:** Excluir carteira com movimentos vinculados

**Evidência:**

Arquivos:
- `frontend/src/hooks/useSupabaseFinance.ts` (L781–797)
- `supabase/migrations/add_account_id_to_movements.sql` (ON DELETE SET NULL)
- `supabase/migrations/create_account_balances.sql` (ON DELETE CASCADE)

`deleteAccount` remove apenas de `accounts`; não chama `invalidateCurrentMonth`, não zera `accountId` nos movimentos em cache, nem remove entradas de `accountBalances` locais (CASCADE ocorre só no DB).

**Comportamento atual:** Chip some imediatamente, mas movimentos do mês corrente podem manter `accountId` órfão na memória até refetch. Saldos declarados da carteira excluída podem permanecer em `accountBalances` até reload.

**Comportamento esperado:** Após exclusão bem-sucedida, refetch do mês e `fetchAccountBalances`, ou patch local zerando `accountId` e removendo balances da carteira.

**Impacto:** Totais de outras carteiras corretos (chip removido), mas inconsistência temporária em dados locais e possível interferência em cálculos de histórico até navegação/reload.

**Recomendação:** Após `deleteAccount`, invalidar mês corrente + atualizar `accountBalances` e `accountHistoryQuery`.

---

### Saldo inicial na criação aplicado sem await nem tratamento de erro

**Severidade:** Médio

**Módulo:** Carteiras (Fase 2)

**Fluxo afetado:** Criar carteira com "Saldo inicial" preenchido

**Evidência:**

Arquivo: `frontend/src/components/AccountStrip.tsx` (L245–283)

```typescript
useEffect(() => {
  // ...
  onUpsertBalance(account.id, pendingInitialBalance.yearMonth, pendingInitialBalance.balance);
  setPendingInitialBalance(null);
}, [accounts, pendingInitialBalance, onUpsertBalance]);
```

Chamada fire-and-forget; conta localizada por **nome** (case-insensitive); `pendingInitialBalance` limpo mesmo se upsert falhar.

**Comportamento atual:** Usuário vê carteira criada com sucesso; saldo inicial pode não persistir sem aviso. Renomear ou colisão de nomes (improvável pela validação) pode vincular ao registro errado.

**Comportamento esperado:** `await onUpsertBalance`, toast em falha, e preferencialmente usar ID retornado por `onAdd` em vez de match por nome.

**Impacto:** Saldo declarado ausente sem feedback; fricção para reconciliar manualmente.

**Recomendação:** Retornar `Account` criado de `addAccount` ou callback com `id`; aplicar saldo inicial com confirmação de sucesso.

---

### Dialog "Declarar saldo" fecha mesmo quando o upsert falha

**Severidade:** Médio

**Módulo:** Carteiras (Fase 2.2)

**Fluxo afetado:** Declarar ou atualizar saldo manual

**Evidência:**

Arquivo: `frontend/src/components/AccountStrip.tsx` (L305–315)

```typescript
try {
  await onUpsertBalance(balanceDialogAccount.id, currentMonth, value);
} finally {
  setIsSavingBalance(false);
  setBalanceDialogAccount(null);
  setBalanceInput('');
}
```

Retorno booleano de `onUpsertBalance` ignorado; `finally` sempre fecha o dialog.

**Comportamento atual:** Em falha de rede/API, toast de erro aparece (no hook), mas dialog fecha e valor digitado é perdido.

**Comportamento esperado:** Manter dialog aberto com input preservado quando `onUpsertBalance` retorna `false`.

**Impacto:** Retrabalho ao redigitar saldo; sensação de sucesso parcial.

**Recomendação:** Fechar dialog apenas em retorno `true`; mover reset para branch de sucesso.

---

### Criação de conta sem validação de duplicata no adapter Supabase

**Severidade:** Médio

**Módulo:** Carteiras (Fase 1)

**Fluxo afetado:** Criar carteira com nome já existente (bypass da UI)

**Evidência:**

Arquivos:
- `frontend/src/services/adapters/supabase/accounts.ts` — `createAccount` sem checagem; `updateAccount` valida com `ilike` (L49–59)
- `supabase/migrations/create_accounts.sql` — sem constraint `UNIQUE(user_id, name)`

**Comportamento atual:** UI impede duplicata via `accountNameExists`; INSERT direto ou race de duplo clique pode criar duas carteiras com mesmo nome.

**Comportamento esperado:** Validação simétrica em create (adapter ou constraint DB), como em `updateAccount`.

**Impacto:** Ambiguidade na seleção de carteiras; `pendingInitialBalance` por nome pode aplicar saldo na carteira errada.

**Recomendação:** Reutilizar checagem `ilike` em `createAccount` ou adicionar índice único parcial no banco.

---

### `displayOrder` sempre zero na criação via UI

**Severidade:** Baixo

**Módulo:** Carteiras

**Fluxo afetado:** Ordenação padrão da faixa

**Evidência:** `AccountStrip.tsx` L229 — `displayOrder: 0` fixo; ordenação "Padrão" não usa `display_order` do banco.

**Comportamento atual:** Todas as carteiras com mesma ordem; sort padrão equivale à ordem do array retornado pela API.

**Comportamento esperado:** Incrementar `displayOrder` ou expor reordenação (se previsto).

**Impacto:** Cosmético; ordenação alfabética e por movimentação funcionam.

**Recomendação:** Usar `accounts.length` como em `addAccount` no hook, ou documentar que ordem padrão é por criação.

---

### Preview de saldo após declarar só quando valor digitado > 0

**Severidade:** Baixo

**Módulo:** Carteiras (Fase 2.2)

**Fluxo afetado:** Declarar saldo zero com movimentações no mês

**Evidência:** `AccountStrip.tsx` L176–178 — `parsedBalanceInput > 0` para exibir `projectedClosingAfterDeclare`.

**Comportamento atual:** Usuário que declara R$ 0,00 com movimentações vê alerta textual mas não o preview numérico do saldo estimado.

**Comportamento esperado:** Preview para qualquer valor válido, inclusive zero.

**Impacto:** Menos clareza em edge case legítimo (conta zerada no início do mês).

**Recomendação:** Remover condição `> 0` ou usar `>= 0` com input validado.

---

### Vinculação do saldo inicial por nome da carteira

**Severidade:** Baixo

**Módulo:** Carteiras (Fase 2)

**Fluxo afetado:** Criar carteira + saldo inicial

**Evidência:** `AccountStrip.tsx` L277–278 — `accounts.find(a => a.name.toLowerCase() === ...)`.

**Comportamento atual:** Funciona com validação de nome único na UI; frágil se duplicatas existirem no DB.

**Comportamento esperado:** Identificar conta recém-criada por `id`.

**Impacto:** Baixo enquanto unicidade de nome for garantida.

**Recomendação:** Resolver junto com retorno de `id` em `addAccount`.

---

## Itens sem achado

- `getAccountMonthTotals` alinhado a efetivados e fatura de cartão paga
- `getBalanceDeclarationWarning` com cenários `replace_carry_forward` e `update_declaration`
- Testes unitários extensivos em `accounts.test.ts`
- RLS nas migrations `accounts` e `account_balances`
- `AccountStrip` entre resumo e registros; FAB `account`
- Select opcional em `IncomeSection` e `ExpenseSection`
- Carteira obrigatória e empty state em `InvestmentSection`
- `omitEffectiveStatus` em edições apply-to-all (status não propaga)
- `account_id` propagado em repetições nos adapters
- Alerta contextual e copy de saldo no **início** do mês (Fase 2.2)
- Indicadores "declarado" e "↳ mês anterior" nos chips
- Confirmação de exclusão mencionando desvinculação (SET NULL)

---

## Riscos residuais (não verificáveis estaticamente)

- Comportamento real de RLS e CASCADE em ambiente Supabase
- Performance de `fetchMonthsRange` com muitos meses no intervalo
- Precisão de carry-forward com mudança de status de fatura em meses históricos
- Modo API (`adapters/api/accounts.ts`, `accountBalances.ts`) não exercido
- Acessibilidade da faixa horizontal e menus em mobile
- Sincronização ao editar `accountId` em movimentos com mês já renderizado

---

## Referências cruzadas

- [04-entradas.md](./04-entradas.md) — seletor opcional de carteira
- [05-gastos.md](./05-gastos.md) — seletor opcional; `omitEffectiveStatus`
- [07-investimentos.md](./07-investimentos.md) — carteira obrigatória (Fase 2.1)
- [06-cartoes.md](./06-cartoes.md) — paridade de padrão com `CreditCardStrip`
- [03-resumo-mensal.md](./03-resumo-mensal.md) — critério efetivado compartilhado
- [99-transversal.md](./99-transversal.md) — consistência planejado vs efetivado

---

## Revalidação (2026-06-17)

| Campo | Valor |
|-------|-------|
| **Tipo** | Revalidação pós-correção |
| **Referência dev** | [relatorio-correcoes-qa.md](../../DEV/relatorio-correcoes-qa.md) — seção Carteiras |
| **Metodologia** | Auditoria estática + testes unitários (`accounts.test.ts`, 39 casos OK) |
| **Veredito** | **Aprovado** — achado Alto e 4 Médios + 3 Baixos originais corrigidos; 2 Baixos residuais |

### Status dos achados originais

| # | Achado | Sev. original | Status | Evidência da correção |
|---|--------|---------------|--------|------------------------|
| 1 | Carry-forward ignorando anos anteriores | Alto | **Corrigido** | `getEarliestAccountMovementMonth` no adapter; `getAccountHistoryFetchRange` aceita `earliestMovementMonth` (L46–65 em `accounts.ts`); hook passa estado em `useSupabaseFinance` L156–164 |
| 2 | Exclusão não sincroniza estado local | Médio | **Corrigido** | `deleteAccount` L801–837: zera `accountId` no cache, remove balances, `invalidateCurrentMonth` + invalida `accountHistory` |
| 3 | Saldo inicial sem await/erro | Médio | **Corrigido** | `addAccount` retorna `Account`; `handleSubmit` L234–244 usa `created.id` + `await onUpsertBalance` + toast em falha |
| 4 | Dialog declaração fecha em falha | Médio | **Corrigido** | `handleSaveBalance` L281–285: fecha só se `success === true` |
| 5 | Create sem validação de duplicata | Médio | **Corrigido** | `createAccount` adapter L26–34: checagem `ilike` antes do INSERT |
| 6 | `displayOrder` fixo na UI | Baixo | **Corrigido** | Payload sem `displayOrder` fixo; hook usa `accounts.length` (L764) |
| 7 | Preview só quando valor > 0 | Baixo | **Corrigido** | `projectedClosingAfterDeclare` usa `balanceInput.trim() !== ''` (L177–179) |
| 8 | Saldo inicial por nome | Baixo | **Corrigido** | Removido `pendingInitialBalance` por nome; fluxo síncrono com `created.id` |

### Novos achados residuais (pós-correção)

#### `earliestMovementMonth` não atualiza ao vincular primeiro movimento na sessão

**Severidade:** Baixo

**Fluxo afetado:** Primeira entrada/gasto/investimento com `accountId` após load, depois navegar para ano/mês distante sem reload

**Evidência:** `fetchEarliestMovementMonth` chamado só em `loadInitialData` e `addAccount` (`useSupabaseFinance.ts` L105–113, L767) — não após `addIncome`/`addExpense`/`addInvestment`.

**Comportamento atual:** Se `earliestMovementMonth` era `null` no load e o usuário vincula movimentos na sessão, o intervalo histórico pode continuar limitado ao ano corrente até reload — carry-forward cross-year impreciso nesse cenário raro.

**Recomendação:** Chamar `fetchEarliestMovementMonth` após criar/atualizar movimento que define `accountId` pela primeira vez, ou derivar do cache local.

---

#### Saldo inicial R$ 0,00 na criação não é persistido

**Severidade:** Baixo

**Fluxo afetado:** Criar carteira com saldo inicial explicitamente zero

**Evidência:** `AccountStrip.tsx` L239 — `if (balance > 0)` antes do upsert.

**Comportamento atual:** Usuário que digita `0` não grava declaração (equivalente a omitir). Declarar zero depois via menu funciona.

**Impacto:** Edge case legítimo mas raro; sem inconsistência grave.

**Recomendação:** Usar `initialBalance.trim() !== ''` em vez de `balance > 0`, alinhado ao dialog de declaração.

### Mapa de fluxos — pós-revalidação

| # | Fluxo | Status |
|---|-------|--------|
| 1–8 | CRUD, seletores, investimento obrigatório | OK |
| 9–10 | Declarar saldo / saldo inicial na criação | OK com ressalva (zero na criação) |
| 11 | Carry-forward cross-year | OK com ressalva (refresh de `earliestMovementMonth`) |
| 12–15 | Alertas, chips, repetições, RLS | OK / não verificável |

### Contagem pós-revalidação

| Severidade | Antes | Depois |
|------------|-------|--------|
| Crítico | 0 | 0 |
| Alto | 1 | 0 |
| Médio | 4 | 0 |
| Baixo | 3 | 2 (residual) |

---

## Validação plano C1–C6 (2026-07-02)

| Campo | Valor |
|-------|-------|
| **Tipo** | Validação pós-implementação (lacunas de negócio) |
| **Referência** | [lacunas_carteiras_c1-c6_1dd12a28.plan.md](/home/vinicius-souza/.cursor/plans/lacunas_carteiras_c1-c6_1dd12a28.plan.md) |
| **Referência dev** | [relatorio-correcoes-qa.md](../../DEV/relatorio-correcoes-qa.md) L317–340 |
| **Metodologia** | Auditoria estática + `npm run build` OK + `accounts.test.ts` 45/45 |
| **Veredito** | **Aprovado** — C1–C3 implementados; C4/C6 documentados; C5 confirmado fechado |

### Checklist do plano

| Item | Status | Evidência |
|------|--------|-----------|
| Build TypeScript | OK | `npm run build` sem erros |
| Testes unlinked + existentes | OK | 45 casos em `accounts.test.ts` |
| C1 — Glossário dois saldos | OK | `FinancialGlossaryDialog.tsx` L26–31 |
| C1 — Chip `Saldo estimado` | OK | `AccountStrip.tsx` L401 |
| C1 — Subtitle + link glossário | OK | L539–542, L517–530 |
| C1 — Hint resumo (opcional) | OK | `MonthSummarySection.tsx` L67 (saldo negativo) |
| C2 — `getUnlinkedMonthTotals` / `getUnlinkedMovements` | OK | `accounts.ts` L102–170 |
| C2 — Chip `Não vinculados` | OK | `AccountStrip.tsx` L447–483, L560 (`hasUnlinkedMovements`) |
| C2 — Modal detalhes | OK | `UnlinkedMovementsDialog.tsx` |
| C2 — Toast ao criar sem carteira | OK | `IncomeSection.tsx` L512–513; `ExpenseSection.tsx` L1005–1006 (só criação) |
| C3 — Copy carry-forward | OK | `↳ estimado do mês anterior` L412 |
| C3 — Dialog declaração ancora | OK | L705–707 |
| C4 — Backlog documentado | OK | `relatorio-correcoes-qa.md` L326 |
| C5 — `touchEarliestMovementMonth` | OK | `useSupabaseFinance.ts` L115–118; chamadas em add/update income/expense/investment |
| C6 — Decisão adiada documentada | OK | `relatorio-correcoes-qa.md` L328 |
| Cenários manuais browser | Não verificável | Fora do escopo da auditoria estática |

### Status por lacuna

| Lacuna | Plano | Validação |
|--------|-------|-----------|
| **C1** Dois conceitos de saldo | Glossário + rótulos | **Conforme** — sem mudança de cálculo |
| **C2** Movimentos invisíveis | Chip + modal + toast | **Conforme** — investimentos excluídos (sempre exigem carteira) |
| **C3** Copy estimado | Reforço textual | **Conforme** — alinhado a C1 no glossário |
| **C4** Transferências | Backlog | **Conforme** — sem código (escopo correto) |
| **C5** `earliestMovementMonth` stale | Validar fechado | **Conforme** — `touchEarliestMovementMonth` corrige achado Baixo da revalidação QA |
| **C6** Fatura ↔ carteira | Backlog | **Conforme** — documentado |

### Regras de negócio verificadas (C2)

| Regra | Implementação | OK |
|-------|---------------|-----|
| Entrada não vinculada | `!accountId && received` | Sim |
| Gasto não vinculado | `!accountId && isExpenseEffectivelyPaid` | Sim |
| Investimento | Ignorado em unlinked | Sim |
| Chip visível | `accounts.length > 0` e inflow/outflow > 0 | Sim |
| Estilo neutro tracejado | `border-dashed`, sem saldo cumulativo | Sim |
| Zero mudança em `getAccountMonthTotals` | Funções novas isoladas | Sim |

### Achados residuais (opcionais)

#### Hint "Saldo do mês" só quando saldo negativo

**Severidade:** Baixo (cosmético)

**Evidência:** `MonthSummarySection.tsx` L67 — hint exibido apenas se `balance < 0`.

**Impacto:** Usuário com saldo positivo não vê a distinção no resumo; glossário e chips de carteira cobrem C1.

**Recomendação:** Opcional — exibir hint ou tooltip também no saldo positivo.

---

#### `touchEarliestMovementMonth` usa mês navegado, não mês do lançamento

**Severidade:** Baixo (edge case)

**Evidência:** Updates chamam `touchEarliestMovementMonth(currentMonth, updates.accountId)` — `currentMonth` é o mês visualizado, não necessariamente o `year_month` do item em séries repetidas.

**Impacto:** Vincular carteira a item de outro mês via apply-to-all pode subestimar `earliestMovementMonth` até reload.

**Recomendação:** Passar `yearMonth` do bundle do item quando disponível.

### Itens sem achado nesta validação

- Toast disparado só em **criação** (não edição)
- Modal sem edição inline (escopo mínimo respeitado)
- Saldo inicial R$ 0,00 na criação corrigido (`initialBalance.trim()`)
- Documentação C4/C6/C5 em `relatorio-correcoes-qa.md`
- Nenhuma regressão detectada em `getAccountMonthTotals`

### Contagem pós-validação C1–C6

| Severidade | Novos achados |
|------------|---------------|
| Crítico | 0 |
| Alto | 0 |
| Médio | 0 |
| Baixo | 2 (opcionais / edge case) |

> **Validação lacunas C1–C6 (2026-07-02):** ver [seção Validação plano C1–C6](#validação-plano-c1c6-2026-07-02) — plano implementado conforme especificado; veredito **Aprovado**.

