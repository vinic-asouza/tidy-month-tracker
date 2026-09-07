---
type: modulo
nome: Carteiras
status: Ativo
versao: "1.0"
owner: Development
ultima_atualizacao: 2026-08-23
tags: [carteiras, saldo-livre, patrimonio, frontend, supabase]
dependencias: [autenticacao]
---

# Módulo — Carteiras

Documento-base em `knowledge/04_modulos/carteiras.md`. Atualize quando papéis, Saldo Livre, declaração de saldo, transferência, resgate ou patrimônio estimado mudarem.

Regras: [`../02_regras-de-negocio/regras-por-modulo/carteiras.md`](../02_regras-de-negocio/regras-por-modulo/carteiras.md). Termos: [`../01_produto/glossario.md`](../01_produto/glossario.md). Persistência: [`../03_arquitetura/banco-de-dados.md`](../03_arquitetura/banco-de-dados.md). Entrada de resgate: [`entradas.md`](./entradas.md). Aportes: [`investimentos.md`](./investimentos.md). Fatura: [`cartoes.md`](./cartoes.md).

---

## Overview

Cadastro de **carteiras** (globais, não por mês) e a leitura do **saldo estimado** no mês de navegação: chips na visão mensal, Saldo Livre, declaração de abertura, transferência entre liquidez e resgate de investimentos.

**Responsabilidade única:** persistir `accounts` + `account_balances` e as operações `withdrawal` / `transfer_out` / `transfer_in`; derivar métricas e patrimônio a partir das linhas efetivadas dos outros módulos.

**Propósito no produto:** a pessoa vê *onde* o dinheiro está (liquidez vs posição aplicada), sem misturar isso com o caixa do resumo (RN-G07, RN-W09).

---

## Bounded context

### O que este módulo FAZ

- CRUD de carteira: nome, papel `movement` | `investment`, subtipo, cor (`CARD_COLORS`), `display_order` no create (RN-W01)
- Recusar nome duplicado (UI ignore-case + adapter `ilike`); **não** há UNIQUE de nome no Postgres
- Trocar papel: UI bloqueia se houver movimentos no histórico carregado; **adapter** também recusa troca se existir qualquer movimento (RN-W01)
- Subtipo (corrente, poupança, dinheiro, outro) só na UI de movimentação; papel investimentos força `type = 'investment'`
- Chip do mês: métricas efetivadas por papel + saldo de fechamento (RN-W02, RN-W04)
- Declarar saldo de abertura do mês (`account_balances`, unique `(account_id, year_month)`); senão carry-forward (RN-W03)
- Aviso se declarar com movimentos efetivados no mês (`getBalanceDeclarationWarning`)
- Chip **Saldo Livre** sempre visível (RN-W07)
- Transferência: par `transfer_out` + `transfer_in` entre movimentação e/ou Saldo Livre; origem ≠ destino; valor > 0; **não** cria entrada nem mexe no resumo (RN-W05)
- Resgate: origem = investimentos; destino = movimentação ou Saldo Livre; gera entrada automática já recebida (RN-W06, RN-G08, RN-E04)
- Excluir carteira: DELETE da conta; saldos CASCADE; FKs de movimentos `ON DELETE SET NULL` (RN-W08)
- Patrimônio estimado = fechamentos das carteiras + Saldo Livre (`getTotalEstimatedPatrimony`, RN-W09)
- Extrato do mês da carteira / do Saldo Livre (leitura + apagar operação de transferência/resgate)

### O que este módulo NÃO FAZ

- Totais do caixa / gráfico anual ([`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — transferência não entra; resgate entra pela **entrada**)
- CRUD de linhas de entrada, gasto ou aporte ([`entradas.md`](./entradas.md), [`gastos.md`](./gastos.md), [`investimentos.md`](./investimentos.md)) — só lê o que já está efetivado
- Pagar fatura / criar `invoice_payment` ([`cartoes.md`](./cartoes.md) — este módulo só consome a operação nas métricas)
- Aporte origem→destino (investimentos); **não** cria `account_operations` no aporte
- Dialog de efetivação de entrada/gasto (`EffectuateWalletDialog` é compartilhado; a lista de movimentação sai daqui)
- CRUD de desejos ([`desejos.md`](./desejos.md)), regra 50/30/20 ([`regra-financeira.md`](./regra-financeira.md)) ou seleção múltipla ([`selecao.md`](./selecao.md))
- Reordenar `display_order` na UI (sort dos chips é só no cliente: padrão / alfabética / maior movimentação)
- Extrato bancário, Open Finance, cotação ou rendimento automático

---

## Estrutura de arquivos

```text
frontend/src/
  components/AccountStrip.tsx                  # chips, form, sort, declaração, CTAs
  components/TransferDialog.tsx                # movimentação ↔ Saldo Livre
  components/WithdrawalDialog.tsx              # resgate investimentos → movimentação/livre
  components/UnlinkedMovementsDialog.tsx       # extrato do Saldo Livre
  components/AccountMonthMovementsDialog.tsx   # extrato da carteira no mês
  components/WalletMovementsTable.tsx          # tabela compartilhada dos extratos
  components/EffectuateWalletDialog.tsx        # compartilhado (entradas/gastos)
  pages/Index.tsx                              # strip na visão mensal (`view === 'dashboard'`)
  hooks/useSupabaseFinance.ts                  # CRUD, saldo, transfer, resgate, delete op
  services/accounts.ts                         # facade
  services/accountBalances.ts
  services/accountOperations.ts
  services/adapters/supabase/accounts.ts
  services/adapters/supabase/accountBalances.ts
  services/adapters/supabase/accountOperations.ts
  services/adapters/api/accounts.ts            # Express (não é produção)
  types/domain.ts                              # Account, AccountBalance, AccountOperation
  types/finance.ts                             # DEFAULT_ACCOUNT_TYPES, CARD_COLORS
  utils/business/accounts.ts                   # métricas, abertura, Saldo Livre, patrimônio
  utils/business/accountRoles.ts
  utils/business/accountLabels.ts
  utils/effectuateWalletDefaults.ts            # localStorage da efetivação (outros módulos)
```

| Arquivo | Descrição |
| --- | --- |
| `AccountStrip.tsx` | CRUD, bloqueio de papel, declaração, chips, abre dialogs |
| `accounts.ts` (supabase) | INSERT/UPDATE/DELETE; duplicata `ilike`; `getEarliestAccountMovementMonth` |
| `accountOperations.ts` (supabase) | `createWithdrawal`, `createTransfer` (par + `transfer_group_id`), delete do grupo |
| `accounts.ts` (business) | Totais efetivados, carry-forward, Saldo Livre, patrimônio |
| `useSupabaseFinance.ts` | Optimistic update; resgate + `createResgateIncome`; rollback best-effort das ops |

Backend `backend/src/routes` de accounts existe no monorepo; **produção não usa** (SPA → Supabase). Adapter API de `getEarliestAccountMovementMonth` devolve `null`.

---

## Entidades e models

### Tabela: `accounts`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `user_id` | UUID | Sim | RLS; `ON DELETE CASCADE` do user |
| `name` | TEXT | Sim | Sem UNIQUE no banco |
| `type` | TEXT | Sim | `checking \| savings \| investment \| cash \| other`; default `checking` |
| `role` | TEXT | Sim | `movement \| investment`; default `movement`; migração `add_account_role.sql` |
| `color` | TEXT | Não | Id de `CARD_COLORS` |
| `display_order` | INTEGER | Sim | Default `0`; preenchido no create (`accounts.length`) |
| `created_at` / `updated_at` | timestamptz | Sim | |

Índices: `user_id`; `(user_id, display_order)`.

### Tabela: `account_balances`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `account_id` | UUID | Sim | `ON DELETE CASCADE` |
| `user_id` | UUID | Sim | RLS |
| `year_month` | TEXT | Sim | `YYYY-MM` |
| `balance` | DECIMAL(14,2) | Sim | Declaração manual; default `0` |
| UNIQUE | `(account_id, year_month)` | — | Upsert na declaração |

### Tabela: `account_operations`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | UUID | Sim | PK |
| `user_id` | UUID | Sim | RLS |
| `type` | TEXT | Sim | `withdrawal \| transfer_out \| transfer_in \| invoice_payment` |
| `source_account_id` | UUID | Não | `ON DELETE SET NULL`; `null` = Saldo Livre |
| `destination_account_id` | UUID | Não | `ON DELETE SET NULL` |
| `credit_card_id` | UUID | Não | Só `invoice_payment`; `ON DELETE CASCADE` do cartão |
| `transfer_group_id` | UUID | Não | Liga o par out/in |
| `amount` | NUMERIC | Sim | CHECK `amount > 0` |
| `year_month` | TEXT | Sim | |
| `operation_date` | DATE | Sim | |
| `description` | TEXT | Não | |

UNIQUE parcial: `(user_id, credit_card_id, year_month)` WHERE `type = 'invoice_payment'`. Dono do INSERT de fatura: [`cartoes.md`](./cartoes.md).

Movimentos (`incomes` / `expenses` / `investments`.`account_id` e `investments`.`source_account_id`): `ON DELETE SET NULL`. Entrada de resgate: `incomes.source_operation_id` → `account_operations(id)` `ON DELETE CASCADE`.

### Contrato TypeScript

```ts
type AccountRole = 'movement' | 'investment';
type AccountType = 'checking' | 'savings' | 'investment' | 'cash' | 'other';

interface Account {
  id: string;
  name: string;
  type: AccountType;
  role: AccountRole;
  color: string | null;
  displayOrder: number;
}

type AccountOperationType =
  | 'withdrawal'
  | 'transfer_out'
  | 'transfer_in'
  | 'invoice_payment';

interface AccountOperation {
  id: string;
  type: AccountOperationType;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  transferGroupId: string | null;
  creditCardId: string | null;
  amount: number;
  yearMonth: string;
  operationDate: string;
  description: string | null;
}
```

`resolveAccountRole`: usa `role`; se ausente, `type === 'investment'` → `investment`.

`MOVEMENT_ACCOUNT_TYPES` = `checking | savings | cash | other`.

### Constantes

| Nome | Valor |
| --- | --- |
| `DEFAULT_ACCOUNT_TYPES` | corrente, poupança, corretora, dinheiro, outro |
| `CARD_COLORS` | mesmas cores dos cartões |
| `RESGATE_INCOME_TAG` | `'Resgate de investimentos'` |
| `EFFECTUATE_WALLET_FREE` | sentinel de Saldo Livre no dialog de efetivação / transferência |

---

## Interface pública

Não há REST de produção.

| Operação | Onde | Auth | Input | Efeito |
| --- | --- | --- | --- | --- |
| Listar | `getAccounts(userId)` | JWT + RLS | — | `Account[]` por `display_order` |
| Criar | `createAccount` | idem | name, type, role, color? | Recusa nome `ilike`; `display_order` = tamanho da lista |
| Atualizar | `updateAccount` | idem | name?, type?, role?, color? | Recusa nome duplicado; **não** valida movimentos ao mudar `role` |
| Excluir | `deleteAccount` | idem | id | DELETE; saldos CASCADE; vínculos SET NULL |
| Declarar saldo | `upsertAccountBalance` | idem | accountId, yearMonth, balance | Upsert `(account_id, year_month)` |
| Transferir | `createTransfer` | idem | source e dest (`null` = livre), amount > 0, date | Par out/in; no-op se ambos nulos ou iguais |
| Resgatar | `createWithdrawal` no **hook** | idem | source investimento, dest?, amount, date | Ver fluxo abaixo |
| Apagar operação | `deleteAccountOperation` | idem | id | Se tiver grupo, apaga o par; CASCADE na entrada de resgate |
| Histórico p/ carry-forward | `getAccountHistoryFetchRange` + query de meses | idem | — | Meses anteriores ao atual até âncora/declaração/início do ano |

### Fluxo de resgate (`createWithdrawal` no hook)

1. Destino nomeado → `createTransfer` (out na origem + in no destino); liga a entrada ao `transfer_in`.
2. Destino Saldo Livre → INSERT `type = 'withdrawal'`; liga a entrada a essa op.
3. `createResgateIncome`: `received: true`, tag `Resgate de investimentos`, `account_id` = destino (ou `null`), `source_operation_id`.
4. Toast: resumo e regra 50/30/20 atualizam.
5. Se a entrada falhar: delete best-effort das ops criadas.

### Validação no cliente

- Nome obrigatório; duplicata ignore-case (`accountNameExists`)
- Transferência: pelo menos duas origens possíveis (Saldo Livre + ≥1 movimentação); valor > 0; origem ≠ destino (`filterMovementAccounts`)
- Resgate: precisa de carteira `investment`; valor > 0
- Adapter de transferência: ambos nulos ou iguais → `false` sem toast

### UI / rotas

Mesma `/`. Só na visão mensal (`Index`, `view === 'dashboard'`). Sem URL própria.

| Superfície | Componente | Observação |
| --- | --- | --- |
| Chips | `AccountStrip` | Inclui Saldo Livre; patrimônio estimado no rodapé da faixa |
| Transferir | `TransferDialog` | Só `filterMovementAccounts` + Saldo Livre |
| Resgatar | `WithdrawalDialog` | Origem investimentos; destino movimentação ou livre |
| Extrato carteira | `AccountMonthMovementsDialog` | Abertura declarada vs carregada |
| Extrato livre | `UnlinkedMovementsDialog` | |

`invoice_payment` aparece no extrato mas **não** é apagável daqui (`deletable: false`).

### Erros comuns (toasts)

| Situação | Mensagem |
| --- | --- |
| Nome duplicado (adapter/UI) | Já existe uma carteira com este nome |
| Troca de papel com movimentos (UI) | Não é possível alterar o papel de uma carteira com movimentos vinculados. |
| Resgate ok | Resgate registrado. Entrada criada em Entradas; resumo e regra 50/30/20 atualizados. |
| Falha create/update/delete | Erro ao adicionar/atualizar/excluir carteira |
| Falha resgate | Erro ao registrar resgate |
| Falha transferência | Erro ao registrar transferência |
| Falha delete op | Erro ao excluir operação |

---

## Regras de negócio

Detalhe: [`../02_regras-de-negocio/regras-por-modulo/carteiras.md`](../02_regras-de-negocio/regras-por-modulo/carteiras.md). Gerais: RN-G02, RN-G07, RN-G08.

| ID | Regra | Onde está no código |
| --- | --- | --- |
| RN-W01 | Papel obrigatório; troca bloqueada se houver movimentos; subtipo só em movimentação | Form + `accountHasAnyMovements` (UX); adapter `updateAccount` + `hasAccountMovements` (fonte de verdade) |
| RN-W02 | Métricas efetivadas; paridade com resumo (`received` / `isExpenseEffectivelyPaid` / `invested`) | `getAccountMonthTotals` |
| RN-W03 | Abertura = declaração ou carry-forward; aviso se já houver efetivados | `getAccountOpeningBalance` / `getBalanceDeclarationWarning` |
| RN-W04 | Movimentação: `inflow − outflow` (aportes enviados saem). Investimentos: `inflow + invested − outflow` | `getAccountNetVariation` |
| RN-W05 | Transferência liquidez ↔ livre; não altera resumo nem regra | `TransferDialog` + `createTransfer`; `monthTotals` ignora essas ops |
| RN-W06 | Resgate → entrada automática | hook `createWithdrawal` + `createResgateIncome` |
| RN-W07 | Saldo Livre sempre visível | chip + `getUnlinkedMonthTotals` |
| RN-W08 | Excluir desvincula, não apaga histórico de lançamentos | DELETE + SET NULL; hook zera `accountId` no bundle do mês |
| RN-W09 | Patrimônio = fechamentos + Saldo Livre (estimativa) | `getTotalEstimatedPatrimony` |

### Métricas (`getAccountMonthTotals`)

**Movimentação**

- Inflow: entradas `received` da carteira + `transfer_in` **não** espelhados por entrada de resgate
- Outflow: gastos efetivos **não-cartão** + `withdrawal` + `transfer_out` + `invoice_payment` + aportes `invested` com `sourceAccountId`
- Invested: aportes enviados

**Investimentos**

- Inflow: `transfer_in` não espelhado
- Outflow: `withdrawal` + `transfer_out`
- Invested: aportes `invested` recebidos (`accountId`)

`getIncomeMirroredOperationIds`: não somar de novo no chip o `transfer_in` / `withdrawal` já representados pela entrada de resgate (RN-G08).

### Saldo Livre (`getUnlinkedMonthTotals`)

Efetivados sem `account_id` + `withdrawal`/`transfer_*`/`invoice_payment` sem carteira nomeada + aportes cuja origem é nula. Carry-forward próprio (`getUnlinkedOpeningBalance`), sem linha em `account_balances`.

### Código vs regra

- **RN-W01 no adapter:** `updateAccount` recusa troca de `role` se houver movimentos em incomes/expenses/investments (destino ou origem) ou `account_operations`.
- **`getEarliestAccountMovementMonth`:** mínimo de `year_month` em incomes/expenses/investments (`account_id` ou `source_account_id`) e `account_operations` (source/destination).
- **Delete otimista:** o hook limpa `accountId` e `sourceAccountId` dos aportes (e vínculos em operações do bundle) alinhado ao SET NULL do banco.
- **Sem UNIQUE de nome** no Postgres (igual cartões).

---

## Dependências

### Módulos internos consumidos

- [`autenticacao.md`](./autenticacao.md) — `user.id`; RLS
- [`entradas.md`](./entradas.md) — linhas `received`; `createResgateIncome` (este módulo dispara)
- [`gastos.md`](./gastos.md) — gastos efetivos não-cartão com `account_id`
- [`investimentos.md`](./investimentos.md) — aportes `invested` origem/destino
- [`cartoes.md`](./cartoes.md) — `invoice_payment` + `isExpenseEffectivelyPaid` (fatura)
- [`resumo-e-estatisticas.md`](./resumo-e-estatisticas.md) — **não** é dependência de escrita; o caixa lê a entrada de resgate, não a operação

### Serviços / integrações externas

- Supabase PostgREST (`accounts`, `account_balances`, `account_operations`, e leitura de `incomes` / `expenses` / `investments`): [`../06_integracoes/supabase.md`](../06_integracoes/supabase.md)

### Utils / libs

| Dependência | Uso |
| --- | --- |
| `@tanstack/react-query` | Bundle do mês + `accountHistory` |
| `sonner` | Toasts |
| `localStorage` `effectuateWallet:*` | Preferência de carteira na efetivação (módulo entradas/gastos/investimentos) |

---

## Eventos emitidos

| Evento / efeito | Trigger | Payload / efeito | Consumidores |
| --- | --- | --- | --- |
| Mutação `accounts` | CRUD | Lista global | Dialogs de efetivação, aporte, fatura |
| Upsert `account_balances` | Declarar | Abertura do mês | Chips, patrimônio |
| Par `transfer_*` | Transferência | Só patrimônio / chips | **Não** o resumo |
| `withdrawal` ou par transfer + INSERT `incomes` | Resgate | Entrada `received` | Entradas, resumo, regra, chips |
| DELETE operação (grupo) | Extrato | Some o par; CASCADE na entrada de resgate | Entradas, chips |
| DELETE `accounts` | Excluir | Vínculos nulos; saldos apagados | Lançamentos permanecem no caixa |
| N/A | — | Sem webhooks/jobs | — |

---

## Configurações

Nenhuma env exclusiva. [`../03_arquitetura/infraestrutura.md`](../03_arquitetura/infraestrutura.md).

| Chave | Tipo | Obrigatória | Descrição |
| --- | --- | --- | --- |
| `VITE_DATA_PROVIDER` | string | Não | Só muda o adapter |
| `effectuateWallet:income` / `:expense` | `localStorage` | Não | Última carteira (ou livre) — dono: entradas/gastos |
| `invoicePaymentAccount:{id}` | `localStorage` | Não | Dono: cartões |

---

## Testes

| Item | Valor |
| --- | --- |
| Arquivos deste módulo | `utils/business/__tests__/accounts.test.ts`, `accountRoles.test.ts`, `accountLabels.test.ts` |
| Relacionados | `utils/__tests__/effectuateWalletDefaults.test.ts`; caixa em `monthTotals.test.ts` |
| UI / adapters supabase | Nenhum spec |
| Cobertura | Não inventar % |

**Casos cobertos hoje:**

- [x] Totais por papel (entradas recebidas, gastos efetivos, aportes, ops)
- [x] Não somar `transfer_in` já espelhado pela entrada de resgate
- [x] Saldo Livre (efetivados sem conta + ops sem conta)
- [x] Abertura declarada vs carry-forward; aviso de declaração
- [x] Patrimônio estimado (carteiras + livre)
- [x] `resolveAccountRole` / filtros por papel
- [x] Label Saldo Livre vs nome; label de gasto pago (carteira vs fatura)

**Casos críticos (não automatizados hoje):**

- [ ] Adapter recusa nome duplicado `ilike`
- [x] Adapter bloqueia troca de papel com movimentos (RN-W01)
- [ ] UI bloqueia papel quando há movimentos no histórico carregado
- [ ] Transferência não cria `incomes` e não altera `calculateMonthTotals`
- [ ] Resgate com destino → par transfer + entrada no destino
- [ ] Resgate para Saldo Livre → `withdrawal` + entrada sem `account_id`
- [ ] Rollback das ops se `createResgateIncome` falhar
- [ ] Excluir carteira deixa lançamentos; SET NULL
- [x] `getEarliestAccountMovementMonth` inclui `account_operations` e `source_account_id`

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

- Destino deste doc: `knowledge/04_modulos/carteiras.md`
- Índice: [`index.md`](./index.md)
- Jornadas (carteiras / resgate / transferir): [`../01_produto/jornadas-de-usuario.md`](../01_produto/jornadas-de-usuario.md)
- Workflow: `knowledge/00_meta/linear-cursor-workflow.md`
