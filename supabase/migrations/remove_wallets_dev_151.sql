-- DEV-151: remove módulo de carteiras (accounts, balances, operations e FKs).
-- Ordem crítica: desvincular incomes.source_operation_id ANTES de dropar
-- account_operations (FK ON DELETE CASCADE apagaria entradas "Resgate de investimentos").

-- 1) Preservar entradas históricas de resgate (viram entradas normais)
UPDATE public.incomes
SET source_operation_id = NULL
WHERE source_operation_id IS NOT NULL;

DROP INDEX IF EXISTS public.idx_incomes_source_operation_id;

-- 2) Remover colunas de vínculo com carteiras nos lançamentos
ALTER TABLE public.incomes
  DROP COLUMN IF EXISTS account_id,
  DROP COLUMN IF EXISTS source_operation_id;

ALTER TABLE public.expenses
  DROP COLUMN IF EXISTS account_id;

ALTER TABLE public.investments
  DROP COLUMN IF EXISTS account_id,
  DROP COLUMN IF EXISTS source_account_id;

-- 3) Dropar tabelas do bounded context de carteiras
DROP TABLE IF EXISTS public.account_balances CASCADE;
DROP TABLE IF EXISTS public.account_operations CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
