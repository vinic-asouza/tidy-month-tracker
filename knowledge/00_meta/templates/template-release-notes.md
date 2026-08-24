---
type: template-permanente
destino: knowledge/releases/
ultima_atualizacao: 2026-08-17
---

# Template — Release Notes

> Artefato **permanente** (não é histórico de uma Issue).  
> Salvar em: `knowledge/releases/[VERSAO]-[DATA].md`  
> Ex.: `knowledge/releases/v1.2.3-2026-07-14.md`  
> Issues da release: referencie IDs Linear; o detalhe operacional continua no Linear.

```yaml
---
type: release-notes
versao: # v1.2.3
data_release:
ambiente: # staging | production
status: Draft # Draft | Em Revisão | Publicado
issues: [] # IDs Linear
breaking_changes: false
autor:
---
```

# Release Notes — {{versao}}

## SemVer

| Tipo | Formato | Significado |
| --- | --- | --- |
| MAJOR | v**X**.0.0 | Breaking |
| MINOR | v1.**X**.0 | Nova funcionalidade |
| PATCH | v1.2.**X** | Correção |

## Sumário da Release

_Uma ou duas frases para usuário não técnico._

## Destaques

-
-
-

## Novas Funcionalidades

| Funcionalidade | Descrição | Issue ID |
| --- | --- | --- |
| | | |

## Melhorias

| Melhoria | Impacto | Issue ID |
| --- | --- | --- |
| | | |

## Correções de Bug

| Bug Corrigido | Módulo | Issue ID |
| --- | --- | --- |
| | | |

## Breaking Changes

> Somente se `breaking_changes: true`. Caso contrário: **Nenhum.**

**O que muda:**  
**O que é removido:**  
**Guia de migração:**

## Mudanças Técnicas

- Infraestrutura:
- Dependências:
- Outras:

## Notas técnicas da release

### Pré-requisitos

- [ ] Migrations / mudanças de schema
- [ ] Seeds / dados iniciais

### Variáveis de ambiente

| Variável | Nova / Alterada | Obrigatória | Observação |
| --- | --- | --- | --- |
| | | Sim / Não | |

## Próximos Passos _(opcional)_
