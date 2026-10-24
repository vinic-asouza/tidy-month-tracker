---
type: index
secao: releases
ultima_atualizacao: 2026-10-24
---

# Releases

Release notes **permanentes** de uma versão enviada. Não são changelog de Issue nem dump do git.

- Template: [`../00_meta/templates/template-release-notes.md`](../00_meta/templates/template-release-notes.md)
- Arquivo: `knowledge/releases/[VERSAO]-[DATA].md` (ex.: `v1.0.0-2026-09-01.md`)
- Demanda: IDs Linear no frontmatter; o detalhe operacional fica no Linear

Índice:

| Versão | Data | Status | Arquivo |
| --- | --- | --- | --- |
| v0.15.0 | 2026-10-24 | Publicado | [v0.15.0-2026-10-24.md](./v0.15.0-2026-10-24.md) |
| v0.14.1 | 2026-10-24 | Publicado | [v0.14.1-2026-10-24.md](./v0.14.1-2026-10-24.md) |
| v0.14.0 | 2026-10-19 | Publicado | [v0.14.0-2026-10-19.md](./v0.14.0-2026-10-19.md) |
| v0.13.0 | 2026-10-19 | Publicado | [v0.13.0-2026-10-19.md](./v0.13.0-2026-10-19.md) |
| v0.12.0 | 2026-10-19 | Publicado | [v0.12.0-2026-10-19.md](./v0.12.0-2026-10-19.md) |
| v0.11.1 | 2026-10-19 | Publicado | [v0.11.1-2026-10-19.md](./v0.11.1-2026-10-19.md) |
| v0.11.0 | 2026-10-17 | Publicado | [v0.11.0-2026-10-17.md](./v0.11.0-2026-10-17.md) |
| v0.10.0 | 2026-10-16 | Publicado | [v0.10.0-2026-10-16.md](./v0.10.0-2026-10-16.md) |
| v0.9.0 | 2026-10-16 | Publicado | [v0.9.0-2026-10-16.md](./v0.9.0-2026-10-16.md) |
| v0.8.0 | 2026-10-14 | Publicado | [v0.8.0-2026-10-14.md](./v0.8.0-2026-10-14.md) |
| v0.7.0 | 2026-10-14 | Publicado | [v0.7.0-2026-10-14.md](./v0.7.0-2026-10-14.md) |
| v0.6.0 | 2026-10-14 | Publicado | [v0.6.0-2026-10-14.md](./v0.6.0-2026-10-14.md) |
| v0.5.0 | 2026-10-13 | Publicado | [v0.5.0-2026-10-13.md](./v0.5.0-2026-10-13.md) |
| v0.4.1 | 2026-09-07 | Publicado | [v0.4.1-2026-09-07.md](./v0.4.1-2026-09-07.md) |
| v0.4.0 | 2026-09-07 | Publicado | [v0.4.0-2026-09-07.md](./v0.4.0-2026-09-07.md) |
| v0.3.1 | 2026-09-04 | Publicado | [v0.3.1-2026-09-04.md](./v0.3.1-2026-09-04.md) |
| v0.3.0 | 2026-09-04 | Publicado | [v0.3.0-2026-09-04.md](./v0.3.0-2026-09-04.md) |
| v0.2.1 | 2026-09-04 | Publicado | [v0.2.1-2026-09-04.md](./v0.2.1-2026-09-04.md) |
| v0.2.0 | 2026-09-03 | Publicado | [v0.2.0-2026-09-03.md](./v0.2.0-2026-09-03.md) |
| v0.1.1 | 2026-08-24 | Publicado | [v0.1.1-2026-08-24.md](./v0.1.1-2026-08-24.md) |
| v0.1.0 | 2026-08 | Publicado (foto do **beta fechado**) | [v0.1.0-2026-08.md](./v0.1.0-2026-08.md) |

---

## Quando gravar uma nota

Gatilho: **PR com destino `main`** (produção / Vercel). A nota entra **no mesmo PR**, gerada pelo Technical Writer na etapa `Document` (workflow §11.2).

- Um arquivo **por PR**, não por Issue.
- Template: [`../00_meta/templates/template-release-notes.md`](../00_meta/templates/template-release-notes.md)
- Nome: `vX.Y.Z-YYYY-MM-DD.md` (ex.: `v0.1.1-2026-08-24.md`)
- Frontmatter: `ambiente: production`; IDs Linear no campo `issues`
- SemVer: a nota de onboarding desta linha é **MINOR** `v0.15.0` (guia opcional no primeiro acesso). A nota `v0.14.1` (métricas do beta) está na branch anterior. Próxima após publicar `v0.15.0`: **PATCH** `v0.15.1`, salvo MINOR/MAJOR justificados.
- `v1.0.0` só no go-live público do [roadmap](../01_produto/roadmap.md).

Não use `v1.0.0` enquanto o go-live público estiver pendente (regressão no browser, landing). O item de migrations/RLS em produção foi fechado em out/2026 (DEV-141 / DEV-142).

---

## SemVer neste produto

`package.json` hoje: `0.1.0`. Até o lançamento público, a linha **0.x** é beta.

| Tipo | Uso no Finto |
| --- | --- |
| `0.x.y` | Beta (fechado ou interno). `v0.1.0` = baseline do que está no ar. |
| `v1.0.0` | Primeiro go-live **público**. |
| MAJOR | Breaking para usuário ou contrato persistido |
| MINOR | Funcionalidade nova, compatível |
| PATCH | Correção |

Se P3 (`credit_card_id`) ou P4 (CHECK no banco) mudarem contrato, isso é **MAJOR** ou ADR nova + nota de breaking — não edite a nota antiga.

---

## O que não entra aqui

- Histórico de Issue (Linear)
- `UNRELEASED.md` / rascunho de próxima versão sem ship
- Inventar Issue ID, data de deploy ou tag que não existem
- Duplicar 01–04: a nota aponta para a KB; não reescreve módulos

Próxima nota depois de publicar `v0.15.0`: **PATCH** `v0.15.1` na PR seguinte para `main`, salvo MINOR/MAJOR justificados, ou **v1.0.0** no go-live público.
