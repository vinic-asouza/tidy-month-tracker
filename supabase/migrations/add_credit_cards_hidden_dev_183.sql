-- DEV-183: flag para ocultar cartão sem excluir (arquivar visualmente)
ALTER TABLE public.credit_cards
  ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.credit_cards.hidden IS
  'Quando true, cartão some das listagens do dia a dia; dados e vínculos permanecem (DEV-183).';
