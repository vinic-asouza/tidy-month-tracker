---
type: regras-modulo
modulo: gastos
ultima_atualizacao: 2026-09-04
---

# Gastos

`ExpenseSection`. Cartão: [`cartoes.md`](./cartoes.md). Conquista de desejo: [`desejos.md`](./desejos.md). Importação CSV: [`../../04_modulos/gastos.md`](../../04_modulos/gastos.md).

---

## RN-X01 — Tipos

| Tipo | Uso |
| --- | --- |
| Fixo | Recorre no ano civil (RN-G05) |
| Variável | Pontual no mês |
| Parcelado | Série com `installmentNumber` / total; **pode cruzar o ano** (`installments.ts`) |

## RN-X02 — Nascimento

`paid = false`, sem carteira (não-cartão). Categoria, forma de pagamento, descrição e valor > 0 obrigatórios.

## RN-X03 — Efetivação não-cartão

Checkbox pago → `EffectuateWalletDialog` (movimentação ou Saldo Livre).

## RN-X04 — Gasto no cartão

Sem checkbox pago no item. Status vem da **fatura** daquele mês. Não vincula carteira por lançamento; o débito é o `invoice_payment` ao pagar a fatura.

## RN-X05 — Parcelas

- Excluir “este mês”: só o registro corrente; a série pode ficar com buraco.
- Excluir “todas”: série pelo `base_expense_id`.
- Editar “todas as parcelas / meses seguintes”: escopo da série, sem copiar carteira.

## RN-X06 — Categorias

CRUD na seção. Em uso: não exclui. Renomear: propaga. Mapeamento na regra financeira é outro passo ([`regra-financeira.md`](./regra-financeira.md)).

## RN-X07 — Troca de tipo na edição (DEV-104)

No formulário de criar/editar, trocar Fixo / Variável / Parcelado **preserva** campos comuns (categoria, descrição, valor, pagamento, data, carteira se visível).

Ao **salvar** com `type` diferente do persistido:

- Aplica **somente** ao registro do mês/parcela aberto — **não** propaga via “aplicar a todos”.
- **Desvincula** da série antiga (`base_expense_id = null`). Se o item era raiz, promove o próximo irmão a nova raiz; irmãos permanecem no tipo antigo.
- Sanitiza campos do tipo destino (parcelas / `repeat_all_months`).
- Se o destino for fixo com “repetir todos os meses” ou parcelado com total > parcela atual, **gera** o restante da série como no create (RN-G05 / RN-X05).

---

## Importação CSV assistida (DEV-103)

Exceção à política de “sem importação automática”. Só **gastos**. Preserva RN-X01–X07, RN-G01/G02/G04/G05, RN-X04 / RN-C02–C03.

| ID | Regra |
| --- | --- |
| **CSV-01** | Upload e mapeamento **não** criam nem atualizam `expenses`. Gravação só após **Importar selecionados**. |
| **CSV-02** | Match com fixo/parcela existente é **sugestão**. Nunca auto-vincular só por score. Ambiguidade → estado **Revisar** (fora do lote até decidir). |
| **CSV-03** | **Associar existente** atualiza a linha escolhida; **não** cria segundo gasto no mês. |
| **CSV-04** | Origem **conta**: métodos `DEFAULT_PAYMENT_METHODS`; efetivar opcional (default off) + carteira/Saldo Livre. Origem **cartão X**: `paymentMethod` = nome do cartão; sem efetivar / sem `account_id` (RN-X04). |
| **CSV-05** | Data da linha ≠ mês aberto na UI → exige escolha explícita (data/mês do CSV **ou** mês da UI) antes de importar. |

### Comportamentos adicionais

- Valor Finto sempre `> 0`; créditos / valor ≤ 0 → inelegíveis (ignorar).
- Ações por linha: novo variável · novo parcelado · tornar fixo (± `repeatAllMonths`, default off) · associar existente · ignorar · revisar.
- Novo parcelado: série a partir da parcela atual em diante (não inventa passado).
- Estado só na sessão do modal; re-upload = nova sessão. Sem inbox / `external_id` / presets de banco.
- Lote com falha parcial: linhas válidas gravam; inválidas falham com relatório.
