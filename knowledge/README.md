---
type: index
titulo: Base de conhecimento
ultima_atualizacao: 2026-08-24
---

# Base de conhecimento

Índice da KB do **projeto que adota o Ledger Flow**.  
O fluxo e os templates da metodologia vivem em [`00_meta/`](00_meta/index.md). As demais pastas são conhecimento **deste** produto — não de outro.

Se um arquivo listado nos MDCs ainda não existir, use este índice e o que houver nas pastas abaixo. **Não invente** visão, regras, stack ou tenants.

Time Linear do fluxo: **Development** (não usar Marketing). `main` = produção.

## Como o time e os agentes trabalham

| Arquivo | Uso |
| --- | --- |
| [00_meta/linear-cursor-workflow.md](00_meta/linear-cursor-workflow.md) | Fonte de verdade do Ledger Flow |
| [00_meta/mapa-de-agentes.md](00_meta/mapa-de-agentes.md) | Etapa Linear → agente → output |
| [00_meta/templates/](00_meta/templates/) | Estruturas para colar na Issue / docs permanentes |

## Convenção da árvore (preencher no projeto)

| Pasta | Conteúdo permanente |
| --- | --- |
| [01_produto/](01_produto/README.md) | Visão, personas, jornadas, roadmap, glossário |
| [02_regras-de-negocio/](02_regras-de-negocio/README.md) | Regras gerais, políticas, regras por módulo |
| [03_arquitetura/](03_arquitetura/README.md) | Visão de sistema, API, dados, infra, segurança |
| [04_modulos/](04_modulos/README.md) | Um documento por módulo / bounded context |
| [05_padroes/](05_padroes/README.md) | Convenções de código, API, banco, testes, Git |
| [06_integracoes/](06_integracoes/README.md) | Serviços externos usados **neste** produto |
| [07_decisoes-tecnicas/](07_decisoes-tecnicas/README.md) | ADRs |
| [releases/](releases/README.md) | Release notes permanentes |

Arquivos que os MDCs citam com frequência:

```txt
knowledge/01_produto/visao-do-produto.md
knowledge/01_produto/personas-e-usuarios.md
knowledge/01_produto/jornadas-de-usuario.md
knowledge/01_produto/roadmap.md
knowledge/01_produto/glossario.md
knowledge/02_regras-de-negocio/regras-gerais.md
knowledge/02_regras-de-negocio/politicas-e-restricoes.md
knowledge/02_regras-de-negocio/regras-por-modulo/
knowledge/03_arquitetura/visao-geral.md
knowledge/03_arquitetura/diagrama-de-sistema.md
knowledge/03_arquitetura/banco-de-dados.md
knowledge/03_arquitetura/api-design.md
knowledge/03_arquitetura/infraestrutura.md
knowledge/03_arquitetura/seguranca.md
knowledge/03_arquitetura/performance-e-escalabilidade.md
knowledge/04_modulos/index.md
knowledge/05_padroes/convencoes-de-codigo.md
knowledge/05_padroes/padroes-de-api.md
knowledge/05_padroes/padroes-de-banco-de-dados.md
knowledge/05_padroes/padroes-de-testes.md
knowledge/05_padroes/padroes-de-git.md
knowledge/06_integracoes/supabase.md
knowledge/06_integracoes/vercel.md
knowledge/07_decisoes-tecnicas/index.md
knowledge/releases/v0.1.0-2026-08.md
```

## Fontes de verdade

| Informação | Onde |
| --- | --- |
| Status e histórico da demanda | Linear (time **Development**) |
| Implementação | Git (`main` = produção) |
| Conhecimento permanente | esta árvore `knowledge/` |
