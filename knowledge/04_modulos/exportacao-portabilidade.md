---
type: modulo
nome: Exportação / Portabilidade
status: Planejado
versao: "0.1"
owner: Development
ultima_atualizacao: 2026-11-11
tags: [exportacao, csv, pdf, portabilidade, p4]
dependencias: [autenticacao, entradas, gastos, cartoes, investimentos, resumo-e-estatisticas]
---

# Módulo — Exportação / Portabilidade

Plano permanente da portabilidade **além** da exportação anual agregada (RN-R07 / DEV-150).  
**Estado:** planejado (DEV-149 / [ADR-013](../07_decisoes-tecnicas/ADR-013-exportacao-portabilidade.md)). **Não há UI desta feature em produção.**

---

## Overview

| Item | Conteúdo |
| --- | --- |
| Problema | Usuário quer levar lançamentos e cartões para planilha/arquivo, sem depender só do recorte anual agregado. |
| Escopo desta doc | Inventário, formatos, contrato CSV/PDF, ownership, fases e esforço. |
| Não é | Importação CSV assistida (DEV-103), Open Finance, export anual (já existe). |

---

## Relação com o que já existe

| Capacidade | Status | Onde |
| --- | --- | --- |
| Exportação anual agregada | Produção | [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) (RN-R07) |
| Importação CSV de gastos | Produção | [`gastos.md`](./gastos.md) |
| Exportação linha a linha / Mensal | **Planejado** | este documento |
| Carteiras / accounts | Removido | [ADR-007](../07_decisoes-tecnicas/ADR-007-remover-carteiras.md) |

---

## Inventário de dados

### MVP (Issue futura de implementação)

| Entidade | Tabela | Conteúdo |
| --- | --- | --- |
| Entradas | `incomes` | Cada lançamento do intervalo |
| Gastos | `expenses` | Cada lançamento (inclui parcelas/séries como linhas) |
| Investimentos | `investments` | Cada aporte do intervalo |
| Cartões | `credit_cards` | Cadastro (inclui `hidden`) |
| Status de fatura | `credit_card_monthly_status` | Pago por cartão/mês no intervalo |

### Fora do MVP (fase 2+)

| Entidade | Motivo |
| --- | --- |
| `wish_items` | Consistência com RN-R07 (desejos fora do export anual) |
| `finance_settings` | Config auxiliar; útil depois para contexto |
| `financial_rule` | Idem |
| `profiles` | Metadados de conta; só se houver necessidade de takeout formal |
| Carteiras / `accounts` | Não existem (ADR-007) |

---

## Formatos

| Formato | Papel | Justificativa |
| --- | --- | --- |
| **CSV** | Inicial / primário | Planilha, análise externa, colunas estáveis |
| **PDF** | Complementar | Relatório legível (sumário da janela); não dump tabular massivo |

Encoding CSV alinhado ao anual: **UTF-8 com BOM**, separador **`;`**.

---

## Ownership e segurança

- Somente usuário autenticado (RN-G01).
- Dados obtidos via sessão Supabase + RLS (`user_id = auth.uid()`) — [ADR-003](../07_decisoes-tecnicas/ADR-003-rls-chave-anon.md).
- Geração no browser; download Blob; **sem** upload a Storage; **sem** `service_role` no client.
- Arquivo não deve misturar modos “efetivado/planejado” agregados: exporta **flags brutos** (`received`, `paid`, `invested`, fatura `paid`).

---

## Filtros (MVP)

| Filtro | Regra |
| --- | --- |
| Intervalo | `year_month` de / até (inclusive), formato `YYYY-MM` |
| Cartões | Cadastro completo do usuário (não filtrar por mês); status mensal respeita o intervalo |
| Séries | Exportar **cada clone mensal**; incluir `base_*_id` |

Nome base do arquivo: `finto-dados-{from}-{to}` (ex.: `finto-dados-2025-01-2025-12`). Um CSV por entidade (`…-incomes.csv`, etc.).

---

## Contrato de colunas (MVP)

### Convenções

| Campo | Formato |
| --- | --- |
| `date` | `YYYY-MM-DD` (vazio se null) |
| `year_month` | `YYYY-MM` |
| `value`, limites | número com ponto decimal (`1234.56`), sem `R$` |
| booleanos | `true` / `false` |
| timestamps | ISO-8601 UTC como no banco |

### `incomes`

`id;year_month;description;value;tag;date;received;repeat_all_months;base_income_id;display_order;created_at;updated_at`

### `expenses`

`id;year_month;type;category;description;payment_method;credit_card_id;credit_card_name;value;paid;date;repeat_all_months;base_expense_id;current_installment;total_installments;display_order;created_at;updated_at`

### `investments`

`id;year_month;description;value;tag;date;invested;repeat_all_months;base_investment_id;display_order;created_at;updated_at`

### `credit_cards`

`id;name;color;paid;due_day;credit_limit;display_order;hidden;created_at;updated_at`

### `credit_card_monthly_status`

`id;credit_card_id;credit_card_name;year_month;paid;created_at;updated_at`

---

## PDF complementar (pós-CSV)

- Sumário da janela: totais por mês, contagens, totais por categoria/tag (agregado).
- Reusar padrões visuais de `annualExportPdf.ts` quando possível.
- Não listar milhares de linhas no PDF.

---

## Esforço estimado (Issue futura)

| Fase | Escopo | Dias (ordem de grandeza) |
| --- | --- | --- |
| MVP CSV | Queries + serialização + UI de intervalo + download multi-arquivo | 3–5 |
| PDF complementar | Modelo agregado + jspdf | +1–2 |
| Fase 2 | Desejos / settings / regra | +1–2 |

Arquitetura: **só frontend** + facades existentes (skip backend Express).

---

## Fora de escopo (permanente até nova decisão)

- E-mail com anexo
- Open Finance / sync bancário
- Reimportação automática do CSV exportado
- Alterar ou substituir a exportação anual agregada (RN-R07)
- Incluir carteiras

---

## Regras sugeridas (formalizar na implementação)

| ID sugerido | Texto |
| --- | --- |
| RN-EXP-01 | Exportação linha a linha só do usuário autenticado; CSV UTF-8 BOM `;`; sem gravação no Storage |
| RN-EXP-02 | PDF complementar é sumário da janela, não dump linha a linha |
| RN-EXP-03 | Naming e entrada de UI distintos de “Exportar anual” e “Importar CSV” |

---

## Histórico

| Data | Versão | Mudança | Issue |
| --- | --- | --- | --- |
| 2026-11-11 | 0.1 | Plano inicial (DEV-149) | DEV-149 |
