-- Dia de vencimento informativo e limite de crédito opcional
ALTER TABLE credit_cards
  ADD COLUMN IF NOT EXISTS due_day SMALLINT
    CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 31)),
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2)
    CHECK (credit_limit IS NULL OR credit_limit > 0);
