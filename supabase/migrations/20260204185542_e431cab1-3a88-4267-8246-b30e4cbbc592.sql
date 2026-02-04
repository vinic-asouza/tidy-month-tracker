-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_cards table (global per user)
CREATE TABLE public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incomes table
CREATE TABLE public.incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- e.g., "2024-01"
  description TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  tag TEXT NOT NULL,
  date TEXT NOT NULL,
  repeat_all_months BOOLEAN NOT NULL DEFAULT false,
  base_income_id UUID REFERENCES public.incomes(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- e.g., "2024-01"
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

-- Create investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- e.g., "2024-01"
  description TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  tag TEXT NOT NULL,
  date TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create finance_settings table for user customizable tags/categories
CREATE TABLE public.finance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  income_tags TEXT[] NOT NULL DEFAULT ARRAY['Salário', 'Benefício', 'Extra', 'Bonificação', 'Pagamento de terceiros', 'Freelance', 'Resgate de investimentos', 'Rendimentos', 'Presente', 'Outros'],
  expense_categories TEXT[] NOT NULL DEFAULT ARRAY['Moradia', 'Contas pessoais', 'Compras Gerais', 'Vestuário', 'Assinaturas', 'Trabalho', 'Serviços Gerais', 'Mercado', 'Lanches', 'Combustível', 'Transporte', 'Carro', 'Presentes', 'Lazer', 'Estilo de Vida', 'Consultas Médicas', 'Suplementação', 'Remédios', 'Educação', 'Viagem', 'Empréstimos', 'Doação', 'Taxas'],
  investment_tags TEXT[] NOT NULL DEFAULT ARRAY['Banco A', 'Banco B', 'Corretora', 'Outros'],
  payment_methods TEXT[] NOT NULL DEFAULT ARRAY['Dinheiro', 'Pix', 'Débito', 'Boleto'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Credit cards policies
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

-- Incomes policies
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

-- Expenses policies
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

-- Investments policies
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

-- Finance settings policies
CREATE POLICY "Users can view their own settings"
  ON public.finance_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
  ON public.finance_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.finance_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX idx_incomes_user_id_year_month ON public.incomes(user_id, year_month);
CREATE INDEX idx_expenses_user_id_year_month ON public.expenses(user_id, year_month);
CREATE INDEX idx_investments_user_id_year_month ON public.investments(user_id, year_month);
CREATE INDEX idx_finance_settings_user_id ON public.finance_settings(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_settings_updated_at
  BEFORE UPDATE ON public.finance_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile and settings on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.finance_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();