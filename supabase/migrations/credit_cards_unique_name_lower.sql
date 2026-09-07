-- Migração: Índice único em credit_cards(user_id, lower(name))
-- Data: 2025-09-07
-- Motivo: Impedir cartões duplicados por nome (case-insensitive) no mesmo usuário
--
-- ATENÇÃO: se já existirem cartões duplicados (mesmo user_id e mesmo nome
-- ignorando maiúsculas/minúsculas), a criação do índice falha. Resolva os
-- duplicados antes de aplicar. Para localizá-los:
--
--   SELECT user_id, lower(name) AS nome, count(*)
--   FROM public.credit_cards
--   GROUP BY user_id, lower(name)
--   HAVING count(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS credit_cards_user_id_lower_name_uidx
ON public.credit_cards (user_id, lower(name));
