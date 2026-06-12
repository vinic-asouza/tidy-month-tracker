# Deploy em Produção — Tidy Month Tracker

Guia de referência para hospedar o frontend na **Vercel**, conectado diretamente ao **Supabase** (fase atual de produção).

**URL de produção:** https://tidy-month-tracker.vercel.app

---

## Arquitetura em produção

```
Frontend (Vercel) ──► Supabase Postgres (RLS)
                 └──► Supabase Auth
```

O backend Express **não** participa do deploy atual. Ele permanece no repositório para uso futuro. A troca entre modos é feita pela variável `VITE_DATA_PROVIDER` (`supabase` ou `api`).

Para detalhes da implementação dos adaptadores, veja [`PLANO_FRONTEND_DIRETO_SUPABASE.md`](./PLANO_FRONTEND_DIRETO_SUPABASE.md).

---

## Pré-requisitos

- Repositório no GitHub conectado à Vercel
- Projeto Supabase configurado (`supabase/setup-completo.sql` executado)
- Branch `main` como branch de produção na Vercel

---

## Configuração na Vercel

### Integração Git

1. Em [vercel.com](https://vercel.com), importe o repositório `tidy-month-tracker`
2. Em **Settings → Git**, defina **Production Branch** como `main`
3. Cada push na `main` dispara deploy automático de produção

### Build (monorepo)

O arquivo `vercel.json` na raiz do repositório define o build apenas do frontend:

| Configuração | Valor |
|--------------|-------|
| Framework | Vite |
| Install | `npm install` |
| Build | `npm run build --workspace=frontend` |
| Output | `frontend/dist` |
| SPA rewrite | `/(.*)` → `/index.html` |

O arquivo `.vercelignore` exclui `backend/` e `landing/` do upload, evitando que a Vercel tente buildar o backend.

### Variáveis de ambiente

Configure em **Settings → Environment Variables** (ambiente **Production**):

| Variável | Valor | Obrigatória |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://yoinjsmlntehikilqoxx.supabase.co` | Sim |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publishable do projeto | Sim |
| `VITE_DATA_PROVIDER` | `supabase` | Sim |

**Opcional (Preview):** replique as mesmas variáveis no ambiente **Preview** para testar branches de PR na Vercel.

**Futuro (com backend):** adicione `VITE_DATA_PROVIDER=api` e `VITE_API_URL` apontando para a API hospedada.

> As variáveis `VITE_*` são embutidas no bundle no momento do build. Após alterá-las na Vercel, é necessário um novo deploy.

---

## Configuração no Supabase Auth

Em [Authentication → URL Configuration](https://supabase.com/dashboard/project/yoinjsmlntehikilqoxx/auth/url-configuration):

| Campo | Valor |
|-------|-------|
| **Site URL** | `https://tidy-month-tracker.vercel.app` |
| **Redirect URLs** | `https://tidy-month-tracker.vercel.app/**` |
| **Redirect URLs** (dev local) | `http://localhost:5173/**` ou `http://localhost:8080/**` |

Sem essas URLs, login e confirmação de e-mail falham em produção (redirect bloqueado pelo Supabase).

---

## Fluxo de deploy

### Automático (recomendado)

```bash
git checkout main
git pull
# ... alterações ...
git commit -m "feat: sua alteração"
git push origin main
```

A Vercel detecta o push, executa o build e publica em produção.

### Manual (CLI)

Útil para debug ou quando o webhook do Git não estiver disponível:

```bash
npx vercel deploy --prod
```

O projeto já está linkado via `.vercel/project.json`. O CLI usa as variáveis configuradas no dashboard da Vercel.

---

## Desenvolvimento local

1. Copie o exemplo de variáveis:

```bash
cp frontend/.env.example frontend/.env.local
```

2. Preencha com as credenciais do Supabase (mesmas da Vercel, ou chaves de outro projeto de dev).

3. Inicie o frontend:

```bash
npm run dev
```

Com `VITE_DATA_PROVIDER=supabase`, o app acessa o banco diretamente, sem backend.

Para testar com o backend local:

```env
VITE_DATA_PROVIDER=api
VITE_API_URL=http://localhost:3000
```

E em outro terminal: `npm run dev:backend`.

---

## Checklist pós-deploy

- [ ] Página de login carrega em https://tidy-month-tracker.vercel.app
- [ ] Login e logout funcionam
- [ ] CRUD de receitas, despesas e investimentos
- [ ] Despesa fixa com repetição mensal
- [ ] Despesa parcelada (criar, editar, excluir parcelas)
- [ ] Cartões de crédito e status mensal
- [ ] Configurações (tags, categorias, métodos de pagamento)
- [ ] Regra financeira
- [ ] Recarregar `/` e `/auth` sem erro 404 (roteamento SPA)

---

## Solução de problemas

### Build falha tentando compilar o backend

Verifique se `vercel.json` na raiz define `buildCommand` e `outputDirectory` do frontend, e se `.vercelignore` exclui `backend/`. O framework deve ser `vite`, não `services`.

### Login funciona localmente mas não em produção

1. Confirme **Site URL** e **Redirect URLs** no Supabase Auth
2. Confirme que `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão no ambiente **Production** da Vercel
3. Faça redeploy após alterar variáveis de ambiente

### Página em branco ou 404 ao recarregar rotas

O `vercel.json` deve conter o rewrite SPA para `/index.html`. Sem isso, rotas como `/auth` retornam 404 ao acessar diretamente.

### Dados não aparecem / erro de permissão

O Supabase usa RLS. Verifique se o usuário está autenticado e se as políticas em `supabase/setup-completo.sql` foram aplicadas no projeto remoto.

---

## Retorno ao backend (futuro)

1. Hospedar o backend (Render, Fly.io, Railway, etc.)
2. Na Vercel: `VITE_DATA_PROVIDER=api` e `VITE_API_URL=<url-da-api>`
3. No backend: `CORS_ORIGIN=https://tidy-month-tracker.vercel.app`
4. Novo deploy do frontend

Nenhuma alteração de schema no banco é necessária.

---

## Referências

| Arquivo | Descrição |
|---------|-----------|
| `vercel.json` | Configuração de build e rewrites |
| `.vercelignore` | Pastas excluídas do deploy |
| `frontend/.env.example` | Variáveis de ambiente do frontend |
| `frontend/src/services/adapters/` | Adaptadores `supabase` e `api` |
| `supabase/setup-completo.sql` | Schema + RLS do banco |

---

## Histórico

| Data | Descrição |
|------|-----------|
| 2026-06-12 | Primeiro deploy de produção na Vercel; integração GitHub + Supabase Auth configurados |
