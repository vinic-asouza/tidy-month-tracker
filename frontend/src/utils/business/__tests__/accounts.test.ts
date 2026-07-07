import { describe, it, expect } from 'vitest';
import {
  getAccountMonthTotals,
  accountHasMovementsInMonth,
  getAccountDeclaredBalance,
  getAccountLastKnownBalance,
  getAccountNetVariation,
  getAccountProjectedBalance,
  getMonthsInRange,
  getAccountOpeningBalance,
  getAccountOpeningBalanceContext,
  getAccountClosingBalance,
  getAccountHistoryFetchRange,
  getBalanceDeclarationWarning,
  getUnlinkedMonthTotals,
  getUnlinkedMovements,
  getUnlinkedNetVariation,
  getUnlinkedOpeningBalance,
  getUnlinkedClosingBalance,
  getUnlinkedOpeningBalanceContext,
  getAccountMonthMovements,
  getAccountMonthOperations,
  accountHasMonthOperations,
  accountHasMonthMovements,
  getTotalEstimatedPatrimony,
} from '../accounts';
import type { Account, AccountBalance, AccountOperation, CreditCard, MonthData } from '@/types/domain';
import { RESGATE_INCOME_TAG } from '@/types/finance';

const mockMonthData = (overrides: Partial<MonthData> = {}): MonthData => ({
  incomes: [],
  expenses: [],
  investments: [],
  ...overrides,
});

const ACC_A = 'acc-a';
const ACC_B = 'acc-b';
const ACC_MOV = 'acc-mov';
const ACC_INV = 'acc-inv';
const CARD_ID = 'card-1';

const creditCards: CreditCard[] = [
  { id: CARD_ID, name: 'Nubank', color: 'blue', displayOrder: 0, paid: false },
];

describe('getAccountMonthTotals', () => {
  it('retorna zeros quando não há movimentos', () => {
    const result = getAccountMonthTotals(ACC_A, mockMonthData());
    expect(result).toEqual({ inflow: 0, outflow: 0, invested: 0 });
  });

  it('soma apenas entradas recebidas da carteira correta', () => {
    const data = mockMonthData({
      incomes: [
        { id: '1', description: 'Salário', value: 5000, tag: 'Salário', date: null, received: true, accountId: ACC_A },
        { id: '2', description: 'Freelance', value: 1000, tag: 'Freelance', date: null, received: false, accountId: ACC_B },
        { id: '3', description: 'Outro', value: 200, tag: 'Outro', date: null, received: false },
      ],
    });
    const result = getAccountMonthTotals(ACC_A, data);
    expect(result.inflow).toBe(5000);
    expect(result.outflow).toBe(0);
    expect(result.invested).toBe(0);
  });

  it('ignora entrada não recebida da mesma carteira (mesmo com account_id legado)', () => {
    const data = mockMonthData({
      incomes: [
        { id: '1', description: 'A', value: 1000, tag: 'T', date: null, received: false, accountId: ACC_A },
      ],
    });
    expect(getAccountMonthTotals(ACC_A, data).inflow).toBe(0);
  });

  it('ignora gasto pendente com account_id legado na carteira', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: '1',
          type: 'variable',
          category: 'Mercado',
          description: 'Supermercado',
          paymentMethod: 'Pix',
          value: 300,
          paid: false,
          accountId: ACC_A,
        },
      ],
    });
    expect(getAccountMonthTotals(ACC_A, data).outflow).toBe(0);
  });

  it('soma apenas gastos pagos da carteira correta', () => {
    const data = mockMonthData({
      expenses: [
        { id: '1', type: 'variable', category: 'Mercado', description: 'Supermercado', paymentMethod: 'Débito', value: 300, paid: true, accountId: ACC_A },
        { id: '2', type: 'fixed', category: 'Moradia', description: 'Aluguel', paymentMethod: 'Pix', value: 1500, paid: false, accountId: ACC_B },
      ],
    });
    const result = getAccountMonthTotals(ACC_A, data);
    expect(result.outflow).toBe(300);
    expect(result.inflow).toBe(0);
  });

  it('gasto em cartão não debita carteira por item mesmo com accountId legado', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: '1',
          type: 'variable',
          category: 'Lazer',
          description: 'Compra',
          paymentMethod: 'Nubank',
          value: 400,
          paid: false,
          accountId: ACC_A,
        },
      ],
    });
    expect(getAccountMonthTotals(ACC_A, data, creditCards, { [CARD_ID]: true }).outflow).toBe(0);
  });

  it('invoice_payment debita carteira pagadora pelo total da fatura', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: '1',
          type: 'variable',
          category: 'Lazer',
          description: 'Compra',
          paymentMethod: 'Nubank',
          value: 400,
          paid: false,
        },
      ],
      accountOperations: [
        {
          id: 'op-1',
          type: 'invoice_payment',
          sourceAccountId: ACC_A,
          destinationAccountId: null,
          transferGroupId: null,
          creditCardId: CARD_ID,
          amount: 400,
          yearMonth: '2026-06',
          operationDate: '2026-06-15',
          description: 'Fatura Nubank',
        },
      ],
    });
    expect(getAccountMonthTotals(ACC_A, data, creditCards, { [CARD_ID]: true }).outflow).toBe(400);
  });

  it('invoice_payment sem carteira debita Saldo Livre pelo total da fatura', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: '1',
          type: 'variable',
          category: 'Lazer',
          description: 'Compra',
          paymentMethod: 'Nubank',
          value: 400,
          paid: false,
        },
      ],
      accountOperations: [
        {
          id: 'op-1',
          type: 'invoice_payment',
          sourceAccountId: null,
          destinationAccountId: null,
          transferGroupId: null,
          creditCardId: CARD_ID,
          amount: 400,
          yearMonth: '2026-06',
          operationDate: '2026-06-15',
          description: 'Fatura Nubank',
        },
      ],
    });
    expect(getUnlinkedMonthTotals(data, creditCards, { [CARD_ID]: true }).outflow).toBe(400);
  });

  it('getUnlinkedMovements lista fatura paga no Saldo Livre', () => {
    const data = mockMonthData({
      accountOperations: [
        {
          id: 'op-1',
          type: 'invoice_payment',
          sourceAccountId: null,
          destinationAccountId: null,
          transferGroupId: null,
          creditCardId: CARD_ID,
          amount: 250,
          yearMonth: '2026-06',
          operationDate: '2026-06-20',
          description: 'Fatura Nubank',
        },
      ],
    });
    const movements = getUnlinkedMovements(data, creditCards, { [CARD_ID]: true });
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      id: 'op-1',
      kind: 'invoice_payment',
      value: 250,
      detail: 'Nubank',
    });
  });

  it('getUnlinkedMonthTotals não inclui gastos de cartão pagos', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: '1',
          type: 'variable',
          category: 'Lazer',
          description: 'Compra',
          paymentMethod: 'Nubank',
          value: 400,
          paid: false,
        },
      ],
    });
    expect(getUnlinkedMonthTotals(data, creditCards, { [CARD_ID]: true }).outflow).toBe(0);
  });

  it('soma aportes recebidos na carteira de investimentos', () => {
    const data = mockMonthData({
      investments: [
        {
          id: '1',
          description: 'Tesouro',
          value: 500,
          tag: 'Corretora',
          date: null,
          invested: true,
          sourceAccountId: ACC_MOV,
          accountId: ACC_INV,
        },
        {
          id: '2',
          description: 'CDB',
          value: 1000,
          tag: 'Banco',
          date: null,
          invested: false,
          accountId: ACC_B,
        },
      ],
    });
    const result = getAccountMonthTotals(ACC_INV, data, [], undefined, 'investment');
    expect(result.invested).toBe(500);
    expect(result.inflow).toBe(0);
    expect(result.outflow).toBe(0);
  });

  it('conta aporte enviado como saída na carteira de movimentação', () => {
    const data = mockMonthData({
      investments: [
        {
          id: '1',
          description: 'Aporte',
          value: 2000,
          tag: 'Invest',
          date: null,
          invested: true,
          sourceAccountId: ACC_MOV,
          accountId: ACC_INV,
        },
      ],
    });
    const result = getAccountMonthTotals(ACC_MOV, data, [], undefined, 'movement');
    expect(result.outflow).toBe(2000);
    expect(result.invested).toBe(2000);
  });

  it('ignora movimentos sem accountId', () => {
    const data = mockMonthData({
      incomes: [
        { id: '1', description: 'Sem carteira', value: 999, tag: 'Tag', date: null, received: true },
      ],
    });
    expect(getAccountMonthTotals(ACC_A, data).inflow).toBe(0);
  });

  it('acumula apenas movimentos efetivados da mesma carteira', () => {
    const data = mockMonthData({
      incomes: [
        { id: '1', description: 'A', value: 1000, tag: 'T', date: null, received: true, accountId: ACC_A },
        { id: '2', description: 'B', value: 500, tag: 'T', date: null, received: false, accountId: ACC_A },
      ],
      expenses: [
        { id: '3', type: 'variable', category: 'C', description: 'X', paymentMethod: 'P', value: 200, paid: false, accountId: ACC_A },
        { id: '4', type: 'variable', category: 'C', description: 'Y', paymentMethod: 'P', value: 100, paid: true, accountId: ACC_A },
      ],
    });
    const result = getAccountMonthTotals(ACC_A, data);
    expect(result.inflow).toBe(1000);
    expect(result.outflow).toBe(100);
  });
});

describe('accountHasMovementsInMonth', () => {
  it('retorna false sem movimentos', () => {
    expect(accountHasMovementsInMonth(ACC_A, mockMonthData())).toBe(false);
  });

  it('retorna false quando há movimento não efetivado', () => {
    const data = mockMonthData({
      incomes: [{ id: '1', description: 'A', value: 100, tag: 'T', date: null, received: false, accountId: ACC_A }],
    });
    expect(accountHasMovementsInMonth(ACC_A, data)).toBe(false);
  });

  it('retorna true com ao menos um movimento efetivado', () => {
    const data = mockMonthData({
      incomes: [{ id: '1', description: 'A', value: 100, tag: 'T', date: null, received: true, accountId: ACC_A }],
    });
    expect(accountHasMovementsInMonth(ACC_A, data)).toBe(true);
  });
});

const mkBalance = (partial: Partial<AccountBalance> & { yearMonth: string }): AccountBalance => ({
  id: partial.id ?? 'b1',
  accountId: partial.accountId ?? ACC_A,
  userId: 'user-1',
  yearMonth: partial.yearMonth,
  balance: partial.balance ?? 0,
});

describe('getAccountDeclaredBalance', () => {
  it('retorna o saldo do mês exato', () => {
    const balances = [mkBalance({ yearMonth: '2026-07', balance: 5000 })];
    const result = getAccountDeclaredBalance(ACC_A, '2026-07', balances);
    expect(result?.balance).toBe(5000);
  });

  it('retorna null quando não declarado no mês', () => {
    const balances = [mkBalance({ yearMonth: '2026-06', balance: 4000 })];
    expect(getAccountDeclaredBalance(ACC_A, '2026-07', balances)).toBeNull();
  });

  it('retorna null para carteira diferente', () => {
    const balances = [mkBalance({ yearMonth: '2026-07', balance: 1000, accountId: ACC_B })];
    expect(getAccountDeclaredBalance(ACC_A, '2026-07', balances)).toBeNull();
  });
});

describe('getAccountLastKnownBalance', () => {
  it('retorna o saldo mais recente anterior ao mês', () => {
    const balances = [
      mkBalance({ yearMonth: '2026-05', balance: 3000 }),
      mkBalance({ yearMonth: '2026-06', balance: 4000 }),
    ];
    const result = getAccountLastKnownBalance(ACC_A, '2026-07', balances);
    expect(result?.yearMonth).toBe('2026-06');
    expect(result?.balance).toBe(4000);
  });

  it('retorna null quando não há saldo anterior', () => {
    const balances = [mkBalance({ yearMonth: '2026-07', balance: 5000 })];
    expect(getAccountLastKnownBalance(ACC_A, '2026-07', balances)).toBeNull();
  });

  it('ignora saldos de outros meses futuros', () => {
    const balances = [mkBalance({ yearMonth: '2026-08', balance: 9000 })];
    expect(getAccountLastKnownBalance(ACC_A, '2026-07', balances)).toBeNull();
  });
});

describe('getAccountNetVariation', () => {
  it('calcula liquidez na carteira de movimentação (inflow - outflow)', () => {
    const data = mockMonthData({
      incomes: [
        {
          id: '1',
          description: 'S',
          value: 2000,
          tag: 'T',
          date: null,
          received: true,
          accountId: ACC_MOV,
        },
      ],
      expenses: [
        {
          id: '2',
          description: 'A',
          value: 500,
          category: 'c',
          paymentMethod: 'p',
          paid: true,
          type: 'personal',
          accountId: ACC_MOV,
        },
      ],
      investments: [
        {
          id: '3',
          description: 'I',
          value: 300,
          tag: 't',
          date: null,
          invested: true,
          sourceAccountId: ACC_MOV,
          accountId: ACC_INV,
        },
      ],
    });
    // 2000 - 500 - 300 = 1200
    expect(getAccountNetVariation(ACC_MOV, data, [], undefined, 'movement')).toBe(1200);
    expect(getAccountNetVariation(ACC_INV, data, [], undefined, 'investment')).toBe(300);
  });

  it('retorna 0 sem movimentos', () => {
    expect(getAccountNetVariation(ACC_A, mockMonthData())).toBe(0);
  });
});

describe('getAccountProjectedBalance', () => {
  it('soma saldo base com variação líquida efetiva', () => {
    const data = mockMonthData({
      incomes: [{ id: '1', description: 'S', value: 1200, tag: 'T', date: null, received: true, accountId: ACC_A }],
      expenses: [{ id: '2', description: 'A', value: 300, category: 'c', paymentMethod: 'p', paid: true, type: 'personal', accountId: ACC_A }],
    });
    // 5000 + (1200 - 300) = 5900
    expect(getAccountProjectedBalance(5000, ACC_A, data)).toBe(5900);
  });

  it('aportado na carteira de investimentos aumenta saldo projetado', () => {
    const data = mockMonthData({
      investments: [
        {
          id: '1',
          description: 'I',
          value: 500,
          tag: 't',
          date: null,
          invested: true,
          sourceAccountId: ACC_MOV,
          accountId: ACC_INV,
        },
      ],
    });
    // 1000 + 500 = 1500
    expect(getAccountProjectedBalance(1000, ACC_INV, data, [], undefined, 'investment')).toBe(1500);
  });
});

describe('patrimônio origem/destino (cenário salário/aluguel/aporte)', () => {
  it('movimentação 2k e investimentos 2k após salário 5k, aluguel 1k e aporte 2k', () => {
    const data = mockMonthData({
      incomes: [
        {
          id: '1',
          description: 'Salário',
          value: 5000,
          tag: 'Salário',
          date: null,
          received: true,
          accountId: ACC_MOV,
        },
      ],
      expenses: [
        {
          id: '2',
          type: 'fixed',
          category: 'Moradia',
          description: 'Aluguel',
          paymentMethod: 'Pix',
          value: 1000,
          paid: true,
          accountId: ACC_MOV,
        },
      ],
      investments: [
        {
          id: '3',
          description: 'Aporte',
          value: 2000,
          tag: ACC_INV,
          date: null,
          invested: true,
          sourceAccountId: ACC_MOV,
          accountId: ACC_INV,
        },
      ],
    });

    expect(getAccountNetVariation(ACC_MOV, data, [], undefined, 'movement')).toBe(2000);
    expect(getAccountNetVariation(ACC_INV, data, [], undefined, 'investment')).toBe(2000);
    expect(
      getAccountNetVariation(ACC_MOV, data, [], undefined, 'movement') +
        getAccountNetVariation(ACC_INV, data, [], undefined, 'investment')
    ).toBe(4000);

    const accounts = [
      {
        id: ACC_MOV,
        name: 'Corrente',
        type: 'checking' as const,
        role: 'movement' as const,
        color: null,
        displayOrder: 0,
      },
      {
        id: ACC_INV,
        name: 'Investimentos',
        type: 'investment' as const,
        role: 'investment' as const,
        color: null,
        displayOrder: 1,
      },
    ];
    const history = { '2026-07': data };
    expect(getTotalEstimatedPatrimony(accounts, '2026-07', [], history)).toBe(4000);
  });
});

describe('getMonthsInRange', () => {
  it('lista meses inclusive entre from e to', () => {
    expect(getMonthsInRange('2026-06', '2026-08')).toEqual(['2026-06', '2026-07', '2026-08']);
  });

  it('retorna vazio quando from > to', () => {
    expect(getMonthsInRange('2026-08', '2026-06')).toEqual([]);
  });
});

describe('getAccountOpeningBalance', () => {
  const balances = [mkBalance({ yearMonth: '2026-07', balance: 5000 })];

  it('usa saldo declarado do mês como abertura', () => {
    const opening = getAccountOpeningBalance(ACC_A, '2026-07', balances, {});
    expect(opening).toBe(5000);
  });

  it('carry-forward: mês sem declaração usa fechamento do mês anterior', () => {
    const history: Record<string, MonthData> = {
      '2026-07': mockMonthData({
        incomes: [{ id: '1', description: 'S', value: 500, tag: 'T', date: null, received: true, accountId: ACC_A }],
      }),
    };
    // Jul: 5000 + 500 = 5500; Ago opening = 5500
    expect(getAccountOpeningBalance(ACC_A, '2026-08', balances, history)).toBe(5500);
  });

  it('cadeia de 3 meses sem declaração intermediária', () => {
    const history: Record<string, MonthData> = {
      '2026-07': mockMonthData({
        incomes: [{ id: '1', description: 'S', value: 500, tag: 'T', date: null, received: true, accountId: ACC_A }],
      }),
      '2026-08': mockMonthData({
        incomes: [{ id: '2', description: 'S', value: 200, tag: 'T', date: null, received: true, accountId: ACC_A }],
      }),
    };
    // Jul: 5500; Ago: 5700; Set opening = 5700
    expect(getAccountOpeningBalance(ACC_A, '2026-09', balances, history)).toBe(5700);
  });

  it('sem âncora: abertura = soma das variações anteriores', () => {
    const history: Record<string, MonthData> = {
      '2026-01': mockMonthData({
        incomes: [{ id: '1', description: 'S', value: 1000, tag: 'T', date: null, received: true, accountId: ACC_A }],
      }),
      '2026-02': mockMonthData({
        expenses: [{ id: '2', description: 'A', value: 300, category: 'c', paymentMethod: 'p', paid: true, type: 'personal', accountId: ACC_A }],
      }),
    };
    // Mar opening = 1000 - 300 = 700
    expect(getAccountOpeningBalance(ACC_A, '2026-03', [], history)).toBe(700);
  });

  it('sem âncora nem histórico: abertura = 0', () => {
    expect(getAccountOpeningBalance(ACC_A, '2026-03', [], {})).toBe(0);
  });
});

describe('getAccountOpeningBalanceContext', () => {
  const balances = [mkBalance({ yearMonth: '2026-07', balance: 5000 })];

  it('retorna saldo declarado no mês', () => {
    expect(getAccountOpeningBalanceContext(ACC_A, '2026-07', balances, {})).toEqual({
      amount: 5000,
      source: 'declared',
    });
  });

  it('retorna carry-forward quando não há declaração no mês', () => {
    const history: Record<string, MonthData> = {
      '2026-07': mockMonthData({
        incomes: [{ id: '1', description: 'S', value: 500, tag: 'T', date: null, received: true, accountId: ACC_A }],
      }),
    };
    expect(getAccountOpeningBalanceContext(ACC_A, '2026-08', balances, history)).toEqual({
      amount: 5500,
      source: 'carried_forward',
    });
  });

  it('retorna null quando abertura é zero sem declaração', () => {
    expect(getAccountOpeningBalanceContext(ACC_A, '2026-03', [], {})).toBeNull();
  });
});

describe('getAccountClosingBalance', () => {
  it('abertura + variação do mês', () => {
    const balances = [mkBalance({ yearMonth: '2026-07', balance: 5000 })];
    const history: Record<string, MonthData> = {
      '2026-07': mockMonthData({
        incomes: [{ id: '1', description: 'S', value: 500, tag: 'T', date: null, received: true, accountId: ACC_A }],
      }),
    };
    expect(getAccountClosingBalance(ACC_A, '2026-07', balances, history)).toBe(5500);
  });

  it('carry-forward completo: fechamento alimenta mês seguinte', () => {
    const balances = [mkBalance({ yearMonth: '2026-07', balance: 5000 })];
    const history: Record<string, MonthData> = {
      '2026-07': mockMonthData({
        incomes: [{ id: '1', description: 'S', value: 500, tag: 'T', date: null, received: true, accountId: ACC_A }],
      }),
      '2026-08': mockMonthData({
        incomes: [{ id: '2', description: 'S', value: 200, tag: 'T', date: null, received: true, accountId: ACC_A }],
      }),
    };
    expect(getAccountClosingBalance(ACC_A, '2026-08', balances, history)).toBe(5700);
  });
});

describe('getAccountHistoryFetchRange', () => {
  it('retorna null sem contas', () => {
    expect(getAccountHistoryFetchRange([], [], '2026-08')).toBeNull();
  });

  it('retorna null no primeiro mês do ano sem âncora anterior', () => {
    expect(getAccountHistoryFetchRange([ACC_A], [], '2026-01')).toBeNull();
  });

  it('usa âncora como from quando existe', () => {
    const balances = [mkBalance({ yearMonth: '2026-06', balance: 5000 })];
    expect(getAccountHistoryFetchRange([ACC_A], balances, '2026-08')).toEqual({
      from: '2026-06',
      to: '2026-07',
    });
  });

  it('usa início do ano como from sem âncora', () => {
    expect(getAccountHistoryFetchRange([ACC_A], [], '2026-03')).toEqual({
      from: '2026-01',
      to: '2026-02',
    });
  });

  it('usa primeiro mês com movimento quando anterior ao ano corrente', () => {
    expect(getAccountHistoryFetchRange([ACC_A], [], '2026-03', '2025-06')).toEqual({
      from: '2025-06',
      to: '2026-02',
    });
  });
});

describe('getBalanceDeclarationWarning', () => {
  const monthWithMovement = mockMonthData({
    incomes: [{ id: '1', description: 'S', value: 500, tag: 'T', date: null, received: true, accountId: ACC_A }],
  });

  it('retorna null sem movimentos', () => {
    expect(
      getBalanceDeclarationWarning(ACC_A, '2026-08', [], mockMonthData(), {})
    ).toBeNull();
  });

  it('retorna replace_carry_forward com movimentos e carry-forward sem declaração', () => {
    const balances = [mkBalance({ yearMonth: '2026-07', balance: 5000 })];
    const history: Record<string, MonthData> = {
      '2026-07': mockMonthData({
        incomes: [{ id: '1', description: 'S', value: 500, tag: 'T', date: null, received: true, accountId: ACC_A }],
      }),
    };
    const result = getBalanceDeclarationWarning(
      ACC_A,
      '2026-08',
      balances,
      monthWithMovement,
      history
    );
    expect(result?.kind).toBe('replace_carry_forward');
    if (result?.kind === 'replace_carry_forward') {
      expect(result.calculatedOpening).toBe(5500);
      expect(result.monthVariation).toBe(500);
    }
  });

  it('retorna update_declaration com movimentos e declaração existente', () => {
    const balances = [mkBalance({ yearMonth: '2026-08', balance: 5000 })];
    const result = getBalanceDeclarationWarning(
      ACC_A,
      '2026-08',
      balances,
      monthWithMovement,
      {}
    );
    expect(result).toEqual({
      kind: 'update_declaration',
      previousDeclared: 5000,
      monthVariation: 500,
    });
  });

  it('retorna null com movimentos mas opening zero sem declaração', () => {
    expect(
      getBalanceDeclarationWarning(ACC_A, '2026-08', [], monthWithMovement, {})
    ).toBeNull();
  });
});

describe('getUnlinkedMonthTotals', () => {
  it('retorna zeros quando não há movimentos sem carteira', () => {
    const data = mockMonthData({
      incomes: [
        { id: '1', description: 'Com carteira', value: 500, tag: 'T', date: null, received: true, accountId: ACC_A },
      ],
    });
    expect(getUnlinkedMonthTotals(data)).toEqual({ inflow: 0, outflow: 0, invested: 0 });
  });

  it('soma entrada recebida sem accountId', () => {
    const data = mockMonthData({
      incomes: [
        { id: '1', description: 'Freela', value: 800, tag: 'T', date: null, received: true },
        { id: '2', description: 'Pendente', value: 200, tag: 'T', date: null, received: false },
      ],
    });
    expect(getUnlinkedMonthTotals(data).inflow).toBe(800);
  });

  it('soma gasto efetivado sem accountId', () => {
    const data = mockMonthData({
      expenses: [
        { id: '1', type: 'variable', category: 'C', description: 'Pix', paymentMethod: 'Pix', value: 150, paid: true },
        { id: '2', type: 'variable', category: 'C', description: 'Pendente', paymentMethod: 'Pix', value: 50, paid: false },
      ],
    });
    expect(getUnlinkedMonthTotals(data).outflow).toBe(150);
  });

  it('ignora gasto em cartão no outflow não vinculado (independente da fatura)', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: '1',
          type: 'variable',
          category: 'Lazer',
          description: 'Compra',
          paymentMethod: 'Nubank',
          value: 400,
          paid: false,
        },
      ],
    });
    expect(getUnlinkedMonthTotals(data, creditCards, { [CARD_ID]: false }).outflow).toBe(0);
    expect(getUnlinkedMonthTotals(data, creditCards, { [CARD_ID]: true }).outflow).toBe(0);
  });

  it('combina entrada e gasto não vinculados', () => {
    const data = mockMonthData({
      incomes: [
        { id: '1', description: 'Extra', value: 300, tag: 'T', date: null, received: true },
      ],
      expenses: [
        { id: '2', type: 'variable', category: 'C', description: 'Mercado', paymentMethod: 'Débito', value: 100, paid: true },
      ],
    });
    const result = getUnlinkedMonthTotals(data);
    expect(result.inflow).toBe(300);
    expect(result.outflow).toBe(100);
    expect(result.invested).toBe(0);
  });
});

describe('getUnlinkedMovements', () => {
  it('lista movimentos efetivados sem carteira', () => {
    const data = mockMonthData({
      incomes: [
        { id: 'i1', description: 'Salário avulso', value: 1000, tag: 'T', date: '2026-06-10', received: true },
      ],
      expenses: [
        { id: 'e1', type: 'variable', category: 'C', description: 'Farmácia', paymentMethod: 'Pix', value: 80, paid: true },
      ],
    });
    const movements = getUnlinkedMovements(data);
    expect(movements).toHaveLength(2);
    expect(movements[0]).toMatchObject({ id: 'i1', kind: 'income', value: 1000 });
    expect(movements[1]).toMatchObject({ id: 'e1', kind: 'expense', value: 80 });
  });

  it('ordena movimentos por data decrescente, sem data por último', () => {
    const data = mockMonthData({
      incomes: [
        { id: 'i-old', description: 'Antiga', value: 100, tag: 'T', date: '2026-06-05', received: true },
        { id: 'i-new', description: 'Recente', value: 200, tag: 'T', date: '2026-06-20', received: true },
        { id: 'i-nodate', description: 'Sem data', value: 50, tag: 'T', date: null, received: true },
      ],
      expenses: [
        {
          id: 'e-mid',
          type: 'variable',
          category: 'C',
          description: 'Meio',
          paymentMethod: 'Pix',
          value: 30,
          date: '2026-06-15',
          paid: true,
        },
      ],
    });
    const movements = getUnlinkedMovements(data);
    expect(movements.map((m) => m.id)).toEqual(['i-new', 'e-mid', 'i-old', 'i-nodate']);
  });
});

describe('unlinked carry-forward', () => {
  it('getUnlinkedNetVariation = inflow - outflow do mês', () => {
    const data = mockMonthData({
      incomes: [
        { id: '1', description: 'Extra', value: 300, tag: 'T', date: null, received: true },
      ],
      expenses: [
        { id: '2', type: 'variable', category: 'C', description: 'Mercado', paymentMethod: 'Débito', value: 100, paid: true },
      ],
    });
    expect(getUnlinkedNetVariation(data)).toBe(200);
  });

  it('carry-forward: mês seguinte herda saldo do mês anterior', () => {
    const history: Record<string, MonthData> = {
      '2026-06': mockMonthData({
        incomes: [
          { id: '1', description: 'Freela', value: 500, tag: 'T', date: null, received: true },
        ],
      }),
    };
    expect(getUnlinkedOpeningBalance('2026-07', history)).toBe(500);
    expect(getUnlinkedClosingBalance('2026-07', history)).toBe(500);
  });

  it('cadeia multi-mês: Jun +300, Jul -100 → Ago opening = 200', () => {
    const history: Record<string, MonthData> = {
      '2026-06': mockMonthData({
        incomes: [
          { id: '1', description: 'Extra', value: 300, tag: 'T', date: null, received: true },
        ],
      }),
      '2026-07': mockMonthData({
        expenses: [
          { id: '2', type: 'variable', category: 'C', description: 'Pix', paymentMethod: 'Pix', value: 100, paid: true },
        ],
      }),
    };
    expect(getUnlinkedOpeningBalance('2026-08', history)).toBe(200);
    expect(getUnlinkedClosingBalance('2026-08', history)).toBe(200);
  });

  it('resgate em mês N carrega para N+1', () => {
    const history: Record<string, MonthData> = {
      '2026-06': mockMonthData({
        accountOperations: [
          {
            id: 'op-w1',
            type: 'withdrawal',
            sourceAccountId: ACC_A,
            destinationAccountId: null,
            transferGroupId: null,
            amount: 500,
            yearMonth: '2026-06',
            operationDate: '2026-06-15',
            description: 'Resgate',
          },
        ],
      }),
    };
    expect(getUnlinkedOpeningBalance('2026-07', history)).toBe(500);
  });

  it('sem histórico anterior: opening = 0', () => {
    expect(getUnlinkedOpeningBalance('2026-06', {})).toBe(0);
  });

  it('getUnlinkedOpeningBalanceContext retorna carried_forward quando opening > 0', () => {
    const history: Record<string, MonthData> = {
      '2026-06': mockMonthData({
        incomes: [
          { id: '1', description: 'Extra', value: 400, tag: 'T', date: null, received: true },
        ],
      }),
    };
    expect(getUnlinkedOpeningBalanceContext('2026-07', history)).toEqual({
      amount: 400,
      source: 'carried_forward',
    });
  });

  it('getUnlinkedOpeningBalanceContext retorna null quando opening = 0', () => {
    expect(getUnlinkedOpeningBalanceContext('2026-06', {})).toBeNull();
  });
});

const mockWithdrawal = (
  overrides: Partial<AccountOperation> = {}
): AccountOperation => ({
  id: 'op-w1',
  type: 'withdrawal',
  sourceAccountId: ACC_A,
  destinationAccountId: null,
  transferGroupId: null,
  amount: 500,
  yearMonth: '2026-06',
  operationDate: '2026-06-15',
  description: 'Resgate',
  ...overrides,
});

describe('account operations', () => {
  it('resgate reduz carteira origem e credita Saldo Livre', () => {
    const data = mockMonthData({
      accountOperations: [mockWithdrawal({ amount: 500 })],
    });

    expect(getAccountMonthTotals(ACC_A, data).outflow).toBe(500);
    expect(getUnlinkedMonthTotals(data).inflow).toBe(500);
  });

  it('transferência atualiza chips simetricamente sem afetar Saldo Livre', () => {
    const groupId = 'tg-1';
    const data = mockMonthData({
      accountOperations: [
        {
          id: 'op-out',
          type: 'transfer_out',
          sourceAccountId: ACC_A,
          destinationAccountId: null,
          transferGroupId: groupId,
          amount: 300,
          yearMonth: '2026-06',
          operationDate: '2026-06-10',
          description: null,
        },
        {
          id: 'op-in',
          type: 'transfer_in',
          sourceAccountId: null,
          destinationAccountId: ACC_B,
          transferGroupId: groupId,
          amount: 300,
          yearMonth: '2026-06',
          operationDate: '2026-06-10',
          description: null,
        },
      ],
    });

    expect(getAccountMonthTotals(ACC_A, data).outflow).toBe(300);
    expect(getAccountMonthTotals(ACC_B, data).inflow).toBe(300);
    expect(getUnlinkedMonthTotals(data)).toEqual({ inflow: 0, outflow: 0, invested: 0 });
  });

  it('transferência do Saldo Livre para carteira debita livre e credita destino', () => {
    const groupId = 'tg-free-out';
    const data = mockMonthData({
      accountOperations: [
        {
          id: 'op-out',
          type: 'transfer_out',
          sourceAccountId: null,
          destinationAccountId: null,
          transferGroupId: groupId,
          amount: 400,
          yearMonth: '2026-06',
          operationDate: '2026-06-11',
          description: null,
        },
        {
          id: 'op-in',
          type: 'transfer_in',
          sourceAccountId: null,
          destinationAccountId: ACC_B,
          transferGroupId: groupId,
          amount: 400,
          yearMonth: '2026-06',
          operationDate: '2026-06-11',
          description: null,
        },
      ],
    });

    expect(getUnlinkedMonthTotals(data).outflow).toBe(400);
    expect(getAccountMonthTotals(ACC_B, data).inflow).toBe(400);
  });

  it('transferência da carteira para Saldo Livre credita livre e debita origem', () => {
    const groupId = 'tg-free-in';
    const data = mockMonthData({
      accountOperations: [
        {
          id: 'op-out',
          type: 'transfer_out',
          sourceAccountId: ACC_A,
          destinationAccountId: null,
          transferGroupId: groupId,
          amount: 250,
          yearMonth: '2026-06',
          operationDate: '2026-06-12',
          description: null,
        },
        {
          id: 'op-in',
          type: 'transfer_in',
          sourceAccountId: null,
          destinationAccountId: null,
          transferGroupId: groupId,
          amount: 250,
          yearMonth: '2026-06',
          operationDate: '2026-06-12',
          description: null,
        },
      ],
    });

    expect(getAccountMonthTotals(ACC_A, data).outflow).toBe(250);
    expect(getUnlinkedMonthTotals(data).inflow).toBe(250);
  });

  it('getUnlinkedMovements lista transferências envolvendo Saldo Livre', () => {
    const groupId = 'tg-free-mov';
    const data = mockMonthData({
      accountOperations: [
        {
          id: 'op-out',
          type: 'transfer_out',
          sourceAccountId: null,
          destinationAccountId: null,
          transferGroupId: groupId,
          amount: 200,
          yearMonth: '2026-06',
          operationDate: '2026-06-13',
          description: 'Para corrente',
        },
        {
          id: 'op-in',
          type: 'transfer_in',
          sourceAccountId: null,
          destinationAccountId: ACC_B,
          transferGroupId: groupId,
          amount: 200,
          yearMonth: '2026-06',
          operationDate: '2026-06-13',
          description: 'Para corrente',
        },
      ],
    });

    const movements = getUnlinkedMovements(data, [], undefined, [
      { id: ACC_B, name: 'Corrente' },
    ]);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      kind: 'transfer_out',
      value: 200,
      detail: 'Para Corrente',
      deletable: true,
    });
  });

  it('patrimônio consolidado permanece estável com transferência livre ↔ carteira', () => {
    const groupId = 'tg-pat';
    const accounts: Account[] = [
      {
        id: ACC_A,
        name: 'Corrente',
        type: 'checking',
        role: 'movement',
        color: 'blue',
        displayOrder: 0,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: ACC_B,
        name: 'Poupança',
        type: 'savings',
        role: 'movement',
        color: 'green',
        displayOrder: 1,
        createdAt: '',
        updatedAt: '',
      },
    ];
    const balances: AccountBalance[] = [
      { accountId: ACC_A, yearMonth: '2026-06', balance: 1000 },
      { accountId: ACC_B, yearMonth: '2026-06', balance: 500 },
    ];
    const monthDataByMonth: Record<string, MonthData> = {
      '2026-06': mockMonthData({
        incomes: [
          {
            id: 'i-free',
            description: 'Freelance',
            value: 800,
            tag: 'T',
            date: '2026-06-01',
            received: true,
            accountId: null,
          },
        ],
        accountOperations: [
          {
            id: 'op-out',
            type: 'transfer_out',
            sourceAccountId: null,
            destinationAccountId: null,
            transferGroupId: groupId,
            amount: 300,
            yearMonth: '2026-06',
            operationDate: '2026-06-14',
            description: null,
          },
          {
            id: 'op-in',
            type: 'transfer_in',
            sourceAccountId: null,
            destinationAccountId: ACC_A,
            transferGroupId: groupId,
            amount: 300,
            yearMonth: '2026-06',
            operationDate: '2026-06-14',
            description: null,
          },
        ],
      }),
    };

    const beforeTransfer = getTotalEstimatedPatrimony(
      accounts,
      '2026-06',
      balances,
      {
        '2026-06': mockMonthData({
          incomes: [
            {
              id: 'i-free',
              description: 'Freelance',
              value: 800,
              tag: 'T',
              date: '2026-06-01',
              received: true,
              accountId: null,
            },
          ],
        }),
      }
    );

    const afterTransfer = getTotalEstimatedPatrimony(
      accounts,
      '2026-06',
      balances,
      monthDataByMonth
    );

    expect(afterTransfer).toBe(beforeTransfer);
  });

  it('aporte com origem Saldo Livre debita livre e credita carteira investimentos', () => {
    const data = mockMonthData({
      investments: [
        {
          id: 'inv-1',
          description: 'Tesouro',
          value: 400,
          tag: 'Investimentos',
          date: '2026-06-10',
          invested: true,
          accountId: ACC_INV,
          sourceAccountId: null,
        },
      ],
    });

    expect(getUnlinkedMonthTotals(data).outflow).toBe(400);
    expect(getAccountMonthTotals(ACC_INV, data, [], undefined, 'investment').invested).toBe(400);
  });

  it('getUnlinkedMovements lista aporte com destino', () => {
    const data = mockMonthData({
      investments: [
        {
          id: 'inv-1',
          description: 'Tesouro',
          value: 400,
          tag: 'Investimentos',
          date: '2026-06-10',
          invested: true,
          accountId: ACC_INV,
          sourceAccountId: null,
        },
      ],
    });

    const movements = getUnlinkedMovements(data, [], undefined, [
      { id: ACC_INV, name: 'Corretora' },
    ]);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      kind: 'investment',
      value: 400,
      detail: 'Para Corretora',
      deletable: false,
    });
  });

  it('patrimônio consolidado permanece estável com aporte do Saldo Livre', () => {
    const accounts: Account[] = [
      {
        id: ACC_INV,
        name: 'Corretora',
        type: 'investment',
        role: 'investment',
        color: 'blue',
        displayOrder: 0,
        createdAt: '',
        updatedAt: '',
      },
    ];
    const balances: AccountBalance[] = [
      { accountId: ACC_INV, yearMonth: '2026-06', balance: 0 },
    ];
    const beforeAporte = mockMonthData({
      incomes: [
        {
          id: 'i-free',
          description: 'Freelance',
          value: 1000,
          tag: 'T',
          date: '2026-06-01',
          received: true,
          accountId: null,
        },
      ],
    });
    const afterAporte = mockMonthData({
      incomes: beforeAporte.incomes,
      investments: [
        {
          id: 'inv-1',
          description: 'Tesouro',
          value: 400,
          tag: 'Corretora',
          date: '2026-06-10',
          invested: true,
          accountId: ACC_INV,
          sourceAccountId: null,
        },
      ],
    });
    const monthDataByMonth = {
      '2026-06': afterAporte,
    };

    const before = getTotalEstimatedPatrimony(
      accounts,
      '2026-06',
      balances,
      { '2026-06': beforeAporte }
    );
    const after = getTotalEstimatedPatrimony(
      accounts,
      '2026-06',
      balances,
      monthDataByMonth
    );

    expect(after).toBe(before);
  });

  it('lista resgates no Saldo Livre com origem da carteira', () => {
    const data = mockMonthData({
      accountOperations: [mockWithdrawal()],
    });
    const movements = getUnlinkedMovements(data, [], undefined, [
      { id: ACC_A, name: 'Investimentos' },
    ]);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      kind: 'withdrawal',
      value: 500,
      detail: 'De Investimentos',
      deletable: true,
    });
  });

  it('resgate com income pareado não duplica Saldo Livre', () => {
    const data = mockMonthData({
      accountOperations: [mockWithdrawal({ id: 'op-w1', amount: 500 })],
      incomes: [
        {
          id: 'inc-r1',
          description: 'Resgate de investimentos',
          value: 500,
          tag: RESGATE_INCOME_TAG,
          date: '2026-06-15',
          received: true,
          sourceOperationId: 'op-w1',
        },
      ],
    });

    expect(getAccountMonthTotals(ACC_A, data).outflow).toBe(500);
    expect(getUnlinkedMonthTotals(data).inflow).toBe(500);
  });

  it('resgate para carteira mov não duplica inflow com transfer_in pareado', () => {
    const groupId = 'tg-resgate';
    const data = mockMonthData({
      accountOperations: [
        {
          id: 'op-out',
          type: 'transfer_out',
          sourceAccountId: ACC_A,
          destinationAccountId: null,
          transferGroupId: groupId,
          amount: 500,
          yearMonth: '2026-06',
          operationDate: '2026-06-15',
          description: 'Resgate',
        },
        {
          id: 'op-in',
          type: 'transfer_in',
          sourceAccountId: null,
          destinationAccountId: ACC_B,
          transferGroupId: groupId,
          amount: 500,
          yearMonth: '2026-06',
          operationDate: '2026-06-15',
          description: 'Resgate',
        },
      ],
      incomes: [
        {
          id: 'inc-r2',
          description: 'Resgate de investimentos',
          value: 500,
          tag: RESGATE_INCOME_TAG,
          date: '2026-06-15',
          received: true,
          accountId: ACC_B,
          sourceOperationId: 'op-in',
        },
      ],
    });

    expect(getAccountMonthTotals(ACC_A, data, [], undefined, 'investment').outflow).toBe(500);
    expect(getAccountMonthTotals(ACC_B, data, [], undefined, 'movement').inflow).toBe(500);
  });

  it('getUnlinkedMovements com resgate pareado lista só a entrada', () => {
    const data = mockMonthData({
      accountOperations: [mockWithdrawal({ id: 'op-w1' })],
      incomes: [
        {
          id: 'inc-r1',
          description: 'Resgate de investimentos',
          value: 500,
          tag: RESGATE_INCOME_TAG,
          date: '2026-06-15',
          received: true,
          sourceOperationId: 'op-w1',
        },
      ],
    });

    const movements = getUnlinkedMovements(data);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ kind: 'income', value: 500 });
  });

  it('patrimônio consolidado não infla com resgate pareado no Saldo Livre', () => {
    const data = mockMonthData({
      accountOperations: [mockWithdrawal({ id: 'op-w1', amount: 500 })],
      incomes: [
        {
          id: 'inc-r1',
          description: 'Resgate',
          value: 500,
          tag: RESGATE_INCOME_TAG,
          date: '2026-06-15',
          received: true,
          sourceOperationId: 'op-w1',
        },
      ],
    });
    const accounts = [
      {
        id: ACC_A,
        name: 'Investimentos',
        type: 'investment' as const,
        role: 'investment' as const,
        color: null,
        displayOrder: 0,
      },
    ];
    const history = { '2026-06': data };
    expect(getTotalEstimatedPatrimony(accounts, '2026-06', [], history)).toBe(0);
    expect(getUnlinkedClosingBalance('2026-06', history)).toBe(500);
  });
});

describe('getAccountMonthOperations', () => {
  it('lista resgate e transferência com labels da contraparte', () => {
    const groupId = 'tg-2';
    const data = mockMonthData({
      accountOperations: [
        mockWithdrawal({ id: 'w1' }),
        {
          id: 'op-out',
          type: 'transfer_out',
          sourceAccountId: ACC_A,
          destinationAccountId: null,
          transferGroupId: groupId,
          amount: 200,
          yearMonth: '2026-06',
          operationDate: '2026-06-08',
          description: null,
        },
        {
          id: 'op-in',
          type: 'transfer_in',
          sourceAccountId: null,
          destinationAccountId: ACC_B,
          transferGroupId: groupId,
          amount: 200,
          yearMonth: '2026-06',
          operationDate: '2026-06-08',
          description: null,
        },
      ],
    });

    const fromA = getAccountMonthOperations(ACC_A, data, [
      { id: ACC_A, name: 'Corrente' },
      { id: ACC_B, name: 'Poupança' },
    ]);
    expect(fromA).toHaveLength(2);
    expect(fromA.find((o) => o.kind === 'withdrawal')).toMatchObject({ label: 'Resgate' });
    expect(fromA.find((o) => o.kind === 'transfer_out')).toMatchObject({
      label: 'Transferência para Poupança',
    });

    const toB = getAccountMonthOperations(ACC_B, data, [
      { id: ACC_A, name: 'Corrente' },
      { id: ACC_B, name: 'Poupança' },
    ]);
    expect(toB).toHaveLength(1);
    expect(toB[0]).toMatchObject({ label: 'Transferência de Corrente' });
    expect(accountHasMonthOperations(ACC_B, data)).toBe(true);
  });
});

describe('getAccountMonthMovements', () => {
  it('lista entradas, gastos, aportes e operações da carteira', () => {
    const groupId = 'tg-3';
    const data = mockMonthData({
      incomes: [
        {
          id: 'i1',
          description: 'Salário',
          value: 5000,
          tag: 'T',
          date: '2026-06-01',
          received: true,
          accountId: ACC_A,
        },
      ],
      expenses: [
        {
          id: 'e1',
          type: 'variable',
          category: 'C',
          description: 'Mercado',
          paymentMethod: 'Pix',
          value: 200,
          paid: true,
          date: '2026-06-05',
          accountId: ACC_A,
        },
      ],
      investments: [
        {
          id: 'inv1',
          description: 'Tesouro',
          value: 1000,
          invested: true,
          date: '2026-06-10',
          accountId: ACC_A,
        },
      ],
      accountOperations: [
        mockWithdrawal({ id: 'w1', amount: 300, operationDate: '2026-06-12' }),
        {
          id: 'op-out',
          type: 'transfer_out',
          sourceAccountId: ACC_A,
          destinationAccountId: null,
          transferGroupId: groupId,
          amount: 150,
          yearMonth: '2026-06',
          operationDate: '2026-06-15',
          description: null,
        },
        {
          id: 'op-in',
          type: 'transfer_in',
          sourceAccountId: null,
          destinationAccountId: ACC_B,
          transferGroupId: groupId,
          amount: 150,
          yearMonth: '2026-06',
          operationDate: '2026-06-15',
          description: null,
        },
      ],
    });

    const accounts = [
      { id: ACC_A, name: 'Corrente' },
      { id: ACC_B, name: 'Poupança' },
    ];
    const movements = getAccountMonthMovements(ACC_A, data, [], undefined, accounts);

    expect(movements).toHaveLength(5);
    expect(movements.map((m) => m.id)).toEqual(['op-out', 'w1', 'inv1', 'e1', 'i1']);

    const withdrawal = movements.find((m) => m.kind === 'withdrawal');
    expect(withdrawal).toMatchObject({
      detail: 'Saldo Livre',
      deletable: true,
    });

    const transferOut = movements.find((m) => m.kind === 'transfer_out');
    expect(transferOut).toMatchObject({
      detail: 'Para Poupança',
      deletable: true,
    });
  });

  it('accountHasMonthMovements reflete totais efetivados', () => {
    const data = mockMonthData({
      incomes: [
        { id: 'i1', description: 'A', value: 100, tag: 'T', date: null, received: true, accountId: ACC_A },
      ],
    });
    expect(accountHasMonthMovements(ACC_A, data)).toBe(true);
    expect(accountHasMonthMovements(ACC_B, data)).toBe(false);
  });
});
