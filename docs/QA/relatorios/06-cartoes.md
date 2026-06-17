# Relatório QA — 06 Cartões de Crédito

| Campo | Valor |
|-------|-------|
| **Módulo** | Cartões de Crédito |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `frontend/src/components/CreditCardStrip.tsx`, `frontend/src/services/adapters/supabase/creditCards.ts` |

---

## Resumo executivo

**Veredito geral:** Requer atenção — UI sólida, validações de nome, mas integração com dashboard tem falhas de sincronização.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 2 |
| Médio | 2 |
| Baixo | 1 |

---

## Mapa de fluxos validados

| # | Checklist | Status |
|---|-----------|--------|
| 1 | Criar com nome e cor | OK |
| 2 | Rejeitar nome duplicado | OK (UI + serviço L55-64) |
| 3 | Total do mês no chip | OK |
| 4 | Marcar/desmarcar fatura paga | OK com ressalva (load inicial) |
| 5 | Renomear propaga gastos | OK (adaptador L66-72) |
| 6 | Bloquear exclusão com gastos | Achado — só mês atual na UI |
| 7 | Estado vazio | OK |

---

## Achados

### `canDeleteCard` na UI verifica apenas mês corrente

**Severidade:** Alto

**Evidência:** `Index.tsx` `canDeleteCardSync` passado a `CreditCardStrip`. Serviço consulta todas as despesas (`creditCards.ts` L102-113).

**Recomendação:** Usar `canDeleteCard` async com feedback de loading.

---

### Status "fatura paga" incorreto no load inicial

**Severidade:** Alto

**Evidência:** Relatório módulo 02 — race `fetchCreditCards` || `fetchCardMonthlyStatus`.

---

### `setCardPaidStatus` sem rollback visual em falha silenciosa

**Severidade:** Médio

**Evidência:** Hook L469-487 faz rollback em catch; `CreditCardStrip` não trata `false` retornado.

**Recomendação:** Toast se `setCardPaidStatus` retornar false.

---

### Campo `paid` em `credit_cards` não usado na UI mensal

**Severidade:** Médio

**Evidência:** Status mensal em `credit_card_monthly_status`; campo global `paid` no model pode confundir.

**Recomendação:** Documentar ou remover uso do campo global na UI.

---

### Exclusão bem-sucedida não remove status mensais órfãos

**Severidade:** Baixo

**Evidência:** `deleteCreditCard` só deleta cartão; FK/cascade depende do DB (não verificado no frontend).

---

## Itens sem achado

- Validação nome obrigatório
- 9 cores `CARD_COLORS`
- Scroll horizontal de chips
- AlertDialog ao bloquear delete
- Preservação scroll ao marcar pago
- Ordenação múltipla

## Referências cruzadas

- Módulos 02, 05, 10
