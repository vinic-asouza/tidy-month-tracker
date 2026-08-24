---
type: produto
titulo: Roadmap
ultima_atualizacao: 2026-08-21
---

# Roadmap

Estado do produto e direção **documentada**. Sem datas inventadas. Arquitetura: [`../03_arquitetura/`](../03_arquitetura/README.md). ADRs (P3 cartão por ID, P4 CHECK): [`../07_decisoes-tecnicas/`](../07_decisoes-tecnicas/index.md).

Visão: [`visao-do-produto.md`](./visao-do-produto.md).

---

## Onde estamos (agosto/2026)

- **Produção:** frontend na Vercel (`https://tidy-month-tracker.vercel.app`), Supabase direto (Auth + Postgres + RLS). Backend Express no repositório, **não** deployado nesta fase.
- **Produto no ar:** entradas, gastos, investimentos, carteiras (papéis movimentação/investimento), cartões, desejos, regra 50/30/20, visão anual, resgate, transferência, Saldo Livre, toggle efetivado/planejado.
- **Veredito de produto (docs internas, jul/2026):** **aprovado para beta fechado**. Gate pré-lançamento (Fases 1, 2 e 2.5) implementado e revalidado; sem achados críticos/altos pendentes nesses gates.
- **Linear:** projeto **Finto** no workspace White Space; status operacional ainda **Backlog** (o ciclo Ledger Flow começa a partir daí).
- **Release notes:** foto do beta em [`../releases/v0.1.0-2026-08.md`](../releases/v0.1.0-2026-08.md) (`v0.1.0`; não é go-live público).

---

## O que já fechou (gate)

Não é backlog; é o que o plano pré-lançamento marca como feito:

- Decisões de produto D1–D9 (caixa efetivado, não classificado, repetição no ano civil, carteiras em duas camadas, conquista com gasto, saldo estimado, Saldo Livre, métodos custom fora do MVP, resgate + transferência)
- Fases 1, 2 e 2.5: confiança nos números, copy, Saldo Livre, resgate e transferência
- Glossário in-app alinhado aos termos de [`glossario.md`](./glossario.md)

---

## Até go-live público (ainda pendente)

Não bloqueiam o **beta fechado**; bloqueiam divulgação ampla, segundo o plano pré-lançamento:

1. **Regressão manual no browser** — o QA dos gates foi estático + testes unitários.
2. **Migrations no Supabase de produção** — em especial `account_operations` com RLS (checklist técnico ainda em aberto no plano).
3. **Checklist de marketing / landing** — hero e FAQ alinhados à visão (manual, efetivado, fatura, saldo estimado, Saldo Livre, resgate, transferência, repetição no ano civil). Não usar “organizador financeiro” como headline principal.

Esforço estimado no plano: da ordem de **1–3 dias** depois desses três itens.

---

## Depois do lançamento público (P3 / P4)

Não bloqueiam a primeira campanha.

**P3 — hardening**

- Vínculo de gasto ao cartão por ID (`credit_card_id`), não só por nome
- Confirmação se o valor do gasto na conquista divergir muito do desejo
- Carry-forward de carteira em todos os caminhos (incl. virada de ano)

**P4 e lacunas de mercado** (contínuo)

- Constraints no banco para valores e percentuais da regra (hoje validação forte no client)
- Exportação CSV/PDF
- PWA (objeção “não tem app”)
- Recorrência além do ano civil — só se a demanda aparecer (YAGNI no plano)
- Métodos de pagamento customizáveis — fora do MVP (D8)

---

## O que o roadmap **não** promete

Alinhado à visão e ao gate:

- Espelhar saldo bancário 1:1
- Open Finance, sync de fatura ou corretora
- “A regra explica 100% dos gastos” sem mapear categorias
- Gestão de ativos no lugar da corretora
- Contas compartilhadas ou família

---

## Como usar este documento

- Demandas novas: o Product Analyst verifica se reforçam hábito/reflexão ou se puxam o Finto para agregador.
- Itens P3/P4 entram no Linear quando houver decisão de puxá-los; não são Issues deste arquivo.
