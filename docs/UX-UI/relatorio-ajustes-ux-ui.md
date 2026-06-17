# Relatório UX/UI — Ajustes para o Dev

| Campo | Valor |
|-------|-------|
| **Data** | 2026-06-17 |
| **Agente** | Especialista Produto / UX / UI (`docs/UX-UI/uxui-specilist.mdc`) |
| **Escopo** | Frontend — experiência pós-correções QA/Dev |
| **Referências** | [Business](../BUSINESS/relatorio-regras-negocio.md), [Validação](../VALIDATION/relatorio-validacao-correcoes-qa.md), [QA](../QA/relatorios/) |

---

## Resumo executivo

O produto tem **base visual sólida** (design system shadcn, cores semânticas por tipo, PT-BR, responsividade razoável). A principal fricção não é estética — é **semântica financeira mal comunicada**: o usuário vê totais diferentes em telas adjacentes sem entender por quê.

| Veredito | Detalhe |
|----------|---------|
| **Pronto para beta fechado** | Sim, com ajustes de copy e hierarquia |
| **Pronto para usuário financeiro exigente** | Não — sem glossário, reconciliação visual e feedback de seleção |
| **Ajustes P1 para dev** | 8 itens |
| **Quick wins** | 12 itens |

### Médias gerais (0–10)

| Dimensão | Nota | Comentário |
|----------|------|------------|
| Produto | 7,0 | Proposta clara; lacunas de planejado vs realizado |
| UX | 6,5 | Fluxos funcionam; atrito em números e seleção |
| UI | 8,0 | Consistente, moderno, legível |
| Eficiência operacional | 6,0 | Muitos cliques em formulários complexos (gastos) |

---

# Módulo: Autenticação

## Resumo geral

| Nota Produto | Nota UX | Nota UI | Nota Eficiência |
|:---:|:---:|:---:|:---:|
| 8 | 8 | 8,5 | 8 |

Fluxo único login/cadastro/recuperação bem estruturado. Feedback inline + toast. Toggle limpa campos sensíveis.

## Problemas encontrados

### [BAIXO] Cadastro sem orientação pós-envio de e-mail

**Impacto:** Usuário pode não entender que precisa confirmar e-mail antes de logar.

**Sugestão:** Após cadastro, exibir bloco persistente na tela (não só toast): *"Enviamos um link de confirmação. Verifique sua caixa de entrada e spam."*

**Arquivos:** `Auth.tsx`

---

### [BAIXO] Recuperação de senha sem tela de nova senha no app

**Impacto:** Fluxo depende do link Supabase; usuário pode cair em rota não preparada.

**Sugestão:** Validar jornada pós-link ou exibir copy: *"O link abrirá uma página segura para definir nova senha."*

---

## Quick wins

- Adicionar `autocomplete="email"` / `autocomplete="current-password"` nos inputs.
- Manter foco no primeiro campo com erro após validação.

---

# Módulo: Dashboard / Shell

## Resumo geral

| Nota Produto | Nota UX | Nota UI | Nota Eficiência |
|:---:|:---:|:---:|:---:|
| 7,5 | 7 | 8 | 7 |

Header sticky, navegação Mensal/Anual, FAB, menu mobile e tema funcionam. `MonthNavigator` centralizado é eficiente.

## Problemas encontrados

### [MÉDIO] Visão Anual escondida no mobile até abrir menu

**Impacto:** Usuário mobile pode não descobrir estatísticas anuais sem explorar o Sheet.

**Sugestão:** Expor atalho Mensal/Anual no header mobile (segmented control compacto) ou ícone de gráfico ao lado do menu.

**Arquivos:** `Index.tsx`

---

### [MÉDIO] Overlay de tema bloqueia tela inteira

**Impacto:** 150ms de bloqueio total pode parecer travamento em troca rápida de tema.

**Sugestão:** Remover overlay global; confiar na transição CSS do `next-themes` ou reduzir a indicador não bloqueante (só ícone no botão).

**Arquivos:** `Index.tsx` L273-280

---

### [BAIXO] Footer fixo com informação pouco acionável

**Impacto:** Ocupa espaço vertical sem ajudar na tarefa.

**Sugestão:** Encurtar ou mover para menu/ajuda; priorizar conteúdo financeiro no viewport.

---

## Quick wins

- `aria-current="page"` nos botões Mensal/Anual ativos.
- Anunciar troca de mês para leitores de tela (`aria-live` no main após `monthLoading`).

---

# Módulo: Resumo do Mês

## Resumo geral

| Nota Produto | Nota UX | Nota UI | Nota Eficiência |
|:---:|:---:|:---:|:---:|
| 7 | 6 | 8 | 7 |

Métricas compactas + regra na mesma superfície. Subtitle *"Saldos efetivados"* ajuda, mas legenda é discreta demais.

## Problemas encontrados

### [ALTO] Hierarquia invertida em relação às listas

**Impacto:** Resumo mostra só efetivados; seções abaixo destacam **total bruto** em fonte maior. Usuário compara números e conclui que o app está errado.

**Sugestão (dev):**
1. Padronizar rótulos: **"Planejado"** (total da lista) e **"Efetivado"** (subtotal) em Entradas, Gastos e Investimentos.
2. Opcional no resumo: segunda linha menor com totais planejados ou tooltip ℹ️ explicando a diferença.

**Arquivos:** `MonthSummarySection.tsx`, `IncomeSection.tsx`, `ExpenseSection.tsx`, `InvestmentSection.tsx`

**Evidência:** Resumo usa `calculateEffectiveMonthTotals`; headers das seções usam `reduce` sem filtrar flags.

---

### [ALTO] Legenda de efetivados pouco visível

**Impacto:** Texto `text-[11px] italic` em cinza claro é fácil de ignorar.

**Sugestão:** Usar componente `Alert` leve ou ícone `Info` com texto 12–13px; repetir padrão nas seções que exibem subtotais.

**Arquivos:** `MonthSummarySection.tsx` L99-101

---

### [MÉDIO] Saldo negativo sem contexto

**Impacto:** Vermelho comunica problema, mas não explica se é caixa efetivado ou planejamento.

**Sugestão:** Subtexto opcional: *"Com base no que já entrou e saiu de fato neste mês"*.

---

## Quick wins

- Adicionar `tabular-nums` nos `MetricTile` do resumo (já usado em outras áreas).
- Tooltip no tile Saldo explicando fórmula em linguagem simples.

---

# Módulo: Entradas

## Resumo geral

| Nota Produto | Nota UX | Nota UI | Nota Eficiência |
|:---:|:---:|:---:|:---:|
| 8 | 7 | 8 | 7 |

CRUD claro, checkbox recebido, repetição, ordenação e gestão de tags.

## Problemas encontrados

### [MÉDIO] Empty state sem CTA

**Impacto:** *"Nenhuma entrada registrada"* não orienta próximo passo.

**Sugestão:** Botão *"Adicionar primeira entrada"* no empty state (abre mesmo dialog do FAB).

**Arquivos:** `IncomeSection.tsx` L859-867

---

### [MÉDIO] Seleção por clique na linha é invisível

**Impacto:** Usuário não sabe que pode clicar na linha para selecionar; barra inferior aparece sem explicação.

**Sugestão:** Hint na primeira seleção (toast ou tooltip dismissible): *"Toque na linha para selecionar e ver totais na barra inferior"*. Ou ícone/checkbox de seleção separado do checkbox *recebido*.

**Arquivos:** `IncomeSection.tsx`, `ExpenseSection.tsx`, `InvestmentSection.tsx`

---

### [MÉDIO] Toggle "repetir todos os meses" sem limite temporal

**Impacto:** Usuário espera recorrência contínua; produto repete só no ano civil ([Business #4](../BUSINESS/relatorio-regras-negocio.md)).

**Sugestão:** Helper text no formulário: *"Repete nos demais meses deste ano."*

---

## Quick wins

- Destacar `| Recebido:` sempre que houver lançamentos (hoje só aparece se `receivedTotal > 0`).
- Label do checkbox: `title="Marcar como recebido"` para acessibilidade.

---

# Módulo: Gastos e Cartões

## Resumo geral

| Nota Produto | Nota UX | Nota UI | Nota Eficiência |
|:---:|:---:|:---:|:---:|
| 7,5 | 6 | 7,5 | 5,5 |

Módulo mais completo e mais complexo. Cartões integrados na aba Gastos faz sentido, mas sobrecarrega a aba.

## Problemas encontrados

### [ALTO] Chip do cartão sem rótulo semântico

**Impacto:** Valor grande no chip parece "gasto pago" ou "no resumo"; na verdade é **total da fatura do mês**.

**Sugestão:** Subtítulo no chip: *"Fatura"* ou *"Total no mês"*; no header da faixa: *"Faturas do mês (todas as compras)"*.

**Arquivos:** `CreditCardStrip.tsx` L245, L286

---

### [MÉDIO] Checkbox de cartão com aparência desabilitada sem legenda permanente

**Impacto:** `opacity-50` + `pointer-events-none` no gasto vinculado; usuário só descobre o motivo ao clicar (dialog existe — bom).

**Sugestão:** Ícone de cartão no checkbox + `title` nativo; ou badge *"Via fatura"* na linha.

**Arquivos:** `ExpenseSection.tsx` L468-474, dialog L1512-1532 (manter)

---

### [MÉDIO] Formulário de gasto com alta carga cognitiva

**Impacto:** Três abas (fixo/variável/parcelado) + categoria + pagamento + repetição + parcelas = muitos campos para tarefa frequente.

**Sugestão (incremental):**
- Manter abas, mas destacar campos obrigatórios com `*` consistente.
- Após salvar gasto variável simples, oferecer *"Adicionar outro"* no dialog.
- Defaults inteligentes: última categoria e forma de pagamento usadas.

**Arquivos:** `ExpenseSection.tsx` (`ExpenseForm`)

---

### [MÉDIO] Dialog Apply-to-all com copy longa

**Impacto:** Três botões empilhados no mobile; decisão irreversível mal escaneável.

**Sugestão:** Título mais direto; botão destrutivo em `variant="destructive"` para exclusão em massa; resumo do item afetado (descrição + valor).

**Arquivos:** `apply-to-all-dialog.tsx`, `ExpenseSection.tsx`

---

### [BAIXO] Agrupamento fixo/variável/parcelado sem contagem no título do grupo

**Sugestão:** *"Fixos (3)"* nos headers de grupo para scan visual.

---

## Quick wins

- No header de Gastos, alinhar com Entradas: rótulo **"Planejado"** no total principal e **"Pago"** no secundário.
- Scroll horizontal dos cartões: indicador de fade nas bordas (já usa `snap`; reforçar affordance).
- Empty states com CTA *"Registrar gasto"*.

---

# Módulo: Investimentos

## Resumo geral

| Nota Produto | Nota UX | Nota UI | Nota Eficiência |
|:---:|:---:|:---:|:---:|
| 7,5 | 7 | 8 | 7 |

Espelha Entradas; coerente visualmente.

## Problemas encontrados

### [MÉDIO] Tag "Resgate de investimentos" nas entradas sem vínculo visual

**Impacto:** Usuário financeiro espera relação entre módulos.

**Sugestão:** Nota de ajuda na tag ou em FAQ in-app: *"Registre resgates manualmente como entrada; não há vínculo automático com aportes."*

---

### [MÉDIO] Mesmos gaps de empty state e seleção dos outros módulos

**Sugestão:** Replicar quick wins de Entradas (CTA empty, hint de seleção, rótulos Planejado/Investido).

**Arquivos:** `InvestmentSection.tsx`

---

# Módulo: Regra Financeira

## Resumo geral

| Nota Produto | Nota UX | Nota UI | Nota Eficiência |
|:---:|:---:|:---:|:---:|
| 8 | 6,5 | 8 | 6 |

Wizard de 2 passos bem construído. Exibição com barras e badges de alerta é profissional.

## Problemas encontrados

### [CRÍTICO — UX financeira] Barras da regra não fecham com total de gastos do resumo

**Impacto:** Gastos efetivados em categorias **não mapeadas** entram no resumo mas não nas barras Essenciais/Estilo de vida. Usuário perde confiança na regra.

**Sugestão (dev + produto):**
1. Exibir linha **"Não classificados"** com valor e link *"Mapear categorias"*.
2. Ou banner quando `gastosResumo > gastosRegra`: *"R$ X em gastos não entram na regra — mapeie suas categorias."*

**Arquivos:** `FinancialRuleDisplay.tsx`, `MonthSummarySection.tsx`, `financialRuleCalculations.ts` (dados para UI)

**Ref:** [Business achado #1](../BUSINESS/relatorio-regras-negocio.md)

---

### [ALTO] Badge de categorias novas não quantifica impacto

**Impacto:** Alerta vermelho genérico; usuário não sabe urgência financeira.

**Sugestão:** *"2 categorias sem mapeamento — R$ 450,00 em gastos este mês"* (quando houver gastos).

**Arquivos:** `MonthSummarySection.tsx` L146-156

---

### [MÉDIO] Regra com renda efetivada zero

**Impacto:** Todas as barras em 0%; usuário iniciante acha que regra "não funciona".

**Sugestão:** Empty state na área da regra: *"Marque suas entradas como recebidas para calcular os percentuais."*

**Arquivos:** `FinancialRuleDisplay.tsx`

---

### [MÉDIO] Sem opção de remover/recomeçar regra na UI

**Impacto:** Usuário preso em configuração antiga; só edita via wizard.

**Sugestão:** Link discreto *"Redefinir regra"* com confirmação.

---

### [BAIXO] Wizard passo 2 com lista longa de categorias

**Sugestão:** Campo de busca/filtro quando `categories.length > 8`; botões *"Marcar todas como Essencial"* por grupo.

**Arquivos:** `FinancialRuleSetup.tsx`

---

## Quick wins

- No passo 1, explicar 50/30/20 em uma frase: *"50% necessidades, 30% desejos, 20% investimentos — sobre o que você já recebeu."*
- Indicador de passo clicável só se validação do passo 1 OK.

---

# Módulo: Estatísticas Anuais

## Resumo geral

| Nota Produto | Nota UX | Nota UI | Nota Eficiência |
|:---:|:---:|:---:|:---:|
| 7,5 | 7 | 7,5 | 7 |

Gráfico legível, cores alinhadas, legenda de efetivados, overlay de loading preserva contexto.

## Problemas encontrados

### [MÉDIO] Ano do gráfico amarrado ao mês do navegador, não explícito

**Impacto:** Usuário em visão anual pode não perceber que navegar meses altera o ano exibido indiretamente.

**Sugestão:** Título *"Resumo Anual — 2026"* já existe; reforçar: *"Baseado no ano do mês selecionado no topo"*.

**Arquivos:** `Statistics.tsx`, `Index.tsx`

---

### [MÉDIO] Inconsistência de rótulo "Investido" vs "Investimentos"

**Impacto:** Pequena quebra de consistência (gráfico usa "Investimentos", card usa "Investido").

**Sugestão:** Unificar para **"Investimentos"** em todos os pontos.

**Arquivos:** `Statistics.tsx` L108

---

### [MÉDIO] Gráfico sem empty state dedicado

**Impacto:** Ano sem dados efetivados mostra barras zeradas — parece bug.

**Sugestão:** Se todos os totais = 0, mensagem: *"Marque lançamentos como recebidos, pagos ou investidos para ver o gráfico."*

---

### [BAIXO] FAB na visão anual com label longa no mobile

**Sugestão:** Ícone `+` com tooltip; texto completo só em `sm+`.

**Arquivos:** `Index.tsx` L546-549

---

## Quick wins

- Tooltip do gráfico com moeda BRL (já implementado) — manter.
- Destacar mês atual no eixo X do gráfico (bold ou marcador).

---

# Módulo: Seleção de Itens

## Resumo geral

| Nota Produto | Nota UX | Nota UI | Nota Eficiência |
|:---:|:---:|:---:|:---:|
| 6 | 5 | 7,5 | 5 |

Barra inferior bem desenhada (glass, totais por tipo), mas **funcionalidade pouco descoberta** e comportamento contra-intuitivo.

## Problemas encontrados

### [ALTO] Barra não aparece quando seleção só tem itens não efetivados

**Impacto:** Usuário seleciona linhas, nada acontece — percepção de bug.

**Sugestão (escolher uma):**
- **A)** Barra sempre visível com seleção: *"3 itens — R$ 0 efetivados (marque como recebido/pago/investido)"*.
- **B)** Impedir seleção de itens não efetivados.
- **C)** Somar valores nominais dos selecionados com rótulo *"Valores selecionados (planejados)"*.

**Arquivos:** `SelectionBottomBar.tsx`, `Index.tsx` `selectionSummary`

**Ref:** [Business achado #6](../BUSINESS/relatorio-regras-negocio.md)

---

### [ALTO] Conflito visual: checkbox de status vs seleção de linha

**Impacto:** Mesma linha tem checkbox (recebido/pago) e clique para seleção — gestos competem.

**Sugestão:** Separar affordances: checkbox de status à esquerda; ícone/quadrado de seleção à direita; ou modo *"Selecionar"* explícito na toolbar.

---

### [MÉDIO] Barra sem ações — só soma

**Impacto:** Usuário seleciona esperando ação em lote (marcar todos pagos, excluir).

**Sugestão:** Se for só informativo, renomear para *"Resumo da seleção"*; se for roadmap, placeholder desabilitado *"Em breve: ações em lote"*.

---

### [BAIXO] Sobreposição FAB + barra + footer

**Impacto:** `pb-24` compensa; em telas pequenas ainda pode haver crowding.

**Sugestão:** Revisar `z-index` e altura da barra em iPhone SE; testar safe-area.

---

## Quick wins

- Contador de itens selecionados na barra mesmo com total R$ 0.
- Animação de entrada da barra (`slide-in`) para feedback de que seleção funcionou.

---

# Módulo: Transversal (UI/UX)

## Problemas encontrados

### [MÉDIO] Glossário financeiro ausente

**Sugestão:** Página/modal *"Como lemos seus números"* com: efetivado, fatura, saldo, regra 50/30/20.

---

### [MÉDIO] Formatação monetária consistente (positivo)

`formatCurrency` pt-BR em uso — manter `tabular-nums` em todos os valores alinhados.

---

### [MÉDIO] Confirmações de exclusão genéricas

**Sugestão:** Sempre mostrar descrição + valor no `DeleteConfirmDialog`.

---

### [BAIXO] Ícones de ação (editar/excluir) só no hover no desktop

**Impacto:** Descoberta baixa para usuário mouse; mobile já mostra sempre.

**Sugestão:** Manter no mobile; no desktop, opacidade mínima 0.6 em repouso.

---

# Backlog consolidado para o Dev

Prioridade para implementação na interface (sem prescrever arquitetura).

## P1 — Fazer antes do release beta ampliado

| # | Ajuste | Arquivo(s) principal(is) |
|---|--------|-------------------------|
| 1 | Padronizar rótulos **Planejado / Efetivado** em resumo e seções | `MonthSummarySection`, `*Section.tsx` |
| 2 | Reforçar legenda de efetivados (tamanho, ícone info) | `MonthSummarySection`, `Statistics` |
| 3 | Barra de seleção visível com feedback quando total = 0 | `SelectionBottomBar`, `Index` |
| 4 | Linha ou alerta **gastos não classificados** na regra financeira | `FinancialRuleDisplay`, `MonthSummarySection` |
| 5 | Rótulo **"Fatura do mês"** nos chips de cartão | `CreditCardStrip` |
| 6 | Empty states com CTA de adicionar | `IncomeSection`, `ExpenseSection`, `InvestmentSection` |
| 7 | Hint de descoberta da seleção por clique | `*Section.tsx` (primeira vez) |
| 8 | Badge de categorias não mapeadas com valor em R$ | `MonthSummarySection` |

## P2 — Melhoria de fluxo

| # | Ajuste |
|---|--------|
| 9 | Helper *"Repete só neste ano"* nos formulários de repetição |
| 10 | Empty state regra quando renda efetivada = 0 |
| 11 | Apply-to-all: botão destrutivo + resumo do item |
| 12 | Atalho Mensal/Anual no header mobile |
| 13 | Unificar *"Investimentos"* no gráfico anual |
| 14 | Empty state gráfico anual sem dados efetivados |
| 15 | Separar visualmente checkbox status vs seleção de linha |

## P3 — Polish

| # | Ajuste |
|---|--------|
| 16 | Remover/reduzir overlay de troca de tema |
| 17 | Contagem nos títulos de grupo de gastos |
| 18 | Busca no wizard de categorias (lista longa) |
| 19 | Link *"Redefinir regra"* |
| 20 | Destacar mês atual no gráfico |
| 21 | Glossário in-app *"Como lemos seus números"* |

---

# Cenários de uso — validação

| Persona | Experiência atual | Após P1 |
|---------|-------------------|---------|
| **Iniciante** | Confuso com totais diferentes | Compreende planejado vs efetivado |
| **Operacional** | Cadastra rápido via FAB; gastos ainda pesados | Empty states aceleram primeiro uso |
| **Financeiro** | Desconfia da regra vs resumo | Alerta de não classificados reconcilia |
| **Gestor (anual)** | Gráfico claro; descoberta mobile fraca | Labels e empty states melhoram leitura |

---

# Recomendações estratégicas

1. **Adotar linguagem única no produto:** *Planejado*, *Efetivado*, *Fatura*, *Saldo em caixa* — em toda interface.
2. **Camada de educação financeira leve:** tooltips e uma página de ajuda, não tutorial bloqueante.
3. **Revisar propósito da seleção:** informativa hoje; evoluir para ações em lote ou simplificar removendo gesto de clique na linha.
4. **Onboarding de 3 passos (futuro):** adicionar entrada → marcar recebido → configurar regra.

---

# O que não mudar (está funcionando bem)

- Paleta semântica (income/expense/investment).
- Dialog de aviso para gasto em cartão (`Item vinculado a cartão`).
- Wizard da regra em 2 passos com indicador de progresso.
- `MonthNavigator` com botão *Hoje*.
- Toasts de sucesso/erro em operações CRUD.
- Responsividade geral das seções embedded nas tabs.
- Página 404 em PT-BR.

---

## Referências

- [UX/UI Specialist](./uxui-specilist.mdc)
- [Regras de Negócio](../BUSINESS/relatorio-regras-negocio.md)
- [Validação](../VALIDATION/relatorio-validacao-correcoes-qa.md)
- [Correções Dev](../DEV/relatorio-correcoes-qa.md)
