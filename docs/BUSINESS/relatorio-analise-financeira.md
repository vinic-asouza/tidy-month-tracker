# Relatório de Análise Financeira — Finto

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-06 |
| **Agente** | Financial Domain Consultant (`docs/BUSINESS/financial-consultant.mdc`) |
| **Escopo** | Domínio financeiro do produto — terminologia, conceitos, fluxos, indicadores e educação financeira |
| **Referências** | [Regras de negócio](./relatorio-regras-negocio.md), [Apresentação do produto](../apresentacao-produto.md), [Documentação técnica](../documentacao-tecnica.md), [Propósito](../MARKETING/purpose.mdc), glossário e cópias da UI (`FinancialGlossaryDialog`, seções do dashboard) |

---

## Resumo executivo

O Finto apresenta uma **base conceitual sólida** para finanças pessoais educativas: separa planejamento de efetivação, trata cartão de crédito como compromisso de fatura (não como débito imediato), isola desejos do fluxo de caixa e — após a revisão de julho/2026 — modela patrimônio com **liquidez** (carteira de movimentação) e **posição aplicada** (carteira de investimentos), com aporte origem → destino.

O produto **ensina bons hábitos** ao exigir reflexão no registro manual e na efetivação (onde o dinheiro entrou ou saiu). O glossário *"Como lemos seus números"* é um diferencial claro de educação financeira.

As principais fragilidades estão na **comunicação**, não na intenção do modelo:

| Dimensão | Avaliação |
|----------|-----------|
| Conceitos centrais (caixa, fatura, aporte, patrimônio) | **Bom** — coerentes após C8 |
| Terminologia e nomenclatura | **Médio** — ambiguidades pontuais (`Saldo Livre`, `Desejos` vs 50/30/20, `Aplicado`/`Aportado`) |
| Consistência entre telas | **Médio** — três leituras de patrimônio sem visão consolidada |
| Fluxos financeiros | **Bom** — efetivação com carteira bem desenhada; resgate parcialmente órfão no módulo Entradas |
| Indicadores e relatórios | **Médio** — úteis, mas exigem alfabetização prévia do usuário |
| Educação financeira | **Bom** — filosofia alinhada; faltam pontes em momentos de decisão |

### Veredito geral

**Aprovado para educação financeira pessoal**, com ressalvas de **comunicação e reconciliação**. O usuário iniciante consegue organizar o mês; o usuário que adota carteiras precisa de mais contexto para não interpretar saldo do mês, chips de carteira e Saldo Livre como números contraditórios. Priorizar clareza verbal e microcopy — não mudanças de modelo.

---

## Conceitos financeiros bem aplicados

Registro positivo do que o produto acerta do ponto de vista de finanças pessoais:

1. **Planejado vs. efetivado** — distinção clássica entre orçamento e caixa real; reforça hábito de confrontar intenção com execução.
2. **Fatura de cartão** — total do mês no chip; impacto no caixa só ao pagar; escolha da carteira pagadora. Alinhado à prática brasileira de crédito.
3. **Investimento como saída de caixa** no resumo mensal, com **posição preservada** na carteira de investimentos — modelo híbrido correto para PF.
4. **Aporte origem → destino** — evita ilusão de que o dinheiro “sumiu” ou “duplicou” na mesma conta.
5. **Transferência entre contas de movimentação** — não distorce renda nem despesa; comunicado explicitamente no dialog.
6. **Lista de desejos isolada** — metas de consumo sem poluir fluxo de caixa; incentiva planejamento antes da compra.
7. **Regra 50/30/20** — bucket de investimentos separado de gastos por categoria; toggle alinhado ao resumo.
8. **Glossário acessível** — linguagem didática, exemplos numéricos em saldo do mês e carteira.

---

## Achados detalhados

---

### 1. Três leituras de patrimônio sem visão consolidada

**Área:** Dashboard · Carteiras

**Tipo:** Indicador · Educação Financeira

**Situação atual:** Na mesma tela o usuário vê (a) **saldo do mês** no resumo, (b) **saldo estimado** em cada carteira (liquidez ou posição) e (c) **Saldo Livre**. O glossário explica saldo do mês vs. carteira, mas não integra Saldo Livre nem sugere como somar patrimônio total.

**Observação:** Quem organiza por contas espera responder *"quanto tenho no total?"*. Sem uma linha consolidada, números corretos parecem conflitantes — especialmente após aportes (resumo cai, posição em investimentos sobe).

**Sugestão:** No texto de ajuda ou no cabeçalho de Carteiras, incluir frase do tipo: *"O resumo mostra o fluxo do mês; os chips mostram onde o dinheiro está. Some liquidez + posição + Saldo Livre para ver seu patrimônio estimado."* Considerar um indicador opcional *"Patrimônio estimado"* (soma dos chips) quando o usuário tiver carteiras.

**Prioridade:** Alta

---

### 2. Nome "Saldo Livre" é metafórico demais

**Área:** Carteiras

**Tipo:** Terminologia

**Situação atual:** O chip **Saldo Livre** agrega movimentos sem carteira nomeada e recebe resgates. O nome sugere dinheiro "livre para gastar", mas pode ser apenas *não classificado por conta*.

**Observação:** Usuários iniciantes podem achar que é uma conta especial recomendada, ou confundir com "sobra do mês". O glossário ajuda, mas o rótulo do chip aparece antes da explicação.

**Sugestão:** Avaliar subtítulo no chip (*"Sem conta"* ou *"Não vinculado"*) mantendo "Saldo Livre" como nome curto, ou tooltip na primeira visita. Reforçar no dialog de efetivação: *"Use quando o dinheiro não está em uma conta específica que você quer acompanhar."*

**Prioridade:** Média

---

### 3. Colisão semântica: "Desejos" na lista vs. "Estilo de Vida" na regra

**Área:** Lista de Desejos · Regra financeira

**Tipo:** Terminologia · Conceito Financeiro

**Situação atual:** A aba **Desejos** planeja metas de consumo. Na regra 50/30/20, o bucket **Estilo de Vida** (30%) agrupa categorias de gasto. Na literatura financeira, "desejos" e "estilo de vida" são termos próximos.

**Observação:** O usuário pode achar que a lista de Desejos deveria alimentar a barra de Estilo de Vida, ou que gastos em "Lazer" são a mesma coisa que desejos conquistados. São propósitos distintos (planejamento isolado vs. classificação de despesa realizada).

**Sugestão:** Na primeira visita à aba Desejos ou no setup da regra, uma linha explicativa: *"Desejos são metas futuras — não entram na regra 50/30/20 até virarem gasto efetivado."* Evitar usar só a palavra "desejos" na regra; manter "Estilo de Vida" como rótulo da barra.

**Prioridade:** Média

---

### 4. Resgate não aparece como entrada no fluxo de caixa

**Área:** Carteiras · Investimentos · Entradas

**Tipo:** Fluxo · Conceito Financeiro

**Situação atual:** Resgatar da carteira de investimentos credita movimentação ou Saldo Livre via operação de carteira. O módulo **Entradas** tem tag padrão *"Resgate de investimentos"*, mas o app **não cria** entrada automaticamente.

**Observação:** Educacionalmente, resgate é **entrada de caixa** (conversão de posição em liquidez). O patrimônio total se conserva, mas o **saldo do mês** no resumo não sobe — o usuário pode achar que "o dinheiro voltou" só olhando o chip, sem entender o resumo.

**Sugestão:** Após resgate bem-sucedido, mensagem contextual: *"Liquidez aumentou na carteira destino. O resumo do mês só muda se você registrar uma entrada — o patrimônio total já foi atualizado nos chips."* Opcionalmente sugerir criar entrada com tag Resgate (sem automatizar).

**Prioridade:** Alta

---

### 5. Investimentos no resumo vs. posição nas carteiras

**Área:** Resumo · Investimentos · Carteiras

**Tipo:** Educação Financeira · Indicador

**Situação atual:** Marcar investimento como investido **reduz** o saldo do mês (saída de caixa) e **aumenta** a posição na carteira de investimentos. Correto conceitualmente, mas contraintuitivo para quem acha que "investir não é gastar".

**Observação:** É uma das maiores fontes de confusão em PF. O glossário menciona aporte origem/destino, mas o card **Invest.** no resumo não deixa claro que é *aplicação de caixa*, não perda patrimonial.

**Sugestão:** Tooltip no resumo: *"Valor que saiu do caixa para aplicação este mês — a posição aplicada aparece nas carteiras de investimentos."* Manter coerência com a filosofia de educação por reflexão.

**Prioridade:** Alta

---

### 6. "Entradas" vs. "Receitas" — vocabulário misto

**Área:** Terminologia geral

**Tipo:** Terminologia · Consistência

**Situação atual:** A UI usa **Entradas** nas abas e listas. Materiais de educação financeira e o próprio módulo de regra falam em **renda** / receitas. Internamente o domínio usa `incomes`.

**Observação:** Não é erro grave — "entradas" é acessível. Porém relatórios e conversas com usuários podem alternar termos sem equivalência explícita.

**Sugestão:** Uma vez no glossário: *"Entradas = receitas do mês (salário, extras, rendimentos)."* Evitar introduzir "Receitas" como rótulo paralelo sem necessidade.

**Prioridade:** Baixa

---

### 7. Rótulo "Aplicado" vs. "Aportado" no chip de carteira

**Área:** Carteiras

**Tipo:** Terminologia · Consistência

**Situação atual:** Na carteira de **movimentação**, a métrica mensal de envio para investimentos aparece como **"Aplicado"**. Na carteira de **investimentos**, aparece **"Aportado"**. Glossário usa *aporte* de forma consistente.

**Observação:** Pequena inconsistência lexical na mesma faixa de chips; pode parecer que são movimentos diferentes.

**Sugestão:** Padronizar para **"Aportado"** (saída na movimentação) e **"Recebido"** ou manter **"Aportado"** nos dois papéis com legendas distintas (*"enviado"* / *"recebido"*).

**Prioridade:** Baixa

---

### 8. Chip do cartão (fatura total) vs. gastos no resumo (só se paga)

**Área:** Cartões · Resumo

**Tipo:** Indicador · Educação Financeira

**Situação atual:** O chip mostra o **total da fatura** do mês; o resumo só conta gastos do cartão quando a fatura está **paga**. Comportamento financeiramente correto (comprometido vs. efetivado).

**Observação:** Usuário novo compara chip do cartão com linha **Gastos** do resumo e acha erro. O glossário cobre *Fatura*, mas o chip não diz explicitamente *"Fatura do mês"*.

**Sugestão:** Subtítulo ou label no chip: **"Fatura"** ou **"Total no cartão"** (já parcialmente usado). Manter distinção visual entre fatura em aberto e paga.

**Prioridade:** Média

---

### 9. Categorias não mapeadas na regra — buraco na narrativa

**Área:** Regra financeira · Resumo

**Tipo:** Indicador · Relatório

**Situação atual:** Gastos efetivados em categorias novas entram no **saldo do mês**, mas não nas barras Essenciais / Estilo de Vida até mapeamento. Badge alerta categorias novas, sem valor excluído.

**Observação:** Quebra a promessa educacional de *"a regra explica para onde foi meu dinheiro"*. O usuário perde confiança no painel 50/30/20.

**Sugestão:** Exibir linha **"Não classificado"** com valor e % da renda, ou texto: *"R$ X em categorias ainda não mapeadas — toque para classificar."* Prioridade de produto já identificada em regras de negócio; reforço do ângulo educacional.

**Prioridade:** Alta

---

### 10. Conquista de desejo com gasto não efetivado

**Área:** Lista de Desejos · Gastos

**Tipo:** Fluxo · Educação Financeira

**Situação atual:** Conquistar com gasto pré-preenche despesa **não paga**. O desejo some como conquistado; o saldo do mês não muda até marcar pago.

**Observação:** O usuário associa "conquistei" a "já gastei". Desconecta planejamento de execução financeira.

**Sugestão:** No dialog de conquista, texto explícito: *"O desejo será marcado como conquistado, mas o gasto só afeta seu saldo quando você marcá-lo como pago."* Avaliar política de nascer efetivado (decisão de produto) — comunicação mínima já ajuda.

**Prioridade:** Média

---

### 11. Repetição mensal limitada ao ano civil

**Área:** Entradas · Gastos · Investimentos

**Tipo:** Fluxo · Conceito Financeiro

**Situação atual:** "Repetir todos os meses" copia lançamentos apenas nos **11 meses restantes do mesmo ano**. Janeiro do ano seguinte não recebe cópia automática.

**Observação:** Para salário e aluguel, o usuário espera recorrência contínua. Esquecimento em janeiro gera subcontagem e falsa sensação de "mês bom".

**Sugestão:** Comunicar no toggle de repetição: *"Repete até dezembro deste ano — em janeiro você pode copiar ou criar de novo."* Ou aviso ao criar em novembro/dezembro.

**Prioridade:** Média

---

### 12. Gasto fixo com repetição ligada por padrão

**Área:** Gastos

**Tipo:** Fluxo · Educação Financeira

**Situação atual:** Novo gasto **fixo** inicia com `repeatAllMonths` ativo por padrão no formulário.

**Observação:** Pode inflar planejamento se o usuário cria um fixo pontual sem perceber a opção marcada — especialmente iniciantes.

**Sugestão:** Default **desligado** com copy *"Repetir nos demais meses do ano"*; ou confirmação ao salvar com repetição ativa.

**Prioridade:** Média

---

### 13. Seleção múltipla — só soma efetivados

**Área:** Seleção

**Tipo:** Indicador · Fluxo

**Situação atual:** Barra inferior soma apenas itens **efetivados** entre os selecionados. Hint âmbar quando há seleção sem efetivados.

**Observação:** Comportamento coerente com o resumo em modo efetivado, mas a seleção visual inclui pendentes — pode frustrar quem quer somar o planejado.

**Sugestão:** Manter comportamento; reforçar rótulo *"X selecionados · Y efetivados"* (já presente). Opcional: toggle *"Somar planejado"* na barra para consulta rápida.

**Prioridade:** Baixa

---

### 14. Declarar saldo — barreira cognitiva

**Área:** Carteiras

**Tipo:** Fluxo · Educação Financeira

**Situação atual:** Usuário pode declarar saldo de abertura do mês. Alerta contextual quando já há movimentos — bom. Sem declaração, carry-forward estima a partir de lançamentos.

**Observação:** Conceito de *saldo inicial do mês* é avançado. Quem nunca declara pode acumular divergência vs. extrato bancário sem entender por quê.

**Sugestão:** Onboarding leve: *"Para bater com seu banco, declare o saldo no dia 1 de cada mês."* Glossário já menciona; repetir no primeiro chip criado.

**Prioridade:** Média

---

### 15. Limite de crédito apenas informativo

**Área:** Cartões

**Tipo:** Indicador · Educação Financeira

**Situação atual:** Limite opcional mostra % da fatura sobre o limite. Copy diz que não impede lançamentos.

**Observação:** Correto alinhar expectativa. Usuário pode achar que o app "controla limite" como banco.

**Sugestão:** Manter copy atual; considerar alerta visual quando > 80% do limite (sem bloquear) — reforço educacional de endividamento.

**Prioridade:** Baixa

---

### 16. Visão anual sem narrativa de patrimônio

**Área:** Estatísticas · Relatórios

**Tipo:** Relatório · Indicador

**Situação atual:** Gráfico e cards mostram entradas, gastos, investimentos e saldo mês a mês (conforme toggle). Não há série de **patrimônio acumulado** ou taxa de poupança.

**Observação:** Para educação de longo prazo, fluxo mensal é insuficiente. Usuário não vê evolução de posição investida vs. liquidez ao longo do ano.

**Sugestão:** Card opcional *"Quanto investi no ano"* (soma efetivada) já existe parcialmente; comunicar que investimentos no gráfico são **aportes de caixa**, não valorização de ativos. Patrimônio por carteira permanece fora do anual — observação para roadmap de comunicação.

**Prioridade:** Média

---

### 17. Regra 50/30/20 — nomenclatura vs. literatura clássica

**Área:** Regra financeira

**Tipo:** Terminologia · Educação Financeira

**Situação atual:** Rótulos **Essenciais**, **Estilo de Vida**, **Investimentos**. Literatura clássica: necessidades / desejos / poupança-investimento.

**Observação:** Mapeamento é razoável. "Estilo de Vida" é mais amplo que "desejos" clássicos (pode incluir streaming, restaurantes). Usuário rigoroso pode esperar definições na configuração.

**Sugestão:** No wizard, exemplos por bucket (*"Essenciais: moradia, contas; Estilo de vida: lazer, assinaturas"*). Link para glossário da regra.

**Prioridade:** Baixa

---

### 18. Ausência de conceito de reserva de emergência

**Área:** Produto (transversal)

**Tipo:** Conceito Financeiro · Educação Financeira

**Situação atual:** Carteiras podem representar poupança, mas não há orientação ou tipo dedicado a **reserva de emergência**. Regra 50/30/20 não menciona reserva separada de investimento.

**Observação:** Lacuna de educação financeira básica, não de bug. Usuário pode colocar reserva na mesma carteira de investimentos e confundir liquidez com aplicação.

**Sugestão:** Conteúdo educativo (blog, onboarding ou glossário): *"Reserva de emergência costuma ficar em carteira de movimentação (poupança), separada de investimentos de longo prazo."* Sem obrigar novo tipo de produto.

**Prioridade:** Baixa

---

### 19. Tag "Resgate de investimentos" órfã no fluxo

**Área:** Entradas · Carteiras

**Tipo:** Fluxo · Consistência

**Situação atual:** Tag padrão existe em entradas; resgate operacional vai para Carteiras. Nenhuma ponte sugere usar a tag após resgate.

**Observação:** Inconsistência de jornada — duas formas de registrar retorno de capital sem guia.

**Sugestão:** Alinhar com achado #4 (mensagem pós-resgate). Unificar narrativa: *patrimônio nos chips* vs. *caixa no resumo via entrada opcional*.

**Prioridade:** Média

---

### 20. Glossário não cobre reconciliação pós-aporte

**Área:** Glossário · Carteiras

**Tipo:** Educação Financeira

**Situação atual:** Entradas de aporte, resgate e transferência estão no glossário. Falta exemplo integrado do cenário clássico: salário − aluguel − aporte → liquidez na movimentação + posição em investimentos ≠ saldo do mês isolado.

**Observação:** Um único exemplo numérico transversal reduziria tickets de "números errados".

**Sugestão:** Adicionar seção *"Exemplo: um mês com aporte"* no glossário, espelhando o cenário educacional 5k / 1k / 2k documentado nas regras de negócio.

**Prioridade:** Média

---

## Matriz de prioridades (comunicação e domínio)

| Prioridade | Achados | Foco |
|------------|---------|------|
| **Crítica** | — | Nenhum conceito financeiro fundamental está incorreto após C8 |
| **Alta** | #1, #4, #5, #9 | Patrimônio vs. caixa, resgate, investimento no resumo, regra incompleta |
| **Média** | #2, #3, #8, #10–#12, #14, #16, #19, #20 | Terminologia, fluxos de desejo/cartão, recorrência, declaração, relatórios |
| **Baixa** | #6, #7, #13, #15, #17, #18 | Padronização lexical, seleção, limite, reserva, 50/30/20 fino |

---

## Recomendações transversais

1. **Manter o modelo C8** — origem/destino e papéis de carteira estão alinhados às boas práticas de PF; investir em explicação, não em simplificação que reintroduza dupla contagem.
2. **Repetir a pedagogia nos momentos de ação** — dialogs de efetivação, resgate, pagamento de fatura e conquista de desejo são os melhores pontos para uma frase educativa (não só o glossário).
3. **Uma narrativa, três leituras** — treinar copy em torno de: *fluxo do mês* (resumo), *onde está o dinheiro* (carteiras), *não classificado* (Saldo Livre).
4. **Não prometer saldo bancário** — reforçar "estimativa" e declaração periódica em toda comunicação externa (landing, apresentação).
5. **Coerência Desejos × Regra × Gastos** — três módulos com papéis distintos; merecem menção explícita no onboarding.

---

## Síntese por módulo

| Módulo | Coerência financeira | Principal oportunidade |
|--------|---------------------|-------------------------|
| Dashboard / Resumo | Boa | Explicar investimento como saída de caixa |
| Entradas | Boa | Equivalência entrada = receita; ponte com resgate |
| Gastos | Boa | Default de repetição em fixos; categorias na regra |
| Cartões | Boa | Label "fatura" vs. resumo |
| Investimentos | Muito boa (pós-C8) | Reforço origem/destino no primeiro uso |
| Carteiras | Muito boa (pós-C8) | Patrimônio consolidado; Saldo Livre |
| Transferência / Resgate | Boa | Mensagem pós-resgate vs. resumo |
| Desejos | Boa | Conquista ≠ gasto efetivado |
| Regra 50/30/20 | Média | Bucket não classificado |
| Estatísticas anuais | Boa | Deixar claro que é fluxo, não patrimônio |
| Glossário | Boa | Exemplo integrado e Saldo Livre na reconciliação |
| Configurações | Adequada | Sem ambiguidade relevante |

---

## Resultado final

### **Aprovado com ressalvas de comunicação**

O Finto utiliza **conceitos financeiros corretos** para um produto de educação e organização pessoal. A distinção planejado/efetivado, o tratamento de crédito, o modelo patrimonial com papéis de carteira e o isolamento de desejos são **diferenciais pedagógicos**.

As ressalvas concentram-se em **como** esses conceitos são comunicados: múltiplas leituras de saldo na mesma tela, resgate fora do módulo Entradas, investimento que "some" do caixa mas permanece no patrimônio, e regra 50/30/20 com categorias não mapeadas.

Nenhuma ressalva exige mudança de modelo financeiro para um beta educacional — exige **copy, glossário, microcopy contextual e indicadores explicativos** alinhados à missão do produto.

---

## Status de implementação (2026-07-06)

Ajustes de comunicação e coerência de indicadores conforme plano de análise financeira:

| Achado | Status | Notas |
|--------|--------|-------|
| #1 Patrimônio consolidado | **Implementado** | `getTotalEstimatedPatrimony` + linha em `AccountStrip` |
| #2 Saldo Livre | **Implementado** | Subtítulo "Sem carteira" + copy em `EffectuateWalletDialog` |
| #3 Desejos vs Estilo de Vida | **Implementado** | Subtítulo em `WishSection` |
| #4 Resgate no resumo | **Fluxo completo** | Entrada automática em Entradas + base da regra 50/30/20 |
| #5 Investimento no resumo | **Implementado** | Hint no tile Invest. do resumo |
| #6 Entradas = receitas | **Implementado** | Entrada no glossário |
| #7 Aplicado/Aportado | **Implementado** | Label "Enviado" na movimentação |
| #8 Chip fatura | **Já coberto** | Label "Fatura" em `CreditCardStrip` |
| #9 Não classificado | **Já coberto** | Barra + alerta em `FinancialRuleDisplay`; copy refinada |
| #10 Conquista de desejo | **Implementado** | Dialog de conquista refinado |
| #11 Repetição anual | **Já coberto** | Copy nos três módulos |
| #12 Default repetição fixos | **Implementado** | `repeatAllMonths` default `false` |
| #13 Seleção só efetivados | **Mantido** | Comportamento preservado |
| #14 Declarar saldo | **Implementado** | Copy no dialog de declaração |
| #15 Limite informativo | **Mantido** | Sem alerta >80% (deferido) |
| #16 Visão anual | **Parcial** | Subtítulo explicativo em `Statistics`; sem série de patrimônio |
| #17 Exemplos 50/30/20 | **Implementado** | Exemplos no wizard de regra |
| #18 Reserva de emergência | **Implementado** | Entrada no glossário |
| #19 Tag resgate órfã | **Fluxo completo** | Tag usada em entradas automáticas ao resgatar |
| #20 Exemplo integrado | **Implementado** | Seção no glossário (5k/1k/2k) |

---

## Referências

- [Financial Domain Consultant](./financial-consultant.mdc)
- [Relatório de regras de negócio](./relatorio-regras-negocio.md)
- [Apresentação do produto](../apresentacao-produto.md)
- [Documentação técnica](../documentacao-tecnica.md)
- [Propósito e filosofia](../MARKETING/purpose.mdc)
