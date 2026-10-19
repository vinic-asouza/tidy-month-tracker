---
type: meta-workflow
titulo: Ledger Flow
ultima_atualizacao: 2026-10-19
versao: "2.0"
tags: [meta, ledger-flow, linear, cursor, workflow, agentes, execucao-continua]
---

# Ledger Flow

## 1. Propósito

Este documento define o **Ledger Flow**: como os agentes de IA do Cursor devem atuar no fluxo de desenvolvimento integrado com Linear.

O objetivo do workflow é garantir que:

- O Linear seja a fonte de verdade para o ciclo de vida das demandas.
- O Cursor execute as etapas usando agentes especializados **de ponta a ponta, sem interrupções no chat**.
- O histórico da demanda permaneça centralizado na própria Issue do Linear.
- A base de conhecimento do repositório seja usada como contexto, não como local de registros temporários.
- Atualizações permanentes de documentação sejam feitas apenas quando houver mudança relevante no produto, arquitetura, módulos, integrações, padrões, ADRs ou releases.
- O usuário só seja chamado no chat em **Done** (resumo + PR) ou em **Gate de Emergência** (caso extremo e raro).

---

## 2. Princípio Central

**Linear é o sistema de registro operacional.**

Toda análise específica de uma demanda deve ser registrada diretamente na Issue do Linear, usando MCP.

Isso inclui:

- Refinamento de produto
- Análise técnica
- Plano de implementação
- Decisões tomadas durante a execução (incluindo decisões assumidas)
- Resultado de code review
- Resultado de QA
- Correções solicitadas e re-execuções
- Status final da demanda
- Necessidade de atualização documental
- Link da PR

O repositório **não** deve receber arquivos como:

- `refinamento-[issue].md`
- `analise-tecnica-[issue].md`
- `qa-report-[issue].md`
- `code-review-[issue].md`

Esses conteúdos pertencem à Issue do Linear.

---

## 2.1 Execução Contínua (modo padrão)

### Regra de ouro

Quando o usuário solicitar executar uma Issue (ex.: “executar”, “rodar o fluxo”, “desenvolver”, “implementar”, “processar Issue X”), o agente **orquestra todas as etapas até `Done` na mesma sessão**, sem pausar para confirmação entre papéis.

Pipeline obrigatório (com skips inteligentes quando o escopo não exige a etapa):

```
Product Analyst
→ Software Architect
→ Backend Engineer (se houver escopo backend)
→ Frontend Engineer (se houver escopo frontend)
→ Tech Lead (Code Review)
→ QA Analyst
→ [se correções obrigatórias] Engineers → Review novamente (loop automático)
→ Technical Writer (Document)
→ Done
```

### Autorização implícita

Pedir a execução da Issue **autoriza** automaticamente:

- Assumir cada papel na ordem do pipeline
- Mover status Linear conforme critérios do §16 (`Backlog` → `Todo` → `In Progress` → `Review` → `Document` → `Done`)
- Criar branch, commits (se o usuário pedir commits no contexto da Issue ou se já houver política do projeto), push e **abrir/atualizar PR**
- Loop Review → `In Progress` → Review quando houver correções obrigatórias
- Concluir Document e mover para `Done`

**Não autoriza** (reservado ao usuário após Done):

- Merge da PR
- Deploy/publicação em produção além do que o merge em `main` já implica no projeto
- Ações destrutivas fora do escopo da Issue

### Silêncio no chat durante o pipeline

Enquanto a Issue **não** estiver em `Done`:

- **Não** pedir “posso seguir para a próxima etapa?”
- **Não** pedir confirmação de handoff, status, escopo já coberto pela KB, ou “quer que eu faça o review?”
- Progresso, decisões e bloqueios operacionais vão para o **Linear**
- O chat fica reservado para: (1) relatório final em Done; (2) Gate de Emergência (§15.1)

### Handoff automático

Ao concluir uma etapa com handoff `concluído` e critérios do §16 atendidos:

1. Atualizar Linear (seção + handoff + status).
2. **Imediatamente** carregar o MDC do próximo papel e continuar.
3. Não esperar mensagem nova do usuário.

Se o handoff for `requer ajustes` (Review):

1. Mover para `In Progress`.
2. Assumir o Engineer adequado.
3. Corrigir → voltar a `Review` → Tech Lead → QA.
4. Repetir até aprovação ou Gate de Emergência.

### Eficiência (obrigatório)

O orquestrador deve ser o mais eficiente possível:

| Princípio | Comportamento |
| --- | --- |
| Skip inteligente | Pular Backend ou Frontend se o SA/PA indicarem escopo só de um lado; registrar o skip no Linear |
| Uma leitura densa | No início, ler Issue + comentários + KB relevante; nas etapas seguintes, reler só o necessário |
| Decisão assumida | Preferir resolver ambiguidade com KB/código/padrões e registrar no Linear (§15.1) |
| Diff focado | Review e QA no que mudou na Issue, não no repositório inteiro |
| PR cedo o bastante | Branch + PR prontos antes ou durante Review; atualizar a PR após correções e Document |
| Sem retrabalho | Não reabrir refinamento se já estiver suficiente; não re-documentar o óbvio |
| Paralelismo mental | Planejar backend→frontend em sequência coerente (contrato primeiro); não inventar APIs no front |

### Relatório ao usuário — somente em Done

Ao chegar em `Done`, **e só então**, retornar no chat:

```markdown
## Issue [ID] — Done

### Resumo
[o que foi entregue, 3–8 linhas]

### Etapas executadas
- Product Analyst: …
- Software Architect: …
- Backend / Frontend: … (ou skip)
- Tech Lead: aprovado / loops de correção
- QA: aprovado
- Technical Writer: docs alterados ou justificativa

### Pull Request
[URL da PR]

### Próximo passo (você)
1. Validar manualmente a PR / ambiente de preview, **ou**
2. Confirmar se deseja que eu realize o(s) merge(s).

Não farei merge sem sua confirmação explícita.
```

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

O Ledger Flow **não** cobre documentação de usabilidade para o usuário final nem publicação em produção (merge/`main` fica a cargo do usuário após Done).

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

Com loop permitido:

```
Review ⇄ In Progress   (somente por correções obrigatórias de Tech Lead ou QA)
```

Notas:

- O refinamento de produto e análise técnica ocorrem com a Issue em `Backlog` (antes de `Todo`).
- Em `Review`, atuam **Tech Lead** (code review) e **QA Analyst** (validação funcional), nesta ordem.
- `Document` vem **antes** de `Done`: após reviews aprovados, o Technical Writer avalia a KB interna e só então a Issue é concluída.
- Em execução contínua, as transições acima são feitas **pelo agente**, sem pedir autorização adicional no chat.

Os nomes de categoria (`Started`, `Completed`, etc.) são da UI do Linear; os agentes operam pelos nomes dos status (`Review`, `Document`, `Done`, …).

---

## 5. Responsabilidade dos Agentes por Etapa

| Etapa Linear | Agente Cursor | Responsabilidade |
| --- | --- | --- |
| Backlog | Product Analyst | Refinar valor de produto, escopo, critérios de aceite, regras de negócio e impactos |
| Backlog | Software Architect | Refinar análise técnica, riscos, arquitetura, dependências e abordagem |
| Todo | — | Issue pronta; em execução contínua, avançar imediatamente para `In Progress` |
| In Progress | Backend Engineer | Implementar APIs, regras de negócio, integrações e lógica backend |
| In Progress | Frontend Engineer | Implementar interface, UX/UI e integrações com APIs |
| Review (Code Review) | Tech Lead | Revisar código, arquitetura, padrões, segurança e performance |
| Review (QA) | QA Analyst | Validar requisitos, fluxos, edge cases e regressões |
| Document | Technical Writer | Atualizar documentação técnica interna quando necessário |
| Done | Orquestrador | Relatório no chat (resumo + PR); aguardar validação/merge do usuário |

---

## 6. Uso Obrigatório do MCP Linear

Sempre que um agente estiver atuando sobre uma Issue, ele deve usar o MCP do Linear para:

1. Ler a Issue atual.
2. Ler título, descrição, comentários, labels, status e links relacionados.
3. Atualizar a Issue com sua análise ou resultado.
4. Adicionar comentários estruturados quando apropriado.
5. **Executar** mudança de status quando a etapa estiver concluída e os critérios do §16 forem cumpridos (execução contínua).
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
[Indicação clara do próximo agente ou etapa — o orquestrador segue automaticamente]
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

**Modo contínuo (padrão):** ao pedir execução da Issue, o orquestrador inicia pelo Product Analyst (se ainda não houver refinamento suficiente) e segue o pipeline até Done.

**Modo pontual (exceção):** o usuário pode pedir só um papel (“atuar como Product Analyst”). Nesse caso, execute só essa etapa; ao concluir, registre o handoff no Linear e **indique no chat** que o fluxo contínuo pode ser retomado — sem executar as demais etapas a menos que o usuário peça.

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
   - Lacunas resolvidas por decisão assumida (§15.1)
4. Atualizar a própria Issue no Linear.
5. Não criar arquivo de refinamento no repositório.
6. Em execução contínua: handoff `concluído` → **seguir imediatamente** para Software Architect.

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
   - Escopo de execução: backend / frontend / ambos (para skips)
4. Atualizar a própria Issue no Linear.
5. Não criar arquivo de análise técnica no repositório.
6. Em execução contínua: mover para `Todo` → `In Progress` e **seguir** para o Engineer adequado.

### 8.4 Saída do Refinamento

Após Product Analyst e Software Architect concluírem:

- A Issue deve conter refinamento suficiente para desenvolvimento.
- Em execução contínua: mover `Backlog` → `Todo` → `In Progress` sem pedir confirmação.
- Ambiguidade: aplicar **Decisão Assumida** (§15.1) e seguir — não pausar o chat.
- Só usar Gate de Emergência se for impossível avançar com segurança.

---

## 9. Fluxo de Execução

### 9.1 Entrada

Em execução contínua, a entrada em `In Progress` é automática após o refinamento.

Ordem padrão:

1. Backend Engineer (se houver escopo backend)
2. Frontend Engineer (se houver escopo frontend)
3. Preparar/atualizar branch e PR
4. Mover para `Review` e seguir Tech Lead → QA

### 9.2 Backend Engineer

O Backend Engineer deve:

1. Ler a Issue no Linear via MCP.
2. Identificar refinamentos de Product Analyst e Software Architect.
3. Consultar a base de conhecimento relevante.
4. Implementar o backend necessário.
5. Atualizar a Issue no Linear com o que foi implementado, arquivos, testes e decisões.
6. Em execução contínua: se houver frontend, handoff automático para Frontend Engineer; senão, preparar PR e ir para Review.

### 9.3 Frontend Engineer

O Frontend Engineer deve:

1. Ler a Issue no Linear via MCP.
2. Identificar critérios de aceite e fluxos esperados.
3. Consultar a base de conhecimento relevante.
4. Implementar a interface necessária.
5. Atualizar a Issue no Linear.
6. Em execução contínua: preparar/atualizar PR, mover para `Review`, assumir Tech Lead.

### 9.4 Pull Request

Durante ou ao fim de `In Progress` (antes de concluir Review):

- Garantir branch dedicada à Issue
- Abrir ou atualizar a PR com resumo alinhado ao refinamento
- Registrar o URL da PR na Issue Linear
- Após correções do loop Review e após Document, atualizar a PR

Não fazer merge. Merge só após confirmação explícita do usuário no chat pós-Done.

---

## 10. Fluxo de Review

Quando a Issue estiver em `Review`, atuam Tech Lead e QA Analyst (nesta ordem). O status único concentra code review e QA.

### 10.1 Code Review — Tech Lead

Em execução contínua, o orquestrador assume Tech Lead **sem** pedir ao usuário.

O Tech Lead deve:

1. Ler a Issue no Linear.
2. Ler os refinamentos e histórico de implementação.
3. Revisar o diff/código alterado.
4. Validar arquitetura, padrões, segurança, performance, testabilidade e consistência com a KB.
5. Atualizar a Issue no Linear com resultado, correções obrigatórias, sugestões opcionais e riscos.

**Se houver correções obrigatórias:**

1. Handoff `requer ajustes`.
2. Mover para `In Progress`.
3. Assumir o Engineer adequado **imediatamente**.
4. Após correção: voltar a `Review` e reavaliar (Tech Lead de novo, depois QA).

**Se aprovado:** seguir imediatamente para QA Analyst (ainda em `Review`).

Sugestões opcionais **não** interrompem o fluxo.

### 10.2 QA — QA Analyst

Após code review aprovado, assumir QA **sem** pedir ao usuário.

O QA Analyst deve:

1. Ler a Issue no Linear.
2. Validar critérios de aceite, fluxos, edge cases e regressões relevantes.
3. Atualizar a Issue no Linear com casos, resultado e evidências quando aplicável.

**Se houver falhas bloqueantes:** mesmo loop automático → `In Progress` → correção → `Review` (Tech Lead → QA).

**Se aprovado:** mover para `Document` e assumir Technical Writer.

Após Code Review e QA aprovados, a Issue segue para `Document` (não diretamente para `Done`).

---

## 11. Fluxo de Documentação e Done

### 11.1 Document

Após aprovação de Code Review e QA, a Issue deve ser movida para `Document`.

Neste estado, a implementação está aprovada funcionalmente e tecnicamente; falta avaliar (e atualizar, se necessário) a documentação permanente.

Nesta etapa atua o **Technical Writer** (KB interna em `knowledge/`). Em execução contínua, assume imediatamente.

#### Regra absoluta de status em Document

Enquanto a Issue estiver na etapa `Document`:

- O status Linear **deve permanecer `Document`**.
- É **proibido** regredir para `In Progress`, `Review`, `Todo` ou `Backlog`.
- Atualizar a Issue (descrição, comentário, anexos) **não** autoriza mudar o status.
- No MCP `save_issue`: **omitir** o campo `state`, salvo correção explícita de regressão (voltar para `Document`) ou conclusão para `Done`.
- **Nunca** passar `state` pelo tipo genérico (`started`, `unstarted`, etc.) — o Linear pode resolver para o status padrão da categoria (em geral `In Progress`). Sempre usar o **nome exato**: `Document`, `Done`, etc.
- Se ao ler a Issue o status tiver regredido para `In Progress` (ex.: automação Git/PR) **durante** Document, o agente deve **restaurar para `Document`** imediatamente e registrar o fato no comentário/handoff.

Única transição válida a partir de `Document`: `Document` → `Done` (quando os critérios do §16 forem cumpridos). Em execução contínua, essa transição é feita pelo agente ao concluir o Technical Writer.

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

Após a etapa `Document` concluída (incluindo justificativa se nenhuma alteração documental for necessária):

1. Mover a Issue para `Done`.
2. Garantir que a PR está atualizada (inclui docs/release notes se aplicável).
3. **Retornar no chat** o relatório do §2.1 (resumo + PR + pedido de validação ou confirmação de merge).

`Done` é o **estado final** do fluxo automático. Merge permanece decisão humana.

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
5. Atualizar a Issue no Linear com documentações revisadas/alteradas ou justificativa.
6. Em execução contínua: mover para `Done` e disparar o relatório no chat (§2.1 / §11.3).

O Technical Writer não deve criar documentação temporária por issue.

O Technical Writer **não altera** o status da Issue para `In Progress`. Preserva `Document` (§11.1) até a transição final para `Done`.

---

## 15. Regras Gerais para Todos os Agentes

### Sempre fazer

- Usar Linear MCP para ler a Issue quando houver Issue associada.
- Registrar análises e decisões na própria Issue do Linear.
- Consultar a base de conhecimento antes de decidir.
- Em execução contínua: concluir a etapa e **assumir o próximo papel** sem esperar o usuário.
- Manter o histórico centralizado no Linear.
- Ser explícito sobre riscos e decisões assumidas.
- Diferenciar correção obrigatória de sugestão opcional.
- Preferir **Decisão Assumida** (§15.1) a interromper o chat.
- Mover status Linear quando os critérios do §16 forem cumpridos (execução contínua).

### Nunca fazer

- Criar arquivos temporários por Issue no repositório.
- Duplicar histórico do Linear em arquivos `.md`.
- Pausar o pipeline contínuo para pedir confirmação de etapa seguinte.
- Mover status sem cumprir os critérios do §16.
- **Regredir** Issue de `Document` (ou `Done`) para `In Progress` — nem por “começar a trabalhar”, nem ao atualizar descrição/comentário, nem por efeito colateral de PR/docs.
- Passar `state` no MCP com tipo genérico (`started`) em vez do nome exato do status.
- Ignorar refinamentos já feitos por agentes anteriores.
- Implementar fora do escopo refinado sem registrar decisão/escopo.
- Atualizar documentação permanente sem necessidade real.
- Fazer merge da PR sem confirmação explícita do usuário no chat pós-Done.
- Usar Gate de Emergência para dúvidas que a KB/código/padrões já resolvem.

---

## 15.1 Decisões no fluxo contínuo

No modo contínuo, o padrão é **não interromper o chat**. Ambiguidade se resolve com decisão assumida; o chat só para em emergência real.

### A) Decisão Assumida (padrão)

Quando houver dúvida mas for possível avançar com segurança:

1. Escolher a opção mais alinhada à KB, ao código existente, aos padrões e ao escopo já refinado.
2. Preferir a opção **conservadora** (menor escopo, sem breaking change, sem inventar produto).
3. Registrar na Issue:

```markdown
## Decisão Assumida — [Agente] — [data]

- **Dúvida:** …
- **Opção escolhida:** …
- **Alternativas descartadas:** …
- **Fundamento:** [KB / código / padrão / critério de aceite]
- **Impacto:** [escopo / aceite / implementação]
```

4. Continuar a etapa e o pipeline.

Dúvidas não bloqueantes (nitpick, follow-up, melhoria opcional) vão só na Issue, sem parar nada.

### B) Gate de Emergência (exceção rara)

Interromper o chat **somente** se for impossível continuar com segurança, por exemplo:

- Ação destrutiva irreversível ou perda de dados sem base clara
- Credencial/segredo/ambiente indispensável e ausente
- Conflito irreconciliável entre requisitos com impacto alto e sem base na KB
- Pedido explícito do usuário para pausar

**Não** é emergência: wording de UI, nome de campo, escolha entre duas abordagens equivalentes, “qual lib?”, detalhes cobertos por padrões do repo, escopo inferível da Issue + KB.

### Protocolo do Gate de Emergência

1. **Pare** a conclusão da etapa (handoff `bloqueado`).
2. Registre no Linear o progresso parcial + perguntas + handoff bloqueado.
3. Pergunte no chat de forma explícita, numerada e acionável.
4. Aguarde a resposta.
5. Atualize o Linear com a decisão.
6. Retome o pipeline contínuo até Done.

### Formato mínimo no chat (emergência)

```markdown
## Gate de Emergência — Issue [ID]

Não consigo continuar com segurança sem sua decisão.

### Contexto (1–3 linhas)
[por que isso é emergência, não ambiguidade comum]

### Perguntas
1. [pergunta objetiva] — opções: A) … / B) … / C) …

### O que já está pronto
- [etapas concluídas]
```

### Formato mínimo no Linear (após resposta)

```markdown
## Decisões do Usuário — [data]

- **Pergunta:** …
- **Decisão:** …
- **Impacto:** [escopo / aceite / abordagem / review / docs]
```

### Regras

- Chat durante o pipeline = só emergência ou Done.
- Linear = persistir decisões assumidas, bloqueios e decisões do usuário.
- Não mova status (§16) enquanto houver Gate de Emergência sem resposta.
- Após a resposta, retomar e ir até Done na mesma sessão, se possível.

---

## 16. Critérios para Mudar Status no Linear

Em execução contínua, cumprir o critério **é** autorização para mover.

### Para mover para `Todo`

Permitido quando:

- Product Analyst concluiu refinamento.
- Software Architect concluiu análise técnica.
- Não há Gate de Emergência aberto.
- Critérios de aceite estão claros (incluindo decisões assumidas registradas).
- Escopo e fora de escopo estão definidos.
- Riscos principais estão registrados.

### Para seguir em `In Progress`

Permitido quando:

- Issue está refinada (ou já estava).
- Execução contínua em andamento **ou** usuário pediu implementação.
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
- PR existe e está referenciada na Issue (quando houver código).

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
- PR atualizada com o estado final.

Após `Done`: relatório no chat (§2.1). **Não** mergear sem confirmação.

### Loop Review → In Progress

Permitido quando Tech Lead ou QA registrarem correções **obrigatórias**. Sugestões opcionais não disparam o loop.

---

## 17. Handoff entre Agentes

Cada agente deve finalizar sua atuação indicando claramente o próximo passo.

Formato recomendado:

```markdown
## Handoff

**Status:** [concluído / requer ajustes / bloqueado]

**Próximo agente recomendado:** [Software Architect / Backend Engineer / Frontend Engineer / Tech Lead / QA Analyst / Technical Writer / Done]

**Motivo:** [por que este é o próximo passo]

**Pontos de atenção:**
- [item 1]
- [item 2]
```

Em execução contínua:

| Handoff | Ação do orquestrador |
| --- | --- |
| `concluído` | Assumir próximo agente / mover status / continuar |
| `requer ajustes` | Voltar Engineers (`In Progress`), corrigir, retornar ao Review |
| `bloqueado` | Somente Gate de Emergência — perguntar no chat |

---

## 18. Fonte de Verdade por Tipo de Informação

| Informação | Fonte de Verdade |
| --- | --- |
| Status da demanda | Linear |
| Histórico de refinamento | Linear |
| Histórico de review | Linear |
| Histórico de QA | Linear |
| Implementação | Git / código |
| PR | Git host (URL também na Issue) |
| Conhecimento permanente do produto | Repositório `knowledge/*.md` |
| Arquitetura permanente | Repositório `knowledge/*.md` |
| Regras de negócio permanentes | Repositório `knowledge/*.md` |

---

## 19. Resumo Operacional

```
[Usuário pede executar Issue]
→ Product Analyst atualiza Issue no Linear
→ Software Architect atualiza Issue no Linear
→ Todo → In Progress (automático)
→ Backend e/ou Frontend (skip se não houver escopo)
→ Branch + PR
→ Review: Tech Lead → QA
→ Loop automático se correções obrigatórias
→ Document: Technical Writer (+ release notes se PR → main)
→ Done
→ Chat: resumo + PR + pedir validação manual ou confirmação de merge
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
- Decisões tomadas (incluindo assumidas)
- Riscos ou problemas encontrados
- Próximo passo recomendado
- Status sugerido (em contínuo: o orquestrador aplica)
```

### 20.5 Handoff vira parte obrigatória dos MDCs

Todo agente deve finalizar com:

```md
## Handoff
Status:
Próximo agente recomendado:
Pontos de atenção:
```

Em execução contínua, `concluído` / `requer ajustes` dispara a próxima ação automaticamente.

### 20.6 Decisões e Gate nos MDCs

Todo MDC deve instruir o agente a:

```md
Ambiguidade resolvível:
1. Decisão Assumida (KB/código/padrões).
2. Registrar no Linear.
3. Continuar o pipeline.

Só se for Gate de Emergência (§15.1 B):
1. Não concluir a etapa.
2. Registrar bloqueio no Linear.
3. Perguntar no chat e aguardar.
4. Atualizar Linear e retomar até Done.
```

Detalhe: workflow §15.1.

### 20.7 Independência de produto

MDCs e templates do Ledger Flow **não** devem citar nome, domínio, tenant ou stack de um produto específico.

Stack, pastas de código, papéis de usuário e integrações vêm da KB e do código **do repositório atual** (`knowledge/03_arquitetura/`, `knowledge/05_padroes/`, `knowledge/06_integracoes/`). Se a KB ainda não existir, descreva o que o código mostra e registre a lacuna documental — não copie o contexto de outro projeto.

### 20.8 Orquestração contínua

Quando a sessão for execução de Issue (não um papel pontual):

```md
1. Carregar MDC do papel atual.
2. Executar até handoff concluído / requer ajustes / bloqueado.
3. Se concluído: próximo papel sem pausar o chat.
4. Se requer ajustes: Engineer → Review em loop.
5. Se Done: relatório §2.1 no chat (único retorno esperado ao usuário).
```
