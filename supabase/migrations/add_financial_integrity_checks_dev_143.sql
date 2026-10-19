-- DEV-143: constraints de integridade financeira em lançamentos
-- Pré-condição: audit sem outliers (value <= 0, year_month inválido, parcelas inconsistentes).

-- value > 0
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_value_positive CHECK (value > 0);

ALTER TABLE public.incomes
  ADD CONSTRAINT incomes_value_positive CHECK (value > 0);

ALTER TABLE public.investments
  ADD CONSTRAINT investments_value_positive CHECK (value > 0);

-- year_month YYYY-MM (mesmo padrão de wish_items)
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_year_month_format CHECK (year_month ~ '^\d{4}-\d{2}$');

ALTER TABLE public.incomes
  ADD CONSTRAINT incomes_year_month_format CHECK (year_month ~ '^\d{4}-\d{2}$');

ALTER TABLE public.investments
  ADD CONSTRAINT investments_year_month_format CHECK (year_month ~ '^\d{4}-\d{2}$');

-- Parcelas: se type = installment, current/total obrigatórios e coerentes
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_installment_coherence CHECK (
    type <> 'installment'
    OR (
      current_installment IS NOT NULL
      AND total_installments IS NOT NULL
      AND current_installment >= 1
      AND total_installments >= 1
      AND current_installment <= total_installments
    )
  );
