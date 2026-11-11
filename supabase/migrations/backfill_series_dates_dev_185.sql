-- DEV-185: backfill de dates desalinhadas em séries + fix RPC incomes/investments
--
-- Pré-condição: public.rebase_date_to_year_month (DEV-176) já existe.
-- Escopo do UPDATE: só linhas de série com left(date,7) <> year_month.
-- Idempotente: reexecutar não altera linhas já alinhadas.

-- ---------------------------------------------------------------------------
-- 1) create_income_with_series — clones com date rebaseada
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
  v_clone_date text;
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
      v_clone_date := public.rebase_date_to_year_month(v_date, v_ym);

      INSERT INTO public.incomes (
        user_id, year_month, description, value, tag, date, received, repeat_all_months,
        base_income_id, display_order
      )
      SELECT
        v_uid, v_ym, v_root.description, v_root.value, v_root.tag, v_clone_date, false, true,
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
-- 2) create_investment_with_series — clones com date rebaseada
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
  v_clone_date text;
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
      v_clone_date := public.rebase_date_to_year_month(v_date, v_ym);

      INSERT INTO public.investments (
        user_id, year_month, description, value, tag, date, invested, repeat_all_months,
        base_investment_id, display_order
      )
      SELECT
        v_uid, v_ym, v_root.description, v_root.value, v_root.tag, v_clone_date, false, true,
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

GRANT EXECUTE ON FUNCTION public.create_income_with_series(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_investment_with_series(jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) Backfill — expenses em série
-- ---------------------------------------------------------------------------
UPDATE public.expenses e
SET date = public.rebase_date_to_year_month(e.date, e.year_month)
WHERE e.date IS NOT NULL
  AND e.date ~ '^\d{4}-\d{2}-\d{2}$'
  AND left(e.date, 7) <> e.year_month
  AND (
    e.base_expense_id IS NOT NULL
    OR e.repeat_all_months = true
    OR e.type = 'installment'
    OR EXISTS (SELECT 1 FROM public.expenses c WHERE c.base_expense_id = e.id)
  );

-- ---------------------------------------------------------------------------
-- 4) Backfill — incomes em série (fixos)
-- ---------------------------------------------------------------------------
UPDATE public.incomes i
SET date = public.rebase_date_to_year_month(i.date, i.year_month)
WHERE i.date IS NOT NULL
  AND i.date ~ '^\d{4}-\d{2}-\d{2}$'
  AND left(i.date, 7) <> i.year_month
  AND (
    i.base_income_id IS NOT NULL
    OR i.repeat_all_months = true
    OR EXISTS (SELECT 1 FROM public.incomes c WHERE c.base_income_id = i.id)
  );

-- ---------------------------------------------------------------------------
-- 5) Backfill — investments em série (fixos)
-- ---------------------------------------------------------------------------
UPDATE public.investments v
SET date = public.rebase_date_to_year_month(v.date, v.year_month)
WHERE v.date IS NOT NULL
  AND v.date ~ '^\d{4}-\d{2}-\d{2}$'
  AND left(v.date, 7) <> v.year_month
  AND (
    v.base_investment_id IS NOT NULL
    OR v.repeat_all_months = true
    OR EXISTS (SELECT 1 FROM public.investments c WHERE c.base_investment_id = v.id)
  );
