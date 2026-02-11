-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS
-- Tidy Month Tracker - PostgreSQL (Supabase)
-- ============================================================================
-- 
-- Este script cria todas as tabelas, políticas RLS, índices, triggers e
-- funções necessárias para o funcionamento do sistema.
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase após criar
-- o projeto. Certifique-se de que o Row Level Security (RLS) está habilitado.
-- ============================================================================

-- ============================================================================
-- 1. TABELAS
-- ============================================================================

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de cartões de crédito (globais por usuário)
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de receitas (incomes)
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Formato: "YYYY-MM" (ex: "2024-01")
  description TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  tag TEXT NOT NULL,
  date TEXT NOT NULL,
  received BOOLEAN NOT NULL DEFAULT false,
  repeat_all_months BOOLEAN NOT NULL DEFAULT false,
  base_income_id UUID REFERENCES public.incomes(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de despesas (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Formato: "YYYY-MM" (ex: "2024-01")
  type TEXT NOT NULL CHECK (type IN ('fixed', 'variable', 'installment')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  repeat_all_months BOOLEAN NOT NULL DEFAULT false,
  base_expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
  current_installment INTEGER,
  total_installments INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de investimentos
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Formato: "YYYY-MM" (ex: "2024-01")
  description TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  tag TEXT NOT NULL,
  date TEXT NOT NULL,
  invested BOOLEAN NOT NULL DEFAULT false,
  repeat_all_months BOOLEAN NOT NULL DEFAULT false,
  base_investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações financeiras
CREATE TABLE IF NOT EXISTS public.finance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  income_tags TEXT[] NOT NULL DEFAULT ARRAY[
    'Salário', 'Benefício', 'Extra', 'Bonificação', 'Pagamento de terceiros',
    'Freelance', 'Resgate de investimentos', 'Rendimentos', 'Presente', 'Outros'
  ],
  expense_categories TEXT[] NOT NULL DEFAULT ARRAY[
    'Moradia', 'Contas pessoais', 'Compras Gerais', 'Vestuário', 'Assinaturas',
    'Trabalho', 'Serviços Gerais', 'Mercado', 'Lanches', 'Combustível',
    'Transporte', 'Carro', 'Presentes', 'Lazer', 'Estilo de Vida',
    'Consultas Médicas', 'Suplementação', 'Remédios', 'Educação', 'Viagem',
    'Empréstimos', 'Doação', 'Taxas'
  ],
  investment_tags TEXT[] NOT NULL DEFAULT ARRAY[
    'Banco A', 'Banco B', 'Corretora', 'Outros'
  ],
  payment_methods TEXT[] NOT NULL DEFAULT ARRAY[
    'Dinheiro', 'Pix', 'Débito', 'Boleto'
  ],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de status mensal de cartões de crédito
CREATE TABLE IF NOT EXISTS public.credit_card_monthly_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Formato: "YYYY-MM" (ex: "2024-01")
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, credit_card_id, year_month)
);

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

-- ============================================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_monthly_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_rule ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can create their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can update their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can delete their own credit cards" ON public.credit_cards;

DROP POLICY IF EXISTS "Users can view their own incomes" ON public.incomes;
DROP POLICY IF EXISTS "Users can create their own incomes" ON public.incomes;
DROP POLICY IF EXISTS "Users can update their own incomes" ON public.incomes;
DROP POLICY IF EXISTS "Users can delete their own incomes" ON public.incomes;

DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can create their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON public.investments;

DROP POLICY IF EXISTS "Users can view their own settings" ON public.finance_settings;
DROP POLICY IF EXISTS "Users can create their own settings" ON public.finance_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.finance_settings;

DROP POLICY IF EXISTS "Users can view their own card status" ON public.credit_card_monthly_status;
DROP POLICY IF EXISTS "Users can create their own card status" ON public.credit_card_monthly_status;
DROP POLICY IF EXISTS "Users can update their own card status" ON public.credit_card_monthly_status;
DROP POLICY IF EXISTS "Users can delete their own card status" ON public.credit_card_monthly_status;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para credit_cards
CREATE POLICY "Users can view their own credit cards"
  ON public.credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credit cards"
  ON public.credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit cards"
  ON public.credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit cards"
  ON public.credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para incomes
CREATE POLICY "Users can view their own incomes"
  ON public.incomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own incomes"
  ON public.incomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes"
  ON public.incomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes"
  ON public.incomes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para expenses
CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para investments
CREATE POLICY "Users can view their own investments"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments"
  ON public.investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments"
  ON public.investments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments"
  ON public.investments FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para finance_settings
CREATE POLICY "Users can view their own settings"
  ON public.finance_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
  ON public.finance_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.finance_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para credit_card_monthly_status
CREATE POLICY "Users can view their own card status"
  ON public.credit_card_monthly_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card status"
  ON public.credit_card_monthly_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card status"
  ON public.credit_card_monthly_status FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card status"
  ON public.credit_card_monthly_status FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para financial_rule
CREATE POLICY "Users can view own financial rule"
  ON public.financial_rule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial rule"
  ON public.financial_rule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial rule"
  ON public.financial_rule FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial rule"
  ON public.financial_rule FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id_year_month ON public.incomes(user_id, year_month);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_year_month ON public.expenses(user_id, year_month);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_payment_method ON public.expenses(user_id, payment_method);
CREATE INDEX IF NOT EXISTS idx_investments_user_id_year_month ON public.investments(user_id, year_month);
CREATE INDEX IF NOT EXISTS idx_finance_settings_user_id ON public.finance_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_monthly_status_user_card_month ON public.credit_card_monthly_status(user_id, credit_card_id, year_month);
CREATE INDEX IF NOT EXISTS idx_financial_rule_user_id ON public.financial_rule(user_id);

-- ============================================================================
-- 5. FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para criar perfil e configurações automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.finance_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_cards_updated_at ON public.credit_cards;
CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_incomes_updated_at ON public.incomes;
CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_investments_updated_at ON public.investments;
CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_finance_settings_updated_at ON public.finance_settings;
CREATE TRIGGER update_finance_settings_updated_at
  BEFORE UPDATE ON public.finance_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_card_monthly_status_updated_at ON public.credit_card_monthly_status;
CREATE TRIGGER update_credit_card_monthly_status_updated_at
  BEFORE UPDATE ON public.credit_card_monthly_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_rule_updated_at ON public.financial_rule;
CREATE TRIGGER update_financial_rule_updated_at
  BEFORE UPDATE ON public.financial_rule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil e configurações ao criar usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
