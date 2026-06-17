# Relatório de Regras de Negócio — Tidy Month Tracker

| Campo | Valor |
|-------|-------|
| **Data** | 2026-06-17 |
| **Agente** | Business Rules Auditor (`docs/BUSINESS/business-specialist.mdc`) |
| **Escopo** | Produto financeiro pessoal — frontend Supabase pós-correções QA/Dev |
| **Referências** | [QA 01–12](../QA/relatorios/), [Dev](../DEV/relatorio-correcoes-qa.md), [Validação](../VALIDATION/relatorio-validacao-correcoes-qa.md), [ANALISE](../ANALISE_FRONTEND_QA.md) |

---

## Resumo executivo

O produto controla **entradas, gastos e investimentos** por mês, com cartões de crédito, regra financeira 50/30/20 (ou personalizada) e visão anual. Após as correções recentes, a taxonomia **efetivados** (recebido / pago / investido) foi unificada no resumo mensal, na regra financeira, na seleção e nas estatísticas anuais — avanço relevante de consistência.

| Classificação | Quantidade |
|---------------|------------|
| Regras corretas e consistentes | 14 áreas |
| Inconsistências / lacunas | 12 achados |
| Decisões de produto pendentes | 5 |

### Veredito geral

**Aprovado com ressalvas para uso pessoal / beta fechado.** O núcleo financeiro (saldo, cartões, efetivados) é coerente na maior parte dos fluxos. Persistem lacunas que podem produzir **números que o usuário não consegue reconciliar** entre resumo, listas, regra e visão anual — especialmente em categorias não mapeadas, operações “todos os meses” e diferença entre totais planejados vs efetivados nas seções de lista.

---

## Taxonomia financeira vigente

| Conceito | Definição no produto | Onde se aplica |
|----------|---------------------|----------------|
| **Efetivado** | Entrada com `received`, gasto com `paid` (ou fatura de cartão paga), investimento com `invested` | Resumo mensal, regra financeira, seleção, estatísticas anuais |
| **Planejado / nominal** | Valor lançado independente das flags | Headers das seções Entradas/Gastos/Investimentos; total do chip do cartão |
| **Saldo do mês** | Entradas efetivadas − Gastos efetivados − Investimentos efetivados | `MonthSummarySection` |

Legenda exibida ao usuário: *"Apenas itens marcados como recebido, pago ou investido"* (resumo e visão anual).

---

## Mapa de consistência entre módulos

```
                    ┌─────────────────┐
                    │  Lançamentos    │
                    │ (listas/seções) │
                    └────────┬────────┘
                             │ total bruto + subtotal efetivado
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌──────────────┐ ┌──────────┐ ┌─────────────┐
      │ Resumo mês   │ │  Regra   │ │ Estatística │
      │ (efetivados) │ │ 50/30/20 │ │   anual     │
      └──────┬───────┘ └────┬─────┘ └──────┬──────┘
             │              │               │
             └──────────────┴───────────────┘
                    monthTotals.ts
                    (mesma lógica de pago em cartão)
```

| Par cruzado | Consistente? | Observação |
|-------------|--------------|------------|
| Resumo ↔ Estatísticas anuais | **Sim** | Mesmo critério efetivado + status de cartão |
| Resumo ↔ Regra financeira | **Parcial** | Gastos em categorias não mapeadas entram no resumo mas não nas barras |
| Resumo ↔ Headers das seções | **Parcial** | Seções destacam total bruto; resumo só efetivados |
| Chip do cartão ↔ Resumo gastos | **Parcial** | Chip soma todos os gastos do cartão; resumo só conta se fatura paga |
| Seleção ↔ Resumo | **Sim** | Ambos usam efetivados; ver achado de UX na seleção |
| Parcelas ↔ Visão anual | **Parcial** | Criação multi-mês atualiza ano; edição/exclusão “todos os meses” pode não atualizar |

---

## Regras confirmadas como corretas

| # | Regra | Comportamento esperado | Status |
|---|-------|------------------------|--------|
| 1 | Saldo mensal | Receitas efetivadas menos gastos e investimentos efetivados | **Correto** |
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

**Severidade:** Alto

**Regra analisada:** Números exibidos em telas adjacentes devem ser comparáveis sem interpretação extra.

**Comportamento atual:**
- **Resumo do mês:** entradas, gastos, investimentos e saldo = apenas efetivados.
- **Seção Entradas:** destaque principal = total de todos os lançamentos; “Recebido” aparece como secundário.
- **Seção Gastos:** destaque principal = total bruto; “Pago” como secundário.
- **Seção Investimentos:** mesmo padrão (total vs investido).

**Comportamento esperado:**
- Usuário que olha o resumo e a lista lado a lado espera que os totais coincidam, ou que rótulos deixem claro “planejado” vs “realizado” em ambos os lugares.

**Impacto:**
- **Usuário:** “Por que o resumo mostra R$ 0 em gastos se minha lista mostra R$ 3.000?” — quando nada está marcado pago.
- **Negócio:** fricção na adoção; suporte com dúvidas recorrentes.
- **Dados:** ambos corretos sob definições diferentes, mas **semanticamente conflitantes**.

**Evidências:** `MonthSummarySection` + `calculateEffectiveMonthTotals`; headers em `IncomeSection`, `ExpenseSection`, `InvestmentSection`.

**Recomendação:** Alinhar hierarquia visual e rótulos em todas as telas (ex.: primário = efetivado em todo o app, ou resumo também mostrar planejado). Documentar glossário para o usuário.

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

### 8. Resgate de investimentos sem vínculo com o módulo Investimentos

**Severidade:** Médio

**Regra analisada:** Movimentação patrimonial deve ser rastreável entre aplicação e resgate.

**Comportamento atual:**
- Tag de entrada “Resgate de investimentos” existe.
- Módulo Investimentos registra aportes com flag `invested`.
- Não há ligação automática entre resgate (entrada) e redução de investimento.

**Comportamento esperado:**
- Usuário avançado espera que resgate diminua posição investida ou gere par de lançamentos vinculados.

**Impacto:**
- **Usuário:** saldo e regra podem inflar investimentos se marcar aporte mas não registrar resgate no módulo correto.
- **Negócio:** visão patrimonial incompleta.
- **Dados:** dupla contagem manual.

**Evidências:** `DEFAULT_INCOME_TAGS`; módulos Entradas e Investimentos independentes.

**Recomendação:** Definir se o produto trata investimento como fluxo de caixa (atual) ou posição patrimonial. Se fluxo, documentar que resgate deve ser entrada manual sem vínculo.

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

**Severidade:** Médio

**Regra analisada:** Usuário precisa planejar o mês e acompanhar execução.

**Comportamento atual:**
- Após unificação em efetivados, o resumo **não** exibe totais planejados.
- Listas mostram bruto + subtotal efetivado de forma desigual entre seções.
- Não há painel comparativo mensal (planejado | realizado | diferença).

**Comportamento esperado:**
- Produto de controle mensal tipicamente oferece ambas as leituras ou alternância clara.

**Impacto:**
- **Usuário:** não vê quanto ainda falta receber/pagar/investir no mês.
- **Negócio:** perda de valor de planejamento.
- **Dados:** informação existe nos lançamentos, não agregada no resumo.

**Recomendação:** Decidir se o produto é “caixa efetivado” (atual) ou “planejado + realizado”. Se caixa, reforçar messaging; se planejado, restaurar métricas planejadas no resumo com rótulos distintos.

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

---

## Decisões de produto pendentes

| # | Pergunta | Opções |
|---|----------|--------|
| 1 | O produto é focado em **caixa efetivado** ou **planejamento + execução**? | A) Só efetivado (atual) B) Ambos com toggle C) Ambos sempre visíveis |
| 2 | Como tratar **categorias não mapeadas** na regra? | A) Bucket “Não classificado” B) Excluir do saldo C) Obrigar mapeamento antes de usar |
| 3 | **Repetição mensal** deve cruzar ano? | A) Sim, indefinida B) Não, só ano civil (atual) C) Perguntar ao usuário |
| 4 | **Investimentos** são fluxo de caixa ou posição? | A) Fluxo (atual) B) Posição com vínculo resgate C) Híbrido |
| 5 | **Métodos de pagamento** customizáveis? | A) Sim B) Não no MVP |

---

## Matriz de prioridade para o time

| Prioridade | Achado | Tipo de ação |
|------------|--------|--------------|
| **P1** | Categorias não mapeadas vs regra (#1) | Regra de produto + comunicação |
| **P1** | Visão anual desatualizada em apply-to-all (#2) | Correção de consistência |
| **P1** | Resumo efetivado vs listas brutas (#3) | Alinhamento de UX/regra |
| **P2** | Repetição não cruza ano (#4) | Decisão de produto |
| **P2** | Seleção vs efetivados (#6) | Clarificação de comportamento |
| **P2** | Chip cartão vs resumo (#9) | Rótulos e educação |
| **P2** | Planejado vs realizado (#10) | Decisão de produto |
| **P3** | Vínculo cartão por nome (#5) | Integridade de dados |
| **P3** | Métodos de pagamento (#7) | Backlog feature |
| **P3** | Resgate vs investimento (#8) | Documentação / feature |
| **P4** | Validação só no client (#11) | Risco aceito ou hardening |
| **P4** | deleteRule sem UI (#12) | Backlog |

---

## Resultado final

### **Aprovado com ressalvas**

As regras centrais de **efetivados**, **cartões**, **saldo** e **regra 50/30/20** estão alinhadas após as correções recentes. O produto produz resultados **corretos e previsíveis** na maioria dos fluxos de uso diário.

As ressalvas concentram-se em:
1. **Reconciliação** entre resumo, listas e regra financeira.
2. **Consistência da visão anual** em operações multi-mês.
3. **Decisões de produto** ainda não formalizadas (planejado vs realizado, recorrência anual, categorias não mapeadas).

Nenhuma inconsistência identificada é **crítica** para uso pessoal individual, mas devem ser endereçadas antes de posicionar o produto como ferramenta confiável de relatório anual e planejamento financeiro estruturado.

---

## Referências

- [Business Specialist](./business-specialist.mdc)
- [ANALISE Frontend](../ANALISE_FRONTEND_QA.md) — *nota: seções de resumo/regra desatualizadas quanto a efetivados; código prevalece*
- [QA Transversal](../QA/relatorios/99-transversal.md)
- [Validação](../VALIDATION/relatorio-validacao-correcoes-qa.md)
- [Performance](../PERFORMANCE/relatorio-performance-frontend.md)
