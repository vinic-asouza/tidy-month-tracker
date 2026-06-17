# Relatório QA — 07 Investimentos

| Campo | Valor |
|-------|-------|
| **Módulo** | Investimentos |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `frontend/src/components/InvestmentSection.tsx`, `frontend/src/services/adapters/supabase/investments.ts` |

---

## Resumo executivo

**Veredito geral:** Aprovado com ressalvas — espelha Entradas com mesmos padrões e mesmas lacunas.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 0 |
| Médio | 3 |
| Baixo | 1 |

---

## Mapa de fluxos validados

| # | Checklist | Status |
|---|-----------|--------|
| 1 | CRUD completo | OK |
| 2 | Repetição e apply-to-all | OK |
| 3 | Marcar investido | OK |
| 4 | Tags (criar, renomear, excluir) | OK com ressalva |
| 5 | Ordenação / resumo por instituição | OK |

---

## Achados

### Exclusão de tag em uso sem feedback

**Severidade:** Médio

**Evidência:** `InvestmentSection.tsx` L480+ — mesmo padrão de `IncomeSection`.

---

### Dialog fecha sem aguardar Promise do hook

**Severidade:** Médio

**Evidência:** Mesmo padrão Entradas/Gastos.

---

### Repetição mensal limitada ao ano civil

**Severidade:** Baixo

**Evidência:** `calculateRemainingMonths` em adaptador.

---

### Cópias com `repeatAllMonths` não editáveis para ativar repetição retroativa

**Severidade:** Médio

**Evidência:** `supabase/investments.ts` — ativar `repeatAllMonths` em item existente cria cópias só para meses restantes do ano; meses anteriores não recebem réplica.

**Recomendação:** Documentar limitação.

---

## Itens sem achado

- Validações formulário
- Toggle `invested`
- ApplyToAllDialog
- Optimistic updates
- Seleção múltipla

## Referências cruzadas

- Módulo 04 (paridade), Módulo 08 (tags)
