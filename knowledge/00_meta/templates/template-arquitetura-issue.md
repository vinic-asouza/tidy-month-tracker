---
type: template-linear
agente: Software Architect
destino: Issue Linear via MCP
ultima_atualizacao: 2026-08-17
---

# Template — Análise Técnica / Arquitetura da Issue (Linear)

> **Não salve este conteúdo como arquivo no repositório.**  
> Publique na **Issue do Linear** após o refinamento do Product Analyst.  
> Stack de referência: a documentada em `knowledge/03_arquitetura/` **deste** projeto.

```markdown
## Software Architect — Análise Técnica

### Resumo
_2–3 frases: abordagem escolhida e por que é adequada._

### Análise de Impacto
| Componente / Módulo | Tipo de Mudança | Nível de Risco |
| --- | --- | --- |
| | Novo / Alterado / Removido | Baixo / Médio / Alto |

### Abordagem Técnica
**Fluxo de dados (alto nível):**
1. 

**Camadas / pacotes tocados:**
- _(ex.: API, domínio, persistência, jobs, UI — use os nomes reais do projeto)_

### Banco de Dados (se aplicável)
- Tabelas / colunas / índices / políticas de acesso:
- Schema / migration precisa ser atualizado? Sim / Não — onde:

### API (se aplicável)
| Method | Path / operação | Auth / papéis | Observação |
| --- | --- | --- | --- |
| | | | |

### Frontend / UX (se aplicável)
- Rotas / telas / estados:

### Integrações (se aplicável)
- Serviços externos afetados (consultar `knowledge/06_integracoes/`):

### Complexidade e Estimativa
- Complexidade: P1–P5
- Estimativa (dias):
- Superfícies impactadas: [backend, frontend, dados, infra, …]

### Riscos Técnicos
| Risco | Mitigação |
| --- | --- |
| | |

### Plano Técnico de Alto Nível
1. 
2. 
3. 

### Critérios para Todo
- [ ] Abordagem clara
- [ ] Escopo técnico alinhado ao de produto
- [ ] Sem perguntas bloqueantes
- [ ] Dependências registradas

### Próximo Passo
Mover para Todo (se autorizado) · Backend/Frontend Engineer

## Handoff
**Status:** concluído | requer ajustes | bloqueado
**Próximo agente recomendado:** Backend Engineer / Frontend Engineer
**Motivo:**
**Pontos de atenção:**
- 
```

---

## Notas (preencher com o projeto atual)

Não copie stack de outro produto. Antes de analisar, leia:

- `knowledge/03_arquitetura/` — runtime, persistência, API, infra
- `knowledge/05_padroes/` — convenções de código, API, banco, testes
- `knowledge/04_modulos/` — limites de domínio já documentados
