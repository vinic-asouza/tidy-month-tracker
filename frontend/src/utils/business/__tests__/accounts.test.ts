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
  getAccountClosingBalance,
  getAccountHistoryFetchRange,
  getBalanceDeclarationWarning,
  getUnlinkedMonthTotals,
  getUnlinkedMovements,
} from '../accounts';
import type { AccountBalance, CreditCard, MonthData } from '@/types/domain';

const mockMonthData = (overrides: Partial<MonthData> = {}): MonthData => ({
  incomes: [],
  expenses: [],
  investments: [],
  ...overrides,
});

const ACC_A = 'acc-a';
const ACC_B = 'acc-b';
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

  it('ignora entrada não recebida da mesma carteira', () => {
    const data = mockMonthData({
      incomes: [
        { id: '1', description: 'A', value: 1000, tag: 'T', date: null, received: false, accountId: ACC_A },
      ],
    });
    expect(getAccountMonthTotals(ACC_A, data).inflow).toBe(0);
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

  it('gasto em cartão conta só com fatura paga', () => {
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
    expect(getAccountMonthTotals(ACC_A, data, creditCards, { [CARD_ID]: false }).outflow).toBe(0);
    expect(getAccountMonthTotals(ACC_A, data, creditCards, { [CARD_ID]: true }).outflow).toBe(400);
  });

  it('soma apenas investimentos efetivados da carteira correta', () => {
    const data = mockMonthData({
      investments: [
        { id: '1', description: 'Tesouro', value: 500, tag: 'Corretora', date: null, invested: true, accountId: ACC_A },
        { id: '2', description: 'CDB', value: 1000, tag: 'Banco', date: null, invested: false, accountId: ACC_B },
      ],
    });
    const result = getAccountMonthTotals(ACC_A, data);
    expect(result.invested).toBe(500);
    expect(result.inflow).toBe(0);
    expect(result.outflow).toBe(0);
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
  it('calcula inflow - outflow + invested apenas efetivados', () => {
    const data = mockMonthData({
      incomes: [{ id: '1', description: 'S', value: 2000, tag: 'T', date: null, received: true, accountId: ACC_A }],
      expenses: [{ id: '2', description: 'A', value: 500, category: 'c', paymentMethod: 'p', paid: false, type: 'personal', accountId: ACC_A }],
      investments: [{ id: '3', description: 'I', value: 300, tag: 't', date: null, invested: true, accountId: ACC_A }],
    });
    // 2000 - 0 + 300 = 2300
    expect(getAccountNetVariation(ACC_A, data)).toBe(2300);
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

  it('aportado investido aumenta saldo projetado', () => {
    const data = mockMonthData({
      investments: [{ id: '1', description: 'I', value: 500, tag: 't', date: null, invested: true, accountId: ACC_A }],
    });
    // 1000 + 500 = 1500
    expect(getAccountProjectedBalance(1000, ACC_A, data)).toBe(1500);
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

  it('ignora gasto em cartão com fatura não paga', () => {
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
    expect(getUnlinkedMonthTotals(data, creditCards, { [CARD_ID]: true }).outflow).toBe(400);
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
});
