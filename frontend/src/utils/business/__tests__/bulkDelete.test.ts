import { describe, it, expect, vi } from 'vitest';
import type { Expense, Income, Investment } from '@/types/domain';
import {
  isIncomeBulkBlocking,
  isExpenseBulkBlocking,
  isInvestmentBulkBlocking,
  buildBulkDeleteList,
  defaultScopesForItems,
  executeBulkDelete,
  seriesScopeLabel,
} from '../bulkDelete';

const income = (partial: Partial<Income> & Pick<Income, 'id'>): Income => ({
  description: 'Salário',
  value: 100,
  tag: 'Trabalho',
  date: null,
  received: false,
  ...partial,
});

const expense = (partial: Partial<Expense> & Pick<Expense, 'id' | 'type'>): Expense => ({
  category: 'Moradia',
  description: 'Aluguel',
  paymentMethod: 'PIX',
  value: 200,
  paid: false,
  ...partial,
});

const investment = (partial: Partial<Investment> & Pick<Investment, 'id'>): Investment => ({
  description: 'Aporte',
  value: 50,
  tag: 'Tesouro',
  date: null,
  invested: false,
  ...partial,
});

describe('is*BulkBlocking', () => {
  it('marca entrada com série', () => {
    expect(isIncomeBulkBlocking(income({ id: '1' }))).toBe(false);
    expect(isIncomeBulkBlocking(income({ id: '2', repeatAllMonths: true }))).toBe(true);
    expect(isIncomeBulkBlocking(income({ id: '3', baseIncomeId: 'root' }))).toBe(true);
  });

  it('marca gasto fixo com série e todo parcelado', () => {
    expect(isExpenseBulkBlocking(expense({ id: '1', type: 'variable' }))).toBe(false);
    expect(isExpenseBulkBlocking(expense({ id: '2', type: 'fixed' }))).toBe(false);
    expect(
      isExpenseBulkBlocking(expense({ id: '3', type: 'fixed', repeatAllMonths: true }))
    ).toBe(true);
    expect(isExpenseBulkBlocking(expense({ id: '4', type: 'installment' }))).toBe(true);
  });

  it('marca investimento com série', () => {
    expect(isInvestmentBulkBlocking(investment({ id: '1' }))).toBe(false);
    expect(
      isInvestmentBulkBlocking(investment({ id: '2', baseInvestmentId: 'root' }))
    ).toBe(true);
  });
});

describe('buildBulkDeleteList / defaultScopes', () => {
  it('monta lista só com ids selecionados e default current para bloqueantes', () => {
    const list = buildBulkDeleteList(
      {
        incomes: [income({ id: 'i1', repeatAllMonths: true }), income({ id: 'i2' })],
        expenses: [
          expense({ id: 'e1', type: 'variable' }),
          expense({ id: 'e2', type: 'installment', description: 'TV' }),
        ],
        investments: [investment({ id: 'v1' })],
      },
      new Set(['i1']),
      new Set(['e1', 'e2']),
      new Set()
    );

    expect(list.map((x) => x.id)).toEqual(['i1', 'e1', 'e2']);
    expect(list.find((x) => x.id === 'i1')?.blocking).toBe(true);
    expect(list.find((x) => x.id === 'e1')?.blocking).toBe(false);
    expect(list.find((x) => x.id === 'e2')?.blockingReason).toBe('installment');

    const scopes = defaultScopesForItems(list);
    expect(scopes).toEqual({ i1: 'current', e2: 'current' });
  });

  it('marca resgate e label de série', () => {
    const list = buildBulkDeleteList(
      {
        incomes: [income({ id: 'r1', sourceOperationId: 'op1', tag: 'Resgate de investimentos' })],
        expenses: [],
        investments: [],
      },
      new Set(['r1']),
      new Set(),
      new Set()
    );
    expect(list[0].isResgate).toBe(true);
    expect(seriesScopeLabel('installment')).toBe('Todas as parcelas');
    expect(seriesScopeLabel('fixed')).toBe('Meses seguintes da série');
  });

  it('inclui parcela atual/total em parcelados', () => {
    const list = buildBulkDeleteList(
      {
        incomes: [],
        expenses: [
          expense({
            id: 'e1',
            type: 'installment',
            currentInstallment: 2,
            totalInstallments: 3,
          }),
        ],
        investments: [],
      },
      new Set(),
      new Set(['e1']),
      new Set()
    );
    expect(list[0].installmentLabel).toBe('2/3');
  });
});

describe('executeBulkDelete', () => {
  it('rota parcelado + series para deleteInstallmentExpense', async () => {
    const exp = expense({ id: 'e1', type: 'installment' });
    const deleteInstallmentExpense = vi.fn().mockResolvedValue(true);
    const deleteExpense = vi.fn().mockResolvedValue(true);

    const result = await executeBulkDelete({
      items: [
        {
          id: 'e1',
          kind: 'expense',
          description: 'TV',
          value: 100,
          blocking: true,
          blockingReason: 'installment',
          expenseType: 'installment',
        },
      ],
      scopes: { e1: 'series' },
      monthData: { incomes: [], expenses: [exp], investments: [] },
      handlers: {
        deleteIncome: vi.fn(),
        deleteExpense,
        deleteInstallmentExpense,
        deleteInvestment: vi.fn(),
      },
    });

    expect(deleteInstallmentExpense).toHaveBeenCalledWith(exp);
    expect(deleteExpense).not.toHaveBeenCalled();
    expect(result.succeededIds).toEqual(['e1']);
  });

  it('usa applyToAllMonths false para current em fixo', async () => {
    const deleteExpense = vi.fn().mockResolvedValue(true);
    const exp = expense({ id: 'e1', type: 'fixed', repeatAllMonths: true });

    await executeBulkDelete({
      items: [
        {
          id: 'e1',
          kind: 'expense',
          description: 'Aluguel',
          value: 100,
          blocking: true,
          blockingReason: 'fixed',
          expenseType: 'fixed',
        },
      ],
      scopes: { e1: 'current' },
      monthData: { incomes: [], expenses: [exp], investments: [] },
      handlers: {
        deleteIncome: vi.fn(),
        deleteExpense,
        deleteInstallmentExpense: vi.fn(),
        deleteInvestment: vi.fn(),
      },
    });

    expect(deleteExpense).toHaveBeenCalledWith('e1', false);
  });
});
