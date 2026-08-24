---
type: meta-workflow
titulo: Ledger Flow
ultima_atualizacao: 2026-08-24
versao: "1.8"
tags: [meta, ledger-flow, linear, cursor, workflow, agentes]
---

# Ledger Flow

## 1. Propósito

Este documento define o **Ledger Flow**: como os agentes de IA do Cursor devem atuar no fluxo de desenvolvimento integrado com Linear.

O objetivo do workflow é garantir que:

- O Linear seja a fonte de verdade para o ciclo de vida das demandas.
- O Cursor execute as etapas usando agentes especializados.
- O histórico da demanda permaneça centralizado na própria Issue do Linear.
- A base de conhecimento do repositório seja usada como contexto, não como local de registros temporários.
- Atualizações permanentes de documentação sejam feitas apenas quando houver mudança relevante no produto, arquitetura, módulos, integrações, padrões, ADRs ou releases.

---

## 2. Princípio Central

**Linear é o sistema de registro operacional.**

Toda análise específica de uma demanda deve ser registrada diretamente na Issue do Linear, usando MCP.

Isso inclui:

- Refinamento de produto
- Análise técnica
- Plano de implementação
- Decisões tomadas durante a execução
- Resultado de code review
- Resultado de QA
- Correções solicitadas
- Status final da demanda
- Necessidade de atualização documental

O repositório **não** deve receber arquivos como:

- `refinamento-[issue].md`
- `analise-tecnica-[issue].md`
- `qa-report-[issue].md`
- `code-review-[issue].md`

Esses conteúdos pertencem à Issue do Linear.

---

## 3. Papel do Repositório

O repositório deve conter apenas documentações permanentes e reutilizáveis, como:

- Base de conhecimento do produto
- Regras de negócio
- Arquitetura
- Documentação de módulos
- Integrações externas
- Padrões de código, API, banco, testes e Git
- Instruções `.mdc` dos agentes (`.cursor/rules/`)
- Documentação técnica interna que permanece útil além de uma única Issue

A base de conhecimento deve ser consultada pelos agentes para tomada de decisão, mas **não** deve ser usada como histórico de execução de tarefas individuais.

Caminho da KB no repositório do produto: `knowledge/`.  
Índice e mapa de agentes: `knowledge/README.md`, `knowledge/00_meta/index.md`, `knowledge/00_meta/mapa-de-agentes.md`.  
Templates de atualização na Issue: `knowledge/00_meta/templates/` (colar no Linear; não versionar por Issue).

### 3.1 Ledger Flow vs. produto

O Ledger Flow é uma **metodologia reutilizável**. Não descreve um produto específico.

| O que | Onde | Pertence a |
| --- | --- | --- |
| Regras dos agentes (MDCs) | `.cursor/rules/` | Ledger Flow |
| Fluxo, mapa de agentes, templates | `knowledge/00_meta/` | Ledger Flow |
| Visão, regras, arquitetura, módulos, padrões, integrações, ADRs | `knowledge/01_produto/` … `knowledge/07_decisoes-tecnicas/` | **Projeto que adota o Ledger Flow** |

Os agentes **nunca** devem:

- usar o nome, domínio ou tenants de outro produto;
- assumir stack, pastas de código ou integrações que não estejam na KB ou no código **deste** repositório;
- inventar conteúdo de produto porque um arquivo listado no MDC ainda não existe.

Se um caminho citado nos MDCs (ex.: `knowledge/01_produto/visao-do-produto.md`) não existir, consulte `knowledge/README.md` e o que houver em `knowledge/`. Não invente a visão, as regras ou a arquitetura.

### 3.2 Plataformas padrão do Ledger Flow

O Ledger Flow assume estas ferramentas. Se o projeto usar outras para Git, documente o desvio em `knowledge/03_arquitetura/` e siga o que o projeto documentou.

| Papel | Padrão | Como adaptar |
| --- | --- | --- |
| Ciclo de vida da demanda | Linear (MCP) | Obrigatório neste workflow |
| Código | Git | GitHub ou outro host |
| Conhecimento permanente | `knowledge/` | Convenção da árvore abaixo |

O Ledger Flow **não** cobre documentação de usabilidade para o usuário final nem publicação em produção.

A árvore `knowledge/01_produto/` … `knowledge/07_decisoes-tecnicas/` é a **convenção da KB do Ledger Flow**. Cada projeto preenche com o próprio conteúdo.

### 3.3 Time Linear deste produto

Neste repositório (Finto / `tidy-month-tracker`) o Ledger Flow usa **somente** o time Linear **Development**.

| Time | Uso |
| --- | --- |
| **Development** | Único time do fluxo. Status: `Backlog`, `Todo`, `In Progress`, `Review`, `Document`, `Done`. |
| Marketing | **Fora** do Ledger Flow (`In Review`, sem `Document`). Não criar nem mover Issues de produto neste time. |

Em `save_issue` / `list_issues` / `get_issue`, identifique o time como **Development** (nome ou ID). Nunca envie `state: started` (ou outro tipo genérico) — o Linear pode resolver para `In Progress`. Use o nome exato do status (`Document`, `Done`, …).

---

## 4. Estados do Linear

O workflow considera os seguintes estados no Linear (configuração atual do workspace):

```
Backlog
└── Backlog

Unstarted
└── Todo

Started
└── In Progress
└── Review          (QA + Code Review)
└── Document        (Technical Writer)

Completed
└── Done

Canceled
└── Canceled

Duplicate
└── Duplicate
```

Ordem operacional esperada:

```
Backlog → Todo → In Progress → Review → Document → Done
```

Notas:

- O refinamento de produto e análise técnica ocorrem com a Issue em `Backlog` (antes de `Todo`).
- Em `Review`, atuam **Tech Lead** (code review) e **QA Analyst** (validação funcional), nesta ordem quando possível.
- `Document` vem **antes** de `Done`: após reviews aprovados, o Technical Writer avalia a KB interna e só então a Issue é concluída.

Os nomes de categoria (`Started`, `Completed`, etc.) são da UI do Linear; os agentes operam pelos nomes dos status (`Review`, `Document`, `Done`, …).

---

## 5. Responsabilidade dos Agentes por Etapa

| Etapa Linear | Agente Cursor | Responsabilidade |
| --- | --- | --- |
| Backlog | Product Analyst | Refinar valor de produto, escopo, critérios de aceite, regras de negócio e impactos |
| Backlog | Software Architect | Refinar análise técnica, riscos, arquitetura, dependências e abordagem |
| Todo | — | Issue pronta para desenvolvimento |
| In Progress | Backend Engineer | Implementar APIs, regras de negócio, integrações e lógica backend |
| In Progress | Frontend Engineer | Implementar interface, UX/UI e integrações com APIs |
| Review (Code Review) | Tech Lead | Revisar código, arquitetura, padrões, segurança e performance |
| Review (QA) | QA Analyst | Validar requisitos, fluxos, edge cases e regressões |
| Document | Technical Writer | Atualizar documentação técnica interna quando necessário |
| Done | — | Issue concluída (reviews + documentação interna avaliados) |

---

## 6. Uso Obrigatório do MCP Linear

Sempre que um agente estiver atuando sobre uma Issue, ele deve usar o MCP do Linear para:

1. Ler a Issue atual.
2. Ler título, descrição, comentários, labels, status e links relacionados.
3. Atualizar a Issue com sua análise ou resultado.
4. Adicionar comentários estruturados quando apropriado.
5. Sugerir ou executar mudança de status quando a etapa estiver concluída.
6. Preservar histórico no próprio Linear.

Os agentes não devem depender apenas do texto enviado no chat se houver uma Issue Linear associada.

---

## 7. Formato de Atualização no Linear

As atualizações feitas pelos agentes na Issue devem ser estruturadas com headings claros.

Formato recomendado:

```markdown
## [Nome do Agente] — [Tipo de Análise]

### Resumo
[Resumo objetivo da análise realizada]

### Decisões / Recomendações
- [item 1]
- [item 2]

### Critérios / Checklist
- [ ] item verificável
- [ ] item verificável

### Riscos / Pontos de Atenção
- [risco 1]
- [risco 2]

### Próximo Passo
[Indicação clara do próximo agente ou etapa]
```

Cada agente deve assinar sua seção com o nome do papel, não com nome pessoal.

Exemplos:

- `## Product Analyst — Refinamento de Produto`
- `## Software Architect — Análise Técnica`
- `## Tech Lead — Code Review`
- `## QA Analyst — Validação Funcional`

---

## 8. Fluxo de Refinamento

### 8.1 Entrada

A demanda nasce no Linear em `Backlog`, normalmente como uma ideia, bug, melhoria ou refatoração.

Quando o usuário decidir executar a demanda, ele solicitará ao Cursor:

> Refinar esta Issue usando Product Analyst e Software Architect.

### 8.2 Product Analyst

O Product Analyst deve:

1. Ler a Issue no Linear via MCP.
2. Consultar a base de conhecimento:
   - `knowledge/01_produto/`
   - `knowledge/02_regras-de-negocio/`
   - `knowledge/04_modulos/`
3. Refinar:
   - Contexto de negócio
   - Problema
   - Objetivo
   - Escopo
   - Fora de escopo
   - Personas impactadas
   - Regras de negócio afetadas
   - Critérios de aceite
   - Riscos de produto
   - Perguntas em aberto
4. Atualizar a própria Issue no Linear.
5. Não criar arquivo de refinamento no repositório.

### 8.3 Software Architect

O Software Architect deve:

1. Ler a Issue já refinada pelo Product Analyst.
2. Consultar a base de conhecimento:
   - `knowledge/03_arquitetura/`
   - `knowledge/04_modulos/`
   - `knowledge/05_padroes/`
   - `knowledge/06_integracoes/`
3. Refinar:
   - Abordagem técnica
   - Impacto arquitetural
   - Módulos afetados
   - Dependências técnicas
   - Riscos técnicos
   - Estratégia de implementação
   - Requisitos de banco/API/infra se aplicável
   - Plano técnico de alto nível
4. Atualizar a própria Issue no Linear.
5. Não criar arquivo de análise técnica no repositório.

### 8.4 Saída do Refinamento

Após Product Analyst e Software Architect concluírem suas análises:

- A Issue deve conter refinamento suficiente para desenvolvimento.
- O agente deve mover a Issue para `Todo`, se autorizado pelo usuário e se não houver perguntas bloqueantes.
- Caso existam perguntas bloqueantes, aplicar o **Gate de Decisão** (§15.1): registrar no Linear, perguntar no chat, aguardar resposta, atualizar Linear com a decisão — e **só então** concluir. A Issue permanece em `Backlog` até isso.

---

## 9. Fluxo de Execução

### 9.1 Entrada

Quando o usuário mover a Issue para `In Progress`, ele poderá solicitar ao Cursor:

- Atuar como Backend Engineer
- Atuar como Frontend Engineer
- Ou ambos, dependendo da demanda

### 9.2 Backend Engineer

O Backend Engineer deve:

1. Ler a Issue no Linear via MCP.
2. Identificar refinamentos de Product Analyst e Software Architect.
3. Consultar a base de conhecimento relevante:
   - Regras de negócio
   - Arquitetura
   - Módulos
   - Integrações
   - Padrões de API, banco e testes
4. Implementar o backend necessário.
5. Atualizar a Issue no Linear com:
   - O que foi implementado
   - Arquivos principais alterados
   - Testes adicionados ou atualizados
   - Pontos pendentes ou decisões tomadas

### 9.3 Frontend Engineer

O Frontend Engineer deve:

1. Ler a Issue no Linear via MCP.
2. Identificar critérios de aceite e fluxos esperados.
3. Consultar a base de conhecimento relevante:
   - Produto
   - Jornadas
   - Módulos
   - Padrões de código
   - Padrões de API
4. Implementar a interface necessária.
5. Atualizar a Issue no Linear com:
   - O que foi implementado
   - Telas/componentes alterados
   - Integrações feitas
   - Estados tratados
   - Pontos pendentes ou decisões tomadas

---

## 10. Fluxo de Review

Quando a Issue estiver em `Review`, atuam Tech Lead e QA Analyst (nesta ordem, quando possível). O status único concentra code review e QA.

### 10.1 Code Review — Tech Lead

O usuário solicitará atuação como Tech Lead.

O Tech Lead deve:

1. Ler a Issue no Linear.
2. Ler os refinamentos e histórico de implementação.
3. Revisar o diff/código alterado.
4. Validar:
   - Arquitetura
   - Padrões
   - Segurança
   - Performance
   - Testabilidade
   - Consistência com a base de conhecimento
5. Atualizar a Issue no Linear com:
   - Resultado da revisão
   - Correções obrigatórias
   - Sugestões opcionais
   - Riscos remanescentes
   - Status: aprovado ou requer ajustes

Se houver correções obrigatórias, a Issue deve voltar para execução pelos Engineers (`In Progress`).

### 10.2 QA — QA Analyst

Após code review aprovado, o usuário solicitará atuação como QA Analyst.

O QA Analyst deve:

1. Ler a Issue no Linear.
2. Validar critérios de aceite.
3. Validar fluxos funcionais.
4. Testar edge cases.
5. Executar ou orientar testes de regressão.
6. Atualizar a Issue no Linear com:
   - Casos testados
   - Resultado
   - Bugs encontrados
   - Evidências quando aplicável
   - Status: aprovado ou requer ajustes

Se houver falhas, a Issue deve voltar para execução pelos Engineers (`In Progress`).

Após Code Review e QA aprovados, a Issue segue para `Document` (não diretamente para `Done`).

---

## 11. Fluxo de Documentação e Done

### 11.1 Document

Após aprovação de Code Review e QA, a Issue deve ser movida para `Document`.

Neste estado, a implementação está aprovada funcionalmente e tecnicamente; falta avaliar (e atualizar, se necessário) a documentação permanente.

Nesta etapa atua o **Technical Writer** (KB interna em `knowledge/`).

#### Regra absoluta de status em Document

Enquanto a Issue estiver na etapa `Document`:

- O status Linear **deve permanecer `Document`**.
- É **proibido** regredir para `In Progress`, `Review`, `Todo` ou `Backlog`.
- Atualizar a Issue (descrição, comentário, anexos) **não** autoriza mudar o status.
- No MCP `save_issue`: **omitir** o campo `state`, salvo correção explícita de regressão (voltar para `Document`) ou conclusão autorizada para `Done`.
- **Nunca** passar `state` pelo tipo genérico (`started`, `unstarted`, etc.) — o Linear pode resolver para o status padrão da categoria (em geral `In Progress`). Sempre usar o **nome exato**: `Document`, `Done`, etc.
- Se ao ler a Issue o status tiver regredido para `In Progress` (ex.: automação Git/PR) **durante** Document, o agente deve **restaurar para `Document`** imediatamente e registrar o fato no comentário/handoff.

Única transição válida a partir de `Document`: `Document` → `Done` (quando os critérios do §16 forem cumpridos e houver autorização).

### 11.2 Release notes de produção (`main`)

`main` é a branch de **produção** (deploy Vercel). Toda PR com destino `main` **já traz** as release notes no mesmo PR — não depois do merge.

Regras:

- Quem gera: **Technical Writer**, na etapa `Document`.
- Um arquivo **por PR**, não por Issue (várias Issues no mesmo PR = uma nota; IDs Linear no frontmatter).
- Template: `knowledge/00_meta/templates/template-release-notes.md`.
- Destino: `knowledge/releases/vX.Y.Z-YYYY-MM-DD.md` + linha no índice `knowledge/releases/README.md`.
- Frontmatter: `ambiente: production`.
- SemVer: última nota publicada é `v0.1.0`. Padrão da próxima = **PATCH** (`v0.1.1`, …). MINOR se funcionalidade visível ao usuário; MAJOR se breaking. `v1.0.0` só no go-live público (roadmap).
- Sem o arquivo de release, a PR para `main` **não está pronta** para merge ([`../05_padroes/padroes-de-git.md`](../05_padroes/padroes-de-git.md)).

Não há GitHub Action para isto: o critério é de processo.

### 11.3 Done

Após a etapa `Document` concluída (incluindo justificativa se nenhuma alteração documental for necessária), a Issue pode ser movida para `Done`.

`Done` é o **estado final** do fluxo.

---

## 12. Technical Writer

O Technical Writer é responsável por documentação técnica interna.

Ele deve:

1. Ler a Issue no Linear.
2. Analisar o que foi alterado no código.
3. Verificar se alguma documentação permanente da base de conhecimento precisa ser atualizada:
   - Produto
   - Regras de negócio
   - Arquitetura
   - Módulos
   - Integrações
   - Padrões
   - ADRs (`knowledge/07_decisoes-tecnicas/`)
   - Release notes (`knowledge/releases/`) — **obrigatório** se a entrega for para `main` (§11.2)
4. Atualizar os arquivos `.md` relevantes no repositório quando necessário.
5. Atualizar a Issue no Linear com:
   - Documentações revisadas
   - Documentações alteradas
   - Justificativa caso nenhuma alteração seja necessária

O Technical Writer não deve criar documentação temporária por issue.

O Technical Writer **não altera** o status da Issue para `In Progress`. Preserva `Document` (§11.1).

---

## 15. Regras Gerais para Todos os Agentes

### Sempre fazer

- Usar Linear MCP para ler a Issue quando houver Issue associada.
- Registrar análises e decisões na própria Issue do Linear.
- Consultar a base de conhecimento antes de decidir.
- Respeitar o papel do agente invocado.
- Manter o histórico centralizado no Linear.
- Ser explícito sobre riscos, dúvidas e bloqueios.
- Diferenciar correção obrigatória de sugestão opcional.
- Seguir o **Gate de Decisão** (§15.1) quando houver dúvida bloqueante.

### Nunca fazer

- Criar arquivos temporários por Issue no repositório.
- Duplicar histórico do Linear em arquivos `.md`.
- Mover uma Issue de etapa sem estar autorizado ou sem cumprir os critérios.
- **Regredir** Issue de `Document` (ou `Done`) para `In Progress` — nem por “começar a trabalhar”, nem ao atualizar descrição/comentário, nem por efeito colateral de PR/docs.
- Passar `state` no MCP com tipo genérico (`started`) em vez do nome exato do status.
- Ignorar refinamentos já feitos por agentes anteriores.
- Implementar fora do escopo refinado sem sinalizar.
- Atualizar documentação permanente sem necessidade real.
- Inventar decisão de produto, arquitetura ou aceite no lugar do usuário.
- Concluir a etapa com perguntas bloqueantes só registradas no Linear, sem perguntar no chat.

---

## 15.1 Gate de Decisão (dúvidas bloqueantes)

Quando uma **decisão importante** for necessária para avançar a etapa, o agente **não inventa** e **não conclui** a atuação. O canal para obter a resposta é o **chat do Cursor**; o Linear registra o bloqueio e, depois, a decisão tomada.

### O que é bloqueante

É bloqueante qualquer dúvida sem a qual a etapa atual não pode ser fechada com qualidade, por exemplo:

| Etapa | Exemplos de decisão bloqueante |
| --- | --- |
| Backlog (Product Analyst) | Escopo, problema, comportamento esperado, personas, regras de negócio, critérios de aceite |
| Backlog (Software Architect) | Trade-off técnico com impacto de produto, ADR necessário, dependência externa/config, migration arriscada |
| In Progress (Engineers) | Ambiguidade de escopo/contrato, regra indefinida, mudança fora do plano sem autorização |
| Review (Tech Lead) | Aceitar risco residual, exception a padrão, escopo vs. implementação, ADR pendente |
| Review (QA) | Comportamento esperado ambíguo, “aprovado com ressalvas”, ambiente/dados impossíveis de validar |
| Document (Technical Writer) | Wording de produto na KB, o que documentar vs. omitir |

Dúvidas **não bloqueantes** (melhoria opcional, follow-up, nitpick) podem ir só na Issue, sem parar o fluxo.

### Protocolo obrigatório

1. **Pare** a conclusão da etapa (não marque handoff como `concluído`; não recomende/mova status para a próxima etapa).
2. **Registre no Linear** (via MCP) o progresso parcial + seção de perguntas bloqueantes + handoff com `Status: bloqueado` (ou `requer esclarecimento`).
3. **Pergunte no chat do Cursor** de forma explícita, numerada e acionável — este é o canal em que o usuário responde.
4. **Aguarde** a resposta do usuário no chat. Não continue a etapa como se a decisão já existisse.
5. **Após a resposta:** atualize o Linear com as decisões tomadas (o que foi decidido, por quem/quando no fluxo, impacto no escopo/aceite).
6. **Só então** conclua a análise/execução da etapa e faça o handoff definitivo.

### Formato mínimo no chat (perguntas)

```markdown
## Decisão necessária — Issue [ID]

Não consigo concluir [etapa/papel] sem sua decisão.

### Contexto (1–3 linhas)
[por que isso bloqueia]

### Perguntas
1. [pergunta objetiva] — opções: A) … / B) … / C) …
2. …

### Impacto se não decidir agora
- [o que fica parado]
```

### Formato mínimo no Linear (após resposta)

```markdown
## Decisões do Usuário — [data]

- **Pergunta:** …
- **Decisão:** …
- **Impacto:** [escopo / aceite / abordagem / review / docs]
```

### Regras

- Chat = obter a decisão. Linear = persistir bloqueio e decisão.
- Não encerre a atuação com “perguntas em aberto” só no Linear sem espelhar as perguntas no chat.
- Não mova status (§16) enquanto houver pergunta bloqueante sem resposta registrada.
- Após registrar a decisão no Linear, o agente pode retomar e concluir o passo na mesma sessão (se o usuário já respondeu) ou na próxima atuação.

---

## 16. Critérios para Mudar Status no Linear

### Para mover para `Todo`

Permitido quando:

- Product Analyst concluiu refinamento.
- Software Architect concluiu análise técnica.
- Não há perguntas bloqueantes (se houve, foram resolvidas via Gate de Decisão §15.1 e registradas no Linear).
- Critérios de aceite estão claros.
- Escopo e fora de escopo estão definidos.
- Riscos principais estão registrados.

### Para seguir em `In Progress`

Permitido quando:

- Issue está refinada.
- O usuário moveu ou autorizou mover para execução.
- O agente executor entendeu escopo, critérios e abordagem.

### Para aprovar Code Review (ainda em `Review`)

Permitido quando:

- Não há problemas obrigatórios pendentes.
- Código segue padrões do projeto.
- Segurança e performance foram consideradas.
- Testes relevantes existem ou a ausência foi justificada.

### Para aprovar QA (ainda em `Review`)

Permitido quando:

- Critérios de aceite foram validados.
- Fluxos principais passaram.
- Edge cases relevantes foram testados.
- Regressões críticas foram consideradas.
- Bugs bloqueantes foram resolvidos.

### Para mover para `Document`

Permitido quando:

- Code Review aprovado.
- QA aprovado.
- Não há bugs bloqueantes abertos.

### Para permanecer em `Document` (obrigatório)

Enquanto o Technical Writer estiver atuando:

- Status permanece `Document`.
- Não mover para `In Progress` ao “iniciar” documentação, editar `knowledge/` ou atualizar a Issue.
- Se detectar regressão indevida para `In Progress`, restaurar `Document` (§11.1).

### Para concluir Document e mover para `Done`

Permitido quando:

- Technical Writer avaliou documentação interna.
- Alterações necessárias foram feitas.
- Caso nada tenha sido alterado, a justificativa foi registrada no Linear.
- A Issue ainda está (ou foi restaurada) em `Document` antes da transição para `Done`.
- Se a entrega for merge em `main`: existe arquivo novo em `knowledge/releases/` e o índice foi atualizado (§11.2).

---

## 17. Handoff entre Agentes

Cada agente deve finalizar sua atuação indicando claramente o próximo passo.

Formato recomendado:

```markdown
## Handoff

**Status:** [concluído / requer ajustes / bloqueado]

**Próximo agente recomendado:** [Software Architect / Backend Engineer / Frontend Engineer / Tech Lead / QA Analyst / Technical Writer]

**Motivo:** [por que este é o próximo passo]

**Pontos de atenção:**
- [item 1]
- [item 2]
```

Quando o status for `bloqueado` por falta de decisão, o próximo passo imediato é **aguardar resposta do usuário no chat** (Gate de Decisão §15.1), não o próximo agente.
---

## 18. Fonte de Verdade por Tipo de Informação

| Informação | Fonte de Verdade |
| --- | --- |
| Status da demanda | Linear |
| Histórico de refinamento | Linear |
| Histórico de review | Linear |
| Histórico de QA | Linear |
| Implementação | Git / código |
| Conhecimento permanente do produto | Repositório `knowledge/*.md` |
| Arquitetura permanente | Repositório `knowledge/*.md` |
| Regras de negócio permanentes | Repositório `knowledge/*.md` |

---

## 19. Resumo Operacional

```
Backlog
→ Product Analyst atualiza Issue no Linear
→ Software Architect atualiza Issue no Linear
→ Issue vai para Todo

Todo
→ Issue pronta para execução

In Progress
→ Backend Engineer / Frontend Engineer implementam
→ Agentes atualizam Issue no Linear com resumo da execução

Review
→ Tech Lead faz code review
→ QA Analyst faz validação
→ Correções voltam para Engineers (In Progress) se necessário

Document
→ Technical Writer atualiza docs internas se necessário
→ Se a PR vai para `main`: gera `knowledge/releases/vX.Y.Z-YYYY-MM-DD.md` + índice (§11.2)

Done
→ Issue concluída (estado final do fluxo)
```

---

## 19.1 Templates no repositório

Os arquivos em `knowledge/00_meta/templates/` são **estruturas de texto**, não destinos de arquivo por demanda:

| Template | Destino do conteúdo |
| --- | --- |
| `template-refinamento.md` | Issue Linear (Product Analyst) |
| `template-arquitetura-issue.md` | Issue Linear (Software Architect) |
| `template-qa-report.md` | Issue Linear (QA Analyst) |
| `template-release-notes.md` | `knowledge/releases/` (permanente) |
| `template-modulo.md` | `knowledge/04_modulos/` (permanente) |
| `template-adr.md` | `knowledge/07_decisoes-tecnicas/` (permanente) |

---

## 20. Impacto nos MDCs dos Agentes

A partir deste workflow, todos os MDCs devem seguir estas regras base:

### 20.1 Todo agente deve referenciar o workflow

Cada MDC deve incluir:

```md
Antes de atuar, leia:
- `knowledge/00_meta/linear-cursor-workflow.md`
- `knowledge/00_meta/mapa-de-agentes.md`
- MDC do papel em `.cursor/rules/`
```

### 20.2 Todo agente deve usar Linear como output primário

Em vez de criar arquivos em `knowledge/refinamentos/` (ou similar), o agente deve:

```md
Atualize a Issue no Linear via MCP com sua análise estruturada.
```

### 20.3 Nenhum agente deve criar arquivos temporários por Issue

Documentações permanentes só entram no repositório quando:

- Atualizam base de conhecimento
- Atualizam módulos
- Atualizam regras permanentes
- Atualizam arquitetura
- Atualizam padrões
- Atualizam integrações

### 20.4 Cada agente deve ter um bloco de “Atualização no Linear”

Exemplo:

```md
Ao concluir sua atuação, atualize a Issue no Linear com:
- Resumo do que foi analisado ou implementado
- Decisões tomadas
- Riscos ou problemas encontrados
- Próximo passo recomendado
- Status sugerido
```

### 20.5 Handoff vira parte obrigatória dos MDCs

Todo agente deve finalizar com:

```md
## Handoff
Status:
Próximo agente recomendado:
Pontos de atenção:
```

### 20.6 Gate de Decisão nos MDCs

Todo MDC deve instruir o agente a:

```md
Se surgir decisão bloqueante:
1. Não concluir a etapa.
2. Registrar bloqueio + perguntas no Linear.
3. Perguntar no chat do Cursor e aguardar resposta do usuário.
4. Atualizar o Linear com a decisão.
5. Só então concluir e fazer handoff definitivo.
```

Detalhe: workflow §15.1.

### 20.7 Independência de produto

MDCs e templates do Ledger Flow **não** devem citar nome, domínio, tenant ou stack de um produto específico.

Stack, pastas de código, papéis de usuário e integrações vêm da KB e do código **do repositório atual** (`knowledge/03_arquitetura/`, `knowledge/05_padroes/`, `knowledge/06_integracoes/`). Se a KB ainda não existir, descreva o que o código mostra e registre a lacuna documental — não copie o contexto de outro projeto.