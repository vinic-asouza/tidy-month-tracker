---
type: regras-modulo
modulo: carteiras
status: Removido
ultima_atualizacao: 2026-10-16
---

# Carteiras (removido)

**Todas as regras RN-W01…RN-W09 foram removidas** com o módulo na **DEV-151** (2026-10-16). Não há regra de carteira vigente.

Decisão: [`ADR-007`](../../07_decisoes-tecnicas/ADR-007-remover-carteiras.md). Release: [`v0.9.0`](../../releases/v0.9.0-2026-10-16.md). Módulo (tombstone): [`../../04_modulos/carteiras.md`](../../04_modulos/carteiras.md).

## O que mudou nas regras

| Antes | Agora |
| --- | --- |
| Papel obrigatório, métricas do mês por carteira, abertura e variação (RN-W01…W04) | Não existe |
| Transferência, resgate de carteira, Saldo Livre, patrimônio estimado (RN-W05…W09) | Não existe |
| Efetivar com carteira de origem/destino | Efetivar é só o toggle de status |
| Pagar fatura debitando carteira | Pagar fatura só marca `credit_card_monthly_status` (ver [cartoes.md](./cartoes.md)) |

Leitura de caixa vigente: RN-G07 em [`../regras-gerais.md`](../regras-gerais.md).

Notas de release `v0.1`–`v0.8` ainda citam carteiras como foto histórica.
