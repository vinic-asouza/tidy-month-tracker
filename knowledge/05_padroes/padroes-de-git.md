---
type: padrao
titulo: Padrões de Git
ultima_atualizacao: 2026-08-24
---

# Padrões de Git

Remote conhecido: GitHub `vinic-asouza/tidy-month-tracker`. Deploy: push em **`main`** → Vercel (SPA). [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md). Host: [`../06_integracoes/vercel.md`](../06_integracoes/vercel.md).

Não há Husky, commitlint, template de PR nem Actions. O histórico mistura `feat:` e mensagens livres (`wallets`, `update docs`). Código novo deve ser **mais disciplinado** que a média antiga, sem reescrever o passado.

---

## Branches

| Branch | Uso |
| --- | --- |
| `main` | Produção. Não commitar WIP quebrado de propósito. |
| Feature | Nome curto do tema (`wallets`, `mobile`, `supabase-adapt`) — já é o hábito do repo |

Não force-push em `main`. Não `--no-verify` (não há hook para pular, e não invente).

Issue Linear (quando houver): uma branch por entrega pequena; merge em `main` quando o critério da etapa deixar.

---

## Commits

- Mensagem curta, **por quê** (não dump de arquivos).
- Prefixo útil e já usado: `feat:`, `fix:`, `chore:`, `docs:`.
- Português ou inglês — os dois existem; seja consistente **no commit**.
- Um assunto por commit quando der (não misturar migration irrelevante com copy da landing).

Não commitar:

| Item | Motivo |
| --- | --- |
| `.env`, `.env.local`, `.env.*.local` | Segredos (`.gitignore`) |
| `node_modules`, `dist`, `.vercel` | Build / deps |
| `service_role` / senha / JWT | Nunca no git |
| Arquivo temporário de Issue (`refinamento-*`, `qa-report-*`) | Ledger Flow: vai no Linear |
| Credenciais de teste na KB ou na Issue Linear | Nunca. Exceção: `.cursor/rules/test-credentials.mdc` |

`*.local` já está no `.gitignore`. Não force add.

---

## knowledge/ vs código vs Linear

| Mudança | Onde |
| --- | --- |
| Comportamento permanente de produto/regra/módulo/padrão | `knowledge/` no mesmo PR/commit da feature, se a mudança for permanente |
| Status da Issue | Linear |
| Implementação | Git |

Não crie pasta `knowledge/refinamentos/` nem markdown de demanda no repo.

---

## Antes de mergear em `main`

1. `npm test` (Vitest frontend) se a mudança toca lógica coberta ou nova spec.
2. `npm run lint` no frontend se mexeu em `frontend/`.
3. Migration aplicada **no projeto Supabase remoto** se o schema mudou — merge sem SQL aplicado quebra produção.
4. `VITE_DATA_PROVIDER=supabase` no ambiente Vercel; não ligar `api` até o Express cobrir o domínio.
5. A PR inclui **release notes** novas em `knowledge/releases/` (arquivo `vX.Y.Z-YYYY-MM-DD.md` + linha no [`../releases/README.md`](../releases/README.md)). Sem isso, a PR para `main` não está pronta. Detalhe: workflow §11.2.

Não há check automático no GitHub para isso. O critério é de processo (Ledger Flow + este documento).

---

## Fonte de verdade documental

Não há pasta `docs/`. **Código + `knowledge/`** mandam. Não invente outra árvore de documentação no repositório.
