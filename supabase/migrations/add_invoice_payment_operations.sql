-- Pagamento de fatura de cartão como operação patrimonial única (invoice_payment)

ALTER TABLE public.account_operations
  ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE;

ALTER TABLE public.account_operations
  DROP CONSTRAINT IF EXISTS account_operations_type_check;

ALTER TABLE public.account_operations
  ADD CONSTRAINT account_operations_type_check
  CHECK (type IN ('withdrawal', 'transfer_out', 'transfer_in', 'invoice_payment'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_operations_invoice_payment
  ON public.account_operations(user_id, credit_card_id, year_month)
  WHERE type = 'invoice_payment';

DROP POLICY IF EXISTS "Users can update own account operations" ON public.account_operations;
CREATE POLICY "Users can update own account operations"
  ON public.account_operations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Gastos em cartão não devem ter carteira vinculada por item
UPDATE public.expenses e
SET account_id = NULL
FROM public.credit_cards c
WHERE e.user_id = c.user_id
  AND e.payment_method = c.name
  AND e.account_id IS NOT NULL;
