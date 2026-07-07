-- Remove vínculos de carteira em lançamentos ainda não efetivados.
-- Carteira passa a ser definida apenas no ato da efetivação.

UPDATE incomes SET account_id = NULL WHERE received = false AND account_id IS NOT NULL;
UPDATE expenses SET account_id = NULL WHERE paid = false AND account_id IS NOT NULL;
UPDATE investments SET account_id = NULL WHERE invested = false AND account_id IS NOT NULL;
