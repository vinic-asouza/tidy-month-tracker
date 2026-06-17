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
