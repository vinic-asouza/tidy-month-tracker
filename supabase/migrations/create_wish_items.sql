-- Migração: Lista de desejos (wish_items)
-- Itens de conquista com prazo, urgência e valor estimado

CREATE TABLE IF NOT EXISTS public.wish_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  value DECIMAL(12,2) NOT NULL DEFAULT 0,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  start_month TEXT NOT NULL,
  target_month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'conquered', 'expired')),
  conquered_month TEXT,
  linked_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT wish_items_month_format CHECK (
    start_month ~ '^\d{4}-\d{2}$' AND target_month ~ '^\d{4}-\d{2}$'
  ),
  CONSTRAINT wish_items_target_after_start CHECK (target_month >= start_month)
);

CREATE INDEX IF NOT EXISTS idx_wish_items_user_id ON public.wish_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wish_items_user_status ON public.wish_items(user_id, status);

ALTER TABLE public.wish_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wish items" ON public.wish_items;
CREATE POLICY "Users can view own wish items"
  ON public.wish_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wish items" ON public.wish_items;
CREATE POLICY "Users can insert own wish items"
  ON public.wish_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wish items" ON public.wish_items;
CREATE POLICY "Users can update own wish items"
  ON public.wish_items FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wish items" ON public.wish_items;
CREATE POLICY "Users can delete own wish items"
  ON public.wish_items FOR DELETE
  USING (auth.uid() = user_id);
