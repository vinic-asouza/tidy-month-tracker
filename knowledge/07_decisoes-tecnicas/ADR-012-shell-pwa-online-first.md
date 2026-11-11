---
type: adr
id: ADR-012
titulo: Shell PWA instalável online-first
status: Aceito
data: 2026-11-11
autor: Development
decisores: [Development]
tags: [frontend, infra, segurança]
supersede: ADR-011
---

# ADR-012 — Shell PWA instalável online-first

## Contexto e problema

DEV-148 / ADR-011 adiou PWA e fixou a política: sem cache de dados financeiros. A objeção “não tem app” permanece no roadmap P4. DEV-186 prioriza a opção B da ADR-011.

## Decisão

**Decidimos** adotar um **shell PWA instalável online-first** no frontend Vite:

- `vite-plugin-pwa` (`registerType: autoUpdate`)
- Manifest + ícones 192/512 (maskable) + `apple-touch-icon`
- Service worker precache só de assets estáticos do build
- `NetworkOnly` para hosts Supabase; navegação `NetworkFirst`
- Banner “Sem conexão — reconecte para ver seus dados”
- Sem UI custom de `beforeinstallprompt` nesta entrega

A **política offline da ADR-011 permanece vigente** (proibido cache de PostgREST/tokens/números; sem Background Sync).

ADR-011 fica **Substituída** quanto ao adiamento; a política offline é reafirmada aqui.

### Safari iOS

Não há `beforeinstallprompt`. Instalação: Safari → Compartilhar → **Adicionar à Tela de Início**. `apple-touch-icon` e `apple-mobile-web-app-*` estão no `index.html`.

## Consequências

**Positivas:** instalável no Chromium; atalho na home; precache versionado mitiga JS stale.

**Negativas:** manutenção do SW/ícones; iOS continua manual; offline não mostra lançamentos (intencional).

## Notas

Issue: DEV-186. Índice: [index.md](./index.md). Política base: [ADR-011](./ADR-011-adiar-pwa.md).
