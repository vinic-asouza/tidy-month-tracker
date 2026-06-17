# Relatório QA — 02 Dashboard (Visão Mensal)

| Campo | Valor |
|-------|-------|
| **Módulo** | Dashboard |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `frontend/src/pages/Index.tsx`, `frontend/src/hooks/useSupabaseFinance.ts`, `frontend/src/components/MonthNavigator.tsx`, `frontend/src/components/MonthRecordsSection.tsx` |

---

## Resumo executivo

**Veredito geral:** Requer atenção — orquestração funcional, mas com bugs de sincronização em status de cartões e estatísticas anuais.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 3 |
| Médio | 4 |
| Baixo | 2 |

---

## Mapa de fluxos validados

| # | Fluxo / Checklist | Status |
|---|-------------------|--------|
| 1 | Alternar visão Mensal / Anual | OK |
| 2 | Navegar mês anterior/próximo | OK |
| 3 | Botão "Hoje" fora do mês atual | OK (`MonthNavigator.tsx`) |
| 4 | Troca de tema persiste | Não verificável (localStorage via next-themes) |
| 5 | Menu mobile | OK (Sheet em `Index.tsx`) |
| 6 | FAB abre opções e direciona aba | OK (L64-68, L495-569) |
| 7 | Loading inicial global | OK |
| 8 | Loading na troca de mês (`monthLoading`) | OK |

---

## Achados

### Status mensal de cartões não carrega no primeiro acesso

**Severidade:** Alto

**Evidência:** `useSupabaseFinance.ts` L125-131 — `fetchCreditCards()` e `fetchCardMonthlyStatus(currentMonth)` rodam em paralelo no load inicial. `fetchCardMonthlyStatus` usa `creditCards` do estado (ainda `[]`). Em `supabase/creditCards.ts`, `getAllCardMonthlyStatuses` retorna mapa vazio se `creditCards.length === 0`. Não há `useEffect` que refaça o fetch quando `creditCards` é populado.

**Comportamento atual:** Ao abrir o app, checkboxes "Fatura paga" podem aparecer desmarcados até o usuário trocar de mês.

**Comportamento esperado:** Recarregar status mensal após cartões estarem disponíveis.

**Recomendação:** Sequenciar fetch ou adicionar efeito `creditCards` → `fetchCardMonthlyStatus`.

---

### Estatísticas anuais não atualizam ao marcar fatura de cartão paga

**Severidade:** Alto

**Evidência:** `Index.tsx` L129-133 — debounce de `yearData` observa apenas `monthData.incomes/expenses/investments` (flags `received`/`paid`/`invested`). `cardMonthlyStatus` vive no hook mas **não** entra em `monthData` nem no hash. Gastos em cartão na visão anual dependem de `cardMonthlyStatuses` em `getYearData`.

**Comportamento atual:** Marcar cartão como pago não dispara recarga da visão anual.

**Recomendação:** Incluir `cardMonthlyStatus` no gatilho de reload ou passar statuses para o hash de debounce.

---

### `canDeleteCardSync` ignora gastos em outros meses

**Severidade:** Alto

**Evidência:** `Index.tsx` L177-181 — wrapper síncrono verifica só `monthData.expenses` do mês atual. Serviço `canDeleteCreditCard` consulta todos os meses. `CreditCardStrip` recebe o wrapper, não o async.

**Comportamento atual:** UI pode permitir tentativa de exclusão quando há gastos em outros meses (falha silenciosa no servidor ou inconsistência).

**Recomendação:** Usar versão async com estado de loading ou checagem prévia via serviço.

---

### Erros de settings/cartões/status engolidos sem feedback

**Severidade:** Médio

**Evidência:** `useSupabaseFinance.ts` L62-65, L75-77, L116-118 — `catch` vazio com comentário MVP.

**Recomendação:** Toast genérico ou estado de erro recuperável.

---

### `yearData` pode ficar desatualizado ao mudar ano no navegador

**Severidade:** Médio

**Evidência:** `Index.tsx` L111-121 — efeito só recarrega se `yearData.length === 0`. Ao mudar `currentYear` (ex.: dez/2025 → jan/2026) na visão estatística, array antigo de 12 meses pode persistir até novo `handleViewChange`.

**Recomendação:** Resetar `yearData` quando `currentYear` mudar.

---

### Seleções de itens não são limpas ao trocar de mês

**Severidade:** Médio

**Evidência:** `Index.tsx` — `selectedIncomeIds` etc. não têm `useEffect` em `currentMonth`.

**Impacto:** IDs de outro mês podem permanecer selecionados; barra inferior pode mostrar totais zerados ou incoerentes.

**Recomendação:** `handleClearAllSelections` ao mudar mês.

---

### Logout com toast de sucesso incondicional

**Severidade:** Médio

**Evidência:** `Index.tsx` L172-175 (mesmo achado do módulo 01).

---

### FAB oculto na visão anual

**Severidade:** Baixo

**Evidência:** `Index.tsx` L495 — `{view === 'dashboard' && (` — intencional, mas usuário precisa voltar ao mensal para adicionar.

**Recomendação:** Documentar ou oferecer atalho na visão anual.

---

### Hook nomeado `useSupabaseFinance` usado com qualquer provider

**Severidade:** Baixo

**Evidência:** Nome legado; funcionalidade via adaptadores.

---

## Itens sem achado

- Duas views (dashboard/statistics) com navegação desktop e mobile
- `MonthNavigator` com limites de ano ao cruzar dezembro/janeiro
- Overlay de tema com timer de cleanup
- FAB reposiciona com seleções ativas (`pb-24`)
- Prop drilling organizado via `MonthRecordsSection`
- Optimistic updates no hook para CRUD

## Riscos residuais

- Performance de `getYearData` (12×3 queries) em runtime
- Comportamento do Sheet `modal={false}` em mobile

## Referências cruzadas

- Módulos 06 (cartões), 10 (estatísticas), 11 (seleção), 01 (logout)
