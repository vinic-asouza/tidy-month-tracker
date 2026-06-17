# QA Frontend — Índice de Relatórios

Processo de qualidade do frontend conforme [`qa-specialist.mdc`](./qa-specialist.mdc), com escopo definido em [`ANALISE_FRONTEND_QA.md`](../ANALISE_FRONTEND_QA.md).

**Metodologia:** auditoria estática de código (sem testes manuais no browser).

**Regra:** relatórios documentam achados para o agente desenvolvedor — nenhuma correção é feita nesta fase.

**Conclusão:** 2026-06-17 — 12 módulos + relatório transversal concluídos.

---

## Progresso

| # | Módulo | Status | Data | Crítico | Alto | Médio | Baixo | Relatório |
|---|--------|--------|------|---------|------|-------|-------|-----------|
| 01 | Autenticação | concluído | 2026-06-17 | 0 | 1 | 3 | 4 | [01-autenticacao.md](./relatorios/01-autenticacao.md) |
| 02 | Dashboard | concluído | 2026-06-17 | 0 | 3 | 4 | 2 | [02-dashboard.md](./relatorios/02-dashboard.md) |
| 03 | Resumo do Mês | concluído | 2026-06-17 | 0 | 1 | 1 | 0 | [03-resumo-mensal.md](./relatorios/03-resumo-mensal.md) |
| 04 | Entradas | concluído | 2026-06-17 | 0 | 0 | 3 | 2 | [04-entradas.md](./relatorios/04-entradas.md) |
| 05 | Gastos | concluído | 2026-06-17 | 0 | 2 | 4 | 1 | [05-gastos.md](./relatorios/05-gastos.md) |
| 06 | Cartões | concluído | 2026-06-17 | 0 | 2 | 2 | 1 | [06-cartoes.md](./relatorios/06-cartoes.md) |
| 07 | Investimentos | concluído | 2026-06-17 | 0 | 0 | 3 | 1 | [07-investimentos.md](./relatorios/07-investimentos.md) |
| 08 | Configurações | concluído | 2026-06-17 | 0 | 0 | 3 | 1 | [08-configuracoes.md](./relatorios/08-configuracoes.md) |
| 09 | Regra Financeira | concluído | 2026-06-17 | 0 | 1 | 3 | 1 | [09-regra-financeira.md](./relatorios/09-regra-financeira.md) |
| 10 | Estatísticas Anuais | concluído | 2026-06-17 | 0 | 2 | 2 | 1 | [10-estatisticas.md](./relatorios/10-estatisticas.md) |
| 11 | Seleção de Itens | concluído | 2026-06-17 | 0 | 0 | 2 | 1 | [11-selecao.md](./relatorios/11-selecao.md) |
| 12 | Shell / Preferências | concluído | 2026-06-17 | 0 | 0 | 2 | 2 | [12-shell.md](./relatorios/12-shell.md) |
| 99 | Transversal | concluído | 2026-06-17 | 0 | — | — | — | [99-transversal.md](./relatorios/99-transversal.md) |

**Totais por severidade (soma dos módulos 01–12):** 0 Crítico · 12 Alto · 30 Médio · 17 Baixo

---

## Prioridade de correção (backlog)

Ver seção 8 em [99-transversal.md](./relatorios/99-transversal.md).

1. Status de cartão no load inicial + debounce estatísticas
2. `canDeleteCardSync` vs todos os meses
3. Alinhar critério planejado vs efetivado (resumo, regra, estatísticas)
4. Atomicidade de parcelas/repetições
5. Mapeamento de erros de auth por código Supabase

---

## Ordem de execução

1. Autenticação → 2. Dashboard → 3. Resumo → 4. Entradas → 5. Gastos → 6. Cartões → 7. Investimentos → 8. Configurações → 9. Regra Financeira → 10. Estatísticas → 11. Seleção → 12. Shell → 99. Transversal

---

## Template

Novo relatório: copiar [`_template-relatorio.md`](./_template-relatorio.md).
