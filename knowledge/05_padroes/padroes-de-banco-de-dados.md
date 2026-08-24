---
type: padrao
titulo: Padrões de banco de dados
ultima_atualizacao: 2026-08-23
---

# Padrões de banco de dados

Modelo atual: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md). Isolamento: RN-G01 em [`../02_regras-de-negocio/regras-gerais.md`](../02_regras-de-negocio/regras-gerais.md).

Postgres no **Supabase**. Projeto em `supabase/config.toml` (`project_id` `yoinjsmlntehikilqoxx`). Frontend e Express (se ligado) leem **as mesmas tabelas**. Integração: [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md).

---

## Como o schema evolui

1. **Bootstrap** de projeto novo: `supabase/setup-completo.sql` no SQL Editor (documentado no README).
2. **Mudança incremental:** arquivo novo em `supabase/migrations/`.
3. Aplicar no projeto remoto (SQL Editor ou CLI).
4. Regenerar tipos:

```bash
supabase gen types typescript --project-id yoinjsmlntehikilqoxx > frontend/src/integrations/supabase/types.ts
```

5. Atualizar `adapters/mappers.ts` e o código de domínio.

Nomes atuais das migrations **não** têm timestamp (`create_accounts.sql`, `add_income_source_operation_id.sql`). Código novo pode continuar descritivo **ou** usar prefixo `YYYYMMDDHHMMSS_` se a CLI exigir — o importante é um arquivo por mudança, aplicado no remoto, sem editar `types.ts` à mão.

Não trate `setup-completo.sql` e `migrations/` como a mesma história: há risco de drift. Fonte do que produção tem = o que está no projeto Supabase + migrations aplicadas.

---

## Naming e tipos

| Tema | Padrão |
| --- | --- |
| Tabela / coluna | `snake_case` |
| PK | `UUID` `DEFAULT gen_random_uuid()` |
| Dono | `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` |
| Mês | `year_month TEXT` no formato `YYYY-MM` |
| Dinheiro | `NUMERIC` / `DECIMAL`, não `float` |
| Instante | `TIMESTAMPTZ` `DEFAULT now()` |
| JSON | `JSONB` (ex.: `financial_rule.category_mapping`) |

UI usa camelCase; conversão só em `mappers.ts`.

---

## RLS (obrigatório em tabela de negócio)

Em **toda** tabela nova de dados do usuário:

```sql
ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;
```

Políticas típicas deste repo (inglês, uma por verbo):

```sql
CREATE POLICY "Users can view own <tabela>"
  ON public.<tabela> FOR SELECT
  USING (auth.uid() = user_id);
-- INSERT: WITH CHECK (auth.uid() = user_id)
-- UPDATE / DELETE: USING (auth.uid() = user_id)
```

Não desligue RLS para “facilitar o beta”. A anon key é pública; política frouxa é o risco real ([`../03_arquitetura/seguranca.md`](../03_arquitetura/seguranca.md)).

Exceções já existentes: `profiles` / `finance_settings` no setup inicial podem não ter DELETE — não copie isso para tabela nova sem motivo.

---

## Integridade que o código espera

- Movimentos → `accounts(id)`: **`ON DELETE SET NULL`** (apagar carteira não apaga lançamento).
- Resgate: `incomes.source_operation_id` → `account_operations`; CASCADE no resgate conforme migration.
- `account_balances`: unique `(account_id, year_month)`.
- `financial_rule`: unique por `user_id`; CHECK da soma dos percentuais **= 100,00** (exato).
- Índice útil: `user_id`, e composto com `year_month` / `display_order` quando a lista do mês filtra assim.

Valor `> 0` em lançamentos **não** está garantido em todos os CHECKs (P4). Formulário no cliente; não assuma que o banco recusa `0`.

Trigger `updated_at` nas tabelas principais — copie o padrão `BEFORE UPDATE` da migration da regra financeira (ou o trigger genérico do setup).

---

## Triggers de produto

Signup: `on_auth_user_created` → `profiles` + `finance_settings`. Não crie usuário de negócio sem passar pelo Auth.

Não há cron no banco para expirar desejos: isso é load no cliente ([`../04_modulos/desejos.md`](../04_modulos/desejos.md)).

---

## O que não fazer

- `service_role` no SPA ou em `VITE_*`.
- Trust só em `user_id` enviado pelo body sem RLS / JWT.
- `SELECT *` gigante sem filtro de `user_id` + mês (mesmo com RLS, não puxe o histórico inteiro sem necessidade).
- Renomear coluna só no TypeScript.
- Usar `credit_cards.paid` como status do mês (legado; UI lê `credit_card_monthly_status` / `cardMonthlyStatuses`).
- Assumir match cartão↔gasto por UUID: o produto casa pelo **nome** (`payment_method === credit_card.name`).

Nova tabela/coluna de módulo: atualize [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md) e o `.md` do módulo em `04_modulos/`.
