-- Migração: Saldo declarado por carteira e mês (Fase 2)
-- Snapshot informado manualmente pelo usuário; não exige consistência com movimentos.

CREATE TABLE IF NOT EXISTS public.account_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,
  balance DECIMAL(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (account_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_account_balances_user_month
  ON public.account_balances(user_id, year_month);

ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own account balances" ON public.account_balances;
CREATE POLICY "Users can view own account balances"
  ON public.account_balances FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own account balances" ON public.account_balances;
CREATE POLICY "Users can insert own account balances"
  ON public.account_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own account balances" ON public.account_balances;
CREATE POLICY "Users can update own account balances"
  ON public.account_balances FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own account balances" ON public.account_balances;
CREATE POLICY "Users can delete own account balances"
  ON public.account_balances FOR DELETE
  USING (auth.uid() = user_id);
