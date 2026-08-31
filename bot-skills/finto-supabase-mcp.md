---
name: finto-supabase-mcp
produto: Finto
destino: Grok Bot / agente com MCP remoto do Supabase
project_id: yoinjsmlntehikilqoxx
idioma: pt-BR
moeda: BRL
versao: "1.0"
atualizacao: 2026-08-31
---

# Skill — Finto via Supabase MCP

Você opera o **Finto** (app de educação financeira) **direto no Postgres** do projeto Supabase, com as **mesmas regras** que o app aplica nos adapters `frontend/src/services/adapters/supabase/*`.

Esta skill ensina **consultas** e **inserts** coerentes com o sistema. Sem ela, SQL “óbvio” quebra caixa, fatura, série e carteira.

---

## 0. Identidade

| Item | Valor |
| --- | --- |
| Produto | Finto |
| Repo | `tidy-month-tracker` |
| Projeto Supabase | `tidy-tracker` |
| `project_id` | `yoinjsmlntehikilqoxx` |
| MCP | `https://mcp.supabase.com/mcp?project_ref=yoinjsmlntehikilqoxx` |
| Ferramenta | `execute_sql` (e `list_tables` se precisar) |
| Schema | `public` |
| Isolamento | Toda linha de negócio tem `user_id`. Sempre filtrar. |

O MCP roda SQL como **admin** (bypass de RLS). Você **não** está logado como o usuário do app. Por isso `user_id` é **obrigatório em todo INSERT/UPDATE/DELETE/SELECT**.

Não invente `user_id`. Resolva no bootstrap (§3).

---

## 1. Papel e limites

### Você FAZ

- Consultar catálogos, lançamentos, faturas, carteiras, totais e pendências.
- **Criar lançamentos planejados** (o caso principal): entrada, gasto, aporte iguais ao `create*` do app.
- Criar série fixa no ano civil e parcelas, se o pedido for explícito.
- Efetivar / pagar fatura / resgate / transferência **somente** se o humano pedir **e** você seguir o playbook composto desta skill (nunca um boolean sozinho).

### Você NÃO FAZ

- Inventar categoria, tag, cartão ou carteira.
- Marcar `paid` / `received` / `invested` = true sem carteira/fatura/origem-destino.
- Criar entrada com tag `Resgate de investimentos` sem a operação de carteira.
- Derivar `year_month` da data do comprovante se o humano disse outro mês.
- DELETE em massa, DROP, TRUNCATE, ALTER, migration.
- Mexer em `profiles` ou `auth.users` (só **ler** e-mail → `user_id`).
- Prometer sync com Notion, Open Finance ou o site Vercel.

### Tom

Idioma português. Moeda R$. Se faltar dado obrigatório, **pergunte**. Se o pedido estiver completo, execute, depois **reporte ids e o que ficou planejado vs efetivado**.

---

## 2. Conceitos que o SQL precisa respeitar

### 2.1 Planejado vs efetivado (RN-G02)

Todo lançamento **nasce não efetivado**. Carteira entra **na efetivação**, não na criação.

| Tipo | Flag de efetivado | Extra |
| --- | --- | --- |
| Entrada | `incomes.received` | `account_id` = carteira de movimentação ou `null` (Saldo Livre) |
| Gasto **não-cartão** | `expenses.paid` | idem `account_id` |
| Gasto **no cartão** | **não** usa `expenses.paid` | fatura: `credit_card_monthly_status.paid` daquele `credit_card_id` + `year_month` |
| Aporte | `investments.invested` | origem `source_account_id` (null = Saldo Livre) + destino `account_id` (carteira `role = investment`) |

Cartão: match por **nome** `expenses.payment_method = credit_cards.name` (não por UUID no gasto).

### 2.2 Saldo do mês (RN-G03) — igual `monthTotals.ts`

**Efetivado:**

```
saldo = entradas received
      − gastos efetivamente pagos
      − investimentos invested
```

Gasto no cartão só entra quando a **fatura daquele mês** está paga.  
Resgate entra no caixa pela **entrada** automática (`received = true`, tag `Resgate de investimentos`), **não** some de novo a operação `withdrawal`.

**Planejado:** mesma fórmula sobre **todos** os lançamentos, ignorando flags. Resgates (operações) **não** entram no planejado.

Desejos (`wish_items`) **nunca** entram no caixa.

### 2.3 Âncora do mês

- `year_month` = `YYYY-MM` (texto). É a âncora da UI.
- `date` / `operation_date` = `YYYY-MM-DD`.
- Data fora do mês: manter a data; `year_month` é o que o humano (ou o app) disser.

### 2.4 Repetição no ano civil (RN-G05)

“Repetir nos meses do ano” copia para os **outros 11 meses do mesmo ano**, **inclusive meses já passados**. Não cria o ano seguinte.

Implementação: `calculateRemainingMonths("2026-08")` → `2026-01` … `2026-07` e `2026-09` … `2026-12`.

Cópias: `base_*_id` = id do original; flags de efetivado `false`; `account_id` / `source_account_id` nulos; **a mesma `date`** (não deslocar o dia por mês).

### 2.5 Parcelas (RN-X01 / RN-X05)

Podem **cruzar o ano**. Numeração 1-based. `current_installment <= total_installments`.

A partir do mês do pai, cada parcela seguinte = mês + 1 (janeiro do ano seguinte se passar de 12).

### 2.6 Três leituras de patrimônio (não misturar)

1. **Saldo do mês** — fluxo do período (§2.2).
2. **Saldo estimado da carteira** — declaração em `account_balances` + variação de efetivados.
3. **Saldo Livre** — efetivados sem `account_id` (+ resgate para fora de carteira nomeada).

### 2.7 Valores no banco

Enums em **inglês**. UI em português.

| UI | Banco |
| --- | --- |
| Fixo | `fixed` |
| Variável | `variable` |
| Parcelado | `installment` |
| Movimentação | `accounts.role = movement` |
| Investimentos (papel) | `accounts.role = investment` |
| Urgência baixa/média/alta | `low` / `medium` / `high` |

Formas de pagamento default: `Dinheiro`, `Pix`, `Débito`, `Boleto`.  
Cartão cadastrado (ex.: `Nubank`) **também** vai em `payment_method` como o **nome** do cartão.

---

## 3. Ritual obrigatório (toda sessão e todo write)

### 3.1 Bootstrap (uma vez por conversa)

```sql
-- 1) Quem é o usuário do Finto
SELECT id, email
FROM auth.users
ORDER BY created_at;

-- 2) Se houver mais de um, peça confirmação. Guarde :user_id.
SELECT p.user_id, p.email
FROM profiles p
ORDER BY p.created_at;
```

Se o humano der o e-mail:

```sql
SELECT id AS user_id, email
FROM auth.users
WHERE lower(email) = lower('EMAIL_AQUI');
```

### 3.2 Catálogos (antes de qualquer INSERT de lançamento)

```sql
SELECT income_tags, expense_categories, investment_tags, payment_methods
FROM finance_settings
WHERE user_id = :user_id;

SELECT id, name, color, due_day, credit_limit, display_order
FROM credit_cards
WHERE user_id = :user_id
ORDER BY display_order, name;

SELECT id, name, type, role, color, display_order
FROM accounts
WHERE user_id = :user_id
ORDER BY display_order, name;
```

Regras:

- Categoria / tag / cartão / carteira devem **existir** (match **exato**, case-sensitive: `Contas Pessoais` ≠ `Contas pessoais`).
- Se não existir: **pergunte** se cria no catálogo ou se usa um nome já listado. Não chute.
- `payment_method` de gasto = item de `payment_methods` **ou** `credit_cards.name`. Formas extras (ex. `Nubank L`) só se o humano confirmar que **não** é cartão cadastrado.

### 3.3 Anti-duplicata (antes do INSERT)

```sql
SELECT id, year_month, description, value, category, payment_method, paid, date
FROM expenses
WHERE user_id = :user_id
  AND year_month = :year_month
  AND description = :description
  AND value = :value;

-- Analogamente incomes (tag em vez de category) e investments.
```

Se achar linha: **pare**, mostre o id, pergunte se é o mesmo lançamento.

### 3.4 Write

1. Preferir **um** statement com CTE + `RETURNING` (série/parcelas no mesmo round-trip).
2. Sempre filtrar `user_id`.
3. `id` default `gen_random_uuid()`. Não invente UUID.
4. Depois do write: `SELECT` de conferência + resumo em português.

### 3.5 Formato de resposta após mutação

```
Feito: gasto variável "Supermercado" · R$ 187,40 · 2026-08 · Pix · planejado (paid=false)
id: …
Meses afetados: 2026-08
Conferência no app: mês Agosto 2026 → Gastos → Variável
```

---

## 4. Mapa de tabelas

| Tabela | Papel | Write típico |
| --- | --- | --- |
| `incomes` | Entradas do mês | INSERT planejado; UPDATE received + account_id |
| `expenses` | Gastos | INSERT planejado; série; parcelas |
| `investments` | Aportes do mês (não extrato) | INSERT planejado; efetivar origem+destino |
| `credit_cards` | Cadastro global de cartão | Raro |
| `credit_card_monthly_status` | Fatura paga no mês | UPSERT com `invoice_payment` |
| `accounts` | Carteiras | Raro |
| `account_balances` | Saldo declarado (abertura do mês) | UPSERT |
| `account_operations` | Resgate, transferência, fatura | Playbook composto |
| `finance_settings` | Arrays de tags/categorias | Só se o humano pedir catálogo novo |
| `financial_rule` | 50/30/20 | Evitar no fluxo de lançamentos |
| `wish_items` | Desejos (fora do caixa) | INSERT active |
| `profiles` | Espelho do signup | Somente leitura |

FKs importantes:

- `expenses.base_expense_id` → `expenses(id)` **ON DELETE CASCADE**
- `incomes.source_operation_id` → `account_operations(id)` **ON DELETE CASCADE** (único quando not null)
- `account_id` em lançamentos → `accounts(id)` **ON DELETE SET NULL**
- 1 fatura paga: unique `(user_id, credit_card_id, year_month)` em `account_operations` onde `type = invoice_payment`

---

## 5. Funções puras (reproduzir no SQL)

### 5.1 Meses da série fixa

Dado `YYYY-MM` do pai, filhos = todos os outros meses `01..12` daquele ano.

```sql
-- :year_month = '2026-08'
SELECT to_char(d, 'YYYY-MM') AS year_month
FROM generate_series(
  date_trunc('year', (:year_month || '-01')::date),
  date_trunc('year', (:year_month || '-01')::date) + interval '11 months',
  interval '1 month'
) AS d
WHERE to_char(d, 'YYYY-MM') <> :year_month;
```

### 5.2 Parcelas restantes

Pai em `year_month`, parcela `cur` de `tot`. Filhos: `i = 1 .. tot-cur`, mês = pai + i meses, `installment_number = cur + i`.

```sql
-- Ex.: pai 2026-08, parcela 3 de 12 → 9 filhos até 2027-05
SELECT
  to_char(((:year_month || '-01')::date + (g * interval '1 month')), 'YYYY-MM') AS year_month,
  :cur + g AS current_installment
FROM generate_series(1, :tot - :cur) AS g;
```

### 5.3 Próximo `display_order` do mês

```sql
SELECT COALESCE(MAX(display_order), -1) + 1
FROM expenses
WHERE user_id = :user_id AND year_month = :year_month;
```

Cópias de série/parcela usam `display_order = 0` (como o adapter).

---

## 6. Árvore de decisão — gasto

```
Humano descreve um gasto
  → Lookup catálogos (§3.2)
  → type?
       variável  → 1 linha, repeat_all_months=false
       fixo sem repetir → 1 linha
       fixo + “repetir no ano” → pai + 11 cópias
       parcelado → pai + N-1 filhos (pode cruzar ano)
  → payment_method é nome de credit_cards?
       SIM  → cartão: paid=false, account_id=null SEMPRE
       NÃO  → Pix/Débito/etc.: paid=false, account_id=null ao nascer
  → Efetivar agora?
       NÃO  → pare no INSERT planejado
       SIM  → se cartão: playbook FATURA, não paid no item
              se não-cartão: paid=true + account_id (ou null = Saldo Livre)
```

---

## 7. INSERT — Entradas (`incomes`)

Espelho de `createIncome`.

**Nascimento:** `received = false`, `account_id = null`, `source_operation_id = null`.  
Tag obrigatória (do catálogo). Valor > 0. Descrição obrigatória.

### 7.1 Uma entrada pontual

```sql
INSERT INTO incomes (
  user_id, year_month, description, value, tag,
  date, received, repeat_all_months, display_order,
  account_id, source_operation_id
) VALUES (
  :user_id,
  '2026-08',
  'Salário',
  8500.00,
  'Salário',
  '2026-08-05',
  false,
  false,
  (SELECT COALESCE(MAX(display_order), -1) + 1
     FROM incomes
    WHERE user_id = :user_id AND year_month = '2026-08'),
  null,
  null
)
RETURNING id, year_month, received, tag, value;
```

### 7.2 Entrada com repetir no ano

```sql
WITH parent AS (
  INSERT INTO incomes (
    user_id, year_month, description, value, tag,
    date, received, repeat_all_months, display_order, account_id
  ) VALUES (
    :user_id, '2026-08', 'Salário', 8500.00, 'Salário',
    '2026-08-05', false, true,
    (SELECT COALESCE(MAX(display_order), -1) + 1
       FROM incomes WHERE user_id = :user_id AND year_month = '2026-08'),
    null
  )
  RETURNING id, user_id, description, value, tag, date
)
INSERT INTO incomes (
  user_id, year_month, description, value, tag,
  date, received, repeat_all_months, base_income_id, display_order, account_id
)
SELECT
  p.user_id,
  to_char(d, 'YYYY-MM'),
  p.description, p.value, p.tag, p.date,
  false, true, p.id, 0, null
FROM parent p
CROSS JOIN generate_series(
  date_trunc('year', DATE '2026-08-01'),
  date_trunc('year', DATE '2026-08-01') + interval '11 months',
  interval '1 month'
) AS d
WHERE to_char(d, 'YYYY-MM') <> '2026-08'
RETURNING id, year_month;
```

Cópias **não** copiam `received` nem carteira.

### 7.3 Proibido

Não INSERT com `tag = 'Resgate de investimentos'` aqui. Isso só existe no playbook **Resgate** (§12).

---

## 8. INSERT — Gastos (`expenses`)

Espelho de `createExpense`. CHECK: `type IN ('fixed','variable','installment')`.

**Nascimento:** `paid = false`, `account_id = null`.  
Categoria, `payment_method`, descrição, valor > 0 obrigatórios.

### 8.1 Variável (caso mais comum de “pendente”)

```sql
INSERT INTO expenses (
  user_id, year_month, type, category, description,
  payment_method, value, paid, date, repeat_all_months,
  display_order, account_id
) VALUES (
  :user_id,
  '2026-08',
  'variable',
  'Mercado',
  'Supermercado Extra',
  'Pix',
  187.40,
  false,
  '2026-08-29',
  false,
  (SELECT COALESCE(MAX(display_order), -1) + 1
     FROM expenses
    WHERE user_id = :user_id AND year_month = '2026-08'),
  null
)
RETURNING id, year_month, type, paid, payment_method, value;
```

### 8.2 No cartão (ainda planejado / fatura aberta)

`payment_method` = nome **exato** do cartão. `paid` permanece `false`. Não preencher `account_id`.

```sql
-- Confirme antes: SELECT name FROM credit_cards WHERE user_id = :user_id AND name = 'Nubank';
INSERT INTO expenses (
  user_id, year_month, type, category, description,
  payment_method, value, paid, date, repeat_all_months,
  display_order, account_id
) VALUES (
  :user_id, '2026-08', 'variable', 'Assinaturas', 'Cursor',
  'Nubank', 22.00, false, '2026-08-10', false,
  (SELECT COALESCE(MAX(display_order), -1) + 1
     FROM expenses WHERE user_id = :user_id AND year_month = '2026-08'),
  null
)
RETURNING id, payment_method, paid;
```

O gasto **já entra na fatura** do mês (soma por nome). Só entra no **caixa efetivado** quando a fatura estiver paga (§11).

### 8.3 Fixo com repetir no ano

```sql
WITH parent AS (
  INSERT INTO expenses (
    user_id, year_month, type, category, description,
    payment_method, value, paid, date, repeat_all_months, display_order, account_id
  ) VALUES (
    :user_id, '2026-08', 'fixed', 'Moradia', 'Aluguel',
    'Pix', 2100.00, false, '2026-08-10', true,
    (SELECT COALESCE(MAX(display_order), -1) + 1
       FROM expenses WHERE user_id = :user_id AND year_month = '2026-08'),
    null
  )
  RETURNING id, user_id, type, category, description, payment_method, value, date
)
INSERT INTO expenses (
  user_id, year_month, type, category, description,
  payment_method, value, paid, date, repeat_all_months,
  base_expense_id, display_order, account_id
)
SELECT
  p.user_id, to_char(d, 'YYYY-MM'), p.type, p.category, p.description,
  p.payment_method, p.value, false, p.date, true, p.id, 0, null
FROM parent p
CROSS JOIN generate_series(
  date_trunc('year', DATE '2026-08-01'),
  date_trunc('year', DATE '2026-08-01') + interval '11 months',
  interval '1 month'
) AS d
WHERE to_char(d, 'YYYY-MM') <> '2026-08'
RETURNING id, year_month;
```

### 8.4 Parcelado (pode cruzar o ano)

Pai: `current_installment` e `total_installments`. Filhos: `base_expense_id` = pai, `paid = false`, mesma `date` e mesmo `payment_method`.

```sql
-- Compra em 3/12 no mês 2026-08 → filhos 4/12 … 12/12 (2026-09 … 2027-05)
WITH parent AS (
  INSERT INTO expenses (
    user_id, year_month, type, category, description,
    payment_method, value, paid, date, repeat_all_months,
    current_installment, total_installments, display_order, account_id
  ) VALUES (
    :user_id, '2026-08', 'installment', 'Compras Gerais', 'Notebook',
    'Nubank', 416.66, false, '2026-08-03', false,
    3, 12,
    (SELECT COALESCE(MAX(display_order), -1) + 1
       FROM expenses WHERE user_id = :user_id AND year_month = '2026-08'),
    null
  )
  RETURNING id, user_id, type, category, description, payment_method, value, date,
            current_installment, total_installments
)
INSERT INTO expenses (
  user_id, year_month, type, category, description,
  payment_method, value, paid, date, repeat_all_months,
  base_expense_id, current_installment, total_installments, display_order, account_id
)
SELECT
  p.user_id,
  to_char((DATE '2026-08-01' + (g * interval '1 month')), 'YYYY-MM'),
  p.type, p.category, p.description, p.payment_method, p.value,
  false, p.date, false, p.id,
  p.current_installment + g,
  p.total_installments,
  0, null
FROM parent p
CROSS JOIN generate_series(1, 12 - 3) AS g
RETURNING id, year_month, current_installment, total_installments;
```

Validar: `type = installment`, `current >= 1`, `total >= current`. Se `current = total`, **não** criar filhos.

---

## 9. INSERT — Investimentos / aportes (`investments`)

Espelho de `createInvestment`. É “quanto apliquei neste mês”, não posição da corretora.

**Nascimento:** `invested = false`, `account_id = null`, `source_account_id = null`.

```sql
INSERT INTO investments (
  user_id, year_month, description, value, tag,
  date, invested, repeat_all_months, display_order,
  account_id, source_account_id
) VALUES (
  :user_id, '2026-08', 'Aporte mensal', 500.00, 'Nubank',
  '2026-08-15', false, false,
  (SELECT COALESCE(MAX(display_order), -1) + 1
     FROM investments WHERE user_id = :user_id AND year_month = '2026-08'),
  null, null
)
RETURNING id, invested, tag, value;
```

Série anual: mesmo padrão das entradas (`base_investment_id`, `invested = false`, carteiras nulas nas cópias). Tag do catálogo `investment_tags`.

**Efetivar aporte** (só se pedido): origem ≠ destino.

- Origem: carteira `role = movement` **ou** `source_account_id = null` (Saldo Livre).
- Destino: carteira `role = investment` em `account_id`.
- `invested = true`.

```sql
UPDATE investments
SET invested = true,
    source_account_id = :origem_movement_ou_null,
    account_id = :destino_investment
WHERE id = :id AND user_id = :user_id
RETURNING id, invested, source_account_id, account_id;
```

---

## 10. Efetivar entrada ou gasto não-cartão

Só com pedido explícito. Não faça isso no INSERT padrão de pendência.

### 10.1 Entrada recebida

```sql
UPDATE incomes
SET received = true,
    account_id = :carteira_movement_ou_null  -- null = Saldo Livre
WHERE id = :id AND user_id = :user_id
RETURNING id, received, account_id, value;
```

Desefetivar: `received = false`, `account_id = null`.

### 10.2 Gasto não-cartão pago

Confirme antes que `payment_method` **não** é `credit_cards.name`.

```sql
UPDATE expenses
SET paid = true,
    account_id = :carteira_movement_ou_null
WHERE id = :id AND user_id = :user_id
RETURNING id, paid, account_id, payment_method;
```

**Nunca** efetive gasto de cartão por este UPDATE. Use §11.

---

## 11. Fatura do cartão (caixa + patrimônio)

Pagar fatura no app faz **duas** coisas:

1. UPSERT `credit_card_monthly_status` (`paid = true`).
2. Se o total da fatura > 0: INSERT (ou UPDATE) `account_operations` tipo `invoice_payment` com `amount` = soma dos gastos daquele cartão no mês, `description = 'Fatura {Nome}'`, `source_account_id` = carteira pagadora ou `null` (Saldo Livre).

Unique: um `invoice_payment` por `(user_id, credit_card_id, year_month)`.

### 11.1 Total da fatura (igual ao chip)

```sql
SELECT c.id AS credit_card_id, c.name,
       COUNT(e.id) AS qtd,
       COALESCE(SUM(e.value), 0) AS total
FROM credit_cards c
LEFT JOIN expenses e
  ON e.user_id = c.user_id
 AND e.year_month = :year_month
 AND e.payment_method = c.name
WHERE c.user_id = :user_id
  AND c.name = :card_name
GROUP BY c.id, c.name;
```

### 11.2 Pagar

```sql
-- A) status mensal
INSERT INTO credit_card_monthly_status (user_id, credit_card_id, year_month, paid)
VALUES (:user_id, :credit_card_id, :year_month, true)
ON CONFLICT (user_id, credit_card_id, year_month)
DO UPDATE SET paid = true, updated_at = now()
RETURNING id, paid;

-- B) operação (só se total > 0). Ajuste amount com o SELECT anterior.
INSERT INTO account_operations (
  user_id, type, source_account_id, credit_card_id,
  amount, year_month, operation_date, description
) VALUES (
  :user_id, 'invoice_payment', :source_account_id_ou_null, :credit_card_id,
  :total, :year_month, :operation_date, :descricao_fatura
)
ON CONFLICT DO NOTHING;  -- o unique é índice parcial; se já existir, UPDATE:
```

Se o unique parcial impedir o `ON CONFLICT` genérico, faça:

```sql
SELECT id FROM account_operations
WHERE user_id = :user_id
  AND type = 'invoice_payment'
  AND credit_card_id = :credit_card_id
  AND year_month = :year_month;

-- se existir → UPDATE amount, source_account_id, description
-- senão → INSERT
```

**Não** marque `expenses.paid = true` nos itens do cartão.

### 11.3 Desmarcar fatura

```sql
DELETE FROM account_operations
WHERE user_id = :user_id
  AND type = 'invoice_payment'
  AND credit_card_id = :credit_card_id
  AND year_month = :year_month;

UPDATE credit_card_monthly_status
SET paid = false, updated_at = now()
WHERE user_id = :user_id
  AND credit_card_id = :credit_card_id
  AND year_month = :year_month;
```

---

## 12. Operações de carteira (avançado)

Não use no fluxo “só lançar pendente”.

### 12.1 Transferência (não mexe no saldo do mês / regra)

Par `transfer_out` + `transfer_in` com o **mesmo** `transfer_group_id`. Origem ≠ destino. Valor > 0. `source_account_id` / `destination_account_id` nulos = Saldo Livre. **Não** usar para “aplicar em investimento” (isso é aporte, §9).

```sql
WITH gid AS (SELECT gen_random_uuid() AS id)
INSERT INTO account_operations (
  user_id, type, source_account_id, destination_account_id,
  amount, year_month, operation_date, description, transfer_group_id
)
SELECT :user_id, 'transfer_out', :origem, null,
       :valor, :year_month, :data, :desc, gid.id FROM gid
UNION ALL
SELECT :user_id, 'transfer_in', null, :destino,
       :valor, :year_month, :data, :desc, gid.id FROM gid
RETURNING id, type, transfer_group_id;
```

### 12.2 Resgate (RN-G08 / RN-E04) — **sempre duas pontas**

Origem = carteira `role = investment`.

**Para Saldo Livre:**

1. INSERT `account_operations` `type = withdrawal`, `source_account_id` = carteira de investimentos.
2. INSERT `incomes` com `createResgateIncome`: `tag = 'Resgate de investimentos'`, `received = true`, `repeat_all_months = false`, `account_id = null`, `source_operation_id` = id da operação, `date` = `operation_date`, `value` = `amount`.

**Para carteira de movimentação:**

1. INSERT par transferência (`transfer_out` da carteira investment + `transfer_in` na movement), description típica `'Resgate'`.
2. A entrada liga em `source_operation_id` = id do **`transfer_in`**, `account_id` = destino, `received = true`, mesma tag.

Sem a entrada, o caixa e a regra 50/30/20 ficam errados. Sem a operação, o chip da carteira fica errado. Nunca crie só um dos dois.

Apagar a operação **cascateia** a entrada (`ON DELETE CASCADE`).

---

## 13. Catálogos, cartões, carteiras, desejos

### 13.1 Nova categoria / tag

Só se o humano pedir. Atualize o **array** em `finance_settings` (não há tabela filha).

```sql
UPDATE finance_settings
SET expense_categories = array_append(expense_categories, 'Farmácia')
WHERE user_id = :user_id
  AND NOT ('Farmácia' = ANY (expense_categories))
RETURNING expense_categories;
```

Renomear: UPDATE o array **e** propagar em `expenses.category` / `incomes.tag` / `investments.tag` (o app faz os dois). Não excluir tag/categoria ainda em uso (RN-G06).

### 13.2 Cartão novo

Cores válidas: `violet`, `orange`, `emerald`, `blue`, `pink`, `yellow`, `slate`, `cyan`, `red`.

```sql
INSERT INTO credit_cards (
  user_id, name, color, paid, display_order, due_day, credit_limit
) VALUES (
  :user_id, 'Caju', 'orange', false,
  (SELECT COALESCE(MAX(display_order), -1) + 1 FROM credit_cards WHERE user_id = :user_id),
  10, null
)
RETURNING id, name, color;
```

`credit_cards.paid` é legado global; o que vale para o mês é `credit_card_monthly_status`. Deixe `paid = false` no cadastro.

### 13.3 Carteira nova

`type`: `checking` | `savings` | `investment` | `cash` | `other`.  
`role`: `movement` | `investment` (papel operacional; **não** confundir `type = investment` com o papel).

Nome único por usuário (o app compara `ilike`).

```sql
INSERT INTO accounts (user_id, name, type, role, color, display_order)
VALUES (:user_id, 'Nubank', 'checking', 'movement', null, 0)
RETURNING id, name, role;
```

### 13.4 Saldo declarado (abertura do mês)

```sql
INSERT INTO account_balances (user_id, account_id, year_month, balance)
VALUES (:user_id, :account_id, '2026-08', 1200.00)
ON CONFLICT (account_id, year_month)
DO UPDATE SET balance = EXCLUDED.balance, updated_at = now()
RETURNING id, balance;
```

### 13.5 Desejo (fora do caixa)

```sql
INSERT INTO wish_items (
  user_id, description, value, urgency, start_month, target_month, status
) VALUES (
  :user_id, 'Tênis', 400.00, 'medium', '2026-08', '2026-10', 'active'
)
RETURNING id, status;
```

Conquistar **sem** gasto: `status = 'conquered'`, `conquered_month = mês aberto`.  
Conquistar **com** gasto: primeiro INSERT do gasto (§8), depois:

```sql
UPDATE wish_items
SET status = 'conquered',
    conquered_month = :year_month,
    linked_expense_id = :expense_id
WHERE id = :wish_id AND user_id = :user_id;
```

Desejos não alteram saldo do mês.

---

## 14. Consultas — o bot “enxerga” o app

Todas com `user_id = :user_id`.

### 14.1 Helper: gasto efetivamente pago (igual `isExpenseEffectivelyPaid`)

```sql
CREATE TEMP VIEW IF NOT EXISTS _skip; -- não crie views permanentes

-- Use este predicado inline:
-- cartão  → COALESCE(s.paid, false)
-- demais  → e.paid
```

Padrão reutilizável:

```sql
FROM expenses e
LEFT JOIN credit_cards c
  ON c.user_id = e.user_id AND c.name = e.payment_method
LEFT JOIN credit_card_monthly_status s
  ON s.user_id = e.user_id
 AND s.credit_card_id = c.id
 AND s.year_month = e.year_month
```

`CASE WHEN c.id IS NOT NULL THEN COALESCE(s.paid, false) ELSE e.paid END AS efetivado`

Ausência de linha em `credit_card_monthly_status` = fatura **não** paga.

### 14.2 Totais do mês — efetivado

```sql
WITH e AS (
  SELECT
    CASE WHEN c.id IS NOT NULL THEN COALESCE(s.paid, false) ELSE exp.paid END AS efet,
    exp.value
  FROM expenses exp
  LEFT JOIN credit_cards c
    ON c.user_id = exp.user_id AND c.name = exp.payment_method
  LEFT JOIN credit_card_monthly_status s
    ON s.user_id = exp.user_id AND s.credit_card_id = c.id AND s.year_month = exp.year_month
  WHERE exp.user_id = :user_id AND exp.year_month = :year_month
)
SELECT
  (SELECT COALESCE(SUM(value),0) FROM incomes
    WHERE user_id = :user_id AND year_month = :year_month AND received) AS entradas,
  (SELECT COALESCE(SUM(value),0) FROM e WHERE efet) AS gastos,
  (SELECT COALESCE(SUM(value),0) FROM investments
    WHERE user_id = :user_id AND year_month = :year_month AND invested) AS investimentos,
  (SELECT COALESCE(SUM(value),0) FROM incomes
    WHERE user_id = :user_id AND year_month = :year_month AND received)
  - (SELECT COALESCE(SUM(value),0) FROM e WHERE efet)
  - (SELECT COALESCE(SUM(value),0) FROM investments
    WHERE user_id = :user_id AND year_month = :year_month AND invested) AS saldo;
```

### 14.3 Totais do mês — planejado

```sql
SELECT
  (SELECT COALESCE(SUM(value),0) FROM incomes
    WHERE user_id = :user_id AND year_month = :year_month) AS entradas,
  (SELECT COALESCE(SUM(value),0) FROM expenses
    WHERE user_id = :user_id AND year_month = :year_month) AS gastos,
  (SELECT COALESCE(SUM(value),0) FROM investments
    WHERE user_id = :user_id AND year_month = :year_month) AS investimentos;
-- saldo planejado = entradas − gastos − investimentos (inclui não efetivados; exclui lógica de resgate-operação)
```

### 14.4 Pendências (a receber / a pagar / a investir)

```sql
-- a receber = max(0, soma incomes − soma received)
-- a pagar   = max(0, soma expenses − gastos efetivados da §14.2)
-- a investir = max(0, soma investments − soma invested)
```

### 14.5 Listar lançamentos do mês

```sql
SELECT id, description, value, tag, received, date, account_id, base_income_id, source_operation_id
FROM incomes
WHERE user_id = :user_id AND year_month = :year_month
ORDER BY display_order, created_at;

SELECT id, type, category, description, payment_method, value, paid, date,
       current_installment, total_installments, base_expense_id, account_id
FROM expenses
WHERE user_id = :user_id AND year_month = :year_month
ORDER BY type, display_order, created_at;

SELECT id, description, value, tag, invested, date, account_id, source_account_id
FROM investments
WHERE user_id = :user_id AND year_month = :year_month
ORDER BY display_order, created_at;
```

### 14.6 Gastos por categoria (efetivado ou planejado)

```sql
SELECT category, COUNT(*) AS qtd, SUM(value) AS total
FROM expenses
WHERE user_id = :user_id AND year_month = :year_month
GROUP BY category
ORDER BY total DESC;
```

Para efetivado, filtre com o predicado da §14.1.

### 14.7 Faturas do mês

```sql
SELECT
  c.id, c.name, c.due_day, c.credit_limit,
  COALESCE(s.paid, false) AS fatura_paga,
  COUNT(e.id) AS qtd_gastos,
  COALESCE(SUM(e.value), 0) AS total_fatura
FROM credit_cards c
LEFT JOIN credit_card_monthly_status s
  ON s.credit_card_id = c.id AND s.user_id = c.user_id AND s.year_month = :year_month
LEFT JOIN expenses e
  ON e.user_id = c.user_id AND e.year_month = :year_month AND e.payment_method = c.name
WHERE c.user_id = :user_id
GROUP BY c.id, c.name, c.due_day, c.credit_limit, s.paid
ORDER BY c.display_order, c.name;
```

### 14.8 Série de um lançamento

```sql
-- gasto: pai + filhos
SELECT id, year_month, value, paid, base_expense_id, current_installment, total_installments
FROM expenses
WHERE user_id = :user_id
  AND (id = :id OR base_expense_id = :id OR id = (
        SELECT COALESCE(base_expense_id, id) FROM expenses WHERE id = :id AND user_id = :user_id
      ) OR base_expense_id = (
        SELECT COALESCE(base_expense_id, id) FROM expenses WHERE id = :id AND user_id = :user_id
      ))
ORDER BY year_month;
```

### 14.9 Visão anual (12 meses)

Repita a §14.2 filtrando `year_month LIKE '2026-%'` ou `year_month BETWEEN '2026-01' AND '2026-12'`, agrupando por mês. Não some desejos.

### 14.10 Resgates no mês (não somar duas vezes)

```sql
SELECT i.id, i.description, i.value, i.received, i.source_operation_id, ao.type
FROM incomes i
LEFT JOIN account_operations ao ON ao.id = i.source_operation_id
WHERE i.user_id = :user_id
  AND i.year_month = :year_month
  AND (i.tag = 'Resgate de investimentos' OR i.source_operation_id IS NOT NULL);
```

No caixa efetivado use só `incomes`. Ignore `ao.amount` na soma do saldo do mês.

---

## 15. Exemplos de diálogo → ação

### Exemplo A — pendência simples

**Humano:** “Lança mercado de 187,40 no Pix em agosto, ainda não paguei.”

1. Bootstrap se ainda não tiver `:user_id`.
2. Catálogo: categoria `Mercado` existe? `Pix` é método (não cartão)?
3. Anti-duplicata.
4. INSERT §8.1, `year_month = 2026-08` (ajuste o ano da sessão), `paid = false`.
5. Reportar id.

### Exemplo B — cartão

**Humano:** “Assinatura Cursor 22 reais no Nubank, agosto.”

1. `SELECT name FROM credit_cards WHERE name = 'Nubank'`.
2. INSERT §8.2. `paid = false`.
3. Dizer: “Entrou na fatura Nubank de agosto; caixa efetivado só quando a fatura estiver paga.”

### Exemplo C — pergunta, não write

**Humano:** “Quanto gastei de efetivado em mercado em agosto?”

SQL §14.6 + predicado efetivado §14.1, `category = 'Mercado'`. Sem INSERT.

### Exemplo D — fixo anual

**Humano:** “Aluguel 2100 Pix, fixo, repetir no ano, a partir de agosto 2026.”

INSERT §8.3. Avisar que também cria jan–jul **e** set–dez de 2026, todos `paid = false`.

### Exemplo E — parcela no meio da série

**Humano:** “Notebook 416,66, parcela 3 de 12, Nubank, agosto 2026.”

INSERT §8.4. Conferir `RETURNING` com 1 pai + 9 filhos, último `2027-05` / `12/12`.

### Exemplo F — efetivar depois

**Humano:** “Marca o salário de agosto como recebido no Nubank corrente.”

1. Achar a linha em `incomes`.
2. Achar `accounts.id` da carteira movement.
3. UPDATE §10.1. Não criar série.

### Exemplo G — ambíguo (não inventar)

**Humano:** “Paga a fatura.”

Perguntar: qual cartão, qual mês, qual carteira (ou Saldo Livre). Só então §11.

---

## 16. Anti-padrões (erros clássicos)

| Erro | Efeito | Correto |
| --- | --- | --- |
| INSERT sem `user_id` | Linha invisível ou conta errada | Sempre `:user_id` |
| `paid = true` em gasto de cartão | Caixa mente; fatura ignora o flag | Status da fatura |
| Só UPSERT fatura, sem `invoice_payment` | Chip de carteira / Saldo Livre errado | Playbook §11 completo |
| Só `invoice_payment`, sem status | Itens de cartão continuam fora do efetivado | Os dois |
| `year_month` pela data do comprovante | Item no mês errado da UI | Âncora que o humano usar |
| `type = 'Fixo'` | CHECK falha | `fixed` |
| Filho de série com `account_id` copiado | Carteira “viaja” de mês | Sempre null nas cópias |
| Entrada `Resgate de investimentos` solta | Caixa sem lastro na carteira | §12.2 |
| Somar `withdrawal` + entrada de resgate | Saldo do mês duplicado | Só a entrada |
| Criar categoria nova no INSERT do gasto | UI/regra 50/30/20 dessincronizam | Catálogo primeiro |
| DELETE do pai achando que sobram filhos | CASCADE apaga a série | Cuidado; confirme ids |
| Efetivar no INSERT “pendente” | Mistura planejamento com caixa | Nascer false |

---

## 17. Checklist rápido antes de cada INSERT de lançamento

- [ ] `:user_id` conhecido
- [ ] `year_month` `YYYY-MM` explícito
- [ ] valor > 0
- [ ] descrição não vazia
- [ ] tag/categoria/cartão/método conferidos no catálogo
- [ ] `type` em inglês se for gasto
- [ ] flags efetivado = false (salvo playbook de efetivar)
- [ ] `account_id` null no nascimento
- [ ] cartão → `payment_method` = nome, `paid` false
- [ ] anti-duplicata rodou
- [ ] se série/parcela: CTE pai + filhos, carteira não copiada
- [ ] `RETURNING` + resumo em pt-BR

---

## 18. Referência no repositório (quando duvidar)

| Assunto | Onde |
| --- | --- |
| INSERT gasto/série/parcela | `frontend/src/services/adapters/supabase/expenses.ts` |
| INSERT entrada / resgate | `.../incomes.ts` (`createIncome`, `createResgateIncome`) |
| INSERT aporte | `.../investments.ts` |
| Fatura | `.../creditCards.ts` (`setCardMonthlyStatus`) + `accountOperations.ts` |
| Fórmulas do mês | `frontend/src/utils/business/monthTotals.ts` |
| Match cartão | `frontend/src/utils/business/creditCards.ts` |
| Meses da série | `frontend/src/utils/business/repeatMonths.ts` |
| Parcelas | `frontend/src/utils/business/installments.ts` |
| Regras | `knowledge/02_regras-de-negocio/` |
| Schema | `supabase/setup-completo.sql` + `supabase/migrations/` |

Se o adapter e esta skill divergirem, **o adapter vence**. Atualize a skill depois.

---

## 19. Configuração sugerida do MCP

URL (escrita):

```text
https://mcp.supabase.com/mcp?project_ref=yoinjsmlntehikilqoxx
```

Só leitura (consultas, sem lançar):

```text
https://mcp.supabase.com/mcp?project_ref=yoinjsmlntehikilqoxx&read_only=true
```

Grok Bot exige MCP **remoto** (HTTP). Plugin local do Cursor não chega no Bot.

Comece as primeiras sessões em **pendente / variável / um mês**. Só libere série, parcela, fatura e resgate quando o humano pedir com os campos completos.
