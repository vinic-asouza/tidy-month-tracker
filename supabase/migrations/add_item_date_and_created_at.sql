-- Campo DATA do item (dia do mês) para entradas, investimentos e gastos.
-- Itens já existentes: use created_at na exibição quando date for NULL.

-- 1) Despesas: adicionar coluna date (data do item)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS date TEXT NULL;

-- 2) Incomes e Investments já possuem coluna date (NOT NULL).
--    Tornar nullable para itens antigos que possam não ter data;
--    na aplicação, usar created_at quando date for NULL.
ALTER TABLE public.incomes
  ALTER COLUMN date DROP NOT NULL;

ALTER TABLE public.investments
  ALTER COLUMN date DROP NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.incomes.date IS 'Data do item (YYYY-MM-DD). NULL = usar created_at na exibição.';
COMMENT ON COLUMN public.investments.date IS 'Data do item (YYYY-MM-DD). NULL = usar created_at na exibição.';
COMMENT ON COLUMN public.expenses.date IS 'Data do item (YYYY-MM-DD). NULL = usar created_at na exibição.';
