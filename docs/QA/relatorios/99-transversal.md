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

**Módulos afetados:** 04, 05, 07, 08 — exclusão tag/categoria em uso

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

---

## 9. Checklist transversal (ANALISE)

| Item | Status auditoria estática |
|------|---------------------------|
| Toast + rollback CRUD | OK por código |
| Troca rápida de meses | OK (`monthLoading`) |
| RLS dois usuários | Não verificável |
| Modo API | Fora de escopo atual |

---

## Referências

- [README QA](./README.md)
- Relatórios [01](./relatorios/01-autenticacao.md) a [12](./relatorios/12-shell.md)
