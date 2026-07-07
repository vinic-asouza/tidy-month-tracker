-- Vincula entradas geradas automaticamente por resgate à operação de carteira.
ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS source_operation_id UUID REFERENCES public.account_operations(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_incomes_source_operation_id
  ON public.incomes(source_operation_id)
  WHERE source_operation_id IS NOT NULL;

-- Backfill: resgates para Saldo Livre (withdrawal)
INSERT INTO public.incomes (
  user_id,
  year_month,
  description,
  value,
  tag,
  date,
  received,
  source_operation_id,
  display_order
)
SELECT
  ao.user_id,
  ao.year_month,
  COALESCE(NULLIF(TRIM(ao.description), ''), 'Resgate de investimentos'),
  ao.amount,
  'Resgate de investimentos',
  ao.operation_date,
  true,
  ao.id,
  0
FROM public.account_operations ao
WHERE ao.type = 'withdrawal'
  AND NOT EXISTS (
    SELECT 1 FROM public.incomes i WHERE i.source_operation_id = ao.id
  );

-- Backfill: resgates para carteira de movimentação (transfer_in de origem investimento)
INSERT INTO public.incomes (
  user_id,
  year_month,
  description,
  value,
  tag,
  date,
  received,
  account_id,
  source_operation_id,
  display_order
)
SELECT
  ti.user_id,
  ti.year_month,
  COALESCE(NULLIF(TRIM(ti.description), ''), 'Resgate de investimentos'),
  ti.amount,
  'Resgate de investimentos',
  ti.operation_date,
  true,
  ti.destination_account_id,
  ti.id,
  0
FROM public.account_operations ti
INNER JOIN public.account_operations tout
  ON tout.transfer_group_id = ti.transfer_group_id
  AND tout.type = 'transfer_out'
INNER JOIN public.accounts a
  ON a.id = tout.source_account_id
  AND a.role = 'investment'
WHERE ti.type = 'transfer_in'
  AND NOT EXISTS (
    SELECT 1 FROM public.incomes i WHERE i.source_operation_id = ti.id
  );
