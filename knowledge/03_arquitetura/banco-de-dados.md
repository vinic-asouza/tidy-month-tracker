---
type: arquitetura
titulo: Banco de dados
ultima_atualizacao: 2026-10-16
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
| `incomes` | Entradas; `received` |
| `expenses` | Gastos; `paid`; tipo fixo/variável/parcelado; `payment_method` (nome do cartão) |
| `investments` | Aportes; `invested` |
| `credit_cards` | Cartões; limite e `due_day` opcionais |
| `credit_card_monthly_status` | Fatura paga por cartão/mês |
| `financial_rule` | Percentuais + `category_mapping` |
| `wish_items` | Desejos; visibilidade calculada no cliente |

Lançamentos mensais usam `year_month` (`YYYY-MM`). Séries: `base_*_id`. Parcelas: `current_installment` / `total_installments`.

**Removidas na DEV-151:** tabelas `accounts`, `account_balances` e `account_operations`; colunas `incomes.account_id`, `incomes.source_operation_id`, `expenses.account_id`, `investments.account_id` e `investments.source_account_id`. Migration: `supabase/migrations/remove_wallets_dev_151.sql`. Decisão: [ADR-007](../07_decisoes-tecnicas/ADR-007-remover-carteiras.md). As migrations antigas de carteiras (`create_accounts.sql` etc.) continuam no repositório só como histórico — **não** reaplicar depois da remoção.

---

## Integridade relevante

- Lançamentos (`incomes`, `expenses`, `investments`) não têm FK para carteira nem operação. Séries usam `base_*_id` (**ON DELETE CASCADE**).
- Ordem da migration DEV-151: desvincular `incomes.source_operation_id` **antes** de dropar `account_operations`, para o CASCADE antigo não apagar entradas históricas *Resgate de investimentos* (elas viram entradas normais).

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

Nova coluna/tabela: migration em `supabase/migrations/` + regenerar `types.ts`. Aplicar no projeto remoto (checklist de go-live: aplicar `remove_wallets_dev_151.sql` em produção — [`../01_produto/roadmap.md`](../01_produto/roadmap.md)).

Frontend e Express (quando existir) leem **as mesmas tabelas**. Voltar ao backend não pede dump novo.
