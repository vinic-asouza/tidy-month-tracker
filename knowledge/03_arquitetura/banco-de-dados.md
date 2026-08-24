---
type: arquitetura
titulo: Banco de dados
ultima_atualizacao: 2026-08-21
---

# Banco de dados

Postgres gerenciado no **Supabase**. Schema evolui por `supabase/setup-completo.sql` **mais** `supabase/migrations/`. Tipos gerados: `frontend/src/integrations/supabase/types.ts`. Mapeamento snake_case ↔ camelCase: `services/adapters/mappers.ts`.

Projeto em uso: `tidy-tracker`, ID `yoinjsmlntehikilqoxx`, região `us-east-2` (`config.toml` alinhado). Isolamento: `user_id` + RLS (`auth.uid() = user_id`). Regras: [`../02_regras-de-negocio/regras-gerais.md`](../02_regras-de-negocio/regras-gerais.md) RN-G01.

---

## Tabelas

| Tabela | Papel |
| --- | --- |
| `profiles` | Trigger no signup; frontend quase não lê |
| `finance_settings` | Tags, categorias, métodos de pagamento |
| `incomes` | Entradas; `received`; `account_id`; `source_operation_id` (resgate) |
| `expenses` | Gastos; `paid`; tipo fixo/variável/parcelado; `payment_method` (nome do cartão) |
| `investments` | Aportes; `invested`; `account_id` destino; `source_account_id` origem |
| `credit_cards` | Cartões; limite e `due_day` opcionais |
| `credit_card_monthly_status` | Fatura paga por cartão/mês |
| `accounts` | Carteiras; `role` `movement` \| `investment` |
| `account_balances` | Saldo declarado por carteira/mês |
| `account_operations` | `withdrawal`, `transfer_out`, `transfer_in`, `invoice_payment` |
| `financial_rule` | Percentuais + `category_mapping` |
| `wish_items` | Desejos; visibilidade calculada no cliente |

Lançamentos mensais usam `year_month` (`YYYY-MM`). Séries: `base_*_id`. Parcelas: `current_installment` / `total_installments`.

---

## Integridade relevante

- `accounts(id)` em movimentos: **`ON DELETE SET NULL`** — excluir carteira não apaga lançamentos.
- `incomes.source_operation_id` → `account_operations`; índice único parcial; **ON DELETE CASCADE** no resgate.
- `investments.source_account_id` → `accounts` **SET NULL**.
- `account_balances`: unique `(account_id, year_month)`.

Valor > 0 e soma 100% da regra **não** estão todos garantidos por CHECK no banco (política P4). Não confiar só no Postgres para isso.

---

## RLS

Habilitado nas tabelas de negócio. Políticas típicas: SELECT/INSERT/UPDATE/DELETE apenas onde `user_id = auth.uid()`. `profiles` e `finance_settings` sem DELETE nas políticas do setup inicial.

---

## Triggers

- `on_auth_user_created` → `profiles` + `finance_settings`
- `updated_at` nas tabelas principais

---

## Convenção de mudança

Nova coluna/tabela: migration em `supabase/migrations/` + regenerar `types.ts`. Aplicar no projeto remoto (checklist de go-live: conferir `account_operations` em produção — [`../01_produto/roadmap.md`](../01_produto/roadmap.md)).

Frontend e Express (quando existir) leem **as mesmas tabelas**. Voltar ao backend não pede dump novo.
