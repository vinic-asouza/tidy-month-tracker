-- Migração: Adicionar campos repeat_all_months e base_investment_id na tabela investments
-- Data: 2025-02-09

-- Adiciona coluna repeat_all_months se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'investments' 
    AND column_name = 'repeat_all_months'
  ) THEN
    ALTER TABLE public.investments 
    ADD COLUMN repeat_all_months BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Adiciona coluna base_investment_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'investments' 
    AND column_name = 'base_investment_id'
  ) THEN
    ALTER TABLE public.investments 
    ADD COLUMN base_investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE;
  END IF;
END $$;
