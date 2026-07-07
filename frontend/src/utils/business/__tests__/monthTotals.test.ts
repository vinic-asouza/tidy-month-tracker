import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveMonthTotals,
  calculatePendingMonthTotals,
  calculatePlannedMonthTotals,
  calculateMonthTotals,
  getResgateInflowFromIncomes,
} from '../monthTotals';
import { RESGATE_INCOME_TAG } from '@/types/finance';
import type { MonthData } from '@/types/domain';

const mockMonthData = (overrides: Partial<MonthData> = {}): MonthData => ({
  incomes: [],
  expenses: [],
  investments: [],
  accountOperations: [],
  ...overrides,
});

const mockResgateIncome = (value: number, received = true) => ({
  id: 'resgate-1',
  description: 'Resgate de investimentos',
  value,
  tag: RESGATE_INCOME_TAG,
  date: '2026-06-12',
  received,
  sourceOperationId: 'op-1',
});

describe('calculateEffectiveMonthTotals with resgate incomes', () => {
  it('inclui entradas de resgate recebidas em totalIncome', () => {
    const data = mockMonthData({
      incomes: [
        {
          id: 'i1',
          description: 'Salário',
          value: 3000,
          tag: 'Salário',
          date: null,
          received: true,
        },
        mockResgateIncome(400),
      ],
    });

    const totals = calculateEffectiveMonthTotals(data, []);
    expect(totals.totalIncome).toBe(3400);
    expect(totals.balance).toBe(3400);
  });

  it('nao conta resgate pendente nem operacoes sem entrada vinculada', () => {
    const data = mockMonthData({
      incomes: [mockResgateIncome(600, false)],
      accountOperations: [
        {
          id: 'op-out',
          type: 'transfer_out',
          sourceAccountId: 'inv-1',
          destinationAccountId: null,
          transferGroupId: 'tg-1',
          amount: 600,
          yearMonth: '2026-06',
          operationDate: '2026-06-10',
          description: null,
        },
      ],
    });

    const totals = calculateEffectiveMonthTotals(data, []);
    expect(totals.totalIncome).toBe(0);
  });

  it('getResgateInflowFromIncomes soma apenas tag de resgate recebidas', () => {
    const data = mockMonthData({
      incomes: [
        {
          id: 'i1',
          description: 'Salario',
          value: 3000,
          tag: 'Salario',
          date: null,
          received: true,
        },
        mockResgateIncome(250),
      ],
    });

    expect(getResgateInflowFromIncomes(data.incomes)).toBe(250);
  });
});

describe('calculatePendingMonthTotals', () => {
  it('nao mistura resgate recebido na pendencia de entradas planejadas', () => {
    const data = mockMonthData({
      incomes: [
        {
          id: 'i1',
          description: 'Salario recebido',
          value: 4000,
          tag: 'Salario',
          date: null,
          received: true,
        },
        {
          id: 'i2',
          description: 'Salario pendente',
          value: 1000,
          tag: 'Salario',
          date: null,
          received: false,
        },
        mockResgateIncome(500),
      ],
    });

    const pending = calculatePendingMonthTotals(data, []);
    expect(pending.pendingIncome).toBe(1000);
  });
});

describe('calculatePlannedMonthTotals', () => {
  it('inclui resgates no planejado e so recebidos no efetivado', () => {
    const data = mockMonthData({
      incomes: [
        {
          id: 'i1',
          description: 'Salario',
          value: 3000,
          tag: 'Salario',
          date: null,
          received: true,
        },
        mockResgateIncome(400, false),
      ],
    });

    const planned = calculatePlannedMonthTotals(data);
    const effective = calculateEffectiveMonthTotals(data, []);

    expect(planned.totalIncome).toBe(3400);
    expect(effective.totalIncome).toBe(3000);
  });
});

describe('calculateMonthTotals', () => {
  it('delega para efetivado ou planejado conforme o modo', () => {
    const data = mockMonthData({
      incomes: [
        {
          id: 'i1',
          description: 'Salario',
          value: 5000,
          tag: 'Salario',
          date: null,
          received: false,
        },
      ],
    });

    expect(calculateMonthTotals('planned', data).totalIncome).toBe(5000);
    expect(calculateMonthTotals('effective', data, []).totalIncome).toBe(0);
  });
});
