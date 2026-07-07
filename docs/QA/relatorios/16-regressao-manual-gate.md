# Roteiro de Regressão Manual — Gate de Lançamento Finto

| Campo | Valor |
|-------|-------|
| **Escopo** | Apply-to-all × gráfico anual; resgate, transferência e exclusão E2E |
| **Data do roteiro** | 2026-07-03 |
| **Executor** | _[preencher]_ |
| **Ambiente** | _[local / produção]_ |
| **Usuário de teste** | _[e-mail ou ID]_ |
| **Migration `account_operations`** | _[confirmada em YYYY-MM-DD / pendente]_ |
| **Referências** | [15-gate-lancamento.md](./15-gate-lancamento.md) · [plano-pre-lancamento.md](../../DEV/plano-pre-lancamento.md) · [relatorio-validacao-gate-correcoes-qa.md](../../VALIDATION/relatorio-validacao-gate-correcoes-qa.md) |
| **Relatório de resultados** | [relatorio-regressao-manual-gate.md](../../VALIDATION/relatorio-regressao-manual-gate.md) |

---

## Objetivo

Validar no browser os fluxos que **não são cobertos** por testes unitários ou auditoria estática:

1. Sincronização da **visão anual** após criar, editar e excluir lançamentos com **aplicar a todos os meses**.
2. Fluxos ponta a ponta de **resgate**, **transferência** e **exclusão** de operações patrimoniais.

Ao concluir, preencher o [relatório de resultados](../../VALIDATION/relatorio-regressao-manual-gate.md).

---

## Pré-requisitos

| Item | Como verificar |
|------|----------------|
| App rodando | `cd frontend && npm run dev` |
| Login | Sessão ativa no Finto |
| Carteiras | Mínimo **2** (ex.: Corrente + Investimentos) |
| Migration remota | Tabela `account_operations` existe no Supabase (aplicada em 2026-07-03 no projeto tidy-tracker) |
| Mês de teste | Preferir **meio do ano civil** (ex.: junho de 2026) para exercitar repetição anual |
| Aba Estatísticas | Ícone de gráfico no header → carrega `yearData` com `statisticsEnabled: true` |

### Dados de teste sugeridos

Use descrições identificáveis para limpeza posterior:

| Item | Descrição | Valor |
|------|-----------|-------|
| Entrada repetida | `QA Salário gate` | R$ 3.000 → editar para R$ 3.500 |
| Gasto controle A4 | `QA Gasto gate` | R$ 100 (repetir, excluir só mês atual) |
| Resgate | `QA Resgate gate` | R$ 500 |
| Transferência | `QA Transfer gate` | R$ 200 |

### Ordem recomendada

Executar na sequência **A → B → C → D** (D reverte B e C).

---

## Matriz de reconciliação

Conferir os mesmos números em todas as superfícies afetadas:

| Operação | Resumo efetivado | Regra 50/30/20 | Gráfico anual | Chips carteira | Saldo Livre |
|----------|------------------|----------------|---------------|----------------|-------------|
| Entrada recebida | +entradas | Não altera bucket invest. | +Entradas no mês | +Entrou na carteira | +se sem carteira |
| Resgate | +entradas (hint resgates) | Não entra na regra | +Entradas no mês | −Saiu na origem | +Entrou (badge Resgate) |
| Transferência | **Inalterado** | **Inalterado** | **Inalterado** | ±simétrico entre carteiras | **Inalterado** |
| Exclusão de op. | Reverte resumo | Reverte se aplicável | Reverte mês no gráfico | Reverte chips | Reverte Saldo Livre |

**Superfícies a inspecionar:**

- **Resumo** — card do mês (`MonthSummarySection`): entradas, gastos, saldo, pendências, hint de resgates.
- **Navegação mês a mês** — mesmo resumo em cada mês afetado.
- **Gráfico** — aba Estatísticas, barras Entradas/Gastos/Investimentos/Saldo.
- **Chips** — faixa Carteiras: saldo estimado, Entrou/Saiu/Aportado.
- **Saldo Livre** — chip tracejado → dialog com movimentos sem carteira + resgates.

---

## Cenário A — Apply-to-all × gráfico anual

**Valida:** fix Fase 1.2 (`refreshAffectedYearMonths` / `getYearRefreshMonths` em `useSupabaseFinance.ts`).

### A1 — Criar entrada com repetição anual

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Navegar para **junho** (ou mês central do ano) | Mês correto no header |
| 2 | Entradas → **Adicionar** `QA Salário gate` R$ 3.000 | Formulário salva |
| 3 | Marcar **Recebido** | Item aparece como efetivado |
| 4 | Ativar **Repetir nos demais meses deste ano** | Helper text visível no form |
| 5 | Salvar | Toast de sucesso |
| 6 | Resumo do mês | Entradas (efetiv.) inclui R$ 3.000 |
| 7 | Navegar **julho, agosto, dezembro** (amostra) | Cada mês mostra R$ 3.000 em entradas efetivadas |
| 8 | Abrir aba **Estatísticas** | Barras **Entradas** ≈ R$ 3.000 nos meses da série (todos exceto junho se repetição não incluir o mês atual — conferir regra: repetição cria nos **demais** meses; junho tem o original) |
| 9 | Comparar gráfico × resumo | Valores **iguais** mês a mês |

**Critério de aprovação:** gráfico anual e navegação mês a mês mostram os mesmos totais de entradas efetivadas.

---

### A2 — Editar com aplicar a todos

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Voltar ao **mês base** (junho) | — |
| 2 | Editar `QA Salário gate` → R$ **3.500** | Dialog de edição |
| 3 | Confirmar com **Aplicar a todos os meses** | Série atualizada |
| 4 | Estatísticas + 2–3 meses no dashboard | Todos com R$ 3.500 em entradas |

**Critério de aprovação:** nenhum mês da série permanece com R$ 3.000.

---

### A3 — Excluir com aplicar a todos (regressão do bug original)

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Excluir `QA Salário gate` com **Aplicar a todos os meses** | Confirmação |
| 2 | Estatísticas | Barras de Entradas **zeram** (ou reduzem) em todos os meses da série |
| 3 | Navegar mês a mês na série | Resumo **sem** a entrada — **sem desync** gráfico ≠ dashboard |

**Critério de aprovação:** **não** pode restar valor no gráfico anual com dashboard zerado no mesmo mês.

---

### A4 — Controle negativo (excluir só este mês)

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Criar gasto `QA Gasto gate` R$ 100, **repetir** no ano, **pago** | Série em vários meses |
| 2 | Em um mês da série, **excluir só este mês** | Outros meses intactos |
| 3 | Estatísticas | Apenas o mês excluído muda no gráfico |

**Critério de aprovação:** exclusão parcial não apaga a série inteira.

---

## Cenário B — Resgate E2E

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Anotar **Entradas (efetiv.)** e saldo do resumo **antes** | Valores de referência |
| 2 | Carteiras → **Resgate** (ou menu do chip) → origem Investimentos | Dialog abre |
| 3 | Valor **R$ 500**, descrição `QA Resgate gate`, salvar | Toast sucesso |
| 4 | Chip **origem** | **Saiu** R$ 500; saldo estimado reduz |
| 5 | Chip **Saldo Livre** | **Entrou** R$ 500; dialog lista item **Resgate** com carteira de origem |
| 6 | Resumo | Entradas (efetiv.) **+R$ 500** vs. antes |
| 7 | Resumo | Hint *"Inclui R$ 500 em resgates"* abaixo de Entradas |
| 8 | Regra financeira | Percentuais **não** tratam resgate como renda classificável |
| 9 | Se houver **A receber** > 0 | Valor **não** diminui por causa do resgate (fix QA #1) |

**Critério de aprovação:** resgate impacta resumo e Saldo Livre; não distorce pendência de salário nem regra 50/30/20.

---

## Cenário C — Transferência E2E

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Anotar resumo completo e chips **antes** | Referência |
| 2 | Carteiras → **Transferir** R$ 200 (Corrente → outra carteira) | Dialog salva |
| 3 | Resumo | Entradas, gastos, saldo **inalterados** |
| 4 | Chip origem | **Saiu** R$ 200 |
| 5 | Chip destino | **Entrou** R$ 200 |
| 6 | Saldo Livre | **Inalterado** |
| 7 | Estatísticas (mês atual) | Barras **inalteradas** vs. passo 1 |

**Critério de aprovação:** transferência é neutra no resumo e no gráfico; só move saldo entre chips.

---

## Cenário D — Exclusão E2E

### D1 — Excluir resgate pelo Saldo Livre

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Abrir chip **Saldo Livre** | Lista inclui `QA Resgate gate` |
| 2 | Clicar **Excluir** (ícone lixeira) → confirmar | Toast "Resgate excluído" |
| 3 | Resumo, chips, hint resgates | **Revertem** ao estado pré-Cenário B |

---

### D2 — Excluir transferência por Operações do mês

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Refazer transferência do Cenário C (se D1 limpou o mês) | — |
| 2 | Menu do chip **origem** → **Operações do mês** | Dialog lista transferência |
| 3 | Excluir → confirmar | Toast "Operação excluída" |
| 4 | Chips origem e destino | **Revertem** ao pré-Cenário C |
| 5 | Resumo e Estatísticas | **Inalterados** vs. antes da transferência |

---

### D3 — Menu oculto sem operações

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1 | Mês sem resgates/transferências (ou após D1+D2) | — |
| 2 | Menu ⋮ do chip de carteira | Item **Operações do mês** **ausente** |

---

## Limpeza pós-teste

- Excluir lançamentos `QA * gate` criados (usar apply-to-all na exclusão se repetidos).
- Opcional: excluir operações patrimoniais restantes via UI.

---

## Riscos conhecidos (não bloqueiam o gate)

| Risco | Sintoma | Nota |
|-------|---------|------|
| Eixo Y do gráfico | Valores &lt; R$ 1.000 aparecem como `0k` | Visual; conferir tooltip ou resumo |
| Troca de ano | `yearData` pode precisar reabrir Estatísticas | Testar no **ano corrente** |
| Spinner na visão anual | Gráfico some durante reload | Aguardar fim do loading |

Fonte: [10-estatisticas.md](./10-estatisticas.md).

---

## Checklist rápido

| Cenário | OK | Falha | Notas |
|---------|:--:|:-----:|-------|
| A1 Criar + repetir | ☐ | ☐ | |
| A2 Editar apply-to-all | ☐ | ☐ | |
| A3 Excluir apply-to-all | ☐ | ☐ | |
| A4 Excluir só este mês | ☐ | ☐ | |
| B Resgate E2E | ☐ | ☐ | |
| C Transferência E2E | ☐ | ☐ | |
| D1 Excluir resgate | ☐ | ☐ | |
| D2 Excluir transferência | ☐ | ☐ | |
| D3 Menu oculto | ☐ | ☐ | |

**Veredito desta execução:** _[Aprovado / Falhou — detalhar em relatorio-regressao-manual-gate.md]_

---

*Roteiro para execução manual no browser. Não substitui testes automatizados E2E.*
