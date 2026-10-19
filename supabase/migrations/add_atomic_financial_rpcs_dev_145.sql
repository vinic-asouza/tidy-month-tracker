-- Migração DEV-145: operações financeiras atômicas via RPC (SECURITY INVOKER)
--
-- Cada função roda em uma única transação: se qualquer INSERT/UPDATE falhar,
-- nada é gravado (sem rollback manual no cliente). Como são SECURITY INVOKER,
-- as políticas RLS das tabelas continuam valendo para o usuário autenticado.
--
-- Funções:
--   create_expense_with_series(p_payload jsonb)     -> jsonb (linha raiz)
--   create_income_with_series(p_payload jsonb)      -> jsonb (linha raiz)
--   create_investment_with_series(p_payload jsonb)  -> jsonb (linha raiz)
--   rename_credit_card(p_card_id uuid, p_new_name text) -> void
--
-- Fora de escopo: importação CSV em lote (continua não atômica); carteiras/transferências (removidas).

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
