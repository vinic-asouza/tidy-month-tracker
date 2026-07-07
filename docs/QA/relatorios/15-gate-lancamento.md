# Relatório QA — 15 Gate de Lançamento Finto (Fases 1, 2 e 2.5)

| Campo | Valor |
|-------|-------|
| **Escopo** | Gate de lançamento público — confiança nos números, clareza UX/copy, resgate + transferência |
| **Data** | 2026-07-03 |
| **Metodologia** | Auditoria estática de código + build/lint/testes unitários dos módulos alterados |
| **Referência** | [plano-pre-lancamento.md](../../DEV/plano-pre-lancamento.md), [gate_lançamento_finto_7bd6d5b0.plan.md](/home/vinicius-souza/.cursor/plans/gate_lançamento_finto_7bd6d5b0.plan.md) |
| **Arquivos analisados** | `useSupabaseFinance.ts`, `repeatMonths.ts`, `FinancialRuleDisplay.tsx`, `AnnualFinancialRuleSection.tsx`, `MonthSummarySection.tsx`, `SectionTotalsHeader.tsx`, `monthTotals.ts`, `accounts.ts`, `AccountStrip.tsx`, `UnlinkedMovementsDialog.tsx`, `WithdrawalDialog.tsx`, `TransferDialog.tsx`, `SelectionBottomBar.tsx`, `CreditCardStrip.tsx`, `IncomeSection.tsx`, `ExpenseSection.tsx`, `InvestmentSection.tsx`, `FinancialGlossaryDialog.tsx`, `financeQueries.ts`, `accountOperations.ts`, `create_account_operations.sql`, testes em `repeatMonths.test.ts`, `financialRuleCalculations.test.ts`, `monthTotals.test.ts`, `accounts.test.ts` |

---

## Resumo executivo

**Objetivo do gate:** Fechar lacunas que bloqueiam confiança nos números e alinhar produto ↔ marketing antes da divulgação pública — Fases 1 (P1), 2 (P2) e 2.5 (resgate + transferência).

**Veredito geral (auditoria inicial):** **Aprovado com ressalvas** — Fases 1, 2 e 2.5 implementadas; 2 Médio + 3 Baixo identificados.

**Veredito pós-correções (revalidação 2026-07-03):** **Aprovado com ressalvas** — achados #1, #2, #4 e #5 **corrigidos** ([validação](../VALIDATION/relatorio-validacao-gate-correcoes-qa.md)); restam #3 (Baixo, fora do escopo), regressão manual e marketing.

| Severidade | Inicial | Pós-revalidação |
|------------|---------|-----------------|
| Crítico | 0 | 0 |
| Alto | 0 | 0 |
| Médio | 2 | 0 |
| Baixo | 3 | 1 (#3 transação atômica) |

---

## Mapa de validação por fase

| # | Item do plano | Status | Evidência |
|---|---------------|--------|-----------|
| **Fase 1.2** | `getYearRefreshMonths` + `refreshAffectedYearMonths` em delete apply-to-all | ✅ OK | `repeatMonths.ts`, `useSupabaseFinance.ts` L319–321; 12 testes em `repeatMonths.test.ts` |
| **Fase 1.1** | Linha “Não classificado” + rodapé reconciliação + glossário | ✅ OK | `FinancialRuleDisplay.tsx` L308–408; `AnnualFinancialRuleSection.tsx` reutiliza componente; teste reconciliação em `financialRuleCalculations.test.ts` |
| **Fase 1.3** | Headers invertidos + `calculatePendingMonthTotals` + pendências no resumo | ✅ OK | Revalidado — `receivedIncome` separado de resgates; teste em `monthTotals.test.ts` |
| **Fase 1.4** | Rótulo “Saldo estimado” + glossário expandido | ✅ OK | `AccountStrip.tsx` L443; `FinancialGlossaryDialog.tsx` (12 entradas) |
| **Fase 2** | Saldo Livre, banner investimentos, toasts, tooltip cartão, seleção, copy repetição | ✅ OK | `AccountStrip`, `UnlinkedMovementsDialog`, `InvestmentSection.tsx` L617–621, toasts em Income/Expense, `CreditCardStrip.tsx` L252–255, `SelectionBottomBar.tsx` L40–43, helper text em Income/Expense/Investment |
| **Fase 2.5** | Migration + adapter + cálculos + UI resgate/transferência | ✅ OK | Revalidado — exclusão via Saldo Livre + `AccountMonthOperationsDialog`; 49 testes `accounts.test.ts` |
| **Técnico** | Build + lint + testes | ✅ OK | `npm run build` OK; 67/67 testes gate |
| **Manual** | Regressão browser, apply-to-all no gráfico anual | ⏳ Pendente | Não verificável estaticamente |

Legenda: **✅ OK** — implementado e consistente com o plano; **⚠️ Ressalva** — implementado com lacuna documentada; **⏳ Pendente** — requer validação manual ou outro time.

---

## Áreas obrigatórias de validação

### 1. Fluxo do usuário

Jornadas principais do gate estão cobertas: reconciliação na regra, resumo com pendências, Saldo Livre renomeado, banner pedagógico em Investimentos, resgate e transferência via menus em Carteiras. Dialogs de resgate/transferência têm copy clara sobre efeito no resumo e no Saldo Livre.

Exclusão de operações disponível no Saldo Livre (resgates) e em “Operações do mês” no menu da carteira (revalidação 2026-07-03).

### 2. Regras de negócio

- Resgates entram em `totalIncome` e Saldo Livre; **não** entram na regra 50/30/20 — alinhado ao plano.
- Transferências excluídas de `calculateEffectiveMonthTotals` — testado em `monthTotals.test.ts`.
- `getAccountMonthTotals` trata `withdrawal`, `transfer_out`, `transfer_in` — testado em `accounts.test.ts`.
- `fetchYearData` inclui `accountOperations` — visão anual consistente após apply-to-all corrigido.

### 3. Validações

Transferência valida origem ≠ destino e valor > 0. Resgate exige carteira e valor > 0. RLS na migration restringe por `user_id`.

### 4. Tratamento de erros

Toasts em falha de resgate/transferência/exclusão no hook. Estado local atualizado otimisticamente após sucesso.

### 5. Consistência

Terminologia “Saldo Livre”, “Saldo estimado”, glossário unificado. Hierarquia efetivado > planejado nas seções espelha o resumo.

---

## Achados

### #1 — Pendência “A receber” subestimada quando há resgate no mês

| Campo | Valor |
|-------|-------|
| **Severidade** | Médio |
| **Fase** | 1.3 |
| **Arquivo** | `frontend/src/utils/business/monthTotals.ts` L64–81 |

**Descrição:** `calculatePendingMonthTotals` calcula `pendingIncome = plannedIncome - effective.totalIncome`. Como `effective.totalIncome` inclui resgates (`withdrawal`), o resgate reduz artificialmente a pendência de entradas planejadas.

**Cenário:** Salário planejado R$ 5.000, recebido R$ 4.000, resgate R$ 500 na carteira.
- Esperado “A receber”: R$ 1.000
- Calculado: R$ 0 (5.000 − 4.500)

**Impacto:** Usuário com resgate no mês pode não ver pendência de salário ainda não recebido — contradiz D1 (educar planejado − efetivado por **tipo** de entrada).

**Sugestão para dev:** Subtrair resgates de `effective.totalIncome` apenas na fórmula de pendência de renda, ou calcular `receivedIncome` separado de `withdrawalIncome`.

---

### #2 — Exclusão de operações patrimoniais sem UI

| Campo | Valor |
|-------|-------|
| **Severidade** | Médio |
| **Fase** | 2.5 |
| **Arquivos** | `useSupabaseFinance.ts` L1290–1317, `Index.tsx` L101 |

**Descrição:** `deleteOperation` está implementado no hook (remove par por `transfer_group_id` no adapter) mas **não é passado** a nenhum componente. Checklist do plano exige: *“Exclusão de operação reverte cálculos corretamente”*.

**Impacto:** Usuário não consegue desfazer resgate/transferência errada sem suporte técnico ou SQL.

**Sugestão para dev:** Ação no `UnlinkedMovementsDialog` (resgates) e/ou menu do chip da carteira (histórico de operações do mês) com `DeleteConfirmDialog`.

---

### #3 — Transferência sem transação atômica no banco

| Campo | Valor |
|-------|-------|
| **Severidade** | Baixo |
| **Fase** | 2.5 |
| **Arquivo** | `frontend/src/services/adapters/supabase/accountOperations.ts` L58–82 |

**Descrição:** `createTransfer` faz insert duplo via Supabase client. Falha entre os dois inserts poderia deixar par incompleto (mitigado parcialmente por `deleteAccountOperation` que remove por `transfer_group_id`).

**Sugestão:** RPC Postgres ou Edge Function com transação — pós-MVP aceitável se monitorado.

---

### #4 — “Entradas (efetiv.)” no resumo agrega resgates sem distinção visual

| Campo | Valor |
|-------|-------|
| **Severidade** | Baixo |
| **Fase** | 2.5 |
| **Arquivo** | `MonthSummarySection.tsx` L78 |

**Descrição:** Por design, resgates somam em `totalIncome`. O rótulo “Entradas (efetiv.)” não diferencia receitas de resgates — pode confundir quem compara com extrato de salário.

**Sugestão:** Tooltip ou linha secundária “incl. resgates” quando `accountOperations` tiver withdrawal no mês.

---

### #5 — Cobertura de testes de pendência com resgate ausente

| Campo | Valor |
|-------|-------|
| **Severidade** | Baixo |
| **Fase** | 1.3 |
| **Arquivo** | `frontend/src/utils/business/__tests__/monthTotals.test.ts` |

**Descrição:** `monthTotals.test.ts` cobre resgates em totais efetivados, mas não há teste para `calculatePendingMonthTotals` — o bug #1 não seria capturado por CI.

**Sugestão:** Adicionar caso de teste do cenário salário + resgate.

---

## Execução técnica (QA)

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ Sucesso |
| `npm run lint` | ✅ 0 erros, 25 warnings |
| `vitest run` (repeatMonths, financialRuleCalculations, monthTotals, accounts) | ✅ 64/64 |

**Migration `account_operations`:** arquivo presente com RLS SELECT/INSERT/DELETE. Aplicação no projeto Supabase remoto **não verificada** nesta auditoria.

---

## Checklist do gate (espelho do plano)

| Critério | QA estático |
|----------|-------------|
| Números reconciliáveis (resumo ↔ regra ↔ anual) | ✅ |
| Saldo Livre + pedagogia investimentos/carteiras | ✅ |
| Resgate e transferência sem distorcer resumo/regra | ✅ |
| Build, lint, testes unitários | ✅ 67/67 |
| Exclusão de operação pelo usuário | ✅ Saldo Livre + Operações do mês |
| Regressão manual (cartão, parcelas, carry-forward) | ⏳ Manual |
| Marketing (copy, screenshots, termos) | ⏳ Fora do escopo dev |

---

## Veredito final

| Fase | Veredito |
|------|----------|
| Auditoria inicial (2026-07-03) | **Aprovado com ressalvas** |
| Pós-correções (revalidação 2026-07-03) | **Aprovado com ressalvas** — bloqueios Médio fechados |

---

## Revalidação 2026-07-03

Plano: `correções_qa_gate_2ab7f229.plan.md` · Validação: [relatorio-validacao-gate-correcoes-qa.md](../VALIDATION/relatorio-validacao-gate-correcoes-qa.md)

| Achado | Status |
|--------|--------|
| #1 Pendência com resgate | ✅ Corrigido — `receivedIncome` isolado |
| #2 Exclusão sem UI | ✅ Corrigido — `UnlinkedMovementsDialog` + `AccountMonthOperationsDialog` |
| #4 Hint resgates | ✅ Corrigido — hint em Entradas (efetiv.) |
| #5 Teste pendência | ✅ Corrigido — 2 casos em `monthTotals.test.ts` |
| #3 Transação atômica | ⏸ Fora do escopo |

**Testes gate:** 67/67 · **Build:** OK

### Próximos passos (pós-correção)

1. **Regressão manual** — executar [16-regressao-manual-gate.md](./16-regressao-manual-gate.md) e preencher [relatorio-regressao-manual-gate.md](../../VALIDATION/relatorio-regressao-manual-gate.md) (apply-to-all no gráfico anual; resgate/transferência/exclusão E2E).
2. Confirmar migration `account_operations` em produção.
3. Checklist marketing (copy, screenshots, termos).

---

*Relatório gerado por auditoria estática. Não substitui testes exploratórios no browser nem validação de migration em produção.*
