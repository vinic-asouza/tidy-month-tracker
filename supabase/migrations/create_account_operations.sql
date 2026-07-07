-- Operações patrimoniais em carteiras: resgate e transferência

CREATE TABLE IF NOT EXISTS public.account_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('withdrawal', 'transfer_out', 'transfer_in', 'invoice_payment')),
  source_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  transfer_group_id UUID,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  year_month TEXT NOT NULL,
  operation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_operations_user_month
  ON public.account_operations(user_id, year_month);

CREATE INDEX IF NOT EXISTS idx_account_operations_transfer_group
  ON public.account_operations(transfer_group_id)
  WHERE transfer_group_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_operations_invoice_payment
  ON public.account_operations(user_id, credit_card_id, year_month)
  WHERE type = 'invoice_payment';

ALTER TABLE public.account_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own account operations" ON public.account_operations;
CREATE POLICY "Users can view own account operations"
  ON public.account_operations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own account operations" ON public.account_operations;
CREATE POLICY "Users can insert own account operations"
  ON public.account_operations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own account operations" ON public.account_operations;
CREATE POLICY "Users can delete own account operations"
  ON public.account_operations FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own account operations" ON public.account_operations;
CREATE POLICY "Users can update own account operations"
  ON public.account_operations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
