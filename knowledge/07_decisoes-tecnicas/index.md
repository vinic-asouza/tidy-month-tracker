---
type: index
secao: 07_decisoes-tecnicas
ultima_atualizacao: 2026-11-11
---

# Índice de ADRs

Registro do que o código **já faz** (e decisões de plano vigentes). Data = quando entrou na KB (a decisão é anterior). Status **Aceito** = vigente.

Template: [`../00_meta/templates/template-adr.md`](../00_meta/templates/template-adr.md). Arquitetura: [`../03_arquitetura/`](../03_arquitetura/README.md).

| ID | Título | Status | Tags |
| --- | --- | --- | --- |
| [ADR-001](./ADR-001-spa-supabase-producao.md) | Produção = SPA na Vercel + Supabase direto | Aceito | infra, backend |
| [ADR-002](./ADR-002-facades-adaptadores.md) | UI só fala com facades; adapters `supabase` \| `api` | Aceito | frontend, api |
| [ADR-003](./ADR-003-rls-chave-anon.md) | Isolamento por RLS; anon key no cliente | Aceito | segurança, banco |
| [ADR-004](./ADR-004-auth-sempre-supabase.md) | Identidade sempre Supabase Auth | Aceito | segurança, auth |
| [ADR-005](./ADR-005-cartao-por-nome.md) | Gasto no cartão casa pelo **nome** | Substituída (ADR-009) | dados, integridade |
| [ADR-006](./ADR-006-validacao-no-cliente.md) | Regras de valor/percentual no cliente | Parcialmente substituída (ADR-008) | segurança, banco |
| [ADR-007](./ADR-007-remover-carteiras.md) | Remover carteiras do produto e do schema | Aceito | produto, banco |
| [ADR-008](./ADR-008-checks-integridade-lancamentos.md) | CHECKs de integridade em lançamentos | Aceito | segurança, banco |
| [ADR-009](./ADR-009-cartao-por-id.md) | Gasto no cartão casa pelo **credit_card_id** | Aceito | dados, integridade |
| [ADR-010](./ADR-010-rpcs-atomicas-series.md) | RPCs atômicas para séries e rename | Aceito | banco, integridade |
| [ADR-011](./ADR-011-adiar-pwa.md) | Adiar PWA; sem cache offline de dados financeiros | Substituída (ADR-012) — política offline vigente | frontend, infra, segurança |
| [ADR-012](./ADR-012-shell-pwa-online-first.md) | Shell PWA instalável online-first | Aceito | frontend, infra, segurança |
| [ADR-013](./ADR-013-exportacao-portabilidade.md) | Plano de exportação/portabilidade além do anual | Aceito | frontend, produto, segurança, dados |

## Não entra aqui

| Assunto | Onde |
| --- | --- |
| D1–D9 (caixa efetivado, D8 métodos, etc.; Saldo Livre/carteiras removidos na DEV-151) | Produto / regras |
| Express incompleto (sem desejos) | Consequência da ADR-001; [`../03_arquitetura/api-design.md`](../03_arquitetura/api-design.md) |
| Sem CI / Prettier | [`../05_padroes/`](../05_padroes/README.md) |
| Contrato CSV/colunas do plano de portabilidade | [`../04_modulos/exportacao-portabilidade.md`](../04_modulos/exportacao-portabilidade.md) |

Próxima ADR: **ADR-014**. Não edite ADR Aceito: crie ADR nova e marque a antiga Substituída.
