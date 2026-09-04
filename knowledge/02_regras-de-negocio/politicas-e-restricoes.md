---
type: regras-negocio
titulo: Políticas e restrições
ultima_atualizacao: 2026-09-03
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
- Exportação CSV/PDF (roadmap P4)
- Importação automática / inbox persistente / presets de banco

**Exceção consciente (DEV-103):** importação **CSV assistida de gastos** — o arquivo só propõe linhas; a pessoa mapeia, revisa e confirma. Nada grava em `expenses` até **Importar selecionados**. Parse no browser; o CSV não sobe ao Supabase. Regras: [`regras-por-modulo/gastos.md`](./regras-por-modulo/gastos.md) (CSV-01…CSV-05). Módulo: [`../04_modulos/gastos.md`](../04_modulos/gastos.md).

Registro com participação ativa continua sendo política (visão do produto): a assistida acelera volume **com** revisão, não substitui o ritual por extrato automático.

---

## Validações

Regras de valor, percentuais da regra e formulários são aplicadas **no cliente**. O plano pré-lançamento registra risco de MVP: constraints no Postgres (valor > 0, soma 100%) são P4, não garantia atual. ADR: [`../07_decisoes-tecnicas/ADR-006-validacao-no-cliente.md`](../07_decisoes-tecnicas/ADR-006-validacao-no-cliente.md).

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
| Excluir carteira | Permitido; movimentos ficam, `account_id` vira nulo (`ON DELETE SET NULL`) |
| Trocar papel da carteira | Bloqueado se já houver movimentos vinculados |
| Aporte origem = destino | Bloqueado |
| Transferência origem = destino | Bloqueado |
| Valor ≤ 0 | Bloqueado nos formulários |
| Percentuais da regra ≠ 100% | Bloqueado ao salvar a regra |

---

## Limites de interpretação

- Saldo de carteira é **estimado**, não extrato.
- Limite de crédito do cartão é **informativo**; não impede lançar gasto.
- Vencimento do cartão é **informativo**; alerta visual (~3 dias), não altera a fatura.
- Chip do cartão soma **todos** os gastos daquele cartão no mês; o resumo efetivado só inclui se a **fatura** estiver paga.
