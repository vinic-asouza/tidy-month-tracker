---
type: arquitetura
titulo: Infraestrutura
ultima_atualizacao: 2026-08-24
---

# Infraestrutura

## Produção

| Peça | Onde |
| --- | --- |
| SPA | Vercel — `https://tidy-month-tracker.vercel.app` |
| Branch | `main` dispara deploy |
| Build | `npm install` + `npm run build --workspace=frontend` → `frontend/dist` |
| SPA fallback | rewrite `/(.*)` → `/index.html` (`vercel.json`) |
| Upload | `.vercelignore` exclui `backend/` e `landing/` |
| Auth + DB | Supabase projeto `yoinjsmlntehikilqoxx` (`us-east-2`) |

`VITE_*` entra no bundle no **build**. Mudou env na Vercel → novo deploy.

### Env de produção (Vercel)

| Variável | Obrigatória |
| --- | --- |
| `VITE_SUPABASE_URL` | Sim |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sim (anon / publishable) |
| `VITE_DATA_PROVIDER` | Sim — deve ser `supabase` |

### Auth URLs (Supabase)

- Site URL: `https://tidy-month-tracker.vercel.app`
- Redirect: origem de produção `/**` + `http://localhost:8080` (Vite deste repo). Porta `5173` só se alguém subir o Vite no default sem o `vite.config.ts` do frontend.

Sem isso, confirmação de e-mail e recovery falham.

---

## Desenvolvimento local

```bash
cp frontend/.env.example frontend/.env.local
npm run dev                 # frontend :8080 (workspace)
npm run dev:backend         # Express :3000 — só com VITE_DATA_PROVIDER=api
```

`.env.example` já traz `VITE_DATA_PROVIDER=supabase`. Sem essa string exacta, `getDataProvider()` usa `api`.

---

## Workspaces

- `frontend` — produto
- `backend` — referência REST (não deployado)
- `landing` — site de marketing; fora do deploy do app

GitHub: `vinic-asouza/tidy-month-tracker`.

---

## Voltar ao Express

1. Hospedar o backend (Railway, Fly, Render, etc.)
2. `VITE_DATA_PROVIDER=api` e `VITE_API_URL`
3. `CORS_ORIGIN` no backend = URL da Vercel
4. Completar rotas que faltam (carteiras, desejos, operações) **antes** de cortar o modo Supabase

Integrações nomeadas: [`../06_integracoes/`](../06_integracoes/README.md) ([Supabase](../06_integracoes/supabase.md), [Vercel](../06_integracoes/vercel.md)).
