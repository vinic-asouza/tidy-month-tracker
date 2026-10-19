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
  due_day SMALLINT CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 31)),
  credit_limit NUMERIC(12, 2) CHECK (credit_limit IS NULL OR credit_limit > 0),
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
  payment_method TEXT NOT NULL, -- Rótulo denormalizado (nome do cartão ou método padrão)
  credit_card_id UUID NULL REFERENCES public.credit_cards(id) ON DELETE SET NULL, -- DEV-144: fonte de verdade da associação com cartão
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
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_credit_card_id ON public.expenses(user_id, credit_card_id);
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
-- DEV-145: RPCs atômicas (SECURITY INVOKER)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- create_expense_with_series
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_expense_with_series(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_payload_uid uuid;
  v_type text;
  v_year_month text;
  v_year int;
  v_month int;
  v_date text;
  v_repeat boolean;
  v_cur int;
  v_tot int;
  v_credit_card_id uuid;
  v_root public.expenses%ROWTYPE;
  v_ym text;
  v_idx int;
  i int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  v_payload_uid := NULLIF(p_payload->>'user_id', '')::uuid;
  IF v_payload_uid IS NOT NULL AND v_payload_uid <> v_uid THEN
    RAISE EXCEPTION 'user_id do payload não corresponde ao usuário autenticado';
  END IF;

  v_type := p_payload->>'type';
  v_year_month := p_payload->>'year_month';
  IF v_year_month IS NULL OR v_year_month !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'year_month inválido (esperado YYYY-MM)';
  END IF;
  v_year := split_part(v_year_month, '-', 1)::int;
  v_month := split_part(v_year_month, '-', 2)::int;

  v_date := COALESCE(NULLIF(p_payload->>'date', ''), to_char(current_date, 'YYYY-MM-DD'));
  v_repeat := COALESCE((p_payload->>'repeat_all_months')::boolean, false);
  v_cur := (p_payload->>'current_installment')::int;
  v_tot := (p_payload->>'total_installments')::int;
  v_credit_card_id := NULLIF(p_payload->>'credit_card_id', '')::uuid;

  INSERT INTO public.expenses (
    user_id, year_month, type, category, description, payment_method, credit_card_id,
    value, paid, date, repeat_all_months, current_installment, total_installments,
    display_order
  ) VALUES (
    v_uid, v_year_month, v_type, p_payload->>'category', p_payload->>'description',
    p_payload->>'payment_method', v_credit_card_id,
    (p_payload->>'value')::numeric,
    COALESCE((p_payload->>'paid')::boolean, false),
    v_date, v_repeat, v_cur, v_tot,
    COALESCE((p_payload->>'display_order')::int, 0)
  )
  RETURNING * INTO v_root;

  -- Fixo repetido: demais meses do ano civil (1..12, exceto o mês atual).
  IF v_type = 'fixed' AND v_repeat THEN
    FOR i IN 1..12 LOOP
      CONTINUE WHEN i = v_month;
      v_ym := v_year::text || '-' || lpad(i::text, 2, '0');

      INSERT INTO public.expenses (
        user_id, year_month, type, category, description, payment_method, credit_card_id,
        value, paid, date, repeat_all_months, base_expense_id, display_order
      )
      SELECT
        v_uid, v_ym, v_root.type, v_root.category, v_root.description,
        v_root.payment_method, v_root.credit_card_id, v_root.value, false, v_date,
        true, v_root.id, 0
      WHERE NOT EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.user_id = v_uid
          AND e.year_month = v_ym
          AND (e.id = v_root.id OR e.base_expense_id = v_root.id)
      );
    END LOOP;
  END IF;

  -- Parcelado: parcelas restantes avançando mês a mês (pode cruzar o ano).
  IF v_type = 'installment' AND v_cur IS NOT NULL AND v_tot IS NOT NULL
     AND v_cur >= 1 AND v_tot >= 1 AND v_cur <= v_tot THEN
    FOR i IN 1..(v_tot - v_cur) LOOP
      v_idx := v_year * 12 + (v_month - 1) + i;
      v_ym := (v_idx / 12)::text || '-' || lpad(((v_idx % 12) + 1)::text, 2, '0');

      INSERT INTO public.expenses (
        user_id, year_month, type, category, description, payment_method, credit_card_id,
        value, paid, date, base_expense_id, current_installment, total_installments,
        display_order
      )
      SELECT
        v_uid, v_ym, v_root.type, v_root.category, v_root.description,
        v_root.payment_method, v_root.credit_card_id, v_root.value, false, v_date,
        v_root.id, v_cur + i, v_tot, 0
      WHERE NOT EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.user_id = v_uid
          AND e.year_month = v_ym
          AND (e.id = v_root.id OR e.base_expense_id = v_root.id)
          AND e.current_installment = v_cur + i
      );
    END LOOP;
  END IF;

  RETURN to_jsonb(v_root);
END;
$$;

-- ---------------------------------------------------------------------------
-- create_income_with_series
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_income_with_series(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_payload_uid uuid;
  v_year_month text;
  v_year int;
  v_month int;
  v_date text;
  v_repeat boolean;
  v_root public.incomes%ROWTYPE;
  v_ym text;
  i int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  v_payload_uid := NULLIF(p_payload->>'user_id', '')::uuid;
  IF v_payload_uid IS NOT NULL AND v_payload_uid <> v_uid THEN
    RAISE EXCEPTION 'user_id do payload não corresponde ao usuário autenticado';
  END IF;

  v_year_month := p_payload->>'year_month';
  IF v_year_month IS NULL OR v_year_month !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'year_month inválido (esperado YYYY-MM)';
  END IF;
  v_year := split_part(v_year_month, '-', 1)::int;
  v_month := split_part(v_year_month, '-', 2)::int;

  v_date := COALESCE(NULLIF(p_payload->>'date', ''), to_char(current_date, 'YYYY-MM-DD'));
  v_repeat := COALESCE((p_payload->>'repeat_all_months')::boolean, false);

  INSERT INTO public.incomes (
    user_id, year_month, description, value, tag, date, received, repeat_all_months,
    display_order
  ) VALUES (
    v_uid, v_year_month, p_payload->>'description', (p_payload->>'value')::numeric,
    p_payload->>'tag', v_date,
    COALESCE((p_payload->>'received')::boolean, false), v_repeat,
    COALESCE((p_payload->>'display_order')::int, 0)
  )
  RETURNING * INTO v_root;

  IF v_repeat THEN
    FOR i IN 1..12 LOOP
      CONTINUE WHEN i = v_month;
      v_ym := v_year::text || '-' || lpad(i::text, 2, '0');

      INSERT INTO public.incomes (
        user_id, year_month, description, value, tag, date, received, repeat_all_months,
        base_income_id, display_order
      )
      SELECT
        v_uid, v_ym, v_root.description, v_root.value, v_root.tag, v_date, false, true,
        v_root.id, 0
      WHERE NOT EXISTS (
        SELECT 1 FROM public.incomes x
        WHERE x.user_id = v_uid
          AND x.year_month = v_ym
          AND (x.id = v_root.id OR x.base_income_id = v_root.id)
      );
    END LOOP;
  END IF;

  RETURN to_jsonb(v_root);
END;
$$;

-- ---------------------------------------------------------------------------
-- create_investment_with_series
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_investment_with_series(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_payload_uid uuid;
  v_year_month text;
  v_year int;
  v_month int;
  v_date text;
  v_repeat boolean;
  v_root public.investments%ROWTYPE;
  v_ym text;
  i int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  v_payload_uid := NULLIF(p_payload->>'user_id', '')::uuid;
  IF v_payload_uid IS NOT NULL AND v_payload_uid <> v_uid THEN
    RAISE EXCEPTION 'user_id do payload não corresponde ao usuário autenticado';
  END IF;

  v_year_month := p_payload->>'year_month';
  IF v_year_month IS NULL OR v_year_month !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'year_month inválido (esperado YYYY-MM)';
  END IF;
  v_year := split_part(v_year_month, '-', 1)::int;
  v_month := split_part(v_year_month, '-', 2)::int;

  v_date := COALESCE(NULLIF(p_payload->>'date', ''), to_char(current_date, 'YYYY-MM-DD'));
  v_repeat := COALESCE((p_payload->>'repeat_all_months')::boolean, false);

  INSERT INTO public.investments (
    user_id, year_month, description, value, tag, date, invested, repeat_all_months,
    display_order
  ) VALUES (
    v_uid, v_year_month, p_payload->>'description', (p_payload->>'value')::numeric,
    p_payload->>'tag', v_date, false, v_repeat,
    COALESCE((p_payload->>'display_order')::int, 0)
  )
  RETURNING * INTO v_root;

  IF v_repeat THEN
    FOR i IN 1..12 LOOP
      CONTINUE WHEN i = v_month;
      v_ym := v_year::text || '-' || lpad(i::text, 2, '0');

      INSERT INTO public.investments (
        user_id, year_month, description, value, tag, date, invested, repeat_all_months,
        base_investment_id, display_order
      )
      SELECT
        v_uid, v_ym, v_root.description, v_root.value, v_root.tag, v_date, false, true,
        v_root.id, 0
      WHERE NOT EXISTS (
        SELECT 1 FROM public.investments x
        WHERE x.user_id = v_uid
          AND x.year_month = v_ym
          AND (x.id = v_root.id OR x.base_investment_id = v_root.id)
      );
    END LOOP;
  END IF;

  RETURN to_jsonb(v_root);
END;
$$;

-- ---------------------------------------------------------------------------
-- rename_credit_card
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rename_credit_card(p_card_id uuid, p_new_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_old_name text;
  v_new_name text := btrim(COALESCE(p_new_name, ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF v_new_name = '' THEN
    RAISE EXCEPTION 'Nome do cartão é obrigatório';
  END IF;

  SELECT name INTO v_old_name
  FROM public.credit_cards
  WHERE id = p_card_id AND user_id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado';
  END IF;

  IF v_old_name = v_new_name THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.credit_cards
    WHERE user_id = v_uid AND lower(name) = lower(v_new_name) AND id <> p_card_id
  ) THEN
    RAISE EXCEPTION 'Já existe um cartão com este nome';
  END IF;

  BEGIN
    UPDATE public.credit_cards
    SET name = v_new_name
    WHERE id = p_card_id AND user_id = v_uid;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Já existe um cartão com este nome';
  END;

  -- DEV-144: associação por credit_card_id; payment_method é só o rótulo denormalizado.
  UPDATE public.expenses
  SET payment_method = v_new_name
  WHERE credit_card_id = p_card_id AND user_id = v_uid;

  -- Legados sem credit_card_id (nome antigo): sincroniza o rótulo e já associa ao cartão.
  UPDATE public.expenses
  SET payment_method = v_new_name, credit_card_id = p_card_id
  WHERE credit_card_id IS NULL AND payment_method = v_old_name AND user_id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_expense_with_series(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_income_with_series(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_investment_with_series(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rename_credit_card(uuid, text) TO authenticated;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
