-- Migração: Criar tabela financial_rule
-- Data: 2025-01-XX
-- Motivo: Implementar funcionalidade de Regra Financeira (50/30/20 ou personalizada)

-- Tabela de regra financeira do usuário
CREATE TABLE IF NOT EXISTS public.financial_rule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configuração da regra (percentuais)
  essentials_percentage DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  lifestyle_percentage DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  investments_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  
  -- Mapeamento de categorias (JSONB)
  -- Formato: {"Moradia": "essentials", "Roupas": "lifestyle", ...}
  category_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Flag para indicar se está usando regra padrão ou personalizada
  is_custom BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Validação: soma dos percentuais deve ser 100
  CONSTRAINT check_percentages_sum CHECK (
    essentials_percentage + lifestyle_percentage + investments_percentage = 100.00
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_financial_rule_user_id ON public.financial_rule(user_id);

-- Habilitar RLS
ALTER TABLE public.financial_rule ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Policy: Usuários só podem ver suas próprias regras
DROP POLICY IF EXISTS "Users can view own financial rule" ON public.financial_rule;
CREATE POLICY "Users can view own financial rule"
  ON public.financial_rule FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários só podem inserir suas próprias regras
DROP POLICY IF EXISTS "Users can insert own financial rule" ON public.financial_rule;
CREATE POLICY "Users can insert own financial rule"
  ON public.financial_rule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários só podem atualizar suas próprias regras
DROP POLICY IF EXISTS "Users can update own financial rule" ON public.financial_rule;
CREATE POLICY "Users can update own financial rule"
  ON public.financial_rule FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Usuários só podem deletar suas próprias regras
DROP POLICY IF EXISTS "Users can delete own financial rule" ON public.financial_rule;
CREATE POLICY "Users can delete own financial rule"
  ON public.financial_rule FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_financial_rule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS financial_rule_updated_at ON public.financial_rule;
CREATE TRIGGER financial_rule_updated_at
  BEFORE UPDATE ON public.financial_rule
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_rule_updated_at();
