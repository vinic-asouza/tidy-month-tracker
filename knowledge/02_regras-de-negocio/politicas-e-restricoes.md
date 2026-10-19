---
type: regras-negocio
titulo: Políticas e restrições
ultima_atualizacao: 2026-10-16
---

# Políticas e restrições

O que o produto **não faz**, **não permite** ou trata como restrição consciente. Visão: [`../01_produto/visao-do-produto.md`](../01_produto/visao-do-produto.md).

---

## Conta e dados

| Política | Detalhe |
| --- | --- |
| Cadastro | E-mail + senha; confirmação por e-mail (Supabase Auth). Senha 6–72 caracteres. |
| Sessão | Persistente até logout. `/` exige usuário (`ProtectedRoute` → `/auth`). |
| Isolamento | Só os dados do `auth.uid()`. Sem conta conjunta. |
| Admin | Não há módulo de administração de usuários. |

---

## Integrações e automação (de propósito)

Não há, e não deve ser prometido sem decisão de produto:

- Open Finance / conexão bancária (DEV-96 adiada)
- Sync de fatura ou corretora
- Push, WhatsApp, e-mail transacional além da confirmação de cadastro
- Assinatura / gateway de pagamento
- Multiplayer ou papéis
- Exportação CSV/PDF fora do recorte anual agregado (roadmap P4)
- Importação automática / inbox persistente / presets de banco

**Exceção consciente (DEV-103 / DEV-105):** importação **CSV assistida de gastos** — o arquivo só propõe linhas; a pessoa mapeia, revisa e confirma. Nada grava em `expenses` até **Importar selecionados**. Parse no browser; o CSV não sobe ao Supabase. Heurística de parcela (CSV-06) só sugere e evidencia na revisão. Regras: [`regras-por-modulo/gastos.md`](./regras-por-modulo/gastos.md) (CSV-01…CSV-06). Módulo: [`../04_modulos/gastos.md`](../04_modulos/gastos.md).

**Exceção consciente (DEV-150):** exportação anual agregada — na visão Anual, PDF ou CSV do ano selecionado e do modo ativo. Lê o que a tela já calculou. Não cria lançamento, não inclui desejos, não lista cada gasto e não sobe o arquivo. Visão Mensal, e-mail e os dois modos no mesmo arquivo continuam fora. Regra: [`regras-por-modulo/resumo-e-estatisticas.md`](./regras-por-modulo/resumo-e-estatisticas.md) (RN-R07). Módulo: [`../04_modulos/resumo-e-estatisticas.md`](../04_modulos/resumo-e-estatisticas.md).

Registro com participação ativa continua sendo política (visão do produto): a assistida acelera volume **com** revisão, não substitui o ritual por extrato automático.

---

## Validações

Formulários e UX (valor ≤ 0, percentuais da regra no wizard) continuam **no cliente**. O Postgres também garante: `value > 0`, `year_month` YYYY-MM e coerência de parcelas em lançamentos (DEV-143); soma 100% em `financial_rule`. Categoria ∈ settings e método ∈ defaults ∪ cartões **permanecem só na app**. ADRs: [`../07_decisoes-tecnicas/ADR-008-checks-integridade-lancamentos.md`](../07_decisoes-tecnicas/ADR-008-checks-integridade-lancamentos.md) (vigente), [`../07_decisoes-tecnicas/ADR-006-validacao-no-cliente.md`](../07_decisoes-tecnicas/ADR-006-validacao-no-cliente.md) (parcialmente substituída).

---

## Cartão identificado pelo nome

Gasto no cartão casa com o cartão pelo **nome** (`paymentMethod` = `creditCard.name`), não por ID. Renomear o cartão atualiza os gastos. Dois cartões com o mesmo nome colidem. Migração para `credit_card_id` é P3 no [`../01_produto/roadmap.md`](../01_produto/roadmap.md). ADR: [`../07_decisoes-tecnicas/ADR-005-cartao-por-nome.md`](../07_decisoes-tecnicas/ADR-005-cartao-por-nome.md).

---

## Métodos de pagamento

Lista padrão no app (`DEFAULT_PAYMENT_METHODS`). **Não** há CRUD de métodos customizáveis no MVP (decisão D8). Cartões cadastrados entram como forma de pagamento além dessa lista.

---

## O que a UI recusa

| Ação | Restrição |
| --- | --- |
| Excluir tag/categoria/cartão em uso | Bloqueado |
| Valor ≤ 0 | Bloqueado nos formulários |
| Percentuais da regra ≠ 100% | Bloqueado ao salvar a regra |

---

## Limites de interpretação

- O produto não rastreia contas bancárias nem patrimônio: só o fluxo do mês e o que a pessoa registra (carteiras removidas na DEV-151, [ADR-007](../07_decisoes-tecnicas/ADR-007-remover-carteiras.md)).
- Limite de crédito do cartão é **informativo**; não impede lançar gasto.
- Vencimento do cartão é **informativo**; alerta visual (~3 dias), não altera a fatura.
- Chip do cartão soma **todos** os gastos daquele cartão no mês; o resumo efetivado só inclui se a **fatura** estiver paga.
