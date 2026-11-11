---
type: adr
id: ADR-011
titulo: Adiar PWA; política offline sem cache de dados financeiros
status: Aceito
data: 2026-11-11
autor: Development
decisores: [Development]
tags: [frontend, infra, segurança, produto]
---

# ADR-011 — Adiar PWA; política offline sem cache de dados financeiros

## Contexto e problema

A objeção “não tem app” aparece no roadmap (P4). O Finto é SPA Vite na Vercel (HTTPS), sem manifest, sem service worker e com ícones insuficientes para instalabilidade (ex.: `logo.png` 40×40).

**Problema:** decidir se investir agora em PWA/instalação melhora retorno sem complexidade e risco desproporcionais para um app de dados financeiros pessoais.

**Por que decidir agora:** spike DEV-148 (P3 avaliar); prioridade Low; sessão já persiste no browser.

## Forças em jogo

- YAGNI e roadmap: PWA não bloqueia lançamento público.
- Segurança: lançamentos/saldos são sensíveis; cache local amplia superfície.
- Fragmentação mobile: Chrome Android ≠ Safari iOS (sem `beforeinstallprompt`).
- Produto: hábito vem do registro manual, não do ícone na home.
- Manutenção: SW mal versionado serve assets stale após deploy.

## Decisão

**Decidimos adiar** a implementação de PWA (manifest, service worker, ícones maskable, UX de instalação).

Se/quando priorizar (P4), o caminho preferido é **shell instalável online-first** (opção B abaixo), nunca offline com dados financeiros em cache.

### Política offline (vigente para qualquer SW futuro)

| Permitido | Proibido |
| --- | --- |
| Precache do app shell (HTML/JS/CSS estáticos do build, versionados) | Cache de respostas Supabase/PostgREST |
| Banner “Sem conexão — reconecte para ver seus dados” | JWT/refresh no Cache API do SW |
| | Números financeiros cacheados como verdade |
| | Background Sync / fila de mutações offline |

## Opções consideradas

| Opção | Esforço | Veredito |
| --- | --- | --- |
| A) Adiar e documentar | Spike | **Escolhida** |
| B) Shell instalável (manifest + ícones 192/512 + SW só estático) | 2–4 d | Follow-up P4 se demanda |
| C) Offline-capable (cache de dados + queue) | semanas | Rejeitada |
| D) Wrapper nativo (Capacitor/TWA) | alto | Fora |

## Consequências

**Positivas:** sem manutenção de SW; sem risco de dados financeiros em Cache API; decisão clara para Issues futuras.

**Negativas:** objeção “não tem app” permanece; atalho na home só via bookmark do browser.

**Estado técnico de referência (nov/2026):** HTTPS ok; sem `manifest.webmanifest`; sem SW; sem `apple-touch-icon` / `theme-color` dedicados a install.

## Notas

Issue: DEV-148. Índice: [index.md](./index.md). Roadmap: [`../01_produto/roadmap.md`](../01_produto/roadmap.md).
