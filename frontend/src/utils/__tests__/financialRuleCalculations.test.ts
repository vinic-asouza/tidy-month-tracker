import { describe, it, expect } from 'vitest';
import {
  calculateFinancialRuleStats,
  calculatePlannedFinancialRuleStats,
} from '../financialRuleCalculations';
import type { FinancialRule, MonthData } from '@/types/domain';
import { RESGATE_INCOME_TAG } from '@/types/finance';

const baseRule: FinancialRule = {
  id: 'rule-1',
  userId: 'user-1',
  essentialsPercentage: 50,
  lifestylePercentage: 30,
  investmentsPercentage: 20,
  categoryMapping: {
    Moradia: 'essentials',
    Lazer: 'lifestyle',
  },
  isCustom: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const baseMonthData: MonthData = {
  incomes: [{ id: '1', description: 'Salário', value: 5000, tag: 'Salário', received: true }],
  expenses: [
    {
      id: 'e1',
      type: 'fixed',
      category: 'Moradia',
      description: 'Aluguel',
      paymentMethod: 'Pix',
      value: 1500,
      paid: true,
    },
    {
      id: 'e2',
      type: 'variable',
      category: 'Sem mapear',
      description: 'Extra',
      paymentMethod: 'Pix',
      value: 300,
      paid: true,
    },
  ],
  investments: [],
  cardMonthlyStatuses: {},
};

describe('calculateFinancialRuleStats reconciliation', () => {
  it('essenciais + estilo de vida + não classificado = gastos efetivados', () => {
    const stats = calculateFinancialRuleStats(baseRule, baseMonthData);

    const classified =
      stats.essentials.currentValue + stats.lifestyle.currentValue;

    expect(stats.totalEffectiveExpenses).toBe(1800);
    expect(stats.unclassifiedValue).toBe(300);
    expect(classified + stats.unclassifiedValue).toBe(stats.totalEffectiveExpenses);
  });

  it('unclassifiedValue é zero quando todas as categorias estão mapeadas', () => {
    const monthData: MonthData = {
      ...baseMonthData,
      expenses: [
        {
          id: 'e1',
          type: 'fixed',
          category: 'Moradia',
          description: 'Aluguel',
          paymentMethod: 'Pix',
          value: 1500,
          paid: true,
        },
      ],
    };

    const stats = calculateFinancialRuleStats(baseRule, monthData);
    expect(stats.unclassifiedValue).toBe(0);
    expect(stats.essentials.currentValue).toBe(stats.totalEffectiveExpenses);
  });
});

describe('calculatePlannedFinancialRuleStats reconciliation', () => {
  it('essenciais + estilo de vida + não classificado = gastos planejados', () => {
    const monthData: MonthData = {
      ...baseMonthData,
      incomes: [{ id: '1', description: 'Salário', value: 5000, tag: 'Salário', received: false }],
      expenses: [
        {
          id: 'e1',
          type: 'fixed',
          category: 'Moradia',
          description: 'Aluguel',
          paymentMethod: 'Pix',
          value: 1500,
          paid: false,
        },
        {
          id: 'e2',
          type: 'variable',
          category: 'Sem mapear',
          description: 'Extra',
          paymentMethod: 'Pix',
          value: 300,
          paid: false,
        },
      ],
    };

    const stats = calculatePlannedFinancialRuleStats(baseRule, monthData);
    const classified = stats.essentials.currentValue + stats.lifestyle.currentValue;

    expect(stats.totalIncome).toBe(5000);
    expect(stats.totalEffectiveExpenses).toBe(1800);
    expect(stats.unclassifiedValue).toBe(300);
    expect(classified + stats.unclassifiedValue).toBe(stats.totalEffectiveExpenses);
  });

  it('efetivado ignora lançamentos não marcados; planejado inclui todos', () => {
    const monthData: MonthData = {
      ...baseMonthData,
      incomes: [{ id: '1', description: 'Salário', value: 5000, tag: 'Salário', received: false }],
      expenses: [
        {
          id: 'e1',
          type: 'fixed',
          category: 'Moradia',
          description: 'Aluguel',
          paymentMethod: 'Pix',
          value: 1500,
          paid: false,
        },
      ],
    };

    const effective = calculateFinancialRuleStats(baseRule, monthData);
    const planned = calculatePlannedFinancialRuleStats(baseRule, monthData);

    expect(effective.totalIncome).toBe(0);
    expect(effective.totalEffectiveExpenses).toBe(0);
    expect(planned.totalIncome).toBe(5000);
    expect(planned.totalEffectiveExpenses).toBe(1500);
  });

  it('inclui resgates recebidos na base da renda e dilui percentuais', () => {
    const monthData: MonthData = {
      incomes: [
        { id: '1', description: 'Salario', value: 5000, tag: 'Salario', received: true },
        {
          id: '2',
          description: 'Resgate',
          value: 2000,
          tag: RESGATE_INCOME_TAG,
          received: true,
          sourceOperationId: 'op-1',
        },
      ],
      expenses: [
        {
          id: 'e1',
          type: 'fixed',
          category: 'Moradia',
          description: 'Aluguel',
          paymentMethod: 'Pix',
          value: 1500,
          paid: true,
        },
      ],
      investments: [],
      cardMonthlyStatuses: {},
    };

    const stats = calculateFinancialRuleStats(baseRule, monthData);

    expect(stats.totalIncome).toBe(7000);
    expect(stats.essentials.current).toBeCloseTo((1500 / 7000) * 100, 5);
    expect(stats.essentials.currentValue).toBe(1500);
  });
});
