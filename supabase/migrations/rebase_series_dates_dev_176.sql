-- DEV-176: datas de clones de série (fixo/parcelado) rebaseadas por year_month
--
-- Antes: clones herdavam a mesma string `date` do root (mês de criação).
-- Agora: dia do root é reposicionado em cada year_month (clamp no último dia do mês),
-- alinhado a rebaseDateToYearMonth no frontend (CSV).

-- ---------------------------------------------------------------------------
-- Helper: YYYY-MM-DD → mesmo dia no year_month alvo (clamp)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rebase_date_to_year_month(p_ymd text, p_year_month text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT p_year_month || '-' || lpad(
    LEAST(
      GREATEST(
        COALESCE(NULLIF(substring(COALESCE(p_ymd, '') from 9 for 2), '')::int, 1),
        1
      ),
      EXTRACT(DAY FROM (
        date_trunc('month', to_date(p_year_month || '-01', 'YYYY-MM-DD'))
        + interval '1 month'
        - interval '1 day'
      ))::int
    )::text,
    2,
    '0'
  );
$$;

COMMENT ON FUNCTION public.rebase_date_to_year_month(text, text) IS
  'DEV-176: reposiciona o dia de p_ymd em p_year_month (YYYY-MM), clampando ao último dia do mês.';

-- ---------------------------------------------------------------------------
-- create_expense_with_series (REPLACE) — clones usam rebase
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
  v_clone_date text;
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
      v_clone_date := public.rebase_date_to_year_month(v_date, v_ym);

      INSERT INTO public.expenses (
        user_id, year_month, type, category, description, payment_method, credit_card_id,
        value, paid, date, repeat_all_months, base_expense_id, display_order
      )
      SELECT
        v_uid, v_ym, v_root.type, v_root.category, v_root.description,
        v_root.payment_method, v_root.credit_card_id, v_root.value, false, v_clone_date,
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
      v_clone_date := public.rebase_date_to_year_month(v_date, v_ym);

      INSERT INTO public.expenses (
        user_id, year_month, type, category, description, payment_method, credit_card_id,
        value, paid, date, base_expense_id, current_installment, total_installments,
        display_order
      )
      SELECT
        v_uid, v_ym, v_root.type, v_root.category, v_root.description,
        v_root.payment_method, v_root.credit_card_id, v_root.value, false, v_clone_date,
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

GRANT EXECUTE ON FUNCTION public.rebase_date_to_year_month(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_expense_with_series(jsonb) TO authenticated;
