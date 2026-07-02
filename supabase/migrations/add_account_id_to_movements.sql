-- Migração: Adiciona account_id (Carteira) em incomes, expenses e investments
-- Vínculo opcional: ON DELETE SET NULL (excluir carteira desvincula sem apagar movimentos)

ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_incomes_account_id ON public.incomes(account_id)
  WHERE account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON public.expenses(account_id)
  WHERE account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_investments_account_id ON public.investments(account_id)
  WHERE account_id IS NOT NULL;
