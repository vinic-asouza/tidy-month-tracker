---
type: produto
titulo: Roadmap
ultima_atualizacao: 2026-10-19
---

# Roadmap

Estado do produto e direção **documentada**. Sem datas inventadas. Arquitetura: [`../03_arquitetura/`](../03_arquitetura/README.md). ADRs (P3 cartão por ID; CHECKs de lançamento = ADR-008 / DEV-143): [`../07_decisoes-tecnicas/`](../07_decisoes-tecnicas/index.md).

Visão: [`visao-do-produto.md`](./visao-do-produto.md).

---

## Onde estamos (outubro/2026)

- **Produção:** frontend na Vercel (`https://tidy-month-tracker.vercel.app`), Supabase direto (Auth + Postgres + RLS). Backend Express no repositório, **não** deployado nesta fase.
- **Produto no ar:** entradas, gastos, investimentos, cartões, desejos, regra 50/30/20, visão anual, toggle efetivado/planejado. **Carteiras** (papéis, Saldo Livre, transferência, resgate) foram **removidas** na DEV-151 / v0.9.0 ([ADR-007](../07_decisoes-tecnicas/ADR-007-remover-carteiras.md)).
- **Recente em produção:** importação **CSV assistida de gastos** (DEV-103 / v0.2.0) — fase 0 antes de Open Finance.
- **Schema / RLS (DEV-141 + DEV-142, out/2026):** produção `tidy-tracker` auditada — `remove_wallets_dev_151` aplicada; tabelas de carteira ausentes; RLS ON nas 9 tabelas de negócio; isolamento cross-user validado. Detalhe: [`../03_arquitetura/seguranca.md`](../03_arquitetura/seguranca.md), [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md).
- **Veredito de produto (docs internas, jul/2026):** **aprovado para beta fechado**. Gate pré-lançamento (Fases 1, 2 e 2.5) implementado e revalidado; sem achados críticos/altos pendentes nesses gates.
- **Linear:** projeto **Finto**; fluxo Ledger Flow no time **Development**.
- **Release notes:** baseline [`../releases/v0.1.0-2026-08.md`](../releases/v0.1.0-2026-08.md); CSV assistida em [`../releases/v0.2.0-2026-09-03.md`](../releases/v0.2.0-2026-09-03.md) (**Publicado**).

---

## O que já fechou (gate)

Não é backlog; é o que o plano pré-lançamento marcou como feito **na época**. Itens de carteiras abaixo são histórico: o módulo foi removido na DEV-151.

- Decisões de produto D1–D9 (caixa efetivado, não classificado, repetição no ano civil, carteiras em duas camadas, conquista com gasto, saldo estimado, Saldo Livre, métodos custom fora do MVP, resgate + transferência)
- Fases 1, 2 e 2.5: confiança nos números, copy, Saldo Livre, resgate e transferência
- Glossário in-app alinhado aos termos de [`glossario.md`](./glossario.md)
- **Migrations / RLS / isolamento em produção** (DEV-141, DEV-142) — schema pós-ADR-007 confirmado; policies `auth.uid() = user_id` revalidadas

---

## Até go-live público (ainda pendente)

Não bloqueiam o **beta fechado**; bloqueiam divulgação ampla, segundo o plano pré-lançamento:

1. **Regressão manual no browser** — o QA dos gates foi estático + testes unitários.
2. **Checklist de marketing / landing** — hero e FAQ alinhados à visão (manual, efetivado, fatura, repetição no ano civil; sem carteiras, Saldo Livre, resgate ou transferência). Não usar “organizador financeiro” como headline principal.

*(Item antigo “migrations no Supabase de produção” foi fechado em out/2026 — ver seção acima.)*

Esforço estimado no plano: da ordem de **1–3 dias** depois dos itens ainda pendentes.

---

## Depois do lançamento público (P3 / P4)

Não bloqueiam a primeira campanha.

**P3 — hardening**

- ~~Vínculo de gasto ao cartão por ID (`credit_card_id`)~~ — **feito** em DEV-144 / ADR-009
- Confirmação se o valor do gasto na conquista divergir muito do desejo
- Endurecimentos Supabase advisors (WARN): `search_path` em funções, REVOKE EXECUTE de `handle_new_user` para anon/authenticated, leaked-password protection no Auth

**P4 e lacunas de mercado** (contínuo)

- ~~Constraints no banco para valores~~ — **feito** em DEV-143 / ADR-008 (`value > 0`, `year_month`, parcelas); soma 100% da regra já tinha CHECK
- Exportação CSV/PDF além do recorte anual agregado (DEV-150 / v0.8.0). Visão Mensal, lançamento linha a linha, e-mail e arquivo dos dois modos continuam fora
- PWA (objeção “não tem app”)
- Recorrência além do ano civil — só se a demanda aparecer (YAGNI no plano)
- Métodos de pagamento customizáveis — fora do MVP (D8)
- Open Finance / agregador (DEV-96 **adiada**; reaproveitar UX da importação assistida quando voltar)

---

## O que o roadmap **não** promete

Alinhado à visão e ao gate:

- Espelhar saldo bancário 1:1 ou rastrear contas/carteiras
- Open Finance, sync de fatura ou corretora (ainda)
- Importação **sem** revisão humana
- “A regra explica 100% dos gastos” sem mapear categorias
- Gestão de ativos no lugar da corretora
- Contas compartilhadas ou família

---

## Como usar este documento

- Demandas novas: o Product Analyst verifica se reforçam hábito/reflexão ou se puxam o Finto para agregador.
- Itens P3/P4 entram no Linear quando houver decisão de puxá-los; não são Issues deste arquivo.
