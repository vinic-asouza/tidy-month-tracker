-- Papel da carteira: movimentação (liquidez) ou investimentos (custódia)

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'movement'
  CHECK (role IN ('movement', 'investment'));

UPDATE public.accounts
SET role = 'investment'
WHERE type = 'investment';

UPDATE public.accounts
SET role = 'movement'
WHERE role IS NULL OR (type <> 'investment' AND role = 'movement');
