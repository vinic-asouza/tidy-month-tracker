---
type: padrao
titulo: Padrões de testes
ultima_atualizacao: 2026-09-07
---

# Padrões de testes

Vitest **só no frontend**. Funções puras + adapters Supabase mockados (épico DEV-62). Não invente cobertura %, CI ou suite E2E que o repo não tem.

---

## Ferramenta e comando

| Item | Valor |
| --- | --- |
| Runner | Vitest 3 (`frontend/vitest.config.ts`) |
| Ambiente | `jsdom`, `globals: true` |
| Setup | `frontend/src/test/setup.ts` (jest-dom + `matchMedia`) |
| Include | `frontend/src/**/*.{test,spec}.{ts,tsx}` |
| Alias | `@` → `src` |
| Mock Supabase | `frontend/src/test/mocks/supabaseClient.ts` |

```bash
npm test                     # vitest run no workspace frontend
npm run test --workspace=frontend
npm run test:watch --workspace=frontend
```

Backend e landing: **sem** script de teste.

Não há GitHub Actions neste repositório. Rodar a suíte é passo local (e critério de Tech Lead / QA na Issue), não um check automático.

---

## Onde colocar o spec

| Tipo | Onde |
| --- | --- |
| `utils/business/*` | `utils/business/__tests__/<arquivo>.test.ts` |
| Outros utils | `utils/__tests__/<arquivo>.test.ts` |
| Adapters Supabase | `services/adapters/supabase/__tests__/<arquivo>.test.ts` |
| Páginas / rotas | `pages/__tests__/` ou `components/__tests__/` (Testing Library) |
| Cálculo da regra | `utils/__tests__/financialRuleCalculations.test.ts` |

Harness: `createSupabaseMock()` + `vi.mock('@/integrations/supabase/client')` com `vi.hoisted(async () => { const m = await import('…/supabaseClient'); return m.createSupabaseMock(); })` — ver cabeçalho do harness. Não use `vi.hoisted(() => createSupabaseMock())` com import estático (TDZ).

`frontend/src/test/example.test.ts` é tautologia. Não use como modelo.

Preferir função pura ou adapter mock. Componente só se a Issue exigir (Auth, ProtectedRoute). Hook pesado (`useSupabaseFinance` pay invoice): preferir testar a camada de dados (`accountOperations`) e deixar orquestração em QA residual.

---

## O que testar (código novo)

Prioridade: regra que muda número na tela ou no banco.

- Caixa / efetivado / planejado (`monthTotals.ts`)
- Parcelas e virada de ano (`installments.ts`)
- Série / `omitPerMonthFields` (`seriesUpdates.ts`)
- Match cartão pelo **nome** (`creditCards.ts`)
- Papéis e labels de carteira (`accountRoles`, `accountLabels`, `accounts`)
- Visibilidade de desejos (`wishItems.ts`)
- Defaults de dialogs de efetivação / fatura
- `financialRuleCalculations.ts`
- Adapters: create/update/delete, gates RN-G06/RN-W01, rollback de série, `ilike` de nomes
- Auth cliente: `authErrors`, validação de senha, redirects de sessão

Asserções: valores explícitos (`toBe(3400)`), não snapshots de JSX.

Não mockar o Supabase para provar RLS. QA manual / Issue cobre fluxo autenticado real.

Credenciais de smoke local: só `.cursor/rules/test-credentials.mdc` (ambiente local). **Nunca** colar senha em Issue pública, em `knowledge/` ou em spec.

---

## O que a suíte ainda não cobre (lacuna)

- Orquestração completa de `payCardInvoice` / sync no hook
- UI de efetivação / resgate intocável / dialogs (residual QA)
- Barra de seleção, Express, SET NULL real no Postgres
- Refresh de token ao focar a aba (DEV-68)
- Adaptadores `investments`, `accountBalances`, `financialRule` (além dos utils)

Issue que mexe nesses fluxos: teste de util/adapter se a regra mudou + verificação manual (ou E2E se alguém adicionar ferramenta). Não declare “testado” só porque `npm test` passou se o arquivo crítico não tem spec.

---

## Critério ao revisar

- Spec novo segue Vitest `describe` / `it` / `expect` (como `installments.test.ts` ou `expenses.test.ts`).
- Não commitar teste que precisa de rede ou de `.env` real.
- Não adicionar Jest ao lado do Vitest.
- Não exigir % de coverage no tsconfig — não está configurado.
- Peer `@testing-library/dom` deve permanecer instalado se houver specs de componente.
