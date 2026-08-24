---
type: meta-mapa-agentes
titulo: Mapa de Agentes — Ledger Flow
ultima_atualizacao: 2026-08-24
versao: "1.7"
tags: [meta, agentes, ledger-flow, linear, cursor]
---

# Mapa de Agentes — Ledger Flow

Cheat sheet operacional. Detalhe completo: [linear-cursor-workflow.md](linear-cursor-workflow.md).

Time Linear deste produto: **somente Development** (não usar Marketing). `main` = produção.

---

## Fluxo resumido

```
Backlog
  → Product Analyst → Software Architect → Todo

In Progress
  → Backend Engineer e/ou Frontend Engineer

Review (QA + Code Review)
  → Tech Lead (Code Review) → QA Analyst

Document (Technical Writer)
  → Technical Writer (`knowledge/`)

Done
  → Estado final do fluxo
```

---

## Gate de Decisão (rápido)

Se a etapa precisa de decisão do usuário para avançar:

1. **Não concluir** / não mover status.
2. Registrar bloqueio + perguntas no **Linear**.
3. Perguntar no **chat do Cursor** e aguardar resposta.
4. Atualizar o Linear com a **decisão**.
5. Só então concluir o passo.

Detalhe: workflow §15.1.

---

## Tabela etapa → agente

| Etapa Linear | Agente | MDC | Output |
| --- | --- | --- | --- |
| Backlog | Product Analyst | `.cursor/rules/product-analyst.mdc` | Seção na Issue + handoff |
| Backlog | Software Architect | `.cursor/rules/software-architect.mdc` | Seção na Issue + handoff |
| Todo | — | — | Issue pronta |
| In Progress | Backend Engineer | `.cursor/rules/backend-engineer.mdc` | Código + resumo na Issue |
| In Progress | Frontend Engineer | `.cursor/rules/frontend-engineer.mdc` | Código + resumo na Issue |
| Review (Code Review) | Tech Lead | `.cursor/rules/tech-lead.mdc` | Code review na Issue |
| Review (QA) | QA Analyst | `.cursor/rules/qa-analyst.mdc` | Relatório QA na Issue |
| Document | Technical Writer | `.cursor/rules/technical-writer.mdc` | Atualiza `knowledge/` se necessário; se a PR vai para `main`, gera `knowledge/releases/` |
| Done | — | — | Concluída (reviews + docs internas avaliados) |

---

## Templates de texto (colar no Linear)

| Agente | Template |
| --- | --- |
| Product Analyst | [templates/template-refinamento.md](templates/template-refinamento.md) |
| Software Architect | [templates/template-arquitetura-issue.md](templates/template-arquitetura-issue.md) |
| QA Analyst | [templates/template-qa-report.md](templates/template-qa-report.md) |

Formato mínimo de toda atualização (workflow §7):

```markdown
## [Nome do Agente] — [Tipo]

### Resumo
...

### Decisões / Recomendações
- ...

### Critérios / Checklist
- [ ] ...

### Riscos / Pontos de Atenção
- ...

### Próximo Passo
...

## Handoff
**Status:** concluído | requer ajustes | bloqueado
**Próximo agente recomendado:** ...
**Motivo:** ...
**Pontos de atenção:**
- ...
```

---

## Fontes de verdade

| Informação | Fonte |
| --- | --- |
| Status / histórico da demanda | Linear |
| Implementação | Git |
| Conhecimento permanente | `knowledge/` |

---

## Proibições rápidas

- Criar arquivo por Issue em `knowledge/`
- Duplicar histórico do Linear no repositório
- Mover status sem autorização / sem critérios
- **Regredir `Document` → `In Progress`** (status deve permanecer `Document` até `Done`)
- Passar `state` genérico (`started`) no MCP — usar nome exato do status
- Usar o time Linear **Marketing** para Issues deste produto — só **Development**
- Inventar decisão bloqueante no lugar do usuário
- Concluir etapa com pergunta bloqueante só no Linear, sem perguntar no chat
