-- Migração: Adicionar índice em expenses(user_id, payment_method)
-- Data: 2025-02-09
-- Motivo: Melhorar performance ao atualizar gastos quando nome do cartão é alterado

CREATE INDEX IF NOT EXISTS idx_expenses_user_id_payment_method 
ON public.expenses(user_id, payment_method);
