-- DEV-147: progresso do guia de primeiro acesso no perfil da própria conta.
-- RLS de UPDATE em profiles já restringe a linha a auth.uid() = user_id.
-- Colunas com default: o client antigo continua válido.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_step smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_dismissed boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_onboarding_step_range;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_onboarding_step_range
  CHECK (onboarding_step >= 0 AND onboarding_step <= 3);
