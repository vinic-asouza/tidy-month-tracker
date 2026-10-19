import { describe, it, expect } from 'vitest';
import {
  CREDIT_CARD_DUE_ALERT_DAYS,
  getCreditCardDueAlertContext,
  getCreditCardInvoiceExpenses,
  getCreditCardInvoiceSummary,
  getCreditCardUsagePercent,
  getDaysUntilDueForSort,
  getEffectiveDueDay,
  groupInvoiceExpensesByCategory,
  isCreditCardExpense,
  canAddExpenseToCreditCard,
} from '../creditCards';
import type { CreditCard, MonthData } from '@/types/domain';

const NUBANK = { id: 'c1', name: 'Nubank' };

const mockMonthData = (overrides: Partial<MonthData> = {}): MonthData => ({
  incomes: [],
  expenses: [],
  investments: [],
  ...overrides,
});

describe('isCreditCardExpense', () => {
  const cards: CreditCard[] = [
    { id: 'c1', name: 'Nubank', color: 'purple', paid: false },
  ];

  it('detecta gasto em cartão cadastrado', () => {
    expect(
      isCreditCardExpense(
        {
          id: '1',
          type: 'variable',
          category: 'C',
          description: 'X',
          paymentMethod: 'Nubank',
          value: 10,
          paid: false,
        },
        cards
      )
    ).toBe(true);
  });

  it('retorna false para Pix', () => {
    expect(
      isCreditCardExpense(
        {
          id: '1',
          type: 'variable',
          category: 'C',
          description: 'X',
          paymentMethod: 'Pix',
          value: 10,
          paid: false,
        },
        cards
      )
    ).toBe(false);
  });

  it('detecta por creditCardId mesmo com rótulo divergente', () => {
    expect(
      isCreditCardExpense(
        {
          id: '1',
          type: 'variable',
          category: 'C',
          description: 'X',
          paymentMethod: 'Nome antigo',
          creditCardId: 'c1',
          value: 10,
          paid: false,
        },
        cards
      )
    ).toBe(true);
  });

  it('com creditCardId de cartão inexistente não cai no fallback por nome', () => {
    expect(
      isCreditCardExpense(
        {
          id: '1',
          type: 'variable',
          category: 'C',
          description: 'X',
          paymentMethod: 'Nubank',
          creditCardId: 'cartao-removido',
          value: 10,
          paid: false,
        },
        cards
      )
    ).toBe(false);
  });

  it('usa fallback por nome para legado (creditCardId null)', () => {
    expect(
      isCreditCardExpense(
        {
          id: '1',
          type: 'variable',
          category: 'C',
          description: 'X',
          paymentMethod: 'Nubank',
          creditCardId: null,
          value: 10,
          paid: false,
        },
        cards
      )
    ).toBe(true);
  });

  it('Pix com creditCardId null segue não sendo cartão', () => {
    expect(
      isCreditCardExpense(
        {
          id: '1',
          type: 'variable',
          category: 'C',
          description: 'X',
          paymentMethod: 'Pix',
          creditCardId: null,
          value: 10,
          paid: false,
        },
        cards
      )
    ).toBe(false);
  });
});

describe('getCreditCardInvoiceExpenses', () => {
  it('filtra gastos pelo nome do cartão', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: '1',
          type: 'variable',
          category: 'Lazer',
          description: 'Cinema',
          paymentMethod: 'Nubank',
          value: 50,
          paid: false,
        },
        {
          id: '2',
          type: 'variable',
          category: 'Mercado',
          description: 'Compras',
          paymentMethod: 'Inter',
          value: 200,
          paid: false,
        },
      ],
    });
    const result = getCreditCardInvoiceExpenses(NUBANK, data);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('prioriza creditCardId: não inclui gasto de outro cartão com mesmo rótulo', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: 'mine',
          type: 'variable',
          category: 'C',
          description: 'Meu',
          paymentMethod: 'Rótulo qualquer',
          creditCardId: 'c1',
          value: 10,
          paid: false,
        },
        {
          id: 'other',
          type: 'variable',
          category: 'C',
          description: 'Outro cartão',
          paymentMethod: 'Nubank',
          creditCardId: 'c2',
          value: 20,
          paid: false,
        },
        {
          id: 'legacy',
          type: 'variable',
          category: 'C',
          description: 'Legado',
          paymentMethod: 'Nubank',
          creditCardId: null,
          value: 30,
          paid: false,
        },
      ],
    });
    expect(getCreditCardInvoiceExpenses(NUBANK, data).map((e) => e.id).sort()).toEqual([
      'legacy',
      'mine',
    ]);
  });

  it('ordena por data decrescente, sem data por último', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: 'old',
          type: 'variable',
          category: 'C',
          description: 'Antigo',
          paymentMethod: 'Nubank',
          value: 10,
          paid: false,
          date: '2026-06-05',
        },
        {
          id: 'new',
          type: 'variable',
          category: 'C',
          description: 'Recente',
          paymentMethod: 'Nubank',
          value: 20,
          paid: false,
          date: '2026-06-20',
        },
        {
          id: 'nodate',
          type: 'variable',
          category: 'C',
          description: 'Sem data',
          paymentMethod: 'Nubank',
          value: 5,
          paid: false,
        },
      ],
    });
    expect(getCreditCardInvoiceExpenses(NUBANK, data).map((e) => e.id)).toEqual([
      'new',
      'old',
      'nodate',
    ]);
  });
});

describe('getCreditCardInvoiceSummary', () => {
  it('retorna total e contagem', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: '1',
          type: 'variable',
          category: 'C',
          description: 'A',
          paymentMethod: 'Nubank',
          value: 100,
          paid: false,
        },
        {
          id: '2',
          type: 'variable',
          category: 'C',
          description: 'B',
          paymentMethod: 'Nubank',
          value: 250,
          paid: false,
        },
      ],
    });
    expect(getCreditCardInvoiceSummary(NUBANK, data)).toEqual({ total: 350, count: 2 });
  });

  it('soma por creditCardId mesmo quando o rótulo diverge do nome atual', () => {
    const data = mockMonthData({
      expenses: [
        {
          id: '1',
          type: 'variable',
          category: 'C',
          description: 'A',
          paymentMethod: 'Nome antigo',
          creditCardId: 'c1',
          value: 100,
          paid: false,
        },
        {
          id: '2',
          type: 'variable',
          category: 'C',
          description: 'B',
          paymentMethod: 'Nubank',
          creditCardId: 'c1',
          value: 50,
          paid: false,
        },
      ],
    });
    expect(getCreditCardInvoiceSummary(NUBANK, data)).toEqual({ total: 150, count: 2 });
  });
});

describe('getCreditCardUsagePercent', () => {
  it('retorna null sem limite', () => {
    expect(getCreditCardUsagePercent(1000, null)).toBeNull();
    expect(getCreditCardUsagePercent(1000, undefined)).toBeNull();
  });

  it('calcula percentual arredondado', () => {
    expect(getCreditCardUsagePercent(3400, 5000)).toBe(68);
  });
});

describe('groupInvoiceExpensesByCategory', () => {
  it('agrupa e ordena por total decrescente', () => {
    const expenses = getCreditCardInvoiceExpenses(
      NUBANK,
      mockMonthData({
        expenses: [
          {
            id: '1',
            type: 'variable',
            category: 'Lazer',
            description: 'A',
            paymentMethod: 'Nubank',
            value: 100,
            paid: false,
          },
          {
            id: '2',
            type: 'variable',
            category: 'Mercado',
            description: 'B',
            paymentMethod: 'Nubank',
            value: 300,
            paid: false,
          },
          {
            id: '3',
            type: 'variable',
            category: 'Lazer',
            description: 'C',
            paymentMethod: 'Nubank',
            value: 50,
            paid: false,
          },
        ],
      })
    );
    const groups = groupInvoiceExpensesByCategory(expenses);
    expect(groups).toEqual([
      { category: 'Mercado', total: 300, count: 1 },
      { category: 'Lazer', total: 150, count: 2 },
    ]);
  });
});

describe('getEffectiveDueDay', () => {
  it('ajusta dia 31 em fevereiro', () => {
    expect(getEffectiveDueDay(31, '2026-02')).toBe(28);
  });
});

describe('getCreditCardDueAlertContext', () => {
  const currentMonth = '2026-06';

  it('retorna null quando fatura paga', () => {
    expect(getCreditCardDueAlertContext(15, currentMonth, true, new Date(2026, 5, 10))).toBeNull();
  });

  it('retorna null em mês passado', () => {
    expect(
      getCreditCardDueAlertContext(15, '2026-05', false, new Date(2026, 5, 10))
    ).toBeNull();
  });

  it('retorna approaching quando dentro da janela', () => {
    const result = getCreditCardDueAlertContext(15, currentMonth, false, new Date(2026, 5, 13));
    expect(result).toEqual({ kind: 'approaching', message: 'Vence em 2 dias', daysUntilDue: 2 });
  });

  it('retorna due_today', () => {
    const result = getCreditCardDueAlertContext(15, currentMonth, false, new Date(2026, 5, 15));
    expect(result).toEqual({ kind: 'due_today', message: 'Vence hoje' });
  });

  it('retorna overdue após vencimento', () => {
    const result = getCreditCardDueAlertContext(15, currentMonth, false, new Date(2026, 5, 16));
    expect(result).toEqual({ kind: 'overdue', message: 'Fatura vencida' });
  });

  it('não alerta quando fora da janela', () => {
    expect(
      getCreditCardDueAlertContext(15, currentMonth, false, new Date(2026, 5, 1))
    ).toBeNull();
  });

  it('usa CREDIT_CARD_DUE_ALERT_DAYS = 3', () => {
    expect(CREDIT_CARD_DUE_ALERT_DAYS).toBe(3);
  });
});

describe('getDaysUntilDueForSort', () => {
  it('retorna dias até vencimento no mês atual', () => {
    expect(getDaysUntilDueForSort(20, '2026-06', new Date(2026, 5, 15))).toBe(5);
  });

  it('retorna null sem dueDay', () => {
    expect(getDaysUntilDueForSort(null, '2026-06', new Date(2026, 5, 15))).toBeNull();
  });
});

describe('canAddExpenseToCreditCard', () => {
  it('sempre retorna true na v1', () => {
    expect(
      canAddExpenseToCreditCard(
        { id: '1', name: 'Nubank', color: 'purple', paid: false, creditLimit: 1000 },
        900,
        200,
        { enforceLimit: true }
      )
    ).toBe(true);
  });
});
