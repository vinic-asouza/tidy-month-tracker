---
type: meta-mapa-agentes
titulo: Mapa de Agentes — Ledger Flow
ultima_atualizacao: 2026-10-19
versao: "2.0"
tags: [meta, agentes, ledger-flow, linear, cursor, execucao-continua]
---

# Mapa de Agentes — Ledger Flow

Cheat sheet operacional. Detalhe completo: [linear-cursor-workflow.md](linear-cursor-workflow.md).

Time Linear deste produto: **somente Development** (não usar Marketing). `main` = produção.

**Modo padrão:** execução contínua até `Done` — sem pausar o chat entre etapas (workflow §2.1).

---

## Fluxo resumido (contínuo)

```
[Usuário: executar Issue]
  → Product Analyst → Software Architect
  → Todo → In Progress (automático)
  → Backend e/ou Frontend (skip se sem escopo)
  → PR
  → Tech Lead → QA Analyst
  → [loop automático se correções obrigatórias]
  → Technical Writer (Document)
  → Done
  → Chat: resumo + PR + validação manual ou confirmação de merge
```

---

## Decisões (rápido)

| Situação | Ação |
| --- | --- |
| Ambiguidade resolvível | **Decisão Assumida** → registrar no Linear → continuar |
| Impossível seguir com segurança | **Gate de Emergência** → perguntar no chat → retomar |
| Etapa concluída | Handoff automático para o próximo papel |
| Correção obrigatória no Review | Voltar `In Progress` → corrigir → Review de novo |
| Done | Relatório no chat; **não** mergear sem confirmação |

Detalhe: workflow §15.1 e §2.1.

---

## Tabela etapa → agente

| Etapa Linear | Agente | MDC | Output |
| --- | --- | --- | --- |
| Backlog | Product Analyst | `.cursor/rules/product-analyst.mdc` | Seção na Issue + handoff → SA automático |
| Backlog | Software Architect | `.cursor/rules/software-architect.mdc` | Seção na Issue + handoff → Engineers |
| Todo | — | — | Avanço imediato para In Progress |
| In Progress | Backend Engineer | `.cursor/rules/backend-engineer.mdc` | Código + resumo na Issue |
| In Progress | Frontend Engineer | `.cursor/rules/frontend-engineer.mdc` | Código + resumo na Issue |
| Review (Code Review) | Tech Lead | `.cursor/rules/tech-lead.mdc` | Code review na Issue |
| Review (QA) | QA Analyst | `.cursor/rules/qa-analyst.mdc` | Relatório QA na Issue |
| Document | Technical Writer | `.cursor/rules/technical-writer.mdc` | Atualiza `knowledge/` se necessário; se a PR vai para `main`, gera `knowledge/releases/` |
| Done | Orquestrador | — | Relatório no chat (resumo + PR); aguarda validação/merge do usuário |

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
| PR | Git host (+ URL na Issue) |
| Conhecimento permanente | `knowledge/` |

---

## Proibições rápidas

- Criar arquivo por Issue em `knowledge/`
- Duplicar histórico do Linear no repositório
- Pausar o pipeline contínuo para pedir “posso seguir?”
- Mover status sem critérios do §16
- **Regredir `Document` → `In Progress`** (status deve permanecer `Document` até `Done`)
- Passar `state` genérico (`started`) no MCP — usar nome exato do status
- Usar o time Linear **Marketing** para Issues deste produto — só **Development**
- Fazer merge sem confirmação explícita pós-Done
- Usar Gate de Emergência para dúvida que Decisão Assumida resolve
