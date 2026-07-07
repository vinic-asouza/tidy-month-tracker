# Relatório de Regras de Negócio — Finto

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-06 (revisão C8 — papéis de carteira e aporte origem/destino) |
| **Agente** | Business Rules Auditor (`docs/BUSINESS/business-specialist.mdc`) |
| **Escopo** | Produto financeiro pessoal — frontend Supabase pós-correções QA/Dev, incluindo **Lista de Desejos** e **Carteiras** |
| **Referências** | [QA 01–14](../QA/relatorios/), [Dev](../DEV/relatorio-correcoes-qa.md), [Validação](../VALIDATION/relatorio-validacao-correcoes-qa.md), [ANALISE](../ANALISE_FRONTEND_QA.md), [Proposta Carteiras](../DEV/proposta-feature-contas.md) |

---

## Resumo executivo

O produto controla **entradas, gastos e investimentos** por mês, com cartões de crédito, **carteiras** (organização e patrimônio por conta — liquidez vs posição aplicada), **lista de desejos** (metas de consumo fora do fluxo de caixa), regra financeira 50/30/20 (ou personalizada) e visão anual. Após as correções recentes, a taxonomia **efetivados** (recebido / pago / investido) foi unificada no resumo mensal, na regra financeira, na seleção, nas estatísticas anuais e nas **métricas de carteira** — avanço relevante de consistência. A revisão de **2026-07-06** introduz **papéis obrigatórios** (`movement` | `investment`), **aporte com origem e destino** e fórmulas de chip alinhadas ao patrimônio por carteira (lacuna C8 fechada).

| Classificação | Quantidade |
|---------------|------------|
| Regras corretas e consistentes | 30 áreas |
| Inconsistências / lacunas | 17 achados |
| Decisões de produto pendentes | 8 |

### Veredito geral

**Aprovado com ressalvas para uso pessoal / beta fechado.** O núcleo financeiro (saldo, cartões, efetivados, carteiras com papéis e patrimônio por conta) é coerente na maior parte dos fluxos. A **lista de desejos** está corretamente isolada do saldo mensal. Persistem lacunas que podem produzir **números que o usuário não consegue reconciliar** entre resumo, listas, regra, visão anual e **chips de carteira / Saldo Livre** — especialmente em categorias não mapeadas, operações “todos os meses”, diferença entre totais planejados vs efetivados nas seções de lista, e **três leituras de patrimônio** (mês vs carteira vs Saldo Livre) sem painel consolidado.

---

## Taxonomia financeira vigente

| Conceito | Definição no produto | Onde se aplica |
|----------|---------------------|----------------|
| **Efetivado** | Entrada com `received`, gasto com `paid` (ou fatura de cartão paga), investimento com `invested` | Resumo mensal, regra financeira, seleção, estatísticas anuais (modo padrão **Efetivados**) |
| **Planejado / nominal** | Valor lançado independente das flags | Headers das seções; chip do cartão; seção Desejos; resumo e regra no modo **Planejados** (toggle) |
| **Saldo do mês** | Entradas − Gastos − Investimentos (conforme modo ativo) | `MonthSummarySection` — efetivado (padrão) ou planejado via toggle |
| **Saldo da carteira** | Patrimônio estimado na conta: declarado + carry-forward + variação por **papel** — movimentação = liquidez (`inflow − outflow`); investimentos = posição (`aportes + transfer_in − resgates`) | Chips em `AccountStrip` |
| **Saldo Livre** | Patrimônio estimado de movimentos efetivados **sem** carteira + destino de resgates para fora das carteiras nomeadas | Chip `Saldo Livre` em `AccountStrip` |
| **Carteira de movimentação** | Liquidez operacional; recebe entradas/gastos e origem de aportes | `EffectuateWalletDialog`, `PayInvoiceDialog` |
| **Carteira de investimentos** | Custódia da posição aplicada; recebe aportes e origem de resgates | `EffectuateInvestmentDialog`, `WithdrawalDialog` |
| **Desejo** | Meta de consumo com prazo; **não** é movimento financeiro | Aba Desejos; ausente do resumo e da regra |

Legenda exibida ao usuário: modo **Efetivados** — *"Apenas itens marcados como recebido, pago ou investido"*; modo **Planejados** — *"Soma de todos os lançamentos do mês, independente de status"*. Preferência persistida em `localStorage` (`tidy-summary-view-mode`).

---

## Mapa de consistência entre módulos

```
                    ┌─────────────────┐
                    │  Lançamentos    │
                    │ (listas/seções) │
                    └────────┬────────┘
                             │ total bruto + subtotal efetivado
              ┌──────────────┼──────────────┬──────────────┐
              ▼              ▼              ▼              ▼
      ┌──────────────┐ ┌──────────┐ ┌─────────────┐ ┌─────────────┐
      │ Resumo mês   │ │  Regra   │ │ Estatística │ │  Carteiras  │
      │ (toggle)     │ │ 50/30/20 │ │   anual     │ │ (efetivados)│
      └──────┬───────┘ └────┬─────┘ └──────┬──────┘ └──────┬──────┘
             │              │               │               │
             └──────────────┴───────────────┴───────────────┘
                    monthTotals.ts / accounts.ts
                    (mesma lógica de pago em cartão)

      ┌─────────────────┐
      │ Lista Desejos   │  ← isolada (não alimenta resumo/regra/carteiras)
      └─────────────────┘
```

| Par cruzado | Consistente? | Observação |
|-------------|--------------|------------|
| Resumo ↔ Estatísticas anuais | **Sim** | Mesmo modo (efetivado/planejado) via toggle compartilhado |
| Resumo ↔ Regra financeira | **Parcial** | Gastos em categorias não mapeadas entram no resumo mas não nas barras |
| Resumo ↔ Headers das seções | **Sim (modo Planejados)** | Toggle alinha totais do resumo ao planejado das listas |
| Resumo ↔ Carteiras (métricas) | **Sim** | `getAccountMonthTotals` usa flags efetivadas e fórmulas por `AccountRole` |
| Resumo ↔ Saldo do chip carteira | **Parcial** | Resumo = fluxo do mês; chip = patrimônio cumulativo por papel (liquidez ou posição) |
| Chip do cartão ↔ Resumo gastos | **Parcial** | Chip soma todos os gastos do cartão; resumo só conta se fatura paga |
| Seleção ↔ Resumo | **Sim** | Ambos usam efetivados; ver achado de UX na seleção |
| Parcelas ↔ Visão anual | **Parcial** | Criação multi-mês atualiza ano; edição/exclusão “todos os meses” pode não atualizar |
| Desejos ↔ Resumo / Regra / Carteiras | **Sim (isolamento)** | Desejos não entram em nenhum total financeiro — por design |
| Desejo conquistado ↔ Gasto | **Parcial** | Vínculo `linked_expense_id` após salvar gasto; valores e efetivação podem divergir |
| Movimento sem carteira ↔ Resumo | **Parcial** | Entra no resumo; contabilizado no chip **Saldo Livre**, não nas carteiras nomeadas |

---

## Regras confirmadas como corretas

| # | Regra | Comportamento esperado | Status |
|---|-------|------------------------|--------|
| 1 | Saldo mensal | Receitas efetivadas + resgates de investimentos (`withdrawal` ou `transfer_in` de resgate) menos gastos e investimentos efetivados | **Correto** |
| 2 | Gasto em cartão | Status de pago vem da fatura mensal do cartão, não do checkbox individual | **Correto** |
| 3 | Regra 50/30/20 | Soma dos percentuais deve ser 100%; categorias mapeadas como essencial ou estilo de vida | **Correto** |
| 4 | Investimentos na regra | Terceiro bucket (% da renda) separado de gastos por categoria | **Correto** |
| 5 | Parcelas | Podem atravessar anos civis (ex.: parcela 10/12 em nov → continua em jan do ano seguinte) | **Correto** |
| 6 | Exclusão de cartão | Bloqueada se existir gasto vinculado em qualquer mês | **Correto** |
| 7 | Nova entrada/gasto/investimento | Sempre criado como não efetivado (`received`/`paid`/`invested` = false) | **Correto** |
| 8 | Valor mínimo | Entradas, gastos e investimentos exigem valor > 0 | **Correto** |
| 9 | Exclusão de tag/categoria | Bloqueada quando há lançamentos usando o rótulo | **Correto** |
| 10 | Renomear categoria/tag/cartão | Propaga para todos os lançamentos do usuário | **Correto** |
| 11 | Excluir parcela “este mês” | Remove apenas o registro do mês corrente | **Correto** |
| 12 | Excluir parcela “todas” | Remove série completa pelo `base_expense_id` | **Correto** |
| 13 | Uma regra por usuário | Apenas uma configuração de regra financeira ativa | **Correto** |
| 14 | Isolamento por usuário | Dados filtrados por `user_id` (RLS no banco) | **Correto** |
| 15 | Desejos fora do fluxo de caixa | Não entram no resumo, na regra, nas estatísticas nem nas carteiras | **Correto** |
| 16 | Visibilidade de desejos | `active` visível entre `startMonth` e `targetMonth`; `conquered` some de todos os meses; `expired` só no mês do prazo | **Correto** |
| 17 | Expiração automática de desejos | Ao navegar para mês posterior ao prazo, `active` vira `expired` em lote | **Correto** |
| 18 | Valor mínimo em desejos | Descrição obrigatória e valor > 0 | **Correto** |
| 19 | Conquista com gasto em duas etapas | Desejo só é marcado `conquered` após gasto salvo com sucesso; `linked_expense_id` preenchido | **Correto** |
| 20 | Métricas de carteira | Por papel: movimentação (Entrou/Saiu/Enviado); investimentos (Aportado/Resgatado/posição) | **Correto** |
| 21 | Aporte com origem e destino | Efetivar investimento debita origem (movimentação ou Saldo Livre) e credita destino (investimentos) via `source_account_id` + `account_id` | **Correto** |
| 22 | Vínculo carteira em movimentos | Entradas/gastos: carteira de **movimentação** (ou Saldo Livre). Investimentos: origem movimentação ou Saldo Livre + destino investimentos | **Correto** |
| 23 | Exclusão de carteira | `ON DELETE SET NULL` — movimentos permanecem, apenas desvinculados | **Correto** |
| 24 | Saldo declarado vs carry-forward | Declaração manual = abertura do mês; sem declaração, carry-forward dos meses anteriores | **Correto** |
| 25 | Variação líquida da carteira | **Movimentação:** `inflow − outflow` (aportes enviados saem). **Investimentos:** `inflow + invested − outflow` (posição aplicada) | **Correto** |
| 26 | Alerta ao declarar saldo | Aviso contextual quando há movimentações efetivadas no mês | **Correto** |
| 27 | Gasto em cartão na carteira | Débito único na carteira pagadora ao marcar fatura paga (`invoice_payment`); itens não vinculam carteira | **Correto** |
| 28 | Transferência entre carteiras | `TransferDialog` registra par `transfer_out` + `transfer_in` entre carteiras de **movimentação** e/ou **Saldo Livre**; não afeta resumo mensal nem regra 50/30/20 | **Correto** |
| 29 | Papel obrigatório na criação | Toda carteira nasce como `movement` ou `investment`; subtipo automático para investimentos | **Correto** |
| 30 | Troca de papel bloqueada | Edição impede alterar papel quando há movimentos vinculados à carteira | **Correto** |
| 31 | Resgate no resumo mensal | Ao resgatar, cria entrada automática em Entradas (`received=true`, tag Resgate de investimentos) vinculada à operação; resumo, regra 50/30/20 e estatísticas usam `incomes` como fonte única | **Correto** |
| 32 | Patrimônio estimado consolidado | Soma dos saldos ao fim do mês de todas as carteiras + Saldo Livre (`getTotalEstimatedPatrimony`) | **Correto** |

---

## Achados — regras a corrigir ou decidir

---

### 1. Gastos em categorias não mapeadas entram no saldo mas não na regra

**Severidade:** Alto

**Regra analisada:** Distribuição 50/30/20 deve refletir a realidade financeira do mês.

**Comportamento atual:**
- O resumo mensal soma **todos** os gastos efetivados, inclusive de categorias ainda não mapeadas na regra.
- As barras de Essenciais e Estilo de Vida consideram **apenas** gastos cuja categoria está em `categoryMapping`.
- O sistema alerta com badge quando há categorias novas, mas não quantifica o valor excluído das barras.

**Comportamento esperado:**
- O usuário deve conseguir reconciliar: *“se gastei R$ X no mês, a regra deve explicar para onde foi esse dinheiro”*.
- Alternativa de produto: exibir gastos não classificados em bucket separado (“Não mapeados”) ou impedir que entrem no saldo até mapeamento.

**Impacto:**
- **Usuário:** vê saldo negativo ou gastos altos, mas barras da regra somam menos — perda de confiança no painel.
- **Negócio:** regra financeira deixa de cumprir promessa de “acompanhar seus gastos”.
- **Dados:** números corretos isoladamente, mas **incomparáveis** entre widgets.

**Evidências:** `financialRuleCalculations.ts` filtra por `categoryMapping`; `monthTotals.ts` soma todos os gastos efetivados; badge em `MonthSummarySection`.

**Recomendação:** Definir política explícita para categorias não mapeadas (incluir em bucket, bloquear do saldo, ou exibir linha “Não classificado” com valor). Comunicar ao usuário quando houver divergência.

---

### 2. Visão anual pode ficar desatualizada em edições “todos os meses”

**Severidade:** Alto

**Regra analisada:** Relatório anual deve refletir a mesma verdade financeira que os lançamentos em todos os meses afetados.

**Comportamento atual:**
- Criação com repetição ou parcelas chama atualização dos meses afetados na visão anual.
- Edição ou exclusão com escopo **“todos os meses seguintes”** atualiza o banco em vários meses, mas a visão anual só invalida/atualiza o **mês corrente** no cache.
- Demais meses na visão anual podem permanecer com dados antigos até expiração do cache (5 minutos) ou nova carga completa.

**Comportamento esperado:**
- Qualquer operação que altere lançamentos em N meses deve refletir nos N meses da visão anual.

**Impacto:**
- **Usuário:** gráfico anual mostra valores diferentes do que vê ao navegar mês a mês.
- **Negócio:** relatório anual não confiável para tomada de decisão.
- **Dados:** inconsistência temporária entre visões.

**Evidências:** `useSupabaseFinance` — `addIncome`/`addExpense` com repetição chamam `refreshYearMonths`; `updateIncome`/`updateExpense`/`delete*` com `applyToAllMonths` chamam apenas `invalidateCurrentMonth`.

**Recomendação:** Garantir que operações multi-mês sempre sincronizem todos os meses impactados na visão anual, não apenas o mês navegado.

---

### 3. Resumo usa efetivados; listas destacam totais brutos

**Severidade:** Alto → **Parcialmente resolvido**

**Regra analisada:** Números exibidos em telas adjacentes devem ser comparáveis sem interpretação extra.

**Comportamento atual:**
- **Resumo do mês e visão anual:** toggle **Efetivados | Planejados** no header (`SummaryViewModeToggle`); padrão = efetivados.
- Modo **Planejados:** totais alinhados aos headers das seções (soma nominal de todos os lançamentos).
- Modo **Efetivados:** comportamento anterior; pendências (*A receber · A pagar · A investir*) visíveis quando > 0.
- **Seções de lista:** padrão inalterado (efetivado primário, planejado secundário).

**Comportamento esperado:**
- Usuário alterna entre visão de caixa e visão de planejamento sem ambiguidade.

**Impacto residual:**
- Em modo **Efetivados**, resumo e lista ainda podem divergir se nada estiver marcado — mitigado por legenda e pendências.

**Evidências:** `MonthSummarySection`, `Statistics`, `calculateMonthTotals`, `useSummaryViewMode`.

**Status:** Implementado (opção B da decisão de produto #1).

---

### 3b. (histórico) Resumo só efetivados — antes do toggle

**Recomendação original:** Alinhar hierarquia visual e rótulos em todas as telas. **Atendida** via toggle no resumo e regra.

---

### 4. Repetição mensal não continua no ano seguinte

**Severidade:** Médio

**Regra analisada:** Itens fixos com “repetir todos os meses” devem refletir compromissos recorrentes do usuário.

**Comportamento atual:**
- Repetição insere cópias apenas nos **outros 11 meses do mesmo ano civil** (`calculateRemainingMonths`).
- Assinatura criada em dezembro não gera lançamentos em janeiro do ano seguinte.
- Parcelas, por outro lado, **podem** cruzar anos.

**Comportamento esperado (perspectiva do usuário):**
- “Repetir todos os meses” costuma significar continuidade indefinida ou pelo menos virada de ano.

**Impacto:**
- **Usuário:** esquece de relançar aluguel/salário fixo em janeiro.
- **Negócio:** lacuna em controle de recorrências de longo prazo.
- **Dados:** subcontagem em meses do ano novo.

**Evidências:** `repeatMonths.ts`; documentado como intencional no relatório Dev.

**Recomendação:** Decisão de produto explícita — manter (e comunicar “repetição no ano civil”) ou estender recorrência. Se mantido, avisar no formulário ao ativar repetição perto de dezembro.

---

### 5. Vínculo gasto ↔ cartão pelo nome, não por identificador

**Severidade:** Médio

**Regra analisada:** Integridade do vínculo entre gasto e cartão ao longo do tempo.

**Comportamento atual:**
- `payment_method` armazena o **nome** do cartão.
- Status de pago efetivo compara `expense.paymentMethod` com `creditCard.name`.
- Renomear cartão propaga para gastos — correto quando funciona.
- Não há proteção contra inconsistências se nome for alterado fora do fluxo ou houver ambiguidade.

**Comportamento esperado:**
- Vínculo estável e imune a renomeações parciais ou divergências de texto.

**Impacto:**
- **Usuário:** gasto pode deixar de ser associado ao cartão; fatura paga não reflete no gasto.
- **Negócio:** erros silenciosos em totais efetivados.
- **Dados:** integridade referencial frágil.

**Evidências:** `monthTotals.isExpenseEffectivelyPaid`; modelo `Expense.paymentMethod` vs `CreditCard.id`.

**Recomendação:** Avaliar vínculo por identificador estável do cartão, mantendo nome apenas para exibição.

---

### 6. Barra de seleção ignora itens não efetivados sem explicar

**Severidade:** Médio

**Regra analisada:** Seleção múltipla deve representar intenção do usuário ao somar valores.

**Comportamento atual:**
- Usuário pode selecionar lançamentos não efetivados (checkbox visual na linha).
- A barra inferior só soma itens **efetivados** entre os selecionados.
- Rótulo: *"Itens selecionados (efetivados)"* — mas seleção visual permanece ativa com total R$ 0.

**Comportamento esperado:**
- Seleção vazia na barra com itens marcados na lista deve ter feedback claro, ou a soma deve incluir todos os selecionados.

**Impacto:**
- **Usuário:** acha que a seleção “não funciona”.
- **Negócio:** funcionalidade de seleção perde utilidade prática.

**Evidências:** `Index.tsx` `selectionSummary`; `SelectionBottomBar.tsx`.

**Recomendação:** Ou somar todos os selecionados (com rótulo “valores nominais”), ou desabilitar seleção de não efetivados, ou exibir contador “3 selecionados, 0 efetivados”.

---

### 7. Métodos de pagamento não personalizáveis

**Severidade:** Médio

**Regra analisada:** Usuário deve registrar gastos com a forma de pagamento real.

**Comportamento atual:**
- Lista fixa: Dinheiro, Pix, Débito, Boleto + cartões cadastrados.
- Não é possível adicionar “PIX Empresa”, “VR”, etc. sem alterar banco.

**Comportamento esperado:**
- Personal finance apps permitem customizar formas de pagamento.

**Impacto:**
- **Usuário:** agrupa gastos em categorias genéricas ou descrição livre.
- **Negócio:** limitação para perfis com múltiplas contas/meios.
- **Dados:** perda de granularidade analítica.

**Evidências:** `DEFAULT_PAYMENT_METHODS`; settings somente leitura para payment methods.

**Recomendação:** Decidir se é escopo do MVP ou documentar limitação na interface.

---

### 8. Resgate de investimentos sem vínculo com o módulo Entradas

**Severidade:** Médio → **Resolvido (comunicação + resumo)**

**Regra analisada:** Movimentação patrimonial deve ser rastreável entre aplicação e resgate.

**Comportamento atual:**
- `WithdrawalDialog` registra resgate a partir de carteira de **investimentos**, com destino em carteira de **movimentação** (par `transfer_out` + `transfer_in`) ou **Saldo Livre** (`withdrawal`).
- A posição aplicada na carteira de investimentos **diminui** corretamente; liquidez aumenta no destino.
- O resumo mensal, a regra 50/30/20 e Entradas refletem resgate via **entrada automática** (`createResgateIncome`) vinculada à operação (`source_operation_id`).
- O módulo **Entradas** exibe o lançamento com tag “Resgate de investimentos”, já recebido.

**Comportamento esperado:**
- Patrimônio por carteira: resgate debita investimentos e credita movimentação/Saldo Livre — **atendido**.
- Fluxo de caixa no resumo: entrada de caixa refletida nos dois destinos de resgate — **atendido**.

**Impacto residual:**
- **Usuário:** chips e resumo alinhados; toast e glossário explicam conversão patrimonial vs fluxo de caixa.
- **Negócio:** regra 50/30/20 não inclui resgate no denominador (resgate ≠ renda).

**Evidências:** `createResgateIncome`, `source_operation_id` em `incomes`; `createWithdrawal` em `useSupabaseFinance`; `FinancialGlossaryDialog` (entrada “Resgate”).

**Recomendação:** Manter — sem criar `Income` automático após resgate.

---

### 9. Chip do cartão mostra fatura total; resumo usa só fatura paga

**Severidade:** Médio

**Regra analisada:** Total exibido no cartão deve ter significado claro.

**Comportamento atual:**
- Chip do cartão: soma de **todos** os gastos do mês naquele cartão (valor da fatura).
- Resumo mensal: esses gastos só entram em “Gastos” quando fatura marcada como paga.

**Comportamento esperado:**
- Para controle de fatura: chip correto (total da fatura).
- Para fluxo de caixa: resumo correto (só quando pago).
- Usuário precisa entender as duas leituras.

**Impacto:**
- **Usuário:** “Gastos no resumo ≠ total no cartão” antes de marcar fatura paga — pode parecer erro.
- **Negócio:** requer educação do usuário.
- **Dados:** numericamente coerente se explicado.

**Evidências:** `getCreditCardTotal` soma todos; `isExpenseEffectivelyPaid` depende de status mensal.

**Recomendação:** Rotular chip como “Fatura do mês” e manter distinção visível entre comprometido (fatura) e efetivado (pago).

---

### 10. Sem visão consolidada “planejado vs realizado”

**Severidade:** Médio → **Resolvido**

**Regra analisada:** Usuário precisa planejar o mês e acompanhar execução.

**Comportamento atual:**
- Toggle **Efetivados | Planejados** no resumo mensal, estatísticas anuais e regra financeira.
- Modo efetivado: pendências (*A receber · A pagar · A investir*) como delta.
- Modo planejado: totais nominais; resgates **não** entram em entradas planejadas.
- Gastos de cartão no planejado: todos os lançamentos (alinha com chip do cartão).

**Status:** Implementado. Painel comparativo lado a lado permanece fora de escopo (YAGNI).

---

### 11. Validações de negócio apenas no cliente

**Severidade:** Médio

**Regra analisada:** Integridade dos dados financeiros em ambiente SaaS.

**Comportamento atual:**
- Regras (valor > 0, mapeamento de categorias, soma 100%, bloqueio de exclusão) validadas no frontend.
- Banco confia em RLS por usuário, sem constraints de negócio equivalentes documentados.

**Comportamento esperado:**
- Dados incorretos não devem persistir mesmo via API direta ou manipulação.

**Impacto:**
- **Usuário:** normalmente protegido pela UI.
- **Negócio:** risco em evoluções futuras (modo API, integrações).
- **Dados:** possível inconsistência fora do fluxo UI.

**Evidências:** `PLANO_FRONTEND_DIRETO_SUPABASE.md`; relatório QA transversal.

**Recomendação:** Documentar como limitação aceita no MVP ou planejar validação no banco para regras críticas (percentuais, valores positivos).

---

### 12. Exclusão de regra financeira indisponível na interface

**Severidade:** Baixo

**Regra analisada:** Usuário deve poder recomeçar configuração da regra.

**Comportamento atual:**
- `deleteRule` existe no hook; nenhum botão na UI.

**Comportamento esperado:**
- Opção de remover regra e reconfigurar do zero.

**Impacto:**
- **Usuário:** preso à regra existente; só pode editar.
- **Negócio:** fricção baixa, mas incompletude funcional.

**Recomendação:** Expor ação de resetar regra ou confirmar que edição cobre o caso.

---

### 13. Gasto da conquista nasce não efetivado — desejo “realizado” mas saldo intacto

**Severidade:** Médio

**Regra analisada:** Conquistar desejo com gasto deve refletir o impacto financeiro da realização.

**Comportamento atual:**
- Fluxo “Sim, incluir gasto” pré-preenche o formulário com `paid: false`.
- O desejo só é marcado `conquered` após salvar o gasto, mas o gasto **não entra no saldo** até ser marcado pago (ou fatura paga, se cartão).
- Usuário pode interpretar conquista como “já gastei”.

**Comportamento esperado:**
- Ou o gasto da conquista nasce efetivado (`paid: true`), ou a UI deixa explícito que a conquista é planejamento e o gasto ainda precisa ser efetivado para impactar o saldo.

**Impacto:**
- **Usuário:** marca desejo como conquistado, mas resumo mensal não muda — sensação de inconsistência.
- **Negócio:** desconexão entre módulo de desejos e fluxo de caixa.
- **Dados:** `linked_expense_id` existe, mas gasto pode permanecer não efetivado indefinidamente.

**Evidências:** `Index.tsx` `expenseDraft` com `paid: false`; critério efetivado em `monthTotals.ts`.

**Recomendação:** Definir política de produto para conquista com gasto (efetivar automaticamente vs. manter planejado com rótulo claro). Comunicar no dialog de conquista.

---

### 14. Valor do gasto pode divergir do valor do desejo na conquista

**Severidade:** Médio

**Regra analisada:** Realização de um desejo deve ser rastreável em relação ao valor planejado.

**Comportamento atual:**
- O rascunho de gasto herda descrição e valor do desejo, mas o usuário pode alterar livremente antes de salvar.
- `linked_expense_id` vincula os registros, mas não há validação de que os valores coincidem.
- Total da seção Desejos (soma dos valores planejados) não se reconcilia automaticamente com o gasto efetivo.

**Comportamento esperado:**
- Usuário deve conseguir entender a diferença entre “planejei R$ X” e “gastei R$ Y”, ou o sistema deve alertar quando houver divergência relevante.

**Impacto:**
- **Usuário:** planejamento de desejos perde confiabilidade como meta de consumo.
- **Negócio:** módulo de desejos deixa de servir como controle de orçamento por item.
- **Dados:** vínculo existe, mas sem regra de reconciliação de valores.

**Evidências:** `Index.tsx` `handleWishConquer` → `expenseDraft`; `WishSection` total planejado vs gasto editável em `ExpenseSection`.

**Recomendação:** Exibir diferença planejado vs. realizado ao salvar, ou bloquear edição de valor no fluxo de conquista (decisão de produto).

---

### 15. Dois conceitos de “saldo” sem glossário unificado

**Severidade:** Alto → **Parcialmente resolvido**

**Regra analisada:** Números financeiros exibidos devem ter significado único e comparável.

**Comportamento atual:**
- **Saldo do mês** (resumo): entradas − gastos − investimentos **efetivados** no mês corrente.
- **Saldo da carteira** (chip): patrimônio cumulativo por **papel** — liquidez (movimentação) ou posição aplicada (investimentos).
- **Saldo Livre** (chip): movimentos efetivados sem carteira + resgates para fora das carteiras nomeadas.
- `FinancialGlossaryDialog` passou a explicar Saldo Livre, papéis de carteira, aporte origem/destino, resgate e transferência — mas não há painel que una as três leituras na mesma tela.

**Comportamento esperado:**
- Usuário deve entender que saldo do mês ≠ patrimônio na carteira ≠ Saldo Livre, ou o produto deve oferecer visão consolidada.

**Impacto residual:**
- **Usuário:** ainda pode estranhar “saldo do mês R$ 2.000” vs “Nubank liquidez R$ 8.500” vs “Corretora posição R$ 3.000”.
- **Negócio:** promessa de “organizar onde está o dinheiro” melhorou com papéis, mas educação continua necessária.

**Evidências:** `MonthSummarySection` vs `AccountStrip` + `getAccountClosingBalance`; `FinancialGlossaryDialog`; subtítulos Liquidez / Posição aplicada.

**Recomendação:** Manter glossário atualizado; rótulos distintos nos chips. Decidir se o produto promete saldo real ou organização patrimonial estimada.

---

### 16. Movimentos sem carteira — cobertos pelo chip Saldo Livre

**Severidade:** Médio → **Parcialmente resolvido**

**Regra analisada:** Totais por carteira devem cobrir ou explicitar movimentos não classificados.

**Comportamento atual:**
- `account_id` é opcional em entradas e gastos na criação; na **efetivação**, `EffectuateWalletDialog` oferece carteira de movimentação ou **Saldo Livre**.
- Movimentos efetivados sem carteira entram no resumo mensal e no chip **Saldo Livre** (`getUnlinkedMonthTotals` / `getUnlinkedClosingBalance`).
- Carteiras nomeadas não incluem esses movimentos — comportamento correto por design.
- Soma **Saldo Livre + chips de carteiras** pode divergir do resumo mensal quando há investimentos (resumo desconta aportes; patrimônio total nas carteiras conserva valor aplicado).

**Comportamento esperado:**
- Usuário que adota carteiras deve ver onde ficou o dinheiro sem carteira — **atendido** via Saldo Livre.
- Reconciliação resumo ↔ soma de todos os chips ainda exige entender papéis e investimentos.

**Impacto residual:**
- **Usuário:** pode não perceber que Saldo Livre agrega o “sem carteira”.
- **Negócio:** incentivo a vincular na efetivação existe (dialog obrigatório), mas não há alerta ao criar sem efetivar.

**Evidências:** `EffectuateWalletDialog`, `getUnlinkedNetVariation`, chip Saldo Livre em `AccountStrip`.

**Recomendação:** Manter Saldo Livre visível; considerar lembrete ao efetivar pendências antigas sem carteira.

---

### 17. Saldo estimado da carteira depende de declaração e histórico carregado

**Severidade:** Médio

**Regra analisada:** Saldo exibido na carteira deve refletir a realidade financeira do usuário.

**Comportamento atual:**
- Sem declaração manual, o saldo é carry-forward de meses anteriores com movimentos efetivados vinculados.
- O intervalo histórico buscado depende de âncoras de saldo declarado e do `earliestMovementMonth`.
- Se o primeiro movimento vinculado ocorrer na sessão atual, o carry-forward cross-year pode ficar impreciso até reload.

**Comportamento esperado:**
- Saldo cumulativo deve incluir toda a cadeia desde o primeiro movimento, ou o produto deve exigir declaração explícita com UX orientativa.

**Impacto:**
- **Usuário:** saldo no chip pode estar subestimado em cenários de longa data ou primeira vinculação na sessão.
- **Negócio:** decisões baseadas em saldo estimado incorreto.
- **Dados:** número derivado sensível a escopo de fetch, não a ledger completo.

**Evidências:** `getAccountOpeningBalance`, `getAccountHistoryFetchRange`, `fetchEarliestMovementMonth` em `useSupabaseFinance`.

**Recomendação:** Atualizar `earliestMovementMonth` ao vincular primeiro movimento na sessão; comunicar que saldo é **estimado** e depende de declarações periódicas.

---

### 18. Transferências entre carteiras — implementado (movimentação ↔ Saldo Livre)

**Severidade:** Baixo → **Resolvido**

**Regra analisada:** Movimentação entre contas do mesmo usuário não deve distorcer totais globais nem exigir lançamentos manuais duplicados.

**Comportamento atual:**
- `TransferDialog` registra par atômico `transfer_out` + `transfer_in` via `account_operations`, entre carteiras de **movimentação** e/ou **Saldo Livre** (um lado com `account_id` nulo).
- Resumo mensal: impacto líquido zero no fluxo de caixa (não cria entrada nem gasto).
- Chips: origem diminui, destino aumenta — correto por carteira e por Saldo Livre.
- Tooltip orienta: *“Para aplicar dinheiro, use Investimentos.”*

**Comportamento esperado:**
- Transferência interna sem afetar resumo nem regra 50/30/20 — **atendido** para movimentação e Saldo Livre.

**Limitação residual:**
- Aplicar dinheiro entre papéis (movimentação → investimentos) usa fluxo de **Investimentos** (aporte origem/destino), não transferência.

**Evidências:** `TransferDialog`, `createTransfer` em `useSupabaseFinance`; `account_operations` com `transferGroupId`; `getUnlinkedMonthTotals` para transferências com origem/destino nulo.

**Status:** Implementado (lacuna C4 fechada; estendido para Saldo Livre).

---

## Módulo: Lista de Desejos

| Campo | Valor |
|-------|-------|
| **Objetivo** | Planejar metas de consumo com valor, urgência e prazo, sem impactar fluxo de caixa |
| **Posicionamento** | Aba mensal em Registros; isolada do resumo, regra, estatísticas e carteiras |
| **Referência QA** | [13-lista-desejos.md](../QA/relatorios/13-lista-desejos.md) |

### Veredito do módulo

**Aprovado com ressalvas.** O isolamento financeiro está correto e as regras de visibilidade, expiração e conquista são previsíveis. As ressalvas concentram-se na **ponte desejo → gasto** (efetivação, divergência de valor) e na **reconciliação planejado vs. realizado**.

### Regras de negócio validadas

| Regra | Resultado |
|-------|-----------|
| Desejos não alteram saldo mensal | Correto — ausentes de `MonthSummarySection` e `monthTotals` |
| Visibilidade `active` entre meses | Correto — desejo criado em jan/2026 visível em mar/2026 se prazo ≥ mar |
| Conquista remove de todos os meses | Correto — `status = conquered` → `isWishVisibleInMonth` false |
| Expiração automática | Correto — batch no load; feedback via toast |
| Expirado só no mês do prazo | Correto — permite renovar ou excluir |
| Renovação reativa item | Correto — `expired` → `active` com novo `targetMonth` |
| Conquista adiada até gasto salvo | Correto — fluxo em duas etapas pós-correção QA |
| Cancelamento limpa pendência | Correto — troca de aba/mês cancela `pendingWishConquer` |

### Lacunas de negócio específicas

| # | Lacuna | Severidade |
|---|--------|------------|
| D1 | Gasto da conquista não efetivado (achado #13) | Médio |
| D2 | Valor do gasto editável vs. valor planejado (achado #14) | Médio |
| D3 | Desejo sem sugestão de carteira no rascunho de gasto | Baixo |
| D4 | Gasto salvo com falha na conquista — expense órfão, wish `active` | Baixo |
| D5 | Total da seção = soma planejada; não há “realizado” agregado | Baixo |

**D3 — Detalhe:** ao conquistar com gasto, o rascunho não pré-seleciona carteira. Usuário que organiza por contas precisa vincular manualmente — gap de continuidade entre planejamento e execução.

**D5 — Detalhe:** `SectionTotalsHeader` exibe total planejado e contagem de itens. Não há métrica “conquistado no mês” ou “valor efetivamente gasto via desejos” — aceitável se desejos forem só planejamento, mas limita visão de execução.

---

## Módulo: Carteiras

| Campo | Valor |
|-------|-------|
| **Objetivo** | Organizar movimentos por conta e exibir saldo estimado cumulativo com declaração manual |
| **Posicionamento** | Faixa global (`AccountStrip`) entre resumo e registros; vínculo na **efetivação** (dialog) em Entradas/Gastos/Investimentos; fatura de cartão inalterada |
| **Referência QA** | [14-carteiras.md](../QA/relatorios/14-carteiras.md), [proposta-feature-contas.md](../DEV/proposta-feature-contas.md) |

### Veredito do módulo

**Aprovado com ressalvas.** Critério efetivado alinhado ao resumo, papéis de carteira (movimentação vs investimentos), aporte origem/destino, transferências mov→mov e carry-forward cross-year corrigidos na maior parte dos cenários. Ressalvas em **três leituras de patrimônio na mesma tela**, **movimentos sem carteira** e **dependência de declaração/histórico** para precisão do chip.

### Regras de negócio validadas

| Regra | Resultado |
|-------|-----------|
| Entrou / Saiu / Aportado = efetivados | Correto — paridade com resumo mensal |
| Aporte origem/destino | Correto — movimentação perde liquidez; investimentos ganham posição |
| Papéis de carteira | Correto — movimentação vs investimentos; vínculos restritos por tipo |
| `account_id` em repetições | Correto — **não** propagado; definido por mês na efetivação |

### Lacunas de negócio específicas

| # | Lacuna | Severidade |
|---|--------|------------|
| C1 | Três leituras de patrimônio (achado #15) | Alto — glossário ampliado, sem painel consolidado |
| C2 | Movimentos sem carteira (achado #16) | Médio — **Saldo Livre cobre**; reconciliação resumo ↔ patrimônio total ainda parcial |
| C3 | Saldo estimado sensível a histórico/declaração (achado #17) | Médio |
| C4 | Transferências internas mov→mov (achado #18) | **Fechado** |
| C5 | `earliestMovementMonth` stale na sessão | Baixo |
| C6 | Cartão de crédito sem vínculo com carteira pagadora | **Fechado** |
| C7 | Carteira vinculada só na efetivação (não-cartão) | **Fechado** |
| C8 | Aporte com origem e destino; papéis de carteira | **Fechado** |

**C4 — Detalhe (implementado):** `TransferDialog` entre carteiras de movimentação; par `transfer_out` + `transfer_in` em `account_operations`. Não altera resumo mensal nem regra. Aplicação em investimentos usa aporte (C8), não transferência.

**C6 — Detalhe (implementado):** ao marcar fatura como paga, o usuário escolhe a carteira pagadora. O sistema registra um único débito (`invoice_payment`) pelo total da fatura. Gastos individuais em cartão não vinculam carteira por item.

**C7 — Detalhe (implementado):** entradas e gastos (não-cartão) abrem `EffectuateWalletDialog` ao efetivar (carteiras de **movimentação** ou Saldo Livre). Investimentos usam `EffectuateInvestmentDialog` com origem (movimentação) e destino (investimentos). Desefetivar limpa vínculos.

**C8 — Detalhe (implementado):** carteiras têm papel obrigatório (`movement` | `investment`). Chip de movimentação = liquidez (`inflow − outflow`, inclui aportes enviados). Chip de investimentos = posição aplicada (`aportes + transfer_in − resgates`). Aporte: origem movimentação ou Saldo Livre (`source_account_id` null) → destino investimentos. Transferências internas entre carteiras de movimentação e Saldo Livre. Resgate: origem investimentos → destino movimentação ou Saldo Livre.

---

## Cenários extremos validados

| Cenário | Resultado | Observação |
|---------|-----------|------------|
| Nenhuma entrada recebida | Saldo pode ser negativo só com gastos/investimentos efetivados; regra mostra 0% | Matematicamente correto; pode confundir |
| Renda recebida = 0 na regra | Percentuais = 0; metas em R$ = 0 | Evita divisão por zero — correto |
| Valor zerado ou negativo no formulário | Bloqueado (valor > 0) | Correto |
| Fatura de cartão não paga | Gastos do cartão fora do resumo efetivado | Correto para visão de caixa |
| Parcela excluída “este mês” | Parcelas futuras permanecem | Comportamento de negócio válido; série pode ter “buraco” |
| Dezembro + repetição mensal | Janeiro seguinte sem cópia | Ver achado #4 |
| Categoria nova usada antes de mapear | Entra no saldo, não na regra | Ver achado #1 |
| Usuário com muitos lançamentos | Cálculos permanecem corretos | Performance é outro domínio |
| Desejo com prazo no mês atual | Alerta âmbar; expira ao mudar de mês | Correto; renovação disponível |
| Conquistar desejo sem gasto | Some da lista; saldo inalterado | Correto — isolamento financeiro |
| Conquistar com gasto, não marcar pago | Desejo conquered; saldo não reflete gasto | Ver achado #13 |
| Carteira sem movimentos vinculados | Chip mostra só saldo declarado ou zero | Correto |
| Movimento efetivado sem `accountId` | Entra no resumo e no chip **Saldo Livre** | Ver achado #16 |
| Declarar saldo com movimentos no mês | Alerta + preview de fechamento | Correto |
| Excluir carteira com movimentos | Movimentos permanecem; `accountId` null no DB | Correto; estado local sincronizado pós-correção |
| Investimento legado sem origem/destino | Efetivado só com `account_id` (destino); `source_account_id` null | Re-efetivar com `EffectuateInvestmentDialog` para corrigir liquidez na origem |
| Aporte mesma carteira (pré-C8) | Chip inflava com `inflow − outflow + invested` | Corrigido — origem movimentação debita; destino investimentos credita |

---

## Decisões de produto pendentes

| # | Pergunta | Opções |
|---|----------|--------|
| 1 | O produto é focado em **caixa efetivado** ou **planejamento + execução**? | **Decidido: B) Ambos com toggle** — padrão efetivado; planejado via toggle no resumo/regra/anual |
| 2 | Como tratar **categorias não mapeadas** na regra? | A) Bucket “Não classificado” B) Excluir do saldo C) Obrigar mapeamento antes de usar |
| 3 | **Repetição mensal** deve cruzar ano? | A) Sim, indefinida B) Não, só ano civil (atual) C) Perguntar ao usuário |
| 4 | **Investimentos** são fluxo de caixa ou posição? | **Parcialmente decidido: C) Híbrido** — resumo mensal = fluxo (aportes efetivados saem do caixa); carteiras de investimentos = posição aplicada; aporte exige origem (movimentação) + destino (investimentos) |
| 5 | **Métodos de pagamento** customizáveis? | A) Sim B) Não no MVP |
| 6 | **Conquista com gasto** deve efetivar o gasto automaticamente? | A) Sim (`paid: true`) B) Não — usuário efetiva depois (atual) C) Perguntar no dialog |
| 7 | **Carteiras** prometem saldo real ou organização? | A) Organização + estimativa (atual) B) Saldo real com declaração obrigatória C) Ledger completo |
| 8 | **Movimentos sem carteira** quando usuário tem carteiras? | **Parcialmente decidido:** efetivação exige escolha (carteira movimentação ou Saldo Livre); criação ainda permite pendente sem carteira |

---

## Matriz de prioridade para o time

| Prioridade | Achado | Tipo de ação |
|------------|--------|--------------|
| **P1** | Categorias não mapeadas vs regra (#1) | Regra de produto + comunicação |
| **P1** | Visão anual desatualizada em apply-to-all (#2) | Correção de consistência |
| **P1** | Resumo efetivado vs listas brutas (#3) | ~~Alinhamento de UX/regra~~ **Resolvido (toggle)** |
| **P1** | Dois conceitos de saldo (#15) | Glossário + decisão de produto — **glossário ampliado (C8)** |
| **P2** | Repetição não cruza ano (#4) | Decisão de produto |
| **P2** | Seleção vs efetivados (#6) | Clarificação de comportamento |
| **P2** | Chip cartão vs resumo (#9) | Rótulos e educação |
| **P2** | Planejado vs realizado (#10) | ~~Decisão de produto~~ **Resolvido (toggle)** |
| **P2** | Gasto da conquista não efetivado (#13) | Regra de produto |
| **P2** | Movimentos sem carteira (#16) | ~~Indicador ou alerta~~ **Parcial — Saldo Livre** |
| **P3** | Valor desejo vs gasto (#14) | Reconciliação ou bloqueio |
| **P3** | Saldo carteira vs histórico (#17) | Hardening carry-forward |
| **P3** | Vínculo cartão por nome (#5) | Integridade de dados |
| **P3** | Métodos de pagamento (#7) | Backlog feature |
| **P3** | Resgate vs investimento (#8) | ~~Documentação / feature~~ **Resolvido — resgate no resumo + comunicação** |
| **P4** | Validação só no client (#11) | Risco aceito ou hardening |
| **P4** | deleteRule sem UI (#12) | Backlog |
| **P4** | Transferências entre carteiras (#18) | ~~Backlog / documentação~~ **Resolvido (C4)** |
| **P4** | Desejo sem carteira no rascunho (D3) | Melhoria de fluxo |

---

## Resultado final

### **Aprovado com ressalvas**

As regras centrais de **efetivados**, **cartões**, **saldo mensal**, **carteiras** (com papéis e patrimônio por conta) e **regra 50/30/20** estão alinhadas após as correções recentes, incluindo **C8** (aporte origem/destino e fórmulas por papel). A **lista de desejos** cumpre corretamente seu papel de planejamento isolado do fluxo de caixa. O produto produz resultados **corretos e previsíveis** na maioria dos fluxos de uso diário.

As ressalvas concentram-se em:
1. **Reconciliação** entre resumo, listas, regra financeira e carteiras.
2. **Consistência da visão anual** em operações multi-mês.
3. **Três leituras de patrimônio** na mesma tela (saldo do mês, chips por carteira, Saldo Livre) — glossário ampliado, mas sem visão consolidada.
4. **Ponte desejo → gasto** (efetivação e divergência de valores).
5. **Decisões de produto** ainda não formalizadas (recorrência anual, categorias não mapeadas, promessa de saldo em carteiras). **Planejado vs realizado:** resolvido via toggle. **Investimentos híbridos (fluxo + posição):** parcialmente resolvido via C8.

Nenhuma inconsistência identificada é **crítica** para uso pessoal individual, mas devem ser endereçadas antes de posicionar o produto como ferramenta confiável de relatório anual, planejamento financeiro estruturado e **controle patrimonial por conta**.

---

## Referências

- [Business Specialist](./business-specialist.mdc)
- [ANALISE Frontend](../ANALISE_FRONTEND_QA.md) — *nota: seções de resumo/regra desatualizadas quanto a efetivados; código prevalece*
- [QA Lista de Desejos](../QA/relatorios/13-lista-desejos.md)
- [QA Carteiras](../QA/relatorios/14-carteiras.md)
- [Proposta Carteiras](../DEV/proposta-feature-contas.md)
- [QA Transversal](../QA/relatorios/99-transversal.md)
- [Validação](../VALIDATION/relatorio-validacao-correcoes-qa.md)
- [Performance](../PERFORMANCE/relatorio-performance-frontend.md)
