# Relatório de Execução — Regressão Manual Gate de Lançamento

| Campo | Valor |
|-------|-------|
| **Roteiro** | [16-regressao-manual-gate.md](../QA/relatorios/16-regressao-manual-gate.md) |
| **Data da execução** | _[YYYY-MM-DD]_ |
| **Executor** | _[nome]_ |
| **Ambiente** | _[local `npm run dev` / URL produção]_ |
| **Build / commit** | _[hash ou tag, se aplicável]_ |
| **Usuário de teste** | _[conta utilizada]_ |
| **Migration `account_operations`** | _[✅ confirmada / ❌ pendente]_ |

---

## Resumo executivo

**Veredito:** _[Aprovado / Aprovado com ressalvas / Falhou]_

_[1–3 frases: o que foi testado, resultado geral, bloqueios se houver.]_

| Resultado | Quantidade |
|-----------|------------|
| Cenários aprovados | _[0–9]_ |
| Cenários com falha | _[0–9]_ |
| Bugs novos encontrados | _[0–N]_ |

---

## Resultados por cenário

### Cenário A — Apply-to-all × gráfico anual

| ID | Descrição | Resultado | Evidência | Bug? |
|----|-----------|-----------|-----------|------|
| A1 | Criar entrada com repetição anual | _[OK / Falha]_ | _[screenshot, nota]_ | _[— / link]_ |
| A2 | Editar com aplicar a todos | _[OK / Falha]_ | | |
| A3 | Excluir com aplicar a todos | _[OK / Falha]_ | | |
| A4 | Excluir só este mês (controle) | _[OK / Falha]_ | | |

**Notas A:** _[valores observados, meses testados, desync gráfico vs. dashboard se houver]_

---

### Cenário B — Resgate E2E

| ID | Descrição | Resultado | Evidência | Bug? |
|----|-----------|-----------|-----------|------|
| B | Resgate R$ 500 + reconciliação | _[OK / Falha]_ | | |

**Valores registrados:**

| Superfície | Antes | Depois | Esperado | Bate? |
|------------|-------|--------|----------|-------|
| Entradas (efetiv.) resumo | | | +R$ 500 | ☐ |
| Hint resgates | | | "Inclui R$ 500…" | ☐ |
| Chip origem (Saiu) | | | +R$ 500 saída | ☐ |
| Saldo Livre (Entrou) | | | +R$ 500 | ☐ |
| A receber (se > 0) | | | inalterado pelo resgate | ☐ |

---

### Cenário C — Transferência E2E

| ID | Descrição | Resultado | Evidência | Bug? |
|----|-----------|-----------|-----------|------|
| C | Transferência R$ 200 | _[OK / Falha]_ | | |

**Valores registrados:**

| Superfície | Antes | Depois | Esperado | Bate? |
|------------|-------|--------|----------|-------|
| Resumo (entradas/gastos/saldo) | | | inalterado | ☐ |
| Chip origem | | | −R$ 200 | ☐ |
| Chip destino | | | +R$ 200 | ☐ |
| Saldo Livre | | | inalterado | ☐ |
| Gráfico anual (mês) | | | inalterado | ☐ |

---

### Cenário D — Exclusão E2E

| ID | Descrição | Resultado | Evidência | Bug? |
|----|-----------|-----------|-----------|------|
| D1 | Excluir resgate (Saldo Livre) | _[OK / Falha]_ | | |
| D2 | Excluir transferência (Operações do mês) | _[OK / Falha]_ | | |
| D3 | Menu "Operações do mês" oculto | _[OK / Falha]_ | | |

---

## Bugs encontrados (se houver)

### _[Título do bug]_

| Campo | Valor |
|-------|-------|
| **Severidade** | _[Crítico / Alto / Médio / Baixo]_ |
| **Cenário** | _[ex.: A3]_ |
| **Passos para reproduzir** | 1. … 2. … |
| **Esperado** | |
| **Obtido** | |
| **Tela / módulo** | |
| **Ação de follow-up** | _[issue / correção / aceite]_ |

---

## Reconciliação gate (checklist espelho)

| Critério | Resultado manual |
|----------|------------------|
| Apply-to-all sincroniza gráfico anual (A1–A3) | _[✅ / ❌ / ⏳]_ |
| Exclusão parcial não quebra série (A4) | _[✅ / ❌ / ⏳]_ |
| Resgate: resumo + Saldo Livre + chips (B) | _[✅ / ❌ / ⏳]_ |
| Transferência neutra no resumo (C) | _[✅ / ❌ / ⏳]_ |
| Exclusão reverte operações (D) | _[✅ / ❌ / ⏳]_ |

---

## Veredito final

| Escopo | Veredito |
|--------|----------|
| Regressão manual gate | _[Aprovado / Aprovado com ressalvas / Falhou]_ |
| Gate de lançamento (impacto) | _[Atualizar 15-gate-lancamento.md se aprovado]_ |

### Próximos passos

1. _[Se aprovado: marcar checklist manual em 15-gate-lancamento.md]_
2. _[Se falhou: abrir correção para bug(s) listados]_
3. _[Marketing / termos — fora deste escopo]_

---

## Referências

- [Roteiro de execução](../QA/relatorios/16-regressao-manual-gate.md)
- [QA Gate — relatório original](../QA/relatorios/15-gate-lancamento.md)
- [Validação correções QA](./relatorio-validacao-gate-correcoes-qa.md)
- [Processo Validation](./validation-specialist.mdc)

---

*Preencher após executar o roteiro no browser. Anexar screenshots na pasta do time ou links externos na coluna Evidência.*
