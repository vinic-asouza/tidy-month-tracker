---
type: adr
id: ADR-013
titulo: Plano de exportação/portabilidade além do anual agregado
status: Aceito
data: 2026-11-11
autor: Development
decisores: [Development]
tags: [frontend, produto, segurança, dados]
---

# ADR-013 — Plano de exportação/portabilidade além do anual agregado

## Contexto e problema

Já existe exportação **anual agregada** (DEV-150 / RN-R07): PDF/CSV do que a visão Anual mostra, sem linha a linha. O roadmap P4 e a Issue DEV-149 pedem portabilidade maior (confiança + análise fora do Finto), sem misturar com importação CSV assistida (DEV-103) nem Open Finance.

**Problema técnico:** definir *antes* de implementar o inventário, formatos, ownership e esforço mínimo — evitando escopo “takeout LGPD completo” ou reintroduzir carteiras (ADR-007).

**Por que decidir agora:** DEV-149 é planejamento explícito; implementação fica em Issue futura.

## Forças em jogo

- Reusar padrão client-side (sessão + RLS + Blob) de DEV-150 / ADR-001 / ADR-003.
- CSV útil para planilha; PDF ruim como dump de milhares de linhas.
- RN-G01: só dados do `auth.uid()`.
- YAGNI: sem e-mail, ZIP obrigatório, backend novo ou reimport 1:1.
- Inventário real pós-DEV-151: sem `accounts`/carteiras.

## Decisão

1. **Esta entrega (DEV-149)** documenta o plano na KB; **não** implementa UI/API da exportação linha a linha.
2. **MVP da Issue futura:** CSV linha a linha das entidades `incomes`, `expenses`, `investments`, `credit_cards`, `credit_card_monthly_status`, gerado no browser com dados já filtrados pela sessão/RLS.
3. **PDF:** relatório complementar (sumário / janela filtrada), não substituto do CSV tabular.
4. **Fora do MVP:** desejos, `finance_settings`, `financial_rule`, `profiles`, e-mail, Open Finance, reimport round-trip, carteiras.
5. **Contrato CSV:** UTF-8 com BOM; separador `;`; datas `YYYY-MM-DD` / `year_month` `YYYY-MM`; valores com ponto decimal; booleanos `true`/`false`; um arquivo por entidade; filtro por intervalo de `year_month`.
6. **Arquitetura futura:** frontend + PostgREST (sem `service_role`, sem upload a Storage) — igual ao export anual.

Detalhe operacional (colunas, fases, esforço): [`../04_modulos/exportacao-portabilidade.md`](../04_modulos/exportacao-portabilidade.md).

## Opções consideradas

| Opção | Veredito |
| --- | --- |
| A) Só documentar o plano agora | **Escolhida** (DEV-149) |
| B) Implementar CSV+PDF completo nesta Issue | Rejeitada (CA = planejar) |
| C) Dump JSON server-side / Edge Function | Adiada; overkill vs RLS client |
| D) Incluir carteiras no inventário | Rejeitada (ADR-007) |

## Consequências

**Positivas:** engenharia tem contrato e estimativa (CSV MVP ~3–5 d); glossário/roadmap deixam claro o que ainda é P4; ownership explícito.

**Negativas:** usuário ainda não baixa linha a linha até a Issue de implementação; PDF complementar só na fase seguinte ao CSV.

## Notas

Issue: DEV-149. Export anual vigente: DEV-150 / RN-R07. Índice: [index.md](./index.md).
