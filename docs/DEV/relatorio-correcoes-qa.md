# Relatório de Correções — QA Frontend

| Campo | Valor |
|-------|-------|
| **Data** | 2026-06-17 |
| **Origem** | Relatórios QA (`docs/QA/relatorios/01`–`12`, `99-transversal`) |
| **Processo** | `docs/DEV/techlead-specilist.mdc` |
| **Escopo** | Frontend Supabase (`frontend/src`) |
| **Build** | `npm run build` — OK |

---

## Resumo

Correções aplicadas com foco em **causa raiz**, **mínimo impacto** e **padrões existentes**. Nenhuma troca de biblioteca ou refatoração ampla.

| Categoria | Itens tratados |
|-----------|----------------|
| Severidade Alta | 7 |
| Severidade Média | 12+ |
| Severidade Baixa | 8+ |
| Código morto removido | 3 artefatos |

**Diff aproximado:** 21 arquivos alterados · +643 / −960 linhas (inclui remoção de hooks/componentes legados).

---

## Arquivos novos

| Arquivo | Função |
|---------|--------|
| `frontend/src/utils/business/monthTotals.ts` | Totais efetivados (recebido/pago/investido) com suporte a cartões |
| `frontend/src/utils/authErrors.ts` | Mapeamento de erros Supabase Auth por código + fallback PT-BR |

---

## Arquivos removidos

| Arquivo | Motivo |
|---------|--------|
| `frontend/src/hooks/useFinanceData.ts` | Não importado em nenhum módulo |
| `frontend/src/components/SummaryCards.tsx` | Substituído por `MonthSummarySection`; sem uso |
| `calculateProjection()` em `financialRuleCalculations.ts` | Função sem consumidores |

---

## Correções por área

### Dashboard / Cartões / Estatísticas

| Problema QA | Solução |
|-------------|---------|
| Status de cartão incorreto no load inicial | Sequenciamento: cartões → status mensal em `useSupabaseFinance` |
| Estatísticas não atualizam ao marcar fatura paga | `cardMonthlyStatus` incluído no hash de debounce de `yearData` |
| `yearData` stale ao mudar ano | Reset de `yearData` quando `currentYear` muda |
| `canDeleteCard` só verificava mês atual | Uso do serviço async em `CreditCardStrip` |
| Erros de settings/cartões/status silenciosos | Toasts nos catches do hook |
| Seleções persistem ao trocar mês | Limpeza automática dos Sets em `Index` |
| Logout com toast incondicional | `signOut` lança erro; toast condicional |
| Eixo Y "0k" para valores &lt; 1000 | `formatAxisValue` em `Statistics` |
| Gráfico some durante recarga | Overlay de loading mantendo dados anteriores |
| FAB oculto na visão anual | FAB na visão anual redireciona para mensal e abre menu |

**Arquivos:** `useSupabaseFinance.ts`, `Index.tsx`, `CreditCardStrip.tsx`, `Statistics.tsx`, `MonthRecordsSection.tsx`

---

### Consistência financeira

| Problema QA | Solução |
|-------------|---------|
| Totais brutos vs efetivados (resumo, regra, seleção) | Utilitário `monthTotals.ts` aplicado em resumo, regra e barra de seleção |
| Legenda ausente | Notas "efetivados" em `MonthSummarySection` e `SelectionBottomBar` |

**Arquivos:** `monthTotals.ts`, `MonthSummarySection.tsx`, `financialRuleCalculations.ts`, `FinancialRuleDisplay.tsx`, `Index.tsx`, `SelectionBottomBar.tsx`

---

### Gastos

| Problema QA | Solução |
|-------------|---------|
| INSERTs de parcelas não atômicos | Rollback compensatório por `base_expense_id` em `createExpense` |
| Excluir parcela "este mês" apagava série inteira | `onDelete(id, false)` no fluxo de confirmação |
| Toggle "pago" em gasto de cartão | Bloqueio em `handleTogglePaid` (status vem do cartão) |
| Dialog fecha antes de persistir | `await` + loading nos formulários |
| Categoria em uso sem feedback | Toast ao tentar excluir |

**Arquivos:** `expenses.ts`, `ExpenseSection.tsx`

---

### Entradas / Investimentos / Cartões (formulários)

| Problema QA | Solução |
|-------------|---------|
| Dialog fecha antes de persistir | Handlers retornam `Promise<boolean>`; dialog só fecha em sucesso |
| Tag em uso sem feedback | Toast em `IncomeSection` e `InvestmentSection` |

**Arquivos:** `IncomeSection.tsx`, `InvestmentSection.tsx`, `CreditCardStrip.tsx`, `MonthRecordsSection.tsx`

---

### Autenticação

| Problema QA | Solução |
|-------------|---------|
| Erros dependem de strings em inglês | `authErrors.ts` com mapeamento por `error.code` |
| Sem recuperação de senha | Fluxo `resetPasswordForEmail` + UI "Esqueci minha senha" |
| E-mail sem normalização | `trim().toLowerCase()` antes do envio |
| Logout sem tratamento de erro | Try/catch + toast de erro |
| Campos sensíveis ao alternar login/cadastro | Limpeza de e-mail e senhas |
| Navegação dupla pós-login | Removido `navigate` redundante no submit |
| Senha sem limite máximo | Zod `.max(72)` |
| Env Supabase ausente | Validação em `client.ts` com mensagem clara |

**Arquivos:** `Auth.tsx`, `AuthContext.tsx`, `authErrors.ts`, `client.ts`

---

### Configurações / Regra financeira

| Problema QA | Solução |
|-------------|---------|
| Upsert parcial sobrescrevia colunas | `UPDATE` explícito + `INSERT` só se linha não existir |
| Tags duplicadas no serviço | Normalização com deduplicação case-insensitive |
| Validação de mapeamento ignorada com categorias vazias | Fallback para `DEFAULT_EXPENSE_CATEGORIES` |
| Dialog da regra fecha em erro | `try/catch` mantém wizard aberto |

**Arquivos:** `settings.ts`, `financialRule.ts`, `MonthSummarySection.tsx`

---

### Shell

| Problema QA | Solução |
|-------------|---------|
| Página 404 em inglês | Textos PT-BR + `Link` do React Router |
| Sheet mobile `modal={false}` | Prop removida (comportamento modal padrão) |
| Overlay de tema 400ms | Reduzido para 150ms |

**Arquivos:** `NotFound.tsx`, `Index.tsx`

---

## Otimizações de performance (P1–P3)

Referência: [relatório de performance frontend](../PERFORMANCE/relatorio-performance-frontend.md)

### Visão anual — patch incremental (P1)

| Antes | Depois |
|-------|--------|
| Debounce de 2s + `getYearData` (48 queries) a cada toggle na visão anual | Patch local via `setQueryData` no cache do ano; zero refetch em toggles |
| `yearData` em estado local em `Index.tsx` | `yearData` derivado de `useQuery` no hook (`statisticsEnabled`) |

**Arquivos:** `useSupabaseFinance.ts`, `yearDataSync.ts`, `financeQueries.ts`, `financeQueryKeys.ts`, `Index.tsx`

### React Query (P1/P2)

- `QueryClient` com `staleTime: 60s` global; mês com 30s, ano com 5min
- Mês corrente e ano via `useQuery`; mutações com optimistic update + merge do retorno do serviço
- `addIncome` / `addInvestment` / `addExpense` simples sem `fetchMonthData` pós-create
- `fetchMonthForYear` exposto para invalidações pontuais (parcelas, repetição)

### Bundle — lazy load Recharts (P1)

| Chunk | Gzip |
|-------|------|
| `index` (bundle principal) | **212 KB** (antes ~358 KB) |
| `recharts` (lazy, só visão anual) | 148 KB |
| `Statistics` (lazy) | 1,5 KB |

Redução do bundle inicial: **~146 KB gzip** (meta ≥ 80 KB).

**Arquivos:** `Index.tsx` (`lazy` + `Suspense`), `vite.config.ts` (`manualChunks`)

### Rede — batch inserts (P2)

Loops `for … await insert` substituídos por `.insert([...])` em criação de parcelas e repetições.

**Arquivos:** `expenses.ts`, `incomes.ts`, `investments.ts`

### Render (P2)

- `React.memo` em `IncomeSection`, `ExpenseSection`, `InvestmentSection`, `CreditCardStrip`
- `MonthRecordsSection`: renderização condicional só da aba ativa (sem montar 3 `TabsContent`)
- `useCallback` / `useMemo` em `AuthContext`

### Validação

- [x] `npm run build` sem erros
- [x] Bundle gzip inicial reduzido ≥ 80 KB
- [ ] Network tab: toggles na visão anual = 0 requests (validação manual recomendada)

---

## Ajustes UX/UI (P1–P3)

Referência: [relatório UX/UI](../UX-UI/relatorio-ajustes-ux-ui.md)

### P1 — Linguagem financeira e descoberta

| Item | Solução |
|------|---------|
| Rótulos Planejado/Efetivado nas seções | `SectionTotalsHeader` em Entradas, Gastos e Investimentos |
| Resumo com sufixo efetivado | Métricas em `MonthSummarySection` com `(efetiv.)` e `tabular-nums` |
| Legenda de efetivados | `EffectiveTotalsLegend` (`Alert` + ícone Info) em resumo e estatísticas |
| Barra de seleção com total R$ 0 | `SelectionBottomBar` exibe contagem + total efetivado; visível quando `selectedCount > 0` |
| Hint primeira seleção | `selectionHint.ts` — toast dismissible via `localStorage` |
| Gastos não classificados na regra | `unclassifiedValue` em `financialRuleCalculations.ts` + alerta em `FinancialRuleDisplay` |
| Badge categorias sem mapeamento | Valor em R$ no badge de `MonthSummarySection` |
| Faturas do mês | Header e label "Fatura" em `CreditCardStrip` |
| Empty states com CTA | Botões "Adicionar primeira entrada/gasto/investimento" nas três seções |

**Arquivos novos:** `SectionTotalsHeader.tsx`, `EffectiveTotalsLegend.tsx`, `selectionHint.ts`, `SelectionToggle.tsx`

### P2 — Fluxos e transversal

| Item | Solução |
|------|---------|
| Helper repetição anual | Texto "Repete nos demais meses deste ano." nos formulários |
| Regra com renda zero | Empty state em `FinancialRuleDisplay` |
| Apply-to-all melhorado | `itemSummary`, `isDestructive` em `apply-to-all-dialog.tsx` |
| Nav mobile Mensal/Anual | Segmented control `md:hidden` em `Index.tsx` |
| Label Investimentos | `StatCard title="Investimentos"` em `Statistics` |
| Empty state gráfico anual | Mensagem centralizada quando totais = 0 |
| Separar status vs seleção | `SelectionToggle` à direita; checkbox de status à esquerda |
| Saldo negativo | Subtexto no tile Saldo |
| Badge Via fatura | Em gastos vinculados a cartão |
| Auth copy/autocomplete | `autocomplete`, bloco pós-cadastro, copy de recuperação |
| DeleteConfirm com item | `itemLabel` opcional nas seções de lista |

### P3 — Polish e acessibilidade

| Item | Solução |
|------|---------|
| Overlay de tema removido | Spinner apenas no botão de tema |
| Contagem nos grupos de gastos | Títulos com `(N)` em `ExpenseGroup` |
| Busca no wizard da regra | Filtro quando `categories.length > 8` |
| Redefinir regra | Link + confirmação + `deleteRule()` em `MonthSummarySection` |
| Mês atual no gráfico | Tick bold no mês de `currentMonth` |
| Glossário in-app | `FinancialGlossaryDialog` no footer e menu mobile |
| Footer enxuto | Uma linha em `Index.tsx` |
| FAB label só em `sm+` | Texto completo oculto em mobile |
| Ícones editar/excluir | `opacity-60` em repouso no desktop |
| `aria-live` no main | Após troca de mês |
| Subtítulo estatísticas | "Baseado no ano do mês selecionado no topo" |

**Arquivo novo:** `FinancialGlossaryDialog.tsx`

### Validação UX/UI

- [x] `npm run build` sem erros TypeScript
- [x] Linguagem Planejado/Efetivado consistente nas seções e resumo
- [x] Barra de seleção visível com itens não efetivados
- [x] Alerta de gastos não classificados na regra financeira
- [ ] Testes manuais mobile (nav Mensal/Anual, glossário, seleção)

---

## Lista de Desejos

Referência: [relatório QA 13](../QA/relatorios/13-lista-desejos.md)

| Achado | Severidade | Solução |
|--------|------------|---------|
| Conquista com gasto prossegue se API falhar | Alto | Fluxo em duas etapas: `pendingWishConquer` em `Index.tsx`; conquista + `linked_expense_id` só após `addExpense` bem-sucedido |
| Validação silenciosa no formulário | Médio | Erros inline (`descriptionError`, `valueError`, `targetMonthError`) + botão desabilitado quando inválido |
| Regra de prazo na edição diverge | Médio | Edição valida `targetMonth >= startMonth`; criação valida `>= currentMonth` |
| `linked_expense_id` nunca preenchido | Médio | `conquerWish` aceita `linkedExpenseId`; preenchido no wrapper `handleAddExpense` |
| Expiração automática sem feedback | Médio | `toast.info` após batch `expireWishItems` |
| Conquista irreversível antes do gasto | Médio | Conquista adiada até salvar gasto; toast ao cancelar dialog sem salvar |
| Ordenação duplicada hook + seção | Baixo | Hook expõe só `filterWishesForMonth`; ordenação em `WishSection` |
| Spinner em toda troca de mês | Baixo | Stale-while-revalidate: spinner fullscreen só na carga inicial; `isRefetching` com opacidade sutil |
| `pendingWishConquer` persiste ao trocar aba (revalidação) | Médio | `useEffect` em `Index.tsx` limpa pendência ao sair da aba Gastos ou trocar de mês |
| Copy do dialog de conquista imprecisa (revalidação) | Baixo | Texto atualizado: conquista com gasto só após salvar |
| D1 — Gasto da conquista não efetivado (negócio) | Médio | `ExpenseForm`: `paid: true` automático quando forma de pagamento não é cartão |
| D2 — Valor planejado vs. real (negócio) | Médio | Alert com valor planejado; campo valor vazio com label "Valor real gasto" |
| D3 — Sem sugestão de carteira no rascunho (negócio) | Baixo | `accountId` pré-selecionado quando há exatamente 1 carteira |
| D4 — Gasto órfão se conquista falhar (negócio) | Baixo | Toast orientando conquista manual ou exclusão do gasto |
| D5 — Sem métrica realizado no header (negócio) | Baixo | `getWishRealizedMetrics` + `SectionTotalsHeader` com total realizado |
| Listagem de desejos conquistados (feature) | — | `filterWishesForMonthDisplay` + toggle Este mês/Ano até aqui; itens marcados com checkbox desabilitado |

**Arquivos:** `Index.tsx`, `useWishItems.ts`, `WishSection.tsx`, `ExpenseSection.tsx`, `MonthRecordsSection.tsx`, `wishItems.ts`

### Validação Lista de Desejos

- [x] `npm run build` sem erros TypeScript
- [x] Conquista + gasto: desejo permanece `active` se dialog fechado sem salvar
- [x] Conquista + gasto: `linked_expense_id` preenchido após salvar
- [x] Troca de aba ou mês com pendência ativa limpa `pendingWishConquer`
- [x] Lacunas de negócio D1–D5 (efetivação condicional, valor planejado/real, carteira, toast órfão, métrica realizado)
- [x] Listagem de conquistados com toggle de escopo e filtro por ano do mês selecionado
- [x] Testes unitários `wishItems.test.ts` (14 casos, incl. visibilidade de conquistados)
- [ ] Testes manuais browser (fluxo conquista, expiração, edição de prazo)

---

## Carteiras (Accounts)

Referência: [relatório QA 14](../QA/relatorios/14-carteiras.md)

| Achado | Severidade | Solução |
|--------|------------|---------|
| Carry-forward ignorando anos anteriores | Alto | `getEarliestAccountMovementMonth` + `getAccountHistoryFetchRange` estendido com `earliestMovementMonth` |
| Exclusão não sincroniza estado local | Médio | `deleteAccount` zera `accountId` no cache, remove balances locais, invalida mês e histórico |
| Saldo inicial sem await/erro | Médio | `addAccount` retorna `Account`; saldo inicial via `onUpsertBalance(created.id)` com toast em falha |
| Dialog declaração fecha em falha | Médio | Fecha só quando `onUpsertBalance` retorna `true` |
| Create sem validação de duplicata no adapter | Médio | Checagem `ilike` em `createAccount` (Supabase) |
| Preview só quando valor > 0 | Baixo | Preview com `balanceInput.trim() !== ''` (inclui R$ 0,00) |
| displayOrder fixo na UI | Baixo | Removido `displayOrder: 0` redundante; hook usa `accounts.length` |
| Saldo inicial por nome | Baixo | Resolvido com retorno de `Account` por id |
| `earliestMovementMonth` stale na sessão | Baixo (revalidação) | `fetchEarliestMovementMonth` após add/update de movimentos com `accountId` (substitui `touchEarliestMovementMonth` impreciso) |
| Saldo inicial R$ 0,00 na criação | Baixo (revalidação) | Removido guard `balance > 0` em `AccountStrip`; upsert quando `initialBalance.trim()` |

### Lacunas de negócio (relatório regras de negócio)

Referência: [relatorio-regras-negocio.md](../BUSINESS/relatorio-regras-negocio.md) — módulo Carteiras C1–C6

| Lacuna | Severidade | Solução |
|--------|------------|---------|
| C1 — Dois conceitos de saldo (#15) | Alto | Glossário (`Saldo do mês` vs `Saldo estimado na carteira`); chip `Saldo estimado`; link ao glossário na `AccountStrip` |
| C2 — Movimentos sem carteira (#16) | Médio | Chip `Não vinculados` + `UnlinkedMovementsDialog`; toast info ao criar entrada/gasto sem carteira |
| C3 — Saldo estimado vs histórico (#17) | Médio | Copy reforçada (`estimado do mês anterior`, declaração ancora saldo); glossário explica dependência de declaração |
| C4 — Sem transferências internas (#18) | Baixo | **Backlog MVP** — limitação aceita; transferência manual (saída em A + entrada em B). Ver [proposta-feature-contas.md](proposta-feature-contas.md) |
| C5 — `earliestMovementMonth` stale | Baixo | **Fechado** — refetch via `fetchEarliestMovementMonth` após vínculo de carteira (corrige edge case de repetição cross-year) |
| C6 — Cartão sem carteira pagadora | Baixo | **Implementado** — ao marcar fatura paga, usuário escolhe carteira; débito único via `invoice_payment` |

**Arquivos (negócio):** `FinancialGlossaryDialog.tsx`, `AccountStrip.tsx`, `UnlinkedMovementsDialog.tsx`, `accounts.ts`, `IncomeSection.tsx`, `ExpenseSection.tsx`, `MonthSummarySection.tsx`

**Arquivos:** `accounts.ts` (business + adapter), `useSupabaseFinance.ts`, `AccountStrip.tsx`, `services/accounts.ts`

### Validação Carteiras

- [x] `npm run build` sem erros TypeScript
- [x] Testes unitários `accounts.test.ts` (45+ casos, incl. cross-year e não vinculados)
- [x] Lacunas de negócio C1–C3 (glossário, chip não vinculados, copy estimado)
- [x] C5 confirmado fechado; C4 documentado como backlog; C6 implementado (pagamento de fatura com carteira)
- [x] Revalidação QA 14: 2 achados Baixos residuais corrigidos (`earliestMovementMonth`, saldo inicial zero)
- [ ] Testes manuais browser (exclusão, declaração de saldo, carry-forward multi-ano)

---

## QA básico 2026-07-06

Referência: [17-qa-basico-2026-07-06.md](../QA/relatorios/17-qa-basico-2026-07-06.md)

| Achado | Severidade | Solução |
|--------|------------|---------|
| #1 Dupla contagem Saldo Livre (withdrawal + income) | Alto | `getIncomeMirroredOperationIds` — excluir withdrawals espelhados em `getUnlinkedMonthTotals` |
| #2 Dupla contagem carteira mov (transfer_in + income resgate) | Alto | Excluir `transfer_in` espelhado em `getAccountMonthTotals` (role movement) |
| #3 Lista duplicada dialog Saldo Livre | Médio | Filtrar withdrawals espelhados em `getUnlinkedMovements` e `getAccountMonthMovements` |
| #4 Falha parcial `createWithdrawal` | Médio | Rollback best-effort via `deleteAccountOperation` se `createResgateIncome` falhar; bundle só após sucesso |
| #5 Toggle "Recebido" em entrada de resgate | Médio | `StatusToggleBadge` desabilitado + guard em `handleToggleReceived` |
| #6 Testes desatualizados | Baixo | Cenários legado (só op) e fluxo completo (op + income) em `accounts.test.ts` |
| #7 `deleteOperation` sem `deleteIncome` explícito | Baixo | CASCADE em `add_income_source_operation_id.sql` — OK se migration aplicada |
| #8 Docs gate 15 vs fluxo novo | Baixo | Fluxo canônico = operação + income com `sourceOperationId`; glossário alinhado |

**Arquivos:** `accounts.ts`, `accounts.test.ts`, `useSupabaseFinance.ts`, `IncomeSection.tsx`

### Validação QA 17

- [x] `npm run build` sem erros TypeScript
- [x] Testes unitários incluindo cenários resgate pareado (159/159 frontend)
- [x] Revalidação estática 2026-07-06 — achados #1–#6 **Aprovados**
- [ ] Regressão manual: resgate→Saldo Livre, resgate→carteira mov, toggle resgate

#### Revalidação 2026-07-06 (Validation Engineer)

| Achado | Resultado |
|--------|-----------|
| #1–#3 Dupla contagem / listas | **Aprovado** — `getIncomeMirroredOperationIds` + filtros em totais e movimentos |
| #4 Rollback createWithdrawal | **Aprovado com ressalva** — best-effort; bundle só após sucesso |
| #5 Toggle resgate | **Aprovado** |
| #6 Testes | **Aprovado** — legado + fluxo pareado |
| #7 CASCADE | **Aprovado** — migration presente |
| #8 Docs | **Pendente (Baixo)** — gate 15 não atualizado |

**Veredito revalidação:** **Aprovado com ressalvas** (manual browser + doc gate 15 opcional).

---

## Pendências (fora do escopo desta entrega)

| Item | Motivo |
|------|--------|
| CRUD de métodos de pagamento | Feature nova; não é correção pontual |
| `reorderIncomes/Expenses/Investments` sem UI | API mantida para uso futuro |
| `deleteRule` sem interface | ~~API mantida no hook~~ — UI de redefinição em `MonthSummarySection` (UX/UI P3) |
| Repetição limitada ao ano civil | Regra de negócio documentada; intencional |
| Ações em lote na seleção | Feature nova |
| Modo API (`VITE_DATA_PROVIDER=api`) | Fora do escopo da auditoria atual |
| Testes E2E / browser | Correções validadas por build estático |

---

## Checklist de validação

- [x] Build TypeScript/Vite sem erros
- [x] Padrões do projeto preservados (hooks, serviços, adaptadores Supabase)
- [x] Sem alteração de schema de banco
- [x] Regras de negócio financeiras rastreadas antes de mudanças em totais
- [ ] Testes manuais em browser (recomendado antes de release)
- [ ] Validação formal pelo agente `docs/VALIDATION/validation-specialist.mdc`

---

## Referências

- [Índice QA](../QA/README.md)
- [Backlog transversal](../QA/relatorios/99-transversal.md)
- [Tech Lead — processo](./techlead-specilist.mdc)
