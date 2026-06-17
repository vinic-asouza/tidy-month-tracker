# Relatório QA — 11 Seleção de Itens

| Campo | Valor |
|-------|-------|
| **Módulo** | Seleção de Itens (`SelectionBottomBar`) |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `frontend/src/components/SelectionBottomBar.tsx`, `frontend/src/pages/Index.tsx` (L31-34, L183-221, L585-589) |

---

## Resumo executivo

**Veredito geral:** Aprovado com ressalvas — funcionalidade simples e coerente; seleção não resetada entre meses.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 0 |
| Médio | 2 |
| Baixo | 1 |

---

## Mapa de fluxos validados

| # | Fluxo | Status |
|---|-------|--------|
| 1 | Selecionar itens por clique na linha | OK (seções) |
| 2 | Barra com totais por tipo | OK |
| 3 | Total geral | OK |
| 4 | Desmarcar todos | OK |
| 5 | FAB reposicionado com barra | OK |

---

## Achados

### Seleções persistem ao trocar de mês

**Severidade:** Médio

**Evidência:** `Index.tsx` — sem `useEffect` em `currentMonth` para limpar Sets.

**Impacto:** IDs inválidos no Set; totais podem ser 0 mas barra ainda visível se flags parciais.

---

### Soma usa valor nominal, não status efetivado

**Severidade:** Médio

**Evidência:** L203-220 — `income.value` sem checar `received`.

**Nota:** Pode ser intencional (soma do que usuário selecionou). Diverge semanticamente da visão anual.

**Recomendação:** Clarificar no label da barra ("valores selecionados").

---

### Sem ações em lote sobre seleção

**Severidade:** Baixo

**Evidência:** Barra só exibe totais; não há "marcar todos como recebido" etc.

---

## Itens sem achado

- Barra oculta quando sem seleção
- Layout fixo inferior com glass
- Independência entre tipos (income/expense/investment)

## Referências cruzadas

- Módulo 02 (estado no Index), Módulos 04-07 (seleção nas seções)
