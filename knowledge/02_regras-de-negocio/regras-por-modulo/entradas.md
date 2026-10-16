---
type: regras-modulo
modulo: entradas
ultima_atualizacao: 2026-10-16
---

# Entradas

`IncomeSection`.

---

## RN-E01 — Nascimento

Nova entrada: `received = false`. Tag e descrição obrigatórias; valor > 0.

## RN-E02 — Efetivação

Marcar recebido é só o **toggle** de `received` (`StatusToggleBadge`), sem diálogo nem carteira. Desefetivar volta a `false`.

## RN-E03 — Repetição

Opcional, ano civil (RN-G05). Editar/excluir: só este mês ou meses seguintes da série. Cada mês efetiva de novo.

## RN-E04 — Tag *Resgate de investimentos* (histórico)

Não há mais resgate automático (carteiras removidas na DEV-151). A tag continua nas tags padrão de entrada; entradas antigas com ela são **entradas normais** e entram no caixa efetivado. No planejado ficam fora da base de renda (RN-G03, RN-G08).

## RN-E05 — Tags

CRUD na seção. Excluir tag em uso: bloqueado. Renomear: propaga.
