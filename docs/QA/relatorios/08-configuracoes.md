# Relatório QA — 08 Configurações

| Campo | Valor |
|-------|-------|
| **Módulo** | Configurações (Tags e Categorias) |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `frontend/src/services/adapters/supabase/settings.ts`, gerenciadores em `IncomeSection`, `ExpenseSection`, `InvestmentSection` |

---

## Resumo executivo

**Veredito geral:** Aprovado com ressalvas — CRUD parcial; métodos de pagamento somente leitura.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 0 |
| Médio | 3 |
| Baixo | 1 |

---

## Mapa de fluxos validados

| Configuração | Criar | Renomear | Excluir | UI |
|--------------|-------|----------|---------|-----|
| Tags entrada | OK | OK + propaga | Bloqueado se uso | OK |
| Categorias gasto | OK | OK + propaga | Bloqueado se uso | OK |
| Tags investimento | OK | OK + propaga | Bloqueado se uso | OK |
| Métodos pagamento | N/A | N/A | N/A | Somente leitura |

---

## Achados

### Métodos de pagamento não editáveis na UI

**Severidade:** Médio

**Evidência:** `settings.ts` lê `payment_methods`; nenhum `updatePaymentMethods`. `ExpenseSection` usa lista fixa + cartões.

**Impacto:** Usuário não pode adicionar "PIX Empresa" etc. sem alterar DB.

**Recomendação:** CRUD de métodos ou documentar como intencional.

---

### Exclusão de tag/categoria em uso sem mensagem

**Severidade:** Médio

**Evidência:** Três seções — `return` silencioso.

---

### Upsert parcial pode sobrescrever colunas não enviadas

**Severidade:** Médio

**Evidência:** `updateInvestmentTags` upsert só `{ investment_tags }`. Supabase upsert com `onConflict: user_id` — depende de defaults/null no DB para outras colunas (comportamento PostgREST).

**Recomendação:** Verificar schema; preferir UPDATE parcial explícito.

---

### Tags duplicadas na adição não validadas no serviço

**Severidade:** Baixo

**Evidência:** UI checa `tags.includes(trimmed)`; bypass via API direta possível.

---

## Itens sem achado

- Defaults em `finance.ts` quando sem registro
- Rename propaga para `incomes`, `expenses`, `investments`
- Upsert por `user_id`

## Referências cruzadas

- Módulos 04, 05, 07, 09 (categorias na regra)
