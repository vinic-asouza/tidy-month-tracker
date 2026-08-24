---
type: regras-modulo
modulo: entradas
ultima_atualizacao: 2026-08-21
---

# Entradas

`IncomeSection`. Ver também resgate em [`carteiras.md`](./carteiras.md).

---

## RN-E01 — Nascimento

Nova entrada: `received = false`, sem carteira. Tag e descrição obrigatórias; valor > 0.

## RN-E02 — Efetivação

Marcar recebido abre `EffectuateWalletDialog`: carteira de **movimentação** ou **Saldo Livre**. Desefetivar limpa o vínculo.

## RN-E03 — Repetição

Opcional, ano civil (RN-G05). Editar/excluir: só este mês ou meses seguintes da série. Carteira **não** se copia; cada mês efetiva de novo.

## RN-E04 — Resgate automático

Resgate de carteira de investimentos cria entrada já `received`, tag *Resgate de investimentos*, ligada à operação. Entra no caixa e na regra. Não deve ser tratada como “salário a receber” (RN-G08, RN-R03).

## RN-E05 — Tags

CRUD na seção. Excluir tag em uso: bloqueado. Renomear: propaga.
