---
type: modulo
nome: Cartões
status: Ativo
versao: "1.0"
owner: Development
ultima_atualizacao: 2026-08-23
tags: [cartoes, fatura, frontend, supabase]
dependencias: [autenticacao, gastos]
---

# Módulo — Cartões

Documento-base em `knowledge/04_modulos/cartoes.md`. Atualize quando cadastro, fatura mensal, pagamento `invoice_payment` ou o match por **nome** mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/cartoes.md`](../02_regras-de-negocio/regras-por-modulo/cartoes.md). Match gasto↔cartão: [`../02_regras-de-negocio/politicas-e-restricoes.md`](../02_regras-de-negocio/politicas-e-restricoes.md). Gastos: [`gastos.md`](./gastos.md). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Persistência: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md). ADR do match por nome: [`../07_decisoes-tecnicas/ADR-005-cartao-por-nome.md`](../07_decisoes-tecnicas/ADR-005-cartao-por-nome.md).

---

## Overview

Cadastro de **cartões de crédito** (globais, não por mês) e o ciclo da **fatura do mês**: soma dos gastos daquele nome, marcar paga (um débito único) e desmarcar. Sem este módulo o caixa efetivado não sabe quando o cartão “fechou”.

**Responsabilidade única:** persistir `credit_cards` + `credit_card_monthly_status` e a operação `invoice_payment` do total da fatura.

**Propósito no produto:** o chip mostra o comprometido do mês; o resumo só conta esses gastos quando a fatura está paga (RN-C02 vs RN-G02).

---

## Bounded context

### O que este módulo FAZ

- CRUD de cartão: nome, cor (`CARD_COLORS`), `dueDay` e `creditLimit` opcionais (RN-C01)
- Recusar nome duplicado na UI (case-insensitive); no rename, o adapter também bloqueia nome exato já usado
- Excluir só se **nenhum** gasto (qualquer mês) tiver `payment_method` = nome do cartão (RN-C01)
- Renomear propaga `expenses.payment_method` old → new
- Chip / fatura = soma de **todos** os gastos com aquele nome no mês (RN-C02)
- Pagar fatura: carteira de **movimentação** ou Saldo Livre; um `invoice_payment` pelo total; `credit_card_monthly_status.paid = true` (RN-C03)
- Desmarcar: apaga o `invoice_payment` e volta `paid = false` (RN-C04)
- Alerta de vencimento só no **mês corrente**, fatura pendente, janela `CREDIT_CARD_DUE_ALERT_DAYS = 3` (RN-C05)
- % de uso do limite (fatura / limite); **não** bloqueia lançamento (`canAddExpenseToCreditCard` sempre `true`)
- Dialog da fatura: lista de gastos + resumo por categoria (leitura; gastos continuam no módulo gastos)
- Reconciliar valor do `invoice_payment` se a fatura **já paga** e os gastos mudarem (`syncInvoicePaymentsForMonth`)

### O que este módulo NÃO FAZ

- CRUD de linhas de gasto ([`gastos.md`](./gastos.md) — o match é só pelo nome)
- Totais do mês no resumo ([`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) usa `isExpenseEffectivelyPaid` + este status)
- CRUD de carteiras ([`carteiras.md`](./carteiras.md) — só consome a lista no dialog de pagamento)
- Métodos de pagamento além dos nomes de cartão (D8)
- Fatura que atravessa mês / ciclo de fechamento bancário: a fatura é o **mês de navegação** (`YYYY-MM`)
- Usar `credit_cards.paid` como status do mês (coluna legado; a UI lê `cardMonthlyStatuses`)
- Seleção múltipla / barra inferior ([`selecao.md`](./selecao.md) — este módulo só alimenta o critério do gasto no cartão via fatura paga)

---

## Estrutura de arquivos

```text
frontend/src/
  components/CreditCardStrip.tsx               # chips, form, sort, paga/desmarca
  components/CreditCardInvoiceDialog.tsx       # detalhe da fatura
  components/PayInvoiceDialog.tsx              # carteira + data
  components/UnpayInvoiceConfirmDialog.tsx
  components/InvoiceExpensesTable.tsx          # leitura (também usada em gastos)
  components/InvoiceCategorySummaryTable.tsx
  components/MonthRecordsSection.tsx           # strip na aba Gastos
  hooks/useSupabaseFinance.ts                  # CRUD + pay/unpay + sync
  services/creditCards.ts                      # facade
  services/adapters/supabase/creditCards.ts
  services/adapters/api/creditCards.ts         # Express (não é produção)
  types/domain.ts                              # CreditCard, CreditCardMonthlyStatus
  types/finance.ts                             # CARD_COLORS
  utils/business/creditCards.ts                # fatura, alerta, %
  utils/business/__tests__/creditCards.test.ts
  utils/__tests__/payInvoiceDefaults.test.ts
```

| Arquivo | Descrição |
| --- | --- |
| `CreditCardStrip.tsx` | Cadastro, chips, alerta, abre fatura / pagar / desmarcar |
| `creditCards.ts` (supabase) | INSERT/UPDATE/DELETE; rename propaga gastos; `canDeleteCreditCard` conta `expenses` por nome |
| `useSupabaseFinance.ts` | `payCardInvoice` / `unpayCardInvoice`; `syncInvoicePaymentsForMonth` |
| `creditCards.ts` (utils) | Soma da fatura, alerta, % limite, `isCreditCardExpense` |

Backend `backend/src/routes/creditCards.ts` + Zod existe; **produção não usa**. O schema Express **não** inclui `dueDay`/`creditLimit`.

---

## Entidades e models

### Tabela: `credit_cards` (global por usuário)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `user_id` | UUID | Sim | RLS |
| `name` | TEXT | Sim | Forma de pagamento dos gastos. **Sem UNIQUE** no banco |
| `color` | TEXT | Sim | Id de `CARD_COLORS` |
| `paid` | BOOLEAN | Sim | Default false. **Legado** — não é o pago do mês |
| `due_day` | SMALLINT | Não | 1–31; dia 31 em fevereiro vira 28 (`getEffectiveDueDay`) |
| `credit_limit` | NUMERIC(12,2) | Não | `> 0` se preenchido |
| `display_order` | INTEGER | Sim | Default 0 |
| `created_at` / `updated_at` | timestamptz | Sim | |

### Tabela: `credit_card_monthly_status`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `user_id` | UUID | Sim | |
| `credit_card_id` | UUID | Sim | `ON DELETE CASCADE` |
| `year_month` | TEXT | Sim | `YYYY-MM` |
| `paid` | BOOLEAN | Sim | Fatura daquele mês |
| UNIQUE | `(user_id, credit_card_id, year_month)` | | Upsert no pagar |

Sem linha = fatura **não paga**.

### Operação: `account_operations` tipo `invoice_payment`

| Campo relevante | Descrição |
| --- | --- |
| `type` | `'invoice_payment'` |
| `credit_card_id` | Cartão; `ON DELETE CASCADE` |
| `source_account_id` | Carteira de movimentação ou `null` (Saldo Livre) |
| `amount` | Total da fatura na hora do pagamento (depois sincronizado) |
| `year_month` / `operation_date` | Mês da navegação / data escolhida no dialog |
| `description` | `Fatura {nome}` |
| UNIQUE parcial | `(user_id, credit_card_id, year_month)` WHERE `type = invoice_payment` |

Só é criada se `summary.total > 0`. Pagar fatura zerada só marca o status.

### Contrato TypeScript

```ts
interface CreditCard {
  id: string;
  name: string;
  color: string;
  paid: boolean; // legado da tabela; UI usa cardMonthlyStatuses[id]
  dueDay?: number | null;
  creditLimit?: number | null;
}

interface CreditCardMonthlyStatus {
  creditCardId: string;
  yearMonth: string;
  paid: boolean;
}
```

### Constantes

| Nome | Valor |
| --- | --- |
| `CREDIT_CARD_DUE_ALERT_DAYS` | `3` |
| `CARD_COLORS` | violet, orange, emerald, blue, pink, yellow, slate, cyan, red |
| `localStorage` | `invoicePaymentAccount:{cardId}` — última carteira (ou Saldo Livre) |

Alerta (`getCreditCardDueAlertContext`): `null` se sem `dueDay`, fatura paga, ou mês ≠ mês civil de `today`. Senão: `overdue` / `due_today` / `approaching` (diff ≤ 3).

---

## Interface pública

Não há REST de produção.

| Operação | Onde | Auth | Input | Efeito |
| --- | --- | --- | --- | --- |
| Listar cartões | `getCreditCards(userId)` | JWT + RLS | — | `CreditCard[]` (`display_order`) |
| Criar | `createCreditCard` | idem | name, color, dueDay?, creditLimit? | INSERT; `paid` da linha = false |
| Atualizar | `updateCreditCard` | idem | updates | Rename: bloqueia duplicata exata; `UPDATE expenses SET payment_method` |
| Excluir | `deleteCreditCard` | idem | id | DELETE (status mensal CASCADE). UI só chama se `canDeleteCreditCard` |
| Pode excluir? | `canDeleteCreditCard(name)` | idem | nome | `count(expenses where payment_method = name) === 0` **em todos os meses** |
| Status do mês | `getAllCardMonthlyStatuses` | idem | yearMonth + cards | `Record<cardId, boolean>` (default false) |
| Pagar | `payCardInvoice(cardId, accountId, date?)` | idem | carteira ou `null` | Upsert status true; create/update `invoice_payment` se total > 0 |
| Desmarcar | `unpayCardInvoice(cardId)` | idem | — | Delete `invoice_payment` do cartão/mês; status false |
| Total do chip | `getCreditCardTotal(name)` no hook | — | nome | Soma `expenses` do **mês aberto** |

`setCardPaidStatus(true)` = `payCardInvoice(id, null)` (Saldo Livre, sem dialog) — usado se não há carteiras.

### UI / rotas

Mesma `/`. Aba **Gastos** (`activeTab = 'expense'`). Sem URL própria.

| Superfície | Componente | Observação |
| --- | --- | --- |
| Faixa de chips | `CreditCardStrip` | Sort por vencimento no mês atual (`getDaysUntilDueForSort`) |
| Form cadastro | mesmo strip | Nome obrigatório; duplicata case-insensitive |
| Detalhe fatura | `CreditCardInvoiceDialog` | Gastos + categorias; checkbox pago dispara pagar/desmarcar |
| Pagar | `PayInvoiceDialog` | Movimentação ou Saldo Livre; data; persiste carteira |
| Desmarcar | `UnpayInvoiceConfirmDialog` | Confirma remoção do débito |

Toggle no item de gasto **não** paga a fatura ([`gastos.md`](./gastos.md)); o clique no cartão abre este detalhe.

### Validação no cliente

- Nome não vazio
- Nome único (ignore case) entre cartões carregados
- Limite / vencimento opcionais
- Sem Zod no SPA

### Erros comuns (toasts)

| Situação | Mensagem |
| --- | --- |
| Create | Erro ao adicionar cartão |
| Update | Mensagem do adapter (`Já existe um cartão com este nome`) ou genérica |
| Delete | Erro ao excluir cartão |
| Delete com gastos (UI) | Não é possível excluir o cartão "…" pois existem gastos vinculados… |
| Pagar | Erro ao registrar pagamento da fatura |
| Desmarcar | Erro ao desmarcar fatura |
| Sync pós-CRUD de gasto | Erro ao sincronizar pagamentos de fatura |

---

## Regras de negócio

Detalhe: [`../02_regras-de-negocio/regras-por-modulo/cartoes.md`](../02_regras-de-negocio/regras-por-modulo/cartoes.md). Caixa: `isExpenseEffectivelyPaid` em [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md).

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-C01 | Nome+cor; limite/vencimento opcionais; excluir só sem gastos em **qualquer** mês | Form + `canDeleteCreditCard` (query global em `expenses`) |
| RN-C02 | Chip = todos os gastos daquele nome no mês ≠ resumo efetivado | `getCreditCardInvoiceSummary` / `getCreditCardTotal` |
| RN-C03 | Um débito `invoice_payment` pelo total; efetiva gastos no caixa | `payCardInvoice` + `isExpenseEffectivelyPaid` |
| RN-C04 | Desmarcar reverte status e apaga a operação | `unpayCardInvoice` |
| RN-C05 | Alerta 3 dias; limite só % | `getCreditCardDueAlertContext`; `getCreditCardUsagePercent`; `canAddExpenseToCreditCard` → true |
| Política nome | Gasto casa por **nome**, não por id | `isCreditCardExpense`; dois cartões iguais colidem |

**Código vs intenção:** não há UNIQUE de nome no Postgres. A UI impede duplicata ignore-case; o adapter no rename compara **string exata**. `credit_cards.paid` não governa o mês.

**Sync:** se a fatura já está paga e o total dos gastos muda, o hook ajusta `amount` ou apaga a operação se total ≤ 0 — **não** desmarca `paid` sozinho.

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — `user.id`; RLS
- [`gastos.md`](./gastos.md) — linhas `expenses` (nome) e rascunho na fatura
- [`carteiras.md`](./carteiras.md) — `filterMovementAccounts`; `account_operations`
- [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — **não** é dependência de escrita; lê `cardMonthlyStatuses`

### Serviços / integrações externas

- Supabase PostgREST (`credit_cards`, `credit_card_monthly_status`, `account_operations`, `expenses`): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `@tanstack/react-query` | Bundle do mês + status |
| `sonner` | Toasts |
| `localStorage` `invoicePaymentAccount:{id}` | Última carteira do dialog |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| Mutação `credit_cards` | CRUD | Lista global | Select de pagamento em gastos |
| Rename | `updateCreditCard` | `payment_method` nos gastos | Fatura, caixa |
| `cardMonthlyStatuses[id]=true` | Pagar | Gastos daquele nome entram no efetivado | Resumo, regra, estatísticas, chips de carteira |
| INSERT/UPDATE `invoice_payment` | Pagar (total > 0) | Débito único | Carteiras / Saldo Livre |
| DELETE `invoice_payment` | Desmarcar ou sync total 0 | Remove débito | Carteiras |
| `syncInvoicePaymentsForMonth` | CRUD de gasto com fatura já paga | Ajusta `amount` | Carteiras |
| N/A | — | Sem webhooks/jobs | — |

---

## Configurações

Nenhuma env exclusiva. [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md).

| Chave | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `invoicePaymentAccount:{cardId}` | `localStorage` | Não | UUID da carteira ou sentinel de Saldo Livre |
| `VITE_DATA_PROVIDER` | string | Não | Só muda o adapter |

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos | `creditCards.test.ts`; `payInvoiceDefaults.test.ts` |
| UI / adapter / payCardInvoice | Nenhum spec |
| Cobertura | Não inventar % |

**Casos cobertos hoje:**

- [x] `isCreditCardExpense` pelo nome
- [x] Fatura filtra/soma/ordena gastos; agrupa por categoria
- [x] `%` de limite; `null` sem limite
- [x] Dia 31 → 28 em fevereiro
- [x] Alerta: pago / outro mês / approaching / due_today / overdue / fora da janela
- [x] `CREDIT_CARD_DUE_ALERT_DAYS === 3`
- [x] `canAddExpenseToCreditCard` sempre true
- [x] Default de carteira no dialog (primeira movimentação / localStorage / Saldo Livre)

**Casos críticos (adapter / residual QA — DEV-65):**

- [x] Create recusa nome vazio / duplicado ignore-case (`creditCards.test.ts`)
- [x] Rename propaga `payment_method` e recusa nome já usado ignore-case (`creditCards.test.ts`)
- [x] Delete bloqueado com gasto (`canDeleteCreditCard` — `creditCards.test.ts`)
- [x] Camada de dados: create/update/delete `invoice_payment` (`invoicePayment.test.ts`)
- [ ] Orquestração hook `payCardInvoice` / unpay / sync amount — **residual QA**
- [x] UNIQUE ignore-case no adapter (`.ilike`); índice DB aplicado (DEV-57) — residual race/constraint

**Como rodar:**

```bash
npm test --workspace=frontend
```

---

## Histórico de mudanças

| Data | Versão | Descrição | Issue ID | Autor |
| --- | --- | --- | --- | --- |
| 2026-08-23 | 1.0 | Bootstrap da KB a partir do código | — | Technical Writer |

---

## Referências rápidas

- Destino deste doc: `knowledge/04_modulos/cartoes.md`
- Índice: [`index.md`](./index.md)
- Jornada gastar no cartão e pagar fatura: [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
