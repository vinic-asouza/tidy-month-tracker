# Relatório QA — 13 Lista de Desejos

| Campo | Valor |
|-------|-------|
| **Módulo** | Lista de Desejos |
| **Data** | 2026-06-17 |
| **Metodologia** | Auditoria estática de código |
| **Referência** | [ANALISE_FRONTEND_QA.md](../../ANALISE_FRONTEND_QA.md) (linhas 536–655) |
| **Arquivos analisados** | `frontend/src/components/WishSection.tsx`, `frontend/src/hooks/useWishItems.ts`, `frontend/src/utils/business/wishItems.ts`, `frontend/src/services/wishItems.ts`, `frontend/src/services/adapters/supabase/wishItems.ts`, `frontend/src/pages/Index.tsx`, `frontend/src/components/MonthRecordsSection.tsx`, `frontend/src/components/ExpenseSection.tsx`, `frontend/src/components/ui/month-picker.tsx`, `supabase/migrations/create_wish_items.sql`, `frontend/src/utils/business/__tests__/wishItems.test.ts` |

---

## Resumo executivo

**Objetivo do módulo:** Planejar metas de consumo com valor estimado, urgência e prazo, acompanhando-as mês a mês até conquista, expiração ou renovação — sem impactar o saldo do resumo mensal.

**Veredito geral:** Aprovado com ressalvas — regras centrais de visibilidade, expiração e CRUD estão implementadas e cobertas por testes unitários; há lacunas em validação de formulário, fluxo conquista→gasto e rastreabilidade com gastos.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 1 |
| Médio | 5 |
| Baixo | 2 |

> **Revalidação (2026-06-17):** ver [seção Revalidação](#revalidação-2026-06-17) — 7/8 achados corrigidos; veredito atualizado para **Aprovado** com 1 achado médio residual.

---

## Mapa de fluxos validados

| # | Fluxo / Checklist (ANALISE) | Status | Observação |
|---|----------------------------|--------|------------|
| 1 | Criar desejo (descrição, valor, urgência, prazo) | OK com ressalva | Validação silenciosa em valor ≤ 0 |
| 2 | Rejeitar valor ≤ 0 ou descrição vazia | Achado | Botão só desabilita por descrição; valor inválido sem feedback |
| 3 | Prazo ≥ mês atual (criação) | OK | `MonthPicker` `min={currentMonth}` + `handleSubmit` |
| 4 | Visibilidade mês a mês (`active`) | OK | `isWishVisibleInMonth` + testes |
| 5 | Desejo de mês anterior visível no prazo | OK | `startMonth ≤ viewing ≤ targetMonth` |
| 6 | Editar descrição, valor, urgência, prazo | Achado | Validação de prazo na edição diverge da regra documentada |
| 7 | Ordenação (urgência, prazo, valor, alfabética) | OK | `sortWishesByOption` na UI |
| 8 | Conquistar (some de todos os meses) | OK | `status = conquered` + visibilidade `false` |
| 9 | Conquistar + incluir gasto | Achado | Não verifica sucesso da conquista; sem vínculo `linked_expense_id` |
| 10 | Conquistar sem gasto | OK | Toast + atualização local |
| 11 | Expiração automática ao passar do prazo | OK com ressalva | Lógica correta; sem feedback ao usuário |
| 12 | Expirado visível só no mês do prazo | OK | `status === expired` + `viewing === targetMonth` |
| 13 | Renovar prazo | OK | `renewWish` → `active` + novo `targetMonth` |
| 14 | Excluir desejo | OK | `DeleteConfirmDialog` + toast |
| 15 | Empty state e expandir (> 10 itens) | OK | `INITIAL_ITEMS_LIMIT = 10` |
| 16 | Totais não alteram saldo mensal | OK | Ausente de `MonthSummarySection` e regra financeira |
| 17 | Aba Desejos + FAB | OK | `MonthRecordsSection` + `addDialogType === 'wish'` |
| 18 | RLS / permissões Supabase | Não verificável | Políticas presentes na migration; requer runtime |

Legenda: **OK** — consistente com regras documentadas; **Achado** — ver seção Achados; **Não verificável** — requer browser ou ambiente Supabase.

---

## Áreas obrigatórias de validação

### 1. Fluxo do usuário

Jornada principal (FAB → dialog → lista → conquista/renovação) está coerente. Conquista via checkbox abre `AlertDialog` com três opções claras (cancelar, só marcar, marcar + gasto). Fluxo conquista→gasto troca aba para Gastos e abre dialog pré-preenchido. Fricção: sem botão “Adicionar” na seção quando já há itens (depende do FAB global — padrão igual a Entradas). Expiração automática remove itens da lista sem aviso, o que pode surpreender quem não navega ao mês do prazo para renovar.

### 2. Regras de negócio

Visibilidade (`active` / `conquered` / `expired`), expiração (`shouldAutoExpireWish`) e ordenação padrão (urgência → prazo → valor) alinhadas com a ANALISE e cobertas em `wishItems.test.ts`. Desejos não entram em totais financeiros. Lacuna documentada: `linked_expense_id` não é preenchido na conquista com gasto.

### 3. Validações

Frontend exige descrição e valor > 0 na submissão, mas falhas retornam silenciosamente. `MonthPicker` restringe datas na UI; banco impõe formato `YYYY-MM` e `target_month >= start_month`. DB permite `value = 0` (DEFAULT); frontend bloqueia na prática.

### 4. Tratamento de erros

Hook `useWishItems` exibe toast em falhas de CRUD e limpa lista em erro de carga. `handleWishConquer` em `Index.tsx` não propaga falha da conquista para o fluxo de rascunho de gasto.

### 5. Estados da interface

Loading com spinner centralizado; empty state com CTA; itens expirados com destaque âmbar e ações Renovar/Remover; alerta no mês do prazo para `active`. Sem estado de erro dedicado na seção (apenas toast).

### 6. Consistência da experiência

Layout `variant="embedded"`, `SectionTotalsHeader` com `secondaryMetric`, expandir/recolher e ordenação seguem padrão de Entradas/Investimentos. Dialog de conquista bem diferenciado dos demais módulos (esperado pelo domínio).

### 7. Persistência e dados

1 registro por desejo; visibilidade calculada no cliente. Auto-expiração em lote no load do mês. Estado local atualizado após mutações bem-sucedidas. Sem vínculo persistido entre desejo conquistado e gasto criado.

### 8. Código e implementação

Camadas separadas (UI → hook → service → adapter). Adaptador Supabase registrado. Ordenação aplicada duas vezes (hook + seção) quando opção é `urgency` — redundante, sem impacto funcional.

### 9. Casos de borda

Edição com prazo entre `startMonth` e `currentMonth` bloqueada indevidamente. Conquista com falha de rede ainda pode abrir rascunho de gasto. Usuário pode fechar dialog de gasto após conquista sem criar lançamento. Renovação não limpa `conquered_month` (campo normalmente nulo em `expired`).

### 10. Segurança funcional

Queries filtram por `user_id`; RLS na migration restringe CRUD ao `auth.uid()`. Sem exposição de dados de outros usuários no código analisado.

---

## Achados

### Conquista com gasto prossegue mesmo se a API falhar

**Severidade:** Alto

**Módulo:** Lista de Desejos (integração com Gastos)

**Fluxo afetado:** Conquistar desejo → “Sim, incluir gasto”

**Evidência:**

Arquivos:
- `frontend/src/pages/Index.tsx` (L127–140)
- `frontend/src/hooks/useWishItems.ts` (L111–128)

```typescript
// Index.tsx — não verifica retorno de conquerWish
await conquerWish(wish.id, currentMonth);
if (options.createExpense) {
  setExpenseDraft({ ... });
  setRecordsTab('expense');
}
```

`conquerWish` retorna `null` em erro (toast já exibido no hook).

**Comportamento atual:** Se a atualização no Supabase falhar, o usuário ainda é levado à aba Gastos com formulário pré-preenchido, enquanto o desejo permanece `active` na lista.

**Comportamento esperado:** Só trocar de aba e criar `expenseDraft` quando `conquerWish` retornar sucesso.

**Impacto:** Inconsistência entre UI e banco; usuário pode registrar gasto duplicado ou associado a desejo ainda ativo; confusão sobre estado real do item.

**Recomendação:** Guardar o resultado de `conquerWish` e executar `setExpenseDraft` / `setRecordsTab` apenas se não for `null`.

---

### Validação silenciosa no formulário de criação/edição

**Severidade:** Médio

**Módulo:** Lista de Desejos

**Fluxo afetado:** Criar ou editar desejo

**Evidência:**

Arquivo: `frontend/src/components/WishSection.tsx` (L367–371, L487–489)

```typescript
if (!trimmed || parsedValue <= 0) return;
if (compareYearMonth(targetMonth, currentMonth) < 0) return;
// ...
disabled={saving || !description.trim()}
```

**Comportamento atual:** Valor ≤ 0 ou prazo inválido impedem submissão sem mensagem; botão habilita com descrição preenchida mesmo com valor zero.

**Comportamento esperado:** Feedback inline ou toast (“Informe um valor maior que zero”, “Prazo inválido”), e/ou desabilitar submit quando valor for inválido.

**Impacto:** Usuário clica em “Adicionar Desejo” sem efeito aparente; retrabalho e sensação de bug.

**Recomendação:** Alinhar critérios de `disabled` do botão com as validações de `handleSubmit` e exibir mensagem ao bloquear envio.

---

### Regra de prazo na edição diverge da documentação

**Severidade:** Médio

**Módulo:** Lista de Desejos

**Fluxo afetado:** Editar prazo de desejo existente

**Evidência:**

Arquivos:
- `frontend/src/components/WishSection.tsx` (L371, L484)
- `docs/ANALISE_FRONTEND_QA.md` (L589): “`MonthPicker` com `min = startMonth` na edição”

`MonthPicker` usa `min={editingWish ? editingWish.startMonth : currentMonth}`, mas `handleSubmit` exige `targetMonth >= currentMonth` também na edição.

**Comportamento atual:** Usuário pode selecionar no picker um mês entre `startMonth` e `currentMonth`, porém o submit falha silenciosamente.

**Comportamento esperado:** Na edição, validar apenas `targetMonth >= startMonth`; na criação, `targetMonth >= currentMonth`.

**Impacto:** Impossível ajustar prazo conforme regra documentada em cenários de edição tardia; inconsistência picker vs submit.

**Recomendação:** Separar validação de criação e edição em `handleSubmit`.

---

### `linked_expense_id` nunca preenchido na conquista com gasto

**Severidade:** Médio

**Módulo:** Lista de Desejos

**Fluxo afetado:** Conquistar + incluir gasto

**Evidência:**

Arquivos:
- `supabase/migrations/create_wish_items.sql` (L14)
- `frontend/src/services/adapters/supabase/wishItems.ts` (L63)
- `frontend/src/pages/Index.tsx` (L131–137) — apenas `expenseDraft` parcial
- `docs/ANALISE_FRONTEND_QA.md` (L601): campo existe mas não é preenchido

**Comportamento atual:** Gasto é rascunho manual; nenhum UPDATE em `wish_items.linked_expense_id` após criar o gasto.

**Comportamento esperado:** Se o produto exige rastreabilidade, vincular o ID do gasto criado ao desejo conquistado (ou remover o campo do schema se for definitivamente fora de escopo).

**Impacto:** Perda de vínculo desejo↔gasto para auditoria e relatórios futuros; schema sugere intenção não implementada.

**Recomendação:** Definir com PO se o vínculo é requisito; se sim, atualizar desejo após `addExpense` bem-sucedido; se não, documentar explicitamente no schema/README.

---

### Expiração automática sem feedback ao usuário

**Severidade:** Médio

**Módulo:** Lista de Desejos

**Fluxo afetado:** Navegar para mês posterior ao prazo

**Evidência:**

Arquivo: `frontend/src/hooks/useWishItems.ts` (L31–38)

Batch `expireWishItems` executado no load sem toast ou indicador.

**Comportamento atual:** Desejos somem da lista ao mudar de mês; usuário só vê expirados ao voltar ao mês do prazo (`targetMonth`).

**Comportamento esperado:** Toast informativo (“X desejos expiraram”) ou badge na aba Desejos quando houver itens expirados aguardando renovação em outro mês.

**Impacto:** Usuário pode não perceber que desejos expiraram e não renovar; expectativa de item “perdido”.

**Recomendação:** Feedback discreto após `expireWishItems` ou contador de expirados pendentes de revisão.

---

### Conquista irreversível antes da confirmação do gasto

**Severidade:** Médio

**Módulo:** Lista de Desejos (integração com Gastos)

**Fluxo afetado:** Conquistar → “Sim, incluir gasto” → fechar dialog de gasto sem salvar

**Evidência:**

Arquivos:
- `frontend/src/pages/Index.tsx` — conquista antes do rascunho
- `frontend/src/components/ExpenseSection.tsx` (L917–922) — `onExpenseDraftConsumed` ao fechar dialog

**Comportamento atual:** Desejo já está `conquered` e some da lista; gasto pode nunca ser criado.

**Comportamento esperado (produto):** Ou adiar conquista até salvar o gasto, ou avisar que o desejo já foi marcado conquistado ao cancelar o gasto.

**Impacto:** Planejamento vs realização desalinhados; usuário precisa criar gasto manualmente sem ligação ao desejo.

**Recomendação:** Alinhar com PO: fluxo em duas etapas (criar gasto primeiro) ou mensagem de confirmação ao cancelar o dialog de gasto pós-conquista.

---

### Ordenação duplicada no hook e na seção

**Severidade:** Baixo

**Módulo:** Lista de Desejos

**Fluxo afetado:** Exibição da lista com ordenação padrão

**Evidência:**

Arquivos:
- `frontend/src/hooks/useWishItems.ts` (L55–57) — `sortWishes(filterWishesForMonth(...))`
- `frontend/src/components/WishSection.tsx` (L297–299) — `sortWishesByOption(wishes, sortOption)`

**Comportamento atual:** Lista ordenada duas vezes quando `sortOption === 'urgency'`.

**Comportamento esperado:** Ordenar em um único lugar (preferencialmente na seção, que controla a opção do usuário).

**Impacto:** Custo computacional irrelevante; leve complexidade de manutenção.

**Recomendação:** Passar `visibleWishes` já filtrados sem sort do hook, ou remover re-sort na seção quando a opção for a padrão.

---

### Spinner em toda troca de mês

**Severidade:** Baixo

**Módulo:** Lista de Desejos

**Fluxo afetado:** Navegação entre meses na aba Desejos

**Evidência:**

Arquivo: `frontend/src/hooks/useWishItems.ts` (L29, L412–417 em `WishSection`)

`setLoading(true)` a cada `loadWishes` disparado por mudança de `currentMonth`.

**Comportamento atual:** Seção inteira substituída por spinner a cada navegação de mês.

**Comportamento esperado:** Manter lista anterior com indicador sutil ou skeleton, como em outros módulos se aplicável.

**Impacto:** Flash visual; experiência menos fluida em navegação rápida.

**Recomendação:** Loading inicial vs refetch em background (padrão stale-while-revalidate).

---

## Itens sem achado

- Regras `isWishVisibleInMonth`, `shouldAutoExpireWish`, `isWishExpiringInMonth`
- Testes unitários em `wishItems.test.ts`
- CRUD Supabase com filtro `user_id` e políticas RLS na migration
- Conquista sem gasto (toast, remoção da lista)
- Renovação com `MonthPicker` `min={currentMonth}`
- Empty state com CTA “Adicionar primeiro desejo”
- Expandir/recolher lista (> 10 itens)
- Integração FAB → aba Desejos (`Index.tsx` L74)
- Cabeçalho `SectionTotalsHeader` com total planejado e contagem
- Desejos ausentes do resumo mensal e da regra financeira
- Destaque âmbar no mês do prazo para itens `active`
- Ações Renovar/Remover em itens `expired` (sem checkbox de conquista)

---

## Riscos residuais (não verificáveis estaticamente)

- Comportamento real das políticas RLS no Supabase (INSERT/UPDATE/DELETE entre sessões)
- Performance com muitos desejos (lista carrega todos por `user_id` sem paginação)
- Acessibilidade do checkbox de conquista e dialogs em leitores de tela
- Modo API (`adapters/api/wishItems.ts`) não exercido em produção atual
- Concorrência: duas abas abertas expirando/conquistando o mesmo desejo

---

## Referências cruzadas

- [05-gastos.md](./05-gastos.md) — consumo de `expenseDraft`, dialog de adição
- [02-dashboard.md](./02-dashboard.md) — FAB e `addDialogType`
- [12-shell.md](./12-shell.md) — navegação de mês
- [99-transversal.md](./99-transversal.md) — consistência de fluxos entre módulos

---

## Revalidação (2026-06-17)

| Campo | Valor |
|-------|-------|
| **Tipo** | Revalidação pós-correção |
| **Referência dev** | [relatorio-correcoes-qa.md](../../DEV/relatorio-correcoes-qa.md) — seção Lista de Desejos |
| **Metodologia** | Auditoria estática + `npm run build` (sucesso) |
| **Veredito** | **Aprovado** — achado Alto e 5 Médios originais corrigidos; 2 Baixos corrigidos; 1 Médio residual novo |

### Status dos achados originais

| # | Achado | Sev. original | Status | Evidência da correção |
|---|--------|---------------|--------|------------------------|
| 1 | Conquista com gasto prossegue se API falhar | Alto | **Corrigido** | `Index.tsx` L129–145: fluxo em duas etapas; `createExpense` não chama `conquerWish` imediatamente |
| 2 | Validação silenciosa no formulário | Médio | **Corrigido** | `WishSection.tsx` L282–290, L386–397, L493–539: erros inline + `isFormValid` no botão |
| 3 | Regra de prazo na edição diverge | Médio | **Corrigido** | `minTargetMonth = editingWish ? startMonth : currentMonth` (L286, L394) |
| 4 | `linked_expense_id` nunca preenchido | Médio | **Corrigido** | `handleAddExpense` L152–157 passa `created.id` a `conquerWish`; adapter L63 |
| 5 | Expiração automática sem feedback | Médio | **Corrigido** | `useWishItems.ts` L48–52: `toast.info` após batch expire |
| 6 | Conquista irreversível antes do gasto | Médio | **Corrigido** | Conquista adiada; `handleExpenseDraftConsumed` L172–177 informa cancelamento |
| 7 | Ordenação duplicada hook + seção | Baixo | **Corrigido** | Hook L72–74: só `filterWishesForMonth`; sort em `WishSection` |
| 8 | Spinner em toda troca de mês | Baixo | **Corrigido** | `hasLoadedRef` + `isRefetching` (L20–37, L440–458) |

### Novo achado (pós-correção)

#### `pendingWishConquer` persiste ao trocar de aba sem fechar o dialog de gasto

**Severidade:** Médio

**Fluxo afetado:** Conquistar → “Sim, incluir gasto” → trocar aba (ex.: Desejos) sem salvar nem cancelar explicitamente o dialog

**Evidência:**

- `Index.tsx` L45, L131–132 — `pendingWishConquer` definido ao escolher incluir gasto
- `MonthRecordsSection.tsx` L212–250 — `ExpenseSection` desmonta quando `activeTab !== 'expense'`
- `ExpenseSection.tsx` — `onExpenseDraftConsumed` só é chamado em `clearAddDialogState` (fechar dialog), sem cleanup no unmount

**Comportamento atual:** Ao sair da aba Gastos com o dialog aberto, `pendingWishConquer` e `expenseDraft` permanecem em `Index`. Um gasto criado posteriormente (mesmo sem relação com o desejo) dispara conquista via `handleAddExpense` L152–164.

**Comportamento esperado:** Limpar `pendingWishConquer` ao desmontar a seção de gastos ou ao trocar de aba, com o mesmo toast de cancelamento já usado em `handleExpenseDraftConsumed`.

**Impacto:** Conquista acidental de desejo vinculada a gasto não relacionado.

**Recomendação:** `useEffect` de cleanup em `ExpenseSection` ou listener de `activeTab` em `Index` que chame `handleExpenseDraftConsumed` quando a aba Gastos perder foco com pendência ativa.

### Riscos residuais aceitáveis

| Item | Severidade | Nota |
|------|------------|------|
| Gasto salvo, conquista falha | Baixo | Toast explícito em `handleAddExpense` L159–161; gasto permanece sem vínculo |
| Texto do dialog de conquista | Baixo | Ainda diz “será removido” antes de salvar o gasto no fluxo “Sim, incluir gasto” |
| `handleRenew` sem feedback inline | Baixo | `MonthPicker` `min={currentMonth}` impede seleção inválida na UI |
| `renewWish` não limpa `conqueredMonth` | Baixo | Irrelevante para fluxo `expired` normal |

### Mapa de fluxos — pós-revalidação

| # | Fluxo / Checklist | Status |
|---|-------------------|--------|
| 1–2 | Criar / validar formulário | OK |
| 3–5 | Prazo, visibilidade | OK |
| 6 | Editar prazo | OK |
| 7 | Ordenação | OK |
| 8–10 | Conquistar (com e sem gasto) | OK com ressalva (aba switch) |
| 11 | Expiração automática | OK |
| 12–18 | Expirado, renovar, excluir, FAB, saldo | OK |

### Contagem pós-revalidação

| Severidade | Antes | Depois |
|------------|-------|--------|
| Crítico | 0 | 0 |
| Alto | 1 | 0 |
| Médio | 5 | 1 |
| Baixo | 2 | 2 (residual) |

