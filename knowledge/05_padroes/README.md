---
type: index
secao: 05_padroes
ultima_atualizacao: 2026-08-24
---

# 05 · Padrões

Convenções **prescritivas** deste repositório (Finto / `tidy-month-tracker`). Engineers e Tech Lead seguem o que estiver aqui, não o padrão de outro produto.

O que o sistema **é** hoje: [`../03_arquitetura/`](../03_arquitetura/README.md).  
Como cada bounded context se comporta: [`../04_modulos/`](../04_modulos/index.md).  
Integrações reais: [`../06_integracoes/`](../06_integracoes/README.md).  
ADRs: [`../07_decisoes-tecnicas/`](../07_decisoes-tecnicas/index.md).  
Esta pasta diz **como escrever código novo** para não divergir.

Código manda se divergir desta KB.

| Arquivo | Conteúdo |
| --- | --- |
| [convencoes-de-codigo.md](./convencoes-de-codigo.md) | Monorepo, TypeScript, pastas, UI, imports |
| [padroes-de-api.md](./padroes-de-api.md) | Facades, adaptadores, Express (não é produção) |
| [padroes-de-banco-de-dados.md](./padroes-de-banco-de-dados.md) | SQL, RLS, migrations, tipos gerados |
| [padroes-de-testes.md](./padroes-de-testes.md) | Vitest, o que testar, lacunas |
| [padroes-de-git.md](./padroes-de-git.md) | Branches, commits, o que não versionar |

Não há Prettier, Husky, commitlint nem CI no GitHub. Não invente essa ferramenta no fluxo até ela existir no repo.
