-- Migração: Adicionar campos received e invested nas tabelas incomes e investments
-- Data: 2025-02-09
-- Motivo: Persistir estado de recebido/investido para não perder ao recarregar página

-- Adiciona coluna received na tabela incomes se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'incomes' 
    AND column_name = 'received'
  ) THEN
    ALTER TABLE public.incomes 
    ADD COLUMN received BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Adiciona coluna invested na tabela investments se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'investments' 
    AND column_name = 'invested'
  ) THEN
    ALTER TABLE public.investments 
    ADD COLUMN invested BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
