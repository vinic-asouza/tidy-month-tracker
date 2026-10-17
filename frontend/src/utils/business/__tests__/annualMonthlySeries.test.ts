import { describe, expect, it } from 'vitest';
import type { CreditCard, Expense, FinancialRule, Investment, MonthData } from '@/types/domain';
import {
  ALL_SERIES_KEY,
  CARDS_GROUP_KEY,
  EXPENSE_SERIES_PALETTE,
  INVESTMENT_SERIES_PALETTE,
  PAYMENT_SERIES_PALETTE,
  RULE_SERIES,
  TOP3_SERIES_KEY,
  buildCategoryMonthlyChart,
  buildFinancialRuleMonthlyChart,
  buildInvestmentMonthlyChart,
  buildPaymentMonthlyChart,
  topKeysByAverage,
} from '../annualMonthlySeries';
import type { AnnualMoneyRow } from '../annualBreakdown';

const card: CreditCard = { id: 'c1', name: 'Nubank', color: '#111', paid: false };

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'e1',
  type: 'variable',
  category: 'Mercado',
  description: 'Compra',
  paymentMethod: 'Pix',
  value: 100,
  paid: true,
  ...overrides,
});

const investment = (overrides: Partial<Investment> = {}): Investment => ({
  id: 'i1',
  description: 'Aporte',
  value: 100,
  tag: 'Corretora',
  date: null,
  invested: true,
  ...overrides,
});

const year = (months: Partial<MonthData>[]): MonthData[] =>
  Array.from({ length: 12 }, (_, index) => ({
    incomes: [],
    expenses: [],
    investments: [],
    ...months[index],
  }));

const rule = (mapping: Record<string, 'essentials' | 'lifestyle'> = {}): FinancialRule => ({
  id: 'r1',
  userId: 'u1',
  essentialsPercentage: 50,
  lifestylePercentage: 30,
  investmentsPercentage: 20,
  isCustom: false,
  categoryMapping: mapping,
  createdAt: '',
  updatedAt: '',
});

describe('topKeysByAverage', () => {
  it('ordena pela média e limita a N', () => {
    const rows: AnnualMoneyRow[] = [
      { key: 'a', label: 'A', total: 300, average: 10 },
      { key: 'b', label: 'B', total: 100, average: 50 },
      { key: 'c', label: 'C', total: 200, average: 30 },
      { key: 'd', label: 'D', total: 50, average: 5 },
    ];
    expect(topKeysByAverage(rows, 3)).toEqual(['b', 'c', 'a']);
  });
});

describe('buildCategoryMonthlyChart', () => {
  it('default top 3 pela média e série mensal por categoria', () => {
    const data = year([
      {
        expenses: [
          expense({ id: 'm1', category: 'Mercado', value: 300 }),
          expense({ id: 't1', category: 'Transporte', value: 200 }),
          expense({ id: 'l1', category: 'Lazer', value: 100 }),
          expense({ id: 'o1', category: 'Outros', value: 10 }),
        ],
      },
      {
        expenses: [
          expense({ id: 'm2', category: 'Mercado', value: 300 }),
          expense({ id: 't2', category: 'Transporte', value: 200 }),
          expense({ id: 'l2', category: 'Lazer', value: 100 }),
        ],
      },
    ]);

    const chart = buildCategoryMonthlyChart(data, 'planned', [], 12, TOP3_SERIES_KEY);
    expect(chart.series.map((s) => s.key)).toEqual(['Mercado', 'Transporte', 'Lazer']);
    expect(chart.series.map((s) => s.color)).toEqual([
      EXPENSE_SERIES_PALETTE[0],
      EXPENSE_SERIES_PALETTE[1],
      EXPENSE_SERIES_PALETTE[2],
    ]);
    expect(chart.points[0].Mercado).toBe(300);
    expect(chart.points[1].Transporte).toBe(200);
    expect(chart.hasData).toBe(true);
  });

  it('filtra uma categoria no seletor', () => {
    const data = year([{ expenses: [expense({ category: 'Mercado', value: 80 })] }]);
    const chart = buildCategoryMonthlyChart(data, 'planned', [], 12, 'Mercado');
    expect(chart.series).toEqual([
      { key: 'Mercado', label: 'Mercado', color: EXPENSE_SERIES_PALETTE[0] },
    ]);
    expect(chart.points[0].Mercado).toBe(80);
  });
});

describe('buildPaymentMonthlyChart', () => {
  it('agrupa cartões no default Todas', () => {
    const data = year([
      {
        expenses: [
          expense({ id: 'p1', paymentMethod: 'Pix', value: 50 }),
          expense({ id: 'c1', paymentMethod: 'Nubank', value: 80 }),
          expense({ id: 'c2', paymentMethod: 'Nubank', value: 20 }),
        ],
      },
    ]);

    const chart = buildPaymentMonthlyChart(data, 'planned', [card], 12, ALL_SERIES_KEY);
    expect(chart.series.map((s) => s.key)).toEqual(['Pix', CARDS_GROUP_KEY]);
    expect(chart.series.map((s) => s.color)).toEqual([
      PAYMENT_SERIES_PALETTE[0],
      PAYMENT_SERIES_PALETTE[1],
    ]);
    expect(chart.points[0].Pix).toBe(50);
    expect(chart.points[0][CARDS_GROUP_KEY]).toBe(100);
  });

  it('permite selecionar cartões agrupados ou um cartão', () => {
    const data = year([
      {
        expenses: [
          expense({ id: 'c1', paymentMethod: 'Nubank', value: 40 }),
          expense({ id: 'p1', paymentMethod: 'Pix', value: 10 }),
        ],
      },
    ]);

    const grouped = buildPaymentMonthlyChart(data, 'planned', [card], 12, CARDS_GROUP_KEY);
    expect(grouped.series.map((s) => s.key)).toEqual([CARDS_GROUP_KEY]);
    expect(grouped.points[0][CARDS_GROUP_KEY]).toBe(40);

    const single = buildPaymentMonthlyChart(data, 'planned', [card], 12, 'Nubank');
    expect(single.series.map((s) => s.key)).toEqual(['Nubank']);
    expect(single.points[0].Nubank).toBe(40);
  });
});

describe('buildInvestmentMonthlyChart', () => {
  it('default todas as tags e seletor individual', () => {
    const data = year([
      {
        investments: [
          investment({ id: 'a', tag: 'Tesouro', value: 100 }),
          investment({ id: 'b', tag: 'Ações', value: 50 }),
        ],
      },
    ]);

    const all = buildInvestmentMonthlyChart(data, 'effective', 12, ALL_SERIES_KEY);
    expect(all.series.map((s) => s.key)).toEqual(['Tesouro', 'Ações']);
    expect(all.series.map((s) => s.color)).toEqual([
      INVESTMENT_SERIES_PALETTE[0],
      INVESTMENT_SERIES_PALETTE[1],
    ]);
    expect(all.points[0].Tesouro).toBe(100);
    expect(all.points[0]['Ações']).toBe(50);

    const tag = buildInvestmentMonthlyChart(data, 'effective', 12, 'Tesouro');
    expect(tag.series.map((s) => s.key)).toEqual(['Tesouro']);
    expect(tag.points[0].Tesouro).toBe(100);
  });
});

describe('buildFinancialRuleMonthlyChart', () => {
  it('série dos buckets e não classificado quando há valor', () => {
    const data = year([
      {
        incomes: [
          {
            id: 'sal',
            description: 'Salário',
            value: 1000,
            tag: 'Salário',
            date: null,
            received: true,
          },
        ],
        expenses: [
          expense({ id: 'e1', category: 'Moradia', value: 400, paid: true }),
          expense({ id: 'e2', category: 'Lazer', value: 100, paid: true }),
          expense({ id: 'e3', category: 'Outros', value: 50, paid: true }),
        ],
        investments: [investment({ id: 'i1', value: 200, invested: true })],
      },
    ]);

    const chart = buildFinancialRuleMonthlyChart(
      rule({ Moradia: 'essentials', Lazer: 'lifestyle' }),
      data,
      'effective',
      []
    );

    expect(chart.series.map((s) => s.key)).toEqual([
      RULE_SERIES.essentials.key,
      RULE_SERIES.lifestyle.key,
      RULE_SERIES.investments.key,
      RULE_SERIES.unclassified.key,
    ]);
    expect(chart.points[0][RULE_SERIES.essentials.key]).toBe(400);
    expect(chart.points[0][RULE_SERIES.lifestyle.key]).toBe(100);
    expect(chart.points[0][RULE_SERIES.investments.key]).toBe(200);
    expect(chart.points[0][RULE_SERIES.unclassified.key]).toBe(50);
  });
});
