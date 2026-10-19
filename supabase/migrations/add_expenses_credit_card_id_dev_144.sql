-- Migração DEV-144: associar gastos a cartões por FK (credit_card_id)
-- Fonte de verdade da associação = credit_card_id.
-- payment_method permanece como rótulo denormalizado (nome do cartão ou método padrão).
-- ON DELETE SET NULL: a aplicação bloqueia a exclusão de cartão com gastos; o SET NULL
-- é apenas rede de segurança contra erro de integridade referencial.

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS credit_card_id UUID NULL
  REFERENCES public.credit_cards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_user_id_credit_card_id
  ON public.expenses(user_id, credit_card_id);

-- Backfill: gastos legados cujo payment_method == nome do cartão do mesmo usuário
UPDATE public.expenses e
SET credit_card_id = c.id
FROM public.credit_cards c
WHERE e.user_id = c.user_id
  AND e.payment_method = c.name
  AND e.credit_card_id IS NULL;
