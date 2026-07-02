# Relatório QA — 99 Transversal

| Campo | Valor |
|-------|-------|
| **Escopo** | Cross-cutting — resiliência, consistência, código morto, arquitetura |
| **Data** | 2026-06-17 |
| **Referência** | Todos os relatórios 01–12, `ANALISE_FRONTEND_QA.md` |

---

## Resumo executivo

**Veredito geral:** O frontend está funcional para beta fechado, com débitos de consistência de dados, sincronização de cartões/estatísticas e código legado não utilizado.

| Severidade | Total agregado (aprox.) |
|------------|------------------------|
| Crítico | 0 |
| Alto | 9 |
| Médio | 28+ |
| Baixo | 12+ |

---

## 1. Consistência de critérios de totais

| Área | Critério | Arquivo |
|------|----------|---------|
| Resumo mensal | Todos os valores | `MonthSummarySection.tsx` |
| Regra financeira | Todos os valores | `financialRuleCalculations.ts` |
| Estatísticas anuais | Só efetivados | `Statistics.tsx` |
| Seleção | Valores nominais selecionados | `Index.tsx` |

**Severidade agregada:** Alto — usuário vê números diferentes sem explicação clara.

**Recomendação:** Definir taxonomia única (planejado vs realizado) e aplicar em todas as telas ou rotular explicitamente.

---

## 2. Código morto / não utilizado

| Artefato | Evidência | Severidade |
|----------|-----------|------------|
| `hooks/useFinanceData.ts` | Não importado | Médio |
| `components/SummaryCards.tsx` | Não importado | Baixo |
| `@tanstack/react-query` | Provider sem `useQuery` | Baixo |
| `reorderIncomes/Expenses/Investments` | Hook exporta; UI ausente | Baixo |
| `deleteRule` | Hook exporta; UI ausente | Médio |
| `calculateProjection` | Função sem uso | Médio |

**Recomendação:** Remover ou integrar em sprint de limpeza.

---

## 3. Padrão dialog fecha antes de async completar

**Módulos afetados:** 04, 05, 07

**Severidade:** Médio (recorrente)

**Recomendação:** Padronizar `await` + loading no botão submit dos dialogs.

---

## 4. Feedback silencioso em ações bloqueadas

**Módulos afetados:** 04, 05, 07, 08, **13** — exclusão tag/categoria em uso; formulário de desejos (valor/prazo)

**Severidade:** Médio

---

## 5. Resiliência e erros

| Cenário | Implementação | Gap |
|---------|---------------|-----|
| Falha fetch mês | Toast + console | OK |
| Falha settings/cartões/status | catch vazio | Médio |
| Falha CRUD | Toast + rollback optimistic | OK |
| Operações compostas (parcelas) | Múltiplos INSERT | Alto |
| Falha rede logout | Sem tratamento | Médio |
| Sessão expirada | Supabase refresh automático | Não verificável |
| RLS 2 usuários | RLS no DB | Não verificável |

---

## 6. Segurança funcional (perceptível)

- Rotas protegidas por `user` — OK
- Sem roles admin — OK para escopo
- Validação de negócio só no client (modo Supabase) — risco aceito no plano
- Chave anon exposta — esperado

---

## 7. Modo API (`VITE_DATA_PROVIDER=api`)

Adaptadores em `services/adapters/api/` completos. Não auditados nesta rodada (fase atual = supabase).

**Recomendação:** Suite de regressão quando backend reativar.

---

## 8. Achados Alto prioritários (backlog sugerido)

1. Status cartão no load inicial (02, 06)
2. Estatísticas não atualizam com fatura paga (02, 10)
3. `canDeleteCardSync` só mês atual (02, 06)
4. Totais brutos vs efetivados (03, 09, 10)
5. INSERTs não atômicos parcelas (05)
6. Matriz delete parcelas "este mês" (05)
7. Mapeamento erros auth em inglês (01)
8. ~~Conquista→gasto sem verificar sucesso da API (13, 05)~~ — corrigido; ver revalidação em [13-lista-desejos.md](./13-lista-desejos.md)

---

## 9. Checklist transversal (ANALISE)

| Item | Status auditoria estática |
|------|---------------------------|
| Toast + rollback CRUD | OK por código |
| Troca rápida de meses | OK (`monthLoading`) |
| RLS dois usuários | Não verificável |
| Modo API | Fora de escopo atual |

---

## 10. Integração Desejos ↔ Gastos (módulo 13)

| Aspecto | Status (pós-revalidação) |
|---------|--------------------------|
| Desejos fora do saldo mensal | OK |
| `expenseDraft` pré-preenche gasto variável | OK |
| `linked_expense_id` no schema | Implementado via `handleAddExpense` |
| Conquista adiada até salvar gasto | OK |
| `pendingWishConquer` ao trocar de aba | Achado residual (Médio) |

Ver [13-lista-desejos.md](./13-lista-desejos.md) — seção Revalidação.

---

## 11. Carteiras — carry-forward e sincronização (módulo 14)

| Aspecto | Status (pós C1–C6) |
|---------|---------------------|
| Totais efetivados no chip | OK |
| Dois conceitos de saldo (C1) | OK — glossário + rótulos |
| Movimentos não vinculados (C2) | OK — chip + modal + toast |
| Copy saldo estimado (C3) | OK |
| Carry-forward cross-year | OK — `earliestMovementMonth` + `touchEarliestMovementMonth` (C5) |
| Estado local pós-`deleteAccount` | OK |
| Transferências / fatura→carteira (C4/C6) | Backlog documentado |

Ver [14-carteiras.md](./14-carteiras.md) — seções Revalidação e Validação C1–C6.

---

## Referências

- [README QA](./README.md)
- Relatórios [01](./relatorios/01-autenticacao.md) a [14](./relatorios/14-carteiras.md)
