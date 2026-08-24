---
type: arquitetura
titulo: Diagrama de sistema
ultima_atualizacao: 2026-08-21
---

# Diagrama de sistema

Produção (caminho real):

```mermaid
flowchart LR
  subgraph client [Browser]
    SPA[SPA React Vite]
  end
  subgraph vercel [Vercel]
    Static[frontend/dist]
  end
  subgraph supabase [Supabase]
    Auth[Auth]
    PG[(Postgres + RLS)]
    REST[PostgREST]
  end
  User --> Static
  Static --> SPA
  SPA --> Auth
  SPA --> REST
  REST --> PG
  Auth --> PG
```

Camadas internas do frontend:

```mermaid
flowchart TB
  Pages[Pages Index Auth NotFound]
  Comp[Components]
  Hooks[Hooks]
  Facades[services facades]
  Select[adapters/select.ts]
  SB[adapters/supabase]
  API[adapters/api]
  Pages --> Comp
  Comp --> Hooks
  Hooks --> Facades
  Facades --> Select
  Select -->|VITE_DATA_PROVIDER supabase| SB
  Select -->|outro| API
  SB --> PostgREST[Supabase PostgREST]
  API --> Express[Backend Express]
```

Modo `api` (local / futuro): o SPA continua autenticando no Supabase; o CRUD iria ao Express com `Authorization: Bearer <jwt>`. O Express de hoje **não** implementa o domínio completo — ver [`api-design.md`](./api-design.md).
