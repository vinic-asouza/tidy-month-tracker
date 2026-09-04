---
type: modulo
nome: Gastos
status: Ativo
versao: "1.4"
owner: Development
ultima_atualizacao: 2026-09-04
tags: [gastos, expenses, frontend, supabase, csv]
dependencias: [autenticacao]
---

# Módulo — Gastos

Documento-base em `knowledge/04_modulos/gastos.md`. Atualize quando tipos, parcelas, efetivação não-cartão, vínculo por nome do cartão, categorias, **troca de tipo na edição** ou **importação CSV assistida** mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/gastos.md`](../02_regras-de-negocio/regras-por-modulo/gastos.md). Cartão (fatura): [`../02_regras-de-negocio/regras-por-modulo/cartoes.md`](../02_regras-de-negocio/regras-por-modulo/cartoes.md). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Persistência: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md).

---

## Overview

Registra **despesas do mês** (fixo, variável, parcelado), marca as não-cartão como pagas e alimenta a fatura quando a forma de pagamento é o **nome** de um cartão. Sem este módulo o resumo não tem lado “saiu”.

**Responsabilidade única:** persistir e editar linhas na tabela `expenses` (incluindo categorias em `finance_settings.expense_categories`) e o fluxo de efetivação `paid` + carteira **só quando o gasto não é de cartão**. Inclui o wizard de **importação CSV assistida** (parse no browser; gravação só após confirmação).

**Propósito no produto:** a pessoa planeja o que deve sair e confirma o caixa no débito em conta — no cartão, o caixa espera a fatura (RN-G02, RN-X04). A CSV assistida reduz atrito de volume **com** revisão humana (CSV-01…CSV-06). Trocar o tipo na edição sem perder os campos já preenchidos evita retrabalho no ritual de registro (RN-X07).

---

## Bounded context

### O que este módulo FAZ

- CRUD de gastos do mês autenticado (`type`, `category`, `description`, `paymentMethod`, `value`, `date`)
- Três tipos: `fixed`, `variable`, `installment` (RN-X01)
- Nascer `paid = false` e sem carteira; categoria, forma de pagamento, descrição e valor `> 0` obrigatórios (RN-X02)
- Não-cartão: marcar pago abre `EffectuateWalletDialog` (movimentação ou Saldo Livre); desmarcar zera `account_id` (RN-X03)
- Cartão: sem toggle de pago no item; status visual e caixa efetivado vêm da fatura (`credit_card_monthly_status`); match por `paymentMethod === creditCard.name` (RN-X04)
- Parcelas: gera o restante da série (`installments.ts`), **pode cruzar o ano**; excluir “este mês” deixa buraco; excluir “todas” pela série `base_expense_id` (RN-X05)
- Fixo com `repeatAllMonths`: mesmos 11 meses do ano civil que entradas (RN-G05); carteira **não** se copia
- CRUD de categorias; renomear propaga em **todas** as `expenses` do usuário; excluir bloqueado se a categoria estiver em uso **no mês aberto** (RN-X06; lacuna vs RN-G06)
- **Troca de tipo** no formulário (criar/editar): um único form por `activeTab` preserva campos comuns; no update, `type` muda só no registro aberto, com unlink/promote de série e geração de nova série se aplicável (RN-X07)
- Aceitar rascunho de gasto vindo da conquista de desejo (o desejo só fecha **depois** do INSERT)
- **Importar CSV** (CTA em Gastos): origem conta | cartão → mapear colunas (incl. Parcela opcional) → revisar ações/match + evidência de parcela → importar lote com falha parcial (CSV-01…CSV-06)

### O que este módulo NÃO FAZ

- Totais do mês / gráfico anual ([`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) lê `expenses` e `isExpenseEffectivelyPaid`)
- Cadastro de cartão, pagar/desmarcar fatura, alerta de vencimento ([`cartoes.md`](./cartoes.md) — a linha no gasto só **abre** o detalhe da fatura)
- CRUD de métodos de pagamento customizados (política D8: lista `DEFAULT_PAYMENT_METHODS` + nomes dos cartões)
- Mapear categoria na regra 50/30/20 ([`regra-financeira.md`](./regra-financeira.md) — rename de categoria **não** atualiza as chaves do mapping)
- CRUD de entradas ([`entradas.md`](./entradas.md)), aportes ([`investimentos.md`](./investimentos.md)), carteiras ([`carteiras.md`](./carteiras.md)) ou desejos ([`desejos.md`](./desejos.md) — este módulo só recebe o rascunho da conquista)
- Seleção múltipla / barra inferior ([`selecao.md`](./selecao.md); a seção só encaminha `selectedIds`)
- Reordenar `display_order` na UI (`reorderExpenses` existe; nenhum componente chama)
- Open Finance, OFX, presets de banco, inbox persistente, upload do CSV ao Storage, importação de entradas/aportes

---

## Estrutura de arquivos

```text
frontend/src/
  components/ExpenseSection.tsx                # lista por tipo, form, categorias, toggle pago, CTA Importar CSV
  components/ImportExpensesCsvDialog.tsx       # wizard Origem → Colunas → Revisão → Resultado
  components/MonthRecordsSection.tsx           # aba Gastos; passa currentMonth ao dialog
  components/InvoiceExpensesTable.tsx          # tabela da fatura (só leitura deste módulo)
  components/EffectuateWalletDialog.tsx        # carteira na efetivação (compartilhado)
  hooks/useSupabaseFinance.ts                  # add/update/deleteExpense (+ yearMonth override), categorias
  services/expenses.ts                         # facade
  services/adapters/supabase/expenses.ts       # PostgREST + série fixa/parcelada
  services/adapters/api/expenses.ts            # Express (não é produção)
  services/adapters/supabase/settings.ts       # expense_categories + rename em expenses
  types/domain.ts                              # Expense
  types/finance.ts                             # DEFAULT_EXPENSE_CATEGORIES, DEFAULT_PAYMENT_METHODS
  utils/business/installments.ts               # calculateRemainingInstallments
  utils/business/remainingMonths.ts            # calculateRemainingMonths (fixo)
  utils/business/seriesUpdates.ts              # omitPerMonthFields
  utils/business/creditCards.ts                # isCreditCardExpense (match por nome)
  utils/business/monthTotals.ts                # isExpenseEffectivelyPaid (caixa)
  utils/business/csvParse.ts                   # parse CSV (;/, aspas, BOM)
  utils/business/csvNormalize.ts               # data BR/ISO, money, rebase mês
  utils/business/installmentDetect.ts          # N/M, Nx, Única/À vista; resolveInstallmentFromCsv
  utils/business/expenseMatch.ts               # score fixo/parcela + sugestão de ação
  utils/business/csvImportBuild.ts             # monta linhas de revisão
  utils/business/__tests__/csvImport.test.ts   # Vitest parse/normalize/match/parcela
```

| Arquivo | Descrição |
| --- | --- |
| `ExpenseSection.tsx` | Validação no cliente; esconde toggle pago no cartão; categorias; dialog série/parcelas; abre CSV; form único por aba de tipo (preserva campos — RN-X07) |
| `ImportExpensesCsvDialog.tsx` | Wizard; badge N/total; aviso se override após detecção; `create`/`update` via props |
| `expenses.ts` (supabase) | INSERT/UPDATE/DELETE; clones fixos no ano; clones de parcela; `ensureRemainingInstallmentsExist`; **type change** com unlink/promote + generate |
| `useSupabaseFinance.ts` | Optimistic update; gasto no cartão **zera** `accountId` no sanitize; `addExpense(..., yearMonth?)`; refresh multi-mês após type change com série |
| `csv*.ts` / `expenseMatch` / `installmentDetect` | Pipeline puro no browser; coluna `installment`; sem papaparse no MVP |

Backend `backend/src/routes/expenses.ts` + Zod existe no monorepo; **produção não usa**.

---

## Entidades e models

### Tabela: `expenses`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `user_id` | UUID | Sim | `auth.users`; RLS |
| `year_month` | TEXT | Sim | `YYYY-MM` do lançamento |
| `type` | TEXT | Sim | CHECK `fixed` \| `variable` \| `installment` |
| `category` | TEXT | Sim | Alinhado a `expense_categories` |
| `description` | TEXT | Sim | |
| `payment_method` | TEXT | Sim | `DEFAULT_PAYMENT_METHODS` **ou** `credit_cards.name` |
| `value` | DECIMAL(15,2) | Sim | UI exige `> 0`; sem CHECK no banco |
| `paid` | BOOLEAN | Sim | Default `false`. No cartão **não** decide o caixa |
| `date` | TEXT | Não (setup antigo); insert atual preenche | `YYYY-MM-DD` |
| `repeat_all_months` | BOOLEAN | Sim | Só faz sentido em `fixed` |
| `base_expense_id` | UUID | Não | Pai da série/parcelas; `ON DELETE CASCADE` |
| `current_installment` / `total_installments` | INTEGER | Parcelado | 1-based; `current <= total` na validação JS |
| `display_order` | INTEGER | Sim | Default 0; sem UI de reorder |
| `account_id` | UUID | Não | Só não-cartão na efetivação; `ON DELETE SET NULL` |
| `created_at` / `updated_at` | timestamptz | Sim | Trigger de `updated_at` |

Índice: `payment_method` (migração) para lookup de fatura/rename de cartão. **Sem** colunas de import (`external_id` etc.) — CSV não persiste metadados do arquivo.

### Tabela: `finance_settings` (recorte)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `expense_categories` | TEXT[] | Seed `DEFAULT_EXPENSE_CATEGORIES` no signup |
| `payment_methods` | TEXT[] | Seed `DEFAULT_PAYMENT_METHODS`; **sem CRUD** na UI de gastos |

### Contrato TypeScript (`Expense`)

```ts
interface Expense {
  id: string;
  type: 'fixed' | 'variable' | 'installment';
  category: string;
  description: string;
  paymentMethod: string;
  value: number;
  paid: boolean;
  date?: string | null;
  repeatAllMonths?: boolean;
  baseExpenseId?: string;
  currentInstallment?: number;
  totalInstallments?: number;
  accountId?: string;
  createdAt?: string;
}
```

`CreateExpenseParams` = `Expense` sem `id` + `userId?`, `yearMonth`, `displayOrder?`.

### Enums / constantes

| Nome | Valores |
| --- | --- |
| `type` | `fixed` (Fixo), `variable` (Variável), `installment` (Parcelado) |
| `DEFAULT_PAYMENT_METHODS` | Dinheiro, Pix, Débito, Boleto |
| `DEFAULT_EXPENSE_CATEGORIES` | Moradia, Contas pessoais, Compras Gerais, Vestuário, Assinaturas, Trabalho, Serviços Gerais, Mercado, Lanches, Combustível, Transporte, Carro, Presentes, Lazer, Estilo de Vida, Consultas Médicas, Suplementação, Remédios, Educação, Viagem, Empréstimos, Doação, Taxas |
| Efetivação (UI) | `accountId` UUID **ou** `null` (Saldo Livre). Sentinel: `EFFECTUATE_WALLET_FREE` no `localStorage` (`effectuateWallet:expense`) |
| Ações CSV (sugestão) | `create_variable` \| `create_installment` \| `create_fixed` \| `link_existing` \| `ignore` \| `review` |

`isCreditCardExpense`: `creditCards.some(c => c.name === expense.paymentMethod)`.

`isExpenseEffectivelyPaid` (caixa, módulo resumo): se casa com cartão **e** há `cardMonthlyStatuses`, usa o status da fatura; senão usa `expense.paid`.

---

## Interface pública

Não há REST de produção. Produção = facade + hook + PostgREST.

| Operação | Onde | Auth | Input | Efeito |
| --- | --- | --- | --- | --- |
| Listar mês | `getExpenses(userId, yearMonth)` | JWT + RLS | `YYYY-MM` | `Expense[]` (`display_order`) |
| Criar | `createExpense` | idem | payload | INSERT da **linha criada:** `paid` do payload (default false) e `account_id` = `accountId ?? null`. Clones de `fixed`+repeat (outros 11 meses do **mesmo ano**) e parcelas seguintes (**podem ser outro ano**): `paid: false`, `account_id: null`. Falha nos clones faz rollback da série |
| Atualizar | `updateExpense` | idem | `updates`, `applyToAllMonths?` | Ver série abaixo |
| Excluir um / seguintes (fixo) | `deleteExpense` | idem | `applyToAllMonths?` | Um id; se fixo + all, série com `year_month >=` atual. **Parcelado + all neste método não apaga a série** |
| Excluir todas as parcelas | `deleteInstallmentExpense` | idem | `Expense` | Todos os ids `id = base` ou `base_expense_id = base` |
| Categorias | `updateExpenseCategories` / `updateExpenseCategoryInExpenses` | idem | lista / old→new | Settings + `UPDATE expenses SET category` de todo o user |
| Reorder | `reorderExpenses` | idem | lista do mês | Só serviço |
| Import CSV (UI) | `ImportExpensesCsvDialog` → `addExpense` / `updateExpense` | idem | lote revisado | Por linha: create ou update; concurrency ~5; `yearMonth` pode diferir do mês aberto |

**Update em lote (`applyToAllMonths`):**

- `fixed`: ids da série com `year_month >=` mês da linha; `omitPerMonthFields` (não propaga `paid` / `account_id`)
- `installment`: **todas** as linhas da série (sem filtro de mês); `paid`/`account_id` omitidos; mudança de `current`/`total` só na linha editada, depois `ensureRemainingInstallmentsExist` preenche buracos
- `variable`: só o id (o lote cai no mesmo `omit` de um registro)

Ligar `repeatAllMonths` num fixo que não é cópia: insere os outros meses do ano (`paid: false`, `account_id: null`). Desligar: apaga `base_expense_id = id`.

**Sanitização no hook:** se `isCreditCardExpense`, `accountId` é forçado `undefined` no create/update.

**Create + carteira:** a linha criada persiste a carteira informada (`accountId` UUID ou `null` = Saldo Livre). Conquista de desejo “já pago” e create avulso já pago usam o mesmo INSERT. Clones da série **não** recebem carteira. Gasto avulso não-cartão no ritual padrão ainda nasce não pago (RN-X02) e vincula carteira no `updateExpense` da efetivação (RN-X03). Express (`backend`) continua omitindo `account_id` no create — fora de produção ([ADR-001](../07_decisoes-tecnicas/ADR-001-spa-supabase-producao.md)).

### Validação no cliente (`ExpenseSection`)

- Categoria, descrição, forma de pagamento obrigatórios
- Valor `> 0`
- Sem Zod neste form

### UI / rotas

Mesma rota autenticada `/`. Aba `activeTab = 'expense'` (rótulo **Gastos**). Sem URL própria.

| Superfície | Componente | Observação |
| --- | --- | --- |
| `/` · aba Gastos | `ExpenseSection` | Form; lista agrupada fixo / variável / parcelado; visão resumo por categoria; CTA **Importar CSV** |
| Import CSV | `ImportExpensesCsvDialog` | 4 steps; copy “nada é gravado até confirmar” |
| Toggle pago (não-cartão) | `EffectuateWalletDialog` `kind="expense"` | Só movimentação ou Saldo Livre |
| Toggle no cartão | Badge 60% opacity | Não chama `updateExpense.paid`; clique abre detalhe da fatura (módulo cartões) |
| Dialog série | `ApplyToAllDialog` | Fixo: este mês vs seguintes. Parcelado: este registro vs **todas** as parcelas (`deleteInstallmentExpense`) |
| Fatura (leitura) | `InvoiceExpensesTable` | Gastos daquele `paymentMethod` no mês |

Conquista de desejo: `Index` monta `expenseDraft` e só chama `conquerWish(..., created.id)` depois do INSERT. Cancelar o form cancela a pendência (RN-D06). Gasto no cartão no fluxo desejo nasce `paid = false`; não-cartão nasce `paid = true` no form.

### Erros comuns (toasts)

| Situação | Mensagem |
| --- | --- |
| Falha create | Erro ao adicionar gasto |
| Falha update | Erro ao atualizar gasto |
| Falha delete | Erro ao excluir gasto |
| Categoria em uso no mês (UI) | Não é possível excluir: existem gastos usando esta categoria |
| CSV mapeamento incompleto | Mapeie as colunas Data, Valor e Descrição |
| CSV mês divergente pendente | Resolva o mês das linhas divergentes antes de importar |
| CSV sem linhas elegíveis | Nenhuma linha elegível selecionada |

---

## Fluxo — Importação CSV assistida

1. CTA **Importar CSV** → escolhe origem (conta | cartão da lista).
2. File API local → `parseCsvText` → mapeamento coluna → campos Finto (guess: Data/Valor/Descrição/`title`→Descrição/`Parcela`; Valor R$ priorizado vs US$).
3. `buildReviewRows`: normaliza valor/data; créditos inelegíveis; `resolveInstallmentFromCsv` (coluna Parcela preferencial) + `suggestImportAction` (nunca auto-aplica vínculo).
4. Revisão: badge `N/total` e campos de parcela quando detectado; default **Novo parcelado** se CSV-06; override por linha (aviso se mudar a ação); mês divergente → pending até escolha CSV ou mês UI; Revisar fora do lote.
5. **Importar selecionados:** por linha create (variável/parcelado/fixo) ou update (associar); cartão força `paid=false`; efetivar só conta com carteira/Saldo Livre; relatório ok/fail/ignored.

Limitações MVP: match de séries só no mês carregado; sem virtualização da grade; parser próprio (sem papaparse).

---

## Regras de negócio

Detalhe: [`../02_regras-de-negocio/regras-por-modulo/gastos.md`](../02_regras-de-negocio/regras-por-modulo/gastos.md). Gerais: RN-G01, RN-G02, RN-G04, RN-G05, RN-G06. Fatura: RN-C02–C04. Match por nome / CSV: [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md).

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-X01 | Três tipos; parcelado pode cruzar o ano | `Expense.type`; `calculateRemainingInstallments` |
| RN-X02 | Nasce não pago, sem carteira; campos obrigatórios; valor > 0 | Form padrão + `createExpense` (`paid \|\| false`; `account_id: accountId ?? null` na linha criada). Exceção de produto: conquista “já pago” envia `paid: true` e carteira no mesmo create |
| RN-X03 | Pago não-cartão → dialog carteira; desmarcar limpa vínculo | `handleTogglePaid` / `handleEffectuateConfirm` |
| RN-X04 | Cartão: sem checkbox de pago no item; caixa = fatura | UI `isExpenseLinkedToCard`; `isExpenseEffectivelyPaid` no resumo; origem CSV cartão |
| RN-X05 | Excluir este mês = um registro (buraco ok); todas = série | `deleteExpense(false)` vs `deleteInstallmentExpense` |
| RN-X06 | CRUD categorias; rename propaga | `updateExpenseCategory` no hook |
| RN-G05 | Fixo+repeat = outros 11 meses do **mesmo** ano civil | `calculateRemainingMonths` (não usa `installments.ts`) |
| RN-G06 | Não excluir categoria em uso em **qualquer** mês | **Parcial:** `handleDeleteCategory` só olha `expenses` do mês aberto |
| CSV-01…06 | Assistida; match só sugestão; associar não duplica; origem; mês divergente; evidência de parcela | `ImportExpensesCsvDialog` + `csvImportBuild` / `expenseMatch` / `installmentDetect` |

**Código vs RN-X05 na edição em lote de parcelas:** `applyToAllMonths` no parcelado atualiza a **série inteira**, não só `year_month >=` atual (diferente do fixo).

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — `user.id`; RLS
- [`cartoes.md`](./cartoes.md) — nomes para match; `cardMonthlyStatuses` / dialog de fatura; origem CSV por cartão
- [`carteiras.md`](./carteiras.md) — dialog de efetivação; Saldo Livre (também no CSV conta)
- [`desejos.md`](./desejos.md) — rascunho + `linked_expense_id` depois do create
- [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — **não** é dependência de escrita; consome `expenses`

### Serviços / integrações externas

- Supabase PostgREST (`expenses`, `finance_settings`): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)
- CSV: **não** sobe ao Storage; só File API no browser

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `@tanstack/react-query` | Cache do bundle do mês |
| `sonner` | Toasts de erro / categoria em uso / import |
| `localStorage` `effectuateWallet:expense` | Última carteira (ou livre) na efetivação |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| Mutação `expenses` | CRUD / efetivar / import CSV | Bundle do mês (+ meses da série/parcelas) | Resumo, regra, fatura, chips de carteira |
| `scheduleSyncInvoicePayments` | após create/update/delete | Reconsilia operação `invoice_payment` se a fatura já estava paga | Módulo cartões / carteiras |
| INSERT gasto de desejo | conquista com “registrar gasto” | `linked_expense_id` no desejo | [`desejos.md`](./desejos.md) |
| N/A | — | Sem webhooks/jobs no app | — |

---

## Configurações

Nenhuma env exclusiva. Mesmo `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`. [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md).

| Chave | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `effectuateWallet:expense` | `localStorage` | Não | UUID da carteira ou `__free__` |
| `VITE_DATA_PROVIDER` | string | Não | Só muda o adapter |

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos de teste deste módulo | `installments.test.ts`; `csvImport.test.ts` |
| Relacionados | `creditCards.test.ts` (`isCreditCardExpense`); `seriesUpdates.test.ts`; caixa em `monthTotals.test.ts` |
| UI / adapter `expenses` | Nenhum spec |
| Cobertura | Não inventar % |

**Casos cobertos hoje:**

- [x] Parcelas restantes e virada de ano (`2024-11` + 3 parcelas → `2025-01`)
- [x] `isValidInstallmentExpense` rejeita tipo errado / current > total / ausências
- [x] `isCreditCardExpense` casa pelo **nome**
- [x] `omitPerMonthFields` tira `paid` e `account_id` do lote
- [x] Parse CSV `;`/aspas; decimal BR; DD/MM sem ano; detect parcela; suggest link / installment / variável

**Casos críticos (não automatizados hoje):**

- [ ] Create recusa categoria/descrição/pagamento vazios e valor ≤ 0
- [ ] Fixo+repeat clona 11 meses do mesmo ano, todos `paid: false` e sem carteira
- [ ] Parcelado gera N−1 linhas, inclusive no ano seguinte
- [ ] Rollback se o insert das parcelas falhar
- [ ] Efetivar não-cartão pede carteira; cartão não chama `paid` no item
- [ ] Excluir uma parcela deixa buraco; “todas” apaga a série
- [ ] Create honra `accountId` na linha principal; clones sem carteira (sem spec de adapter; QA manual DEV-52)
- [ ] Excluir categoria usada em **outro** mês (RN-G06)
- [ ] Wizard CSV ponta a ponta (E2E) — QA manual / Gherkin DEV-103
- [ ] Troca de tipo na edição preserva campos; unlink só o aberto; generate fixo/parcelado (QA manual DEV-104)

**Como rodar:**

```bash
npm test --workspace=frontend
```

---

## Histórico de mudanças

| Data | Versão | Descrição | Issue ID | Autor |
| --- | --- | --- | --- | --- |
| 2026-08-23 | 1.0 | Bootstrap da KB a partir do código | — | Technical Writer |
| 2026-08-24 | 1.1 | Create persiste `account_id` na linha criada; clones seguem sem carteira | DEV-52 | Technical Writer |
| 2026-09-03 | 1.2 | Importação CSV assistida (wizard + utils + CSV-01…05) | DEV-103 | Technical Writer |
| 2026-09-04 | 1.3 | Troca de tipo na edição (preservar campos + unlink/generate — RN-X07) | DEV-104 | Technical Writer |
| 2026-09-04 | 1.4 | CSV-06: coluna Parcela + evidência N/total na revisão do import | DEV-105 | Technical Writer |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/gastos.md`
- Índice: [`index.md`](./index.md)
- Jornada importar CSV: [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md) (§9)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
