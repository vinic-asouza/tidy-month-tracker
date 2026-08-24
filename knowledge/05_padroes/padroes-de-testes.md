---
type: padrao
titulo: Padrões de testes
ultima_atualizacao: 2026-08-23
---

# Padrões de testes

O que existe hoje: Vitest **só no frontend**, quase só funções puras. Não invente cobertura %, CI ou suite E2E que o repo não tem.

---

## Ferramenta e comando

| Item | Valor |
| --- | --- |
| Runner | Vitest 3 (`frontend/vitest.config.ts`) |
| Ambiente | `jsdom`, `globals: true` |
| Setup | `frontend/src/test/setup.ts` (jest-dom + `matchMedia`) |
| Include | `frontend/src/**/*.{test,spec}.{ts,tsx}` |
| Alias | `@` → `src` |

```bash
npm test                     # vitest run no workspace frontend
npm run test --workspace=frontend
npm run test:watch --workspace=frontend
```

Backend e landing: **sem** script de teste.

Não há GitHub Actions neste repositório. Rodar a suíte é passo local (e critério de Tech Lead / QA na Issue), não um check automático.

---

## Onde colocar o spec

| Tipo | Onde (padrão atual) |
| --- | --- |
| `utils/business/*` | `utils/business/__tests__/<arquivo>.test.ts` |
| Outros utils | `utils/__tests__/<arquivo>.test.ts` |
| Cálculo da regra | `utils/__tests__/financialRuleCalculations.test.ts` |

Não há specs de componentes, hooks, adapters, rotas Express nem Playwright no git.

`frontend/src/test/example.test.ts` é tautologia (`expect(true)`). Não use como modelo. Não dependa dele para regressão.

Testing Library está no `package.json` e no setup; **nenhum teste de UI a usa de fato**. Preferir função pura. Componente só se a Issue exigir e o padrão de render for o da lib já instalada.

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

Asserções: valores explícitos (`toBe(3400)`), não snapshots de JSX.

Não mockar o Supabase para provar RLS — isso não está na suíte. QA manual / Issue cobre fluxo autenticado.

Credenciais de smoke local: só `.cursor/rules/test-credentials.mdc` (ambiente local). **Nunca** colar senha em Issue pública, em `knowledge/` ou em spec.

---

## O que a suíte não cobre (lacuna)

Registado nos módulos 04: Auth, CRUD real, adapters, barra de seleção, Express, atomicidade de série, exclusão de categoria usada noutro mês, etc.

Issue que mexe nesses fluxos: teste de util se a fórmula mudou + verificação manual (ou E2E se alguém adicionar ferramenta). Não declare “testado” só porque `npm test` passou se o arquivo crítico não tem spec.

---

## Critério ao revisar

- Spec novo segue Vitest `describe` / `it` / `expect` (como `installments.test.ts`).
- Não commitar teste que precisa de rede ou de `.env`.
- Não adicionar Jest ao lado do Vitest.
- Não exigir % de coverage no tsconfig — não está configurado.
