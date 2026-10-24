---
type: produto
titulo: Métricas do beta fechado
ultima_atualizacao: 2026-10-24
---

# Métricas do beta fechado

Como o fundador vê se quem entra no beta chega ao primeiro valor e se volta. Não é telemetria de produto, não tem SDK e não aparece na UI.

Visão: [`visao-do-produto.md`](./visao-do-produto.md). Política: [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md). Onboarding (conclusão de tour, quando existir) **não** redefine estas métricas.

---

## O que cada evento significa

| Evento | Onde já está | Conta quando |
| --- | --- | --- |
| Cadastro | `profiles.created_at` | A trigger de signup criou o perfil |
| Login | `auth.users.last_sign_in_at` | Houve ao menos um login bem-sucedido. Refresh de token não conta |
| Primeiro lançamento | `MIN(created_at)` em `incomes`, `expenses` ou `investments` | Existe ao menos uma linha nessas tabelas |
| Regra financeira | linha em `financial_rule` | A pessoa salvou a regra. Evento à parte, não é ativação |
| Retorno | `last_sign_in_at` vs `profiles.created_at` | O último login cai em dia de calendário **posterior** ao dia do cadastro, fuso `America/Sao_Paulo` |

Desejo não é lançamento. Conta só com desejo, ou só com regra, **não** está ativada. Série recorrente gera várias linhas; vale a existência, não a quantidade de meses.

**Retorno é um piso.** A sessão do Finto fica viva até o logout. Quem volta no dia seguinte sem passar de novo pelo login não entra na taxa. Não trate a taxa como “abriu o app de novo”.

---

## Ativação e retenção

- **Ativação:** a conta tem ao menos um lançamento (entrada, gasto ou investimento).
- **Retenção do beta:** a conta retornou, no sentido da tabela acima.
- **Coorte de decisão:** cadastro há pelo menos 7 dias. Conta mais nova fica de fora da leitura que autoriza mudança.
- **Amostra mínima:** menos de 5 contas no coorte → não decidir.

Não há percentual-alvo de go-live. O número serve para escolher o tipo de problema, não para declarar o beta um sucesso.

---

## Como coletar

Uma vez por semana, no beta fechado, o fundador cola as consultas abaixo no **SQL Editor** do Supabase (papel do dashboard, que já lê `auth.users`).

É proibido:

- transformar isso em view, RPC ou policy
- dar `GRANT` para `anon` ou `authenticated`
- selecionar `auth.users.email` (nem aqui, nem numa variante)
- mandar o resultado para um vendor (PostHog, Sentry ou equivalente)
- expor a consulta no SPA

A consulta de detalhe identifica a conta por `user_id`. O agregado não traz identificador.

```sql
-- Coorte do beta (DEV-146). Somente SQL Editor.
-- Proibido: view/RPC, GRANT para anon ou authenticated, selecionar email.

WITH lancamentos AS (
  SELECT user_id, created_at FROM public.incomes
  UNION ALL
  SELECT user_id, created_at FROM public.expenses
  UNION ALL
  SELECT user_id, created_at FROM public.investments
),
primeiro AS (
  SELECT user_id, MIN(created_at) AS primeiro_lancamento_em
  FROM lancamentos
  GROUP BY user_id
),
coorte AS (
  SELECT
    p.user_id,
    p.created_at AS cadastro_em,
    u.last_sign_in_at AS ultimo_login_em,
    (u.last_sign_in_at IS NOT NULL) AS entrou,
    (
      u.last_sign_in_at IS NOT NULL
      AND (u.last_sign_in_at AT TIME ZONE 'America/Sao_Paulo')::date
        > (p.created_at AT TIME ZONE 'America/Sao_Paulo')::date
    ) AS retornou,
    (fr.user_id IS NOT NULL) AS configurou_regra,
    pr.primeiro_lancamento_em,
    (pr.user_id IS NOT NULL) AS ativado
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.financial_rule fr ON fr.user_id = p.user_id
  LEFT JOIN primeiro pr ON pr.user_id = p.user_id
  WHERE p.created_at <= now() - interval '7 days'
)
SELECT
  COUNT(*) AS coorte,
  COUNT(*) FILTER (WHERE entrou) AS com_login,
  COUNT(*) FILTER (WHERE configurou_regra) AS com_regra,
  COUNT(*) FILTER (WHERE ativado) AS ativados,
  COUNT(*) FILTER (WHERE NOT ativado) AS sem_lancamento,
  COUNT(*) FILTER (WHERE ativado AND NOT retornou) AS ativou_sem_retorno,
  COUNT(*) FILTER (WHERE retornou) AS retornos
FROM coorte;
```

Para ver conta a conta, troque o `SELECT` final por `SELECT * FROM coorte ORDER BY cadastro_em`. Continua sem e-mail.

---

## O que a leitura autoriza

| Leitura no coorte | Problema | Decisão que cabe |
| --- | --- | --- |
| `sem_lancamento` é a maior parte | O primeiro acesso não chega num lançamento | Ajustar a orientação do primeiro uso. Não instalar analytics |
| `com_regra` alto e `ativados` baixo | A regra está sendo salva e o lançamento, não | Não tratar “configurou a regra” como ativação |
| `ativou_sem_retorno` alto, com ativação razoável | Houve primeiro valor e o login seguinte não apareceu | Conversar com quem está no beta. Lembrar que a taxa é piso |
| `ativados` e `retornos` altos | O funil mínimo aconteceu | Não mudar o produto por impressão solta |
| `coorte` &lt; 5, ou cadastro com menos de 7 dias | Amostra fora da regra | Não decidir |

Conclusão ou dispensa de onboarding, quando esse fluxo existir, mede a UX do tour. Não entra nesta tabela e não conta como ativação.
