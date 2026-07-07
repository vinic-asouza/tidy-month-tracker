-- Origem do aporte (carteira de movimentação)

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS source_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_investments_source_account_id ON public.investments(source_account_id)
  WHERE source_account_id IS NOT NULL;
