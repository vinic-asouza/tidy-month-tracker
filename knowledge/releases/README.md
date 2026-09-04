---
type: index
secao: releases
ultima_atualizacao: 2026-09-04
---

# Releases

Release notes **permanentes** de uma versão enviada. Não são changelog de Issue nem dump do git.

- Template: [`../00_meta/templates/template-release-notes.md`](../00_meta/templates/template-release-notes.md)
- Arquivo: `knowledge/releases/[VERSAO]-[DATA].md` (ex.: `v1.0.0-2026-09-01.md`)
- Demanda: IDs Linear no frontmatter; o detalhe operacional fica no Linear

Índice:

| Versão | Data | Status | Arquivo |
| --- | --- | --- | --- |
| v0.3.0 | 2026-09-04 | Draft | [v0.3.0-2026-09-04.md](./v0.3.0-2026-09-04.md) |
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
- SemVer: última publicada é `v0.2.1`. Próxima padrão = **PATCH** `v0.2.2`. MINOR se funcionalidade visível; MAJOR se breaking. Em andamento: Draft **v0.3.0** (DEV-106).
- `v1.0.0` só no go-live público do [roadmap](../01_produto/roadmap.md).

Não use `v1.0.0` enquanto o go-live público estiver pendente (regressão no browser, migrations, landing).

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

Próxima nota após publicar `v0.3.0`: **PATCH** `v0.3.1` na próxima PR para `main`, salvo MINOR/MAJOR justificados, ou **v1.0.0** no go-live público.
