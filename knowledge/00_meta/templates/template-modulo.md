---
type: modulo
nome:
status: Ativo # Ativo | Em Desenvolvimento | Depreciado
versao:
owner:
ultima_atualizacao:
tags: []
dependencias: [] # módulos que este módulo consome
---

# Módulo — {{nome}}

> Documento-base em `knowledge/04_modulos/[nome-do-modulo].md`. Atualize quando a estrutura ou contratos mudarem.
>
> Preencha com a organização **deste** projeto. Consulte `knowledge/03_arquitetura/` e `knowledge/05_padroes/` — não assuma stack, pastas ou tenants de outro produto.

---

## 📌 Overview

<!-- Uma frase sobre o que este módulo faz e seu papel no sistema -->

**Responsabilidade única:**



**Propósito no produto:**



---

## ⚖️ Bounded Context

<!-- Limites claros evitam acoplamento indevido -->

### ✅ O que este módulo FAZ

-
-

### ❌ O que este módulo NÃO FAZ

_(responsabilidades de outros módulos)_

-
-

---

## 📁 Estrutura de Arquivos

<!-- Liste os arquivos reais do domínio neste repositório. -->

```text
# Substitua pelo layout real (backend, frontend, packages, etc.)
```

| Arquivo | Descrição |
| --- | --- |
| | |

---

## 🗄️ Entidades e Models

_Documente o modelo de dados como o projeto realmente persiste (SQL, ORM, documentos, etc.). Schema de referência: o que a arquitetura do projeto indicar._

### Entidade / tabela: `[nome]`

| Campo | Tipo | Obrigatório | Descrição | Validações |
| --- | --- | --- | --- | --- |
| `id` | | Sim | PK | |
| | | | | |

**Esboço de schema** _(opcional):_

```sql
-- ou equivalente (Prisma, Drizzle, etc.)
```

**Tipo / contrato** _(linguagem do projeto):_

```
// interface / type / struct do domínio
```

**Enums relacionados:**

| Enum | Valores |
| --- | --- |
| | |

---

## 🌐 Interface Pública

_Descreva a interface real: REST, GraphQL, tRPC, filas, CLI, etc. Auth e autorização conforme o projeto._

| Método | Rota / operação | Auth / papéis | Descrição | Request | Response |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

### Contratos detalhados _(opcional para endpoints críticos)_

**`METHOD /path`**

```json
// Request
```

```json
// Response 200
```

**Erros comuns:**

**UI / rotas de interface relacionadas:**

| Rota | Componente principal | Observação |
| --- | --- | --- |
| | | |

---

## ⚙️ Regras de Negócio

Principais regras implementadas neste módulo. Detalhamento em:

**→** [`../02_regras-de-negocio/regras-por-modulo/`](../02_regras-de-negocio/regras-por-modulo/)

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-… | | |

-
-

---

## 🔗 Dependências

<!-- Evite dependências circulares -->

### Módulos internos consumidos

- [`../04_modulos/`](../04_modulos/)

### Serviços / integrações externas

- [`../06_integracoes/`](../06_integracoes/)

### Utils / middlewares / libs compartilhados

| Dependência | Uso |
| --- | --- |
| | |

---

## 📡 Eventos Emitidos

<!-- Se não aplicável, escreva N/A. Documente o que o projeto usa: eventos internos, webhooks, jobs, side-effects. -->

| Evento / Job / Webhook | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| | | | |
| N/A | — | Este módulo não emite eventos/jobs | — |

---

## 🔧 Configurações

Variáveis de ambiente necessárias para este módulo:

| Variável | Tipo | Obrigatória | Valor padrão | Descrição |
| --- | --- | --- | --- | --- |
| | string / number / bool | Sim / Não | | |

---

## 🧪 Testes

_Use as ferramentas e pastas de teste documentadas em `knowledge/05_padroes/`._

| Item | Valor |
| --- | --- |
| Arquivos de teste | |
| Coleções / manuais | |
| Cobertura atual (%) | |
| Casos críticos cobertos | |

**Casos críticos:**

- [ ]
- [ ]

**Como rodar:**

```bash
# comando de teste deste projeto
```

---

## 📝 Histórico de Mudanças

| Data | Versão | Descrição | Issue ID | Autor |
| --- | --- | --- | --- | --- |
| | | | | |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/[nome].md` (KB permanente)
- Refinamento / análise técnica da Issue: **Linear** (templates em `knowledge/00_meta/templates/`)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md` (Ledger Flow)
