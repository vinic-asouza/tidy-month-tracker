---
type: modulo
nome: Desejos
status: Ativo
versao: "1.1"
owner: Development
ultima_atualizacao: 2026-08-24
tags: [desejos, wishlist, frontend, supabase]
dependencias: [autenticacao]
---

# Módulo — Desejos

Documento-base em `knowledge/04_modulos/desejos.md`. Atualize quando visibilidade, expiração, renovação, conquista ou o vínculo com gasto mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/desejos.md`](../02_regras-de-negocio/regras-por-modulo/desejos.md). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Persistência: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md). Gasto na conquista: [`gastos.md`](./gastos.md). Isolamento do caixa: [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) (RN-R05).

---

## Overview

Lista de **metas de consumo** com prazo e urgência. Não é movimento financeiro: planejar um desejo **não** mexe em caixa, regra, estatísticas nem carteiras. Só vira dinheiro se a pessoa conquistar **e** registrar um gasto.

**Responsabilidade única:** persistir `wish_items` (CRUD, status, prazo) e calcular no cliente quem aparece no mês de navegação.

**Propósito no produto:** a pessoa reflete antes de comprar; o hábito de registrar o gasto continua no módulo gastos (RN-D01, jornada 7).

---

## Bounded context

### O que este módulo FAZ

- CRUD de desejo: descrição, valor `> 0`, urgência `low | medium | high`, prazo `targetMonth` (RN-D02)
- `startMonth` = mês de navegação no create; **não** é editável depois
- Status `active | expired | conquered`; create sempre nasce `active`
- Visibilidade no mês (RN-D03, RN-D07): `active` entre start e prazo; `expired` só no mês do prazo; `conquered` fora da lista ativa, só no filtro opcional de conquistas
- Expirar em lote ao abrir um mês **depois** do prazo (RN-D04) — no hook, não há job
- Renovar `expired` → `active` com novo `targetMonth` ≥ mês atual (RN-D05)
- Conquistar sem gasto: `status = conquered`, `conqueredMonth` = mês aberto; caixa intacto (RN-D06)
- Conquistar **e** registrar gasto: o desejo só fecha **depois** do INSERT; cancelar o form cancela a pendência (RN-D06)
- Filtro de conquistas do mês ou do ano até o mês (`ConqueredWishScope`); sort só no cliente
- Cabeçalho: planejado = soma dos `active` visíveis; realizado = métrica de conquistas do mês via gasto vinculado

### O que este módulo NÃO FAZ

- Entrar no caixa, na regra 50/30/20, no gráfico anual ou nos chips de carteira (RN-D01, RN-R05)
- Entrar na barra de seleção ([`selecao.md`](./selecao.md) — desejos não são selecionáveis)
- CRUD de linhas de gasto ([`gastos.md`](./gastos.md) — este módulo só dispara o rascunho e grava `linked_expense_id`)
- Efetivar carteira / pagar fatura (o form de gasto segue as regras de gastos/cartões)
- Totais do resumo ([`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) **não** lê `wish_items`)
- CRUD de entradas, aportes, cartões, carteiras ou regra financeira ([`regra-financeira.md`](./regra-financeira.md))
- Persistência de sort / filtro de conquistas (`useState` local)
- Marketing da landing (`landing/.../WishListSection`) — não é este bounded context

---

## Estrutura de arquivos

```text
frontend/src/
  components/WishSection.tsx                   # lista, form, conquistar, renovar, filtros
  components/MonthRecordsSection.tsx           # aba Desejos
  pages/Index.tsx                              # hook + pendência de conquista → rascunho de gasto
  hooks/useWishItems.ts                        # load, expire em lote, CRUD, conquer, renew
  services/wishItems.ts                        # facade
  services/adapters/supabase/wishItems.ts      # PostgREST
  services/adapters/api/wishItems.ts           # Express (não é produção; rotas inexistentes)
  types/domain.ts                              # WishItem, CreateWishItemInput, UpdateWishItemInput
  utils/business/wishItems.ts                  # visibilidade, sort, métrica realizado
  utils/business/__tests__/wishItems.test.ts
```

| Arquivo | Descrição |
| --- | --- |
| `WishSection.tsx` | Validação no cliente; dialogs; lista (limite inicial 10) |
| `useWishItems.ts` | Fetch global do user; expira `active` cujo prazo já passou no mês aberto |
| `wishItems.ts` (supabase) | INSERT `status: 'active'`; UPDATE parcial; expire = `status: 'expired'` |
| `wishItems.ts` (business) | Regras RN-D03–D07 no cliente |
| `Index.tsx` | `pendingWishConquer` + `expenseDraft`; conquista com gasto só após `addExpense` |

Backend Express **não** tem rotas de `wish_items`. Adapter API (`/api/wish-items`) existe no frontend; **produção não usa** (SPA → Supabase).

---

## Entidades e models

### Tabela: `wish_items`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `user_id` | UUID | Sim | RLS; `ON DELETE CASCADE` do user |
| `description` | TEXT | Sim | Sem UNIQUE |
| `value` | DECIMAL(12,2) | Sim | Default `0`; **sem** CHECK `> 0` no banco |
| `urgency` | TEXT | Sim | `low \| medium \| high`; default `medium` |
| `start_month` | TEXT | Sim | `YYYY-MM`; mês em que foi criado |
| `target_month` | TEXT | Sim | `YYYY-MM`; CHECK `>= start_month` |
| `status` | TEXT | Sim | `active \| conquered \| expired`; default `active` |
| `conquered_month` | TEXT | Não | `YYYY-MM` da conquista |
| `linked_expense_id` | UUID | Não | `expenses(id)` `ON DELETE SET NULL` |
| `created_at` / `updated_at` | timestamptz | Sim | |

Índices: `user_id`; `(user_id, status)`. CHECK de formato `^\d{4}-\d{2}$` em start/target.

### Contrato TypeScript

```ts
type WishUrgency = 'low' | 'medium' | 'high';
type WishStatus = 'active' | 'conquered' | 'expired';
type ConqueredWishScope = 'currentMonth' | 'yearToDate';

interface WishItem {
  id: string;
  description: string;
  value: number;
  urgency: WishUrgency;
  startMonth: string;
  targetMonth: string;
  status: WishStatus;
  conqueredMonth?: string;
  linkedExpenseId?: string;
}

interface CreateWishItemInput {
  description: string;
  value: number;
  urgency: WishUrgency;
  startMonth: string;
  targetMonth: string;
}
```

`UpdateWishItemInput` é parcial; inclui `status`, `conqueredMonth`, `linkedExpenseId`. Create no adapter **não** aceita status/vínculo: sempre `active`, sem gasto.

### Constantes

| Nome | Valor |
| --- | --- |
| `WISH_URGENCY_LABELS` | Baixa / Média / Alta |
| Sort default | `urgency` (alta → média → baixa, depois prazo, depois maior valor) |
| Limite da lista | `INITIAL_ITEMS_LIMIT = 10` |

---

## Interface pública

Não há REST de produção.

| Operação | Onde | Auth | Input | Efeito |
| --- | --- | --- | --- | --- |
| Listar | `getWishItems(userId)` | JWT + RLS | — | Todos os desejos do user (`created_at` asc) |
| Criar | `createWishItem` | idem | description, value, urgency, start, target | INSERT `active` |
| Atualizar | `updateWishItem` | idem | campos parciais | Não revalida movimentos/caixa |
| Excluir | `deleteWishItem` | idem | id | DELETE; gasto vinculado permanece |
| Expirar lote | `expireWishItems(ids)` | idem | ids | `status = expired` |
| Conquistar | `conquerWish` no hook | idem | id, mês, `linkedExpenseId?` | `conquered` + mês (+ vínculo) |
| Renovar | `renewWish` no hook | idem | id, novo prazo | `active` + `targetMonth` |

### Fluxo de conquista com gasto (`Index`)

1. Dialog: **Só marcar conquistado** → `conquerWish(id, currentMonth)` imediato.
2. **Sim, incluir gasto** → guarda `pendingWishConquer`, preenche `expenseDraft` (`description`, `type: 'variable'`), troca para a aba Gastos. **Ainda não** altera o desejo.
3. Form de gasto: não-cartão nasce `paid: true` (e tenta dialog de carteira); cartão nasce `paid: false` ([`gastos.md`](./gastos.md)).
4. `addExpense` ok → `conquerWish(..., created.id)`.
5. Cancelar o form / trocar de aba / trocar de mês: pendência some; desejo segue `active`. Toast: *Registro de gasto cancelado. O desejo continua ativo.*
6. Gasto salva e conquista falha: toast de erro; gasto fica; desejo ativo.

No fluxo “já pago” (não-cartão), a carteira escolhida entra no INSERT da linha criada (`account_id` UUID ou `null` = Saldo Livre). Cartão no mesmo fluxo continua `paid: false` e sem carteira. Detalhe do create: [`gastos.md`](./gastos.md).

### Validação no cliente

- Descrição obrigatória (trim)
- Valor `> 0`
- Prazo ≥ `startMonth` na edição, ≥ mês aberto no create
- Renovar: novo prazo ≥ mês aberto
- Sem Zod neste form

### UI / rotas

Mesma `/`. Aba `activeTab = 'wish'` (rótulo **Desejos**). Sem URL própria. Só na visão mensal.

| Superfície | Componente | Observação |
| --- | --- | --- |
| Lista | `WishSection` | Recebe **todos** os desejos; filtra no cliente |
| Badge da aba | `pendingWishCount` | `visibleWishes.length` (sem conquistados) |
| Conquistar | `AlertDialog` | Três saídas: Não / só marcar / incluir gasto |
| Renovar | Dialog de mês | Só itens `expired` |
| Rascunho de gasto | `ExpenseSection` | `expenseDraft` + `wishConquerPlannedValue` |

Itens conquistados: só excluir. Expirados: renovar ou excluir. Ativos: conquistar / editar / excluir.

### Erros comuns (toasts)

| Situação | Mensagem |
| --- | --- |
| Create ok | Desejo adicionado |
| Update / renew ok | Desejo atualizado |
| Delete ok | Desejo removido |
| Conquer ok | Desejo conquistado! |
| Expire em lote (1 / n) | `1 desejo expirou e pode ser renovado no mês do prazo.` / `N desejos expiraram e podem ser renovados no mês do prazo.` |
| Load / CRUD falhou | `Erro ao carregar/adicionar/atualizar/remover/conquistar desejo` (ou `error.message`) |
| Gasto ok, conquista falhou | Gasto salvo, mas o desejo não foi marcado como conquistado. Você pode conquistá-lo manualmente ou excluir o gasto. |
| Cancelou o gasto | Registro de gasto cancelado. O desejo continua ativo. |

---

## Regras de negócio

Detalhe: [`../02_regras-de-negocio/regras-por-modulo/desejos.md`](../02_regras-de-negocio/regras-por-modulo/desejos.md). Gerais: RN-G01, RN-G04. Resumo: RN-R05.

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-D01 | Fora do caixa, regra, estatísticas, carteiras e seleção | Ausência em `monthTotals.ts` / `SelectionBottomBar`; aba própria |
| RN-D02 | Descrição, valor > 0, urgência, prazo; start = mês de criação | Form + `createWishItem` (`startMonth: currentMonth`) |
| RN-D03 | Visibilidade por status | `isWishVisibleInMonth` / `filterWishesForMonthDisplay` |
| RN-D04 | Mês depois do prazo → `expired` em lote | `shouldAutoExpireWish` + `expireWishItems` no load |
| RN-D05 | Renovar: `active` + novo prazo | `renewWish` |
| RN-D06 | Conquista só-marcar vs depois do gasto | `Index.handleWishConquer` / `handleAddExpense` |
| RN-D07 | Conquistado some da lista ativa | `isWishVisibleInMonth` retorna false; filtro explícito à parte |

### Visibilidade (`isWishVisibleInMonth`)

- `conquered` → nunca (lista ativa)
- `expired` → só `viewingMonth === targetMonth`
- `active` → `startMonth ≤ viewingMonth ≤ targetMonth`

Conquistas no filtro: mesmo ano civil, `conqueredMonth ≤ viewingMonth`; `currentMonth` exige igualdade; `yearToDate` inclui meses anteriores do ano.

### Métrica “Realizado” (`getWishRealizedMetrics`)

Conta desejos `conquered` com `conqueredMonth ===` mês aberto. Soma o **valor do gasto vinculado**, não o valor do desejo. Sem `linkedExpenseId` (só marcar) entra no **count** e soma `0`.

### Código vs regra

- **Valor > 0:** só no cliente. Banco aceita `0`.
- **Expiração:** não há cron. Só quando o SPA carrega desejos naquele mês.
- **`startMonth`:** não atualiza na renovação (o CHECK `target >= start` continua válido porque o novo prazo é ≥ mês do prazo antigo).
- **Gasto apagado:** `ON DELETE SET NULL` no vínculo; o desejo **permanece** `conquered`.
- **Sort / scope de conquistas:** não persistem.

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — `user.id`; RLS
- [`gastos.md`](./gastos.md) — **não** é dependência de leitura contínua; só o rascunho + INSERT na conquista. Este módulo grava `linked_expense_id`.
- [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — **não** consome este módulo
- [`carteiras.md`](./carteiras.md) / [`cartoes.md`](./cartoes.md) — só indireto, via form de gasto

### Serviços / integrações externas

- Supabase PostgREST (`wish_items`): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `sonner` | Toasts |
| `@tanstack/react-query` | **Não** usado neste hook (estado local) |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| Mutação `wish_items` | CRUD / expire / conquer / renew | Lista no cliente | Só esta aba (não o resumo) |
| Pendência de conquista | “incluir gasto” | `expenseDraft` na aba Gastos | [`gastos.md`](./gastos.md) |
| UPDATE `linked_expense_id` | INSERT do gasto ok | Vínculo | Métrica realizado |
| N/A | — | Sem webhooks/jobs | — |

---

## Configurações

Nenhuma env exclusiva. [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md).

| Chave | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `VITE_DATA_PROVIDER` | string | Não | Adapter `api` quebra este módulo (Express sem rotas) |

Sem `localStorage` próprio.

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos deste módulo | `utils/business/__tests__/wishItems.test.ts` |
| UI / hook / adapters | Nenhum spec |
| Cobertura | Não inventar % |

**Casos cobertos hoje:**

- [x] `active` visível no intervalo start–prazo
- [x] `conquered` oculto na lista ativa
- [x] `expired` só no mês do prazo
- [x] Auto-expire depois do prazo
- [x] Sort por opção
- [x] Realizado: soma gastos vinculados do mês; count inclui conquista sem gasto
- [x] Filtro conquistas `currentMonth` / `yearToDate`; exclui outro ano e mês futuro
- [x] Sort de display: pendentes antes de conquistados

**Casos críticos (não automatizados hoje):**

- [ ] Create recusa descrição vazia / valor ≤ 0; grava `active` e `startMonth` = mês aberto
- [ ] Adapter não envia status no INSERT
- [ ] Load expira lote e mostra toast
- [ ] Só marcar → `conquered` sem `linked_expense_id`; caixa inalterado
- [ ] Incluir gasto: desejo só fecha após INSERT; cancelar mantém `active`
- [ ] Cartão no fluxo conquista nasce `paid: false`; não-cartão `paid: true`
- [ ] Conquista “já pago” persiste a carteira no gasto (mesmo `createExpense`; QA manual DEV-52; sem spec de adapter)
- [ ] Apagar o gasto zera o vínculo e **não** reabre o desejo
- [ ] Express `/api/wish-items` não existe

**Como rodar:**

```bash
npm test --workspace=frontend
```

---

## Histórico de mudanças

| Data | Versão | Descrição | Issue ID | Autor |
| --- | --- | --- | --- | --- |
| 2026-08-23 | 1.0 | Bootstrap da KB a partir do código | — | Technical Writer |
| 2026-08-24 | 1.1 | Conquista “já pago” persiste carteira no gasto criado | DEV-52 | Technical Writer |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/desejos.md`
- Índice: [`index.md`](./index.md)
- Jornada planejar/conquistar: [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
