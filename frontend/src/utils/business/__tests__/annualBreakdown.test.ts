import { describe, expect, it } from 'vitest';
import type { CreditCard, Expense, Income, Investment, MonthData } from '@/types/domain';
import { RESGATE_INCOME_TAG } from '@/types/finance';
import {
  UNCLASSIFIED_INCOME_LABEL,
  UNCLASSIFIED_INVESTMENT_LABEL,
  buildAnnualExpenseBreakdown,
  buildAnnualIncomeRows,
  buildAnnualInvestmentRows,
  sumCardPaymentRows,
} from '../annualBreakdown';

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

describe('buildAnnualExpenseBreakdown', () => {
  it('mostra total dos 12 meses e média da janela por categoria', () => {
    const data = year([
      { expenses: [expense({ id: 'jan', value: 120 })] },
      { expenses: [expense({ id: 'fev', value: 0 })] },
    ]);
    data[11] = {
      ...data[11],
      expenses: [expense({ id: 'dez', value: 240, category: 'Mercado' })],
    };

    const { categories } = buildAnnualExpenseBreakdown(data, 'effective', [], 9);
    expect(categories).toEqual([
      { key: 'Mercado', label: 'Mercado', total: 360, average: 120 },
    ]);
  });

  it('tira o mês sem lançamento do divisor e mantém o mês que só tem entrada', () => {
    const data = year([
      {},
      {
        incomes: [
          {
            id: 'salario',
            description: 'Salário',
            value: 1000,
            tag: 'Salário',
            date: null,
            received: true,
          },
        ],
      },
      { expenses: [expense({ id: 'mar', value: 300, category: 'Mercado' })] },
    ]);

    const { categories } = buildAnnualExpenseBreakdown(data, 'effective', [], 9);
    expect(categories).toEqual([
      { key: 'Mercado', label: 'Mercado', total: 300, average: 150 },
    ]);
  });

  it('separa tipo sem somar o mesmo gasto duas vezes no recorte', () => {
    const data = year([
      {
        expenses: [
          expense({ id: 'a', value: 80, type: 'fixed', category: 'Moradia' }),
          expense({ id: 'b', value: 20, type: 'installment', category: 'Mercado' }),
          expense({ id: 'c', value: 50, type: 'variable', category: 'Mercado' }),
        ],
      },
    ]);

    const { categories, types } = buildAnnualExpenseBreakdown(data, 'planned', [], 12);
    expect(categories.map((row) => [row.label, row.total])).toEqual([
      ['Moradia', 80],
      ['Mercado', 70],
    ]);
    expect(categories.reduce((sum, row) => sum + row.total, 0)).toBe(150);
    expect(types.map((row) => [row.label, row.total])).toEqual([
      ['Fixo', 80],
      ['Variável', 50],
      ['Parcelado', 20],
    ]);
    expect(types.reduce((sum, row) => sum + row.total, 0)).toBe(150);
  });

  it('marca cartão pelo nome e ordena por total', () => {
    const data = year([
      {
        expenses: [
          expense({ id: 'pix', value: 40, paymentMethod: 'Pix', category: 'Lazer' }),
          expense({ id: 'card', value: 90, paymentMethod: 'Nubank', category: 'Mercado', paid: false }),
        ],
      },
    ]);

    const { paymentMethods } = buildAnnualExpenseBreakdown(data, 'planned', [card], 12);
    expect(paymentMethods).toEqual([
      { key: 'Nubank', label: 'Nubank', total: 90, average: 90, isCard: true },
      { key: 'Pix', label: 'Pix', total: 40, average: 40 },
    ]);
  });

  it('no efetivado ignora gasto de cartão com fatura em aberto', () => {
    const nubank = expense({
      id: 'card',
      value: 90,
      paymentMethod: 'Nubank',
      paid: false,
      category: 'Mercado',
    });
    const pix = expense({ id: 'pix', value: 40, paymentMethod: 'Pix', category: 'Lazer' });
    const data = year([
      {
        expenses: [nubank, pix],
        cardMonthlyStatuses: { c1: false },
      },
    ]);

    const effective = buildAnnualExpenseBreakdown(data, 'effective', [card], 12);
    expect(effective.categories.map((row) => row.label)).toEqual(['Lazer']);
    expect(effective.paymentMethods.map((row) => row.label)).toEqual(['Pix']);

    const planned = buildAnnualExpenseBreakdown(data, 'planned', [card], 12);
    expect(planned.categories.map((row) => row.label).sort()).toEqual(['Lazer', 'Mercado']);
    expect(planned.paymentMethods.map((row) => row.label)).toEqual(['Nubank', 'Pix']);
  });

  it('omite linha com total zero e não divide média por zero', () => {
    const data = year([
      { expenses: [expense({ id: 'zero', value: 0, category: 'Zero' })] },
      { expenses: [expense({ id: 'out', value: 30, category: 'Fora' })] },
    ]);
    data[10] = { ...data[10], expenses: [expense({ id: 'nov', value: 30, category: 'Fora' })] };

    const closed = buildAnnualExpenseBreakdown(data, 'effective', [], 12);
    expect(closed.categories.find((row) => row.label === 'Zero')).toBeUndefined();
    expect(closed.categories[0]).toMatchObject({ label: 'Fora', total: 60, average: 30 });

    const future = buildAnnualExpenseBreakdown(data, 'effective', [], 0);
    expect(future.categories[0]).toMatchObject({ label: 'Fora', total: 60, average: null });
  });

  it('empata pelo nome em pt-BR', () => {
    const data = year([
      {
        expenses: [
          expense({ id: 'b', value: 10, category: 'Luz', paymentMethod: 'Pix' }),
          expense({ id: 'a', value: 10, category: 'Água', paymentMethod: 'Débito' }),
        ],
      },
    ]);
    const { categories } = buildAnnualExpenseBreakdown(data, 'effective', [], 1);
    expect(categories.map((row) => row.label)).toEqual(['Água', 'Luz']);
  });
});

describe('sumCardPaymentRows', () => {
  const inter: CreditCard = { id: 'c2', name: 'Inter', color: '#222', paid: false };

  it('soma só os cartões e deixa Pix de fora', () => {
    const data = year([
      {
        expenses: [
          expense({ id: 'nubank', value: 90, paymentMethod: 'Nubank' }),
          expense({ id: 'inter', value: 30, paymentMethod: 'Inter' }),
          expense({ id: 'pix', value: 40, paymentMethod: 'Pix' }),
        ],
      },
    ]);
    const { paymentMethods } = buildAnnualExpenseBreakdown(data, 'planned', [card, inter], 12);

    expect(sumCardPaymentRows(paymentMethods)).toEqual({
      key: 'cards-total',
      label: 'Cartões',
      total: 120,
      average: 120,
      isCard: true,
    });
  });

  it('não cria total quando não há cartão', () => {
    const data = year([{ expenses: [expense({ id: 'pix', value: 40, paymentMethod: 'Pix' })] }]);
    const { paymentMethods } = buildAnnualExpenseBreakdown(data, 'planned', [card], 12);
    expect(sumCardPaymentRows(paymentMethods)).toBeNull();
  });

  it('mantém a média ausente quando a janela está vazia', () => {
    const data = year([{ expenses: [expense({ id: 'nubank', value: 90, paymentMethod: 'Nubank' })] }]);
    const { paymentMethods } = buildAnnualExpenseBreakdown(data, 'planned', [card], 0);
    expect(sumCardPaymentRows(paymentMethods)).toMatchObject({ total: 90, average: null });
  });
});

const income = (overrides: Partial<Income> = {}): Income => ({
  id: 'inc1',
  description: 'Salário',
  value: 1000,
  tag: 'Salário',
  date: null,
  received: true,
  ...overrides,
});

describe('buildAnnualIncomeRows', () => {
  it('agrupa por tag e junta entrada sem classificação', () => {
    const data = year([
      {
        incomes: [
          income({ id: 'a', value: 2000, tag: 'Salário' }),
          income({ id: 'b', value: 100, tag: '   ' }),
          income({ id: 'c', value: 50, tag: 'Freelance', received: false }),
        ],
      },
    ]);

    const planned = buildAnnualIncomeRows(data, 'planned', 12);
    expect(planned).toEqual([
      { key: 'Salário', label: 'Salário', total: 2000, average: 2000 },
      {
        key: '__unclassified_income__',
        label: UNCLASSIFIED_INCOME_LABEL,
        total: 100,
        average: 100,
      },
      { key: 'Freelance', label: 'Freelance', total: 50, average: 50 },
    ]);

    const effective = buildAnnualIncomeRows(data, 'effective', 12);
    expect(effective.map((row) => [row.label, row.total])).toEqual([
      ['Salário', 2000],
      [UNCLASSIFIED_INCOME_LABEL, 100],
    ]);
  });

  it('exclui resgate no planejado e inclui no efetivado quando recebido', () => {
    const data = year([
      {
        incomes: [
          income({ id: 'sal', value: 1000, tag: 'Salário' }),
          income({ id: 'res', value: 300, tag: RESGATE_INCOME_TAG, received: true }),
        ],
      },
    ]);

    expect(buildAnnualIncomeRows(data, 'planned', 12).map((r) => r.label)).toEqual(['Salário']);
    expect(buildAnnualIncomeRows(data, 'effective', 12).map((r) => [r.label, r.total])).toEqual([
      ['Salário', 1000],
      [RESGATE_INCOME_TAG, 300],
    ]);
  });
});

describe('buildAnnualInvestmentRows', () => {
  it('agrupa por tag e junta aporte sem classificação', () => {
    const data = year([
      {
        investments: [
          investment({ id: 'a', value: 200, tag: 'Corretora' }),
          investment({ id: 'b', value: 50, tag: '   ' }),
          investment({ id: 'c', value: 25, tag: '—', invested: false }),
        ],
      },
    ]);

    const planned = buildAnnualInvestmentRows(data, 'planned', 12);
    expect(planned).toEqual([
      { key: 'Corretora', label: 'Corretora', total: 200, average: 200 },
      {
        key: '__unclassified__',
        label: UNCLASSIFIED_INVESTMENT_LABEL,
        total: 75,
        average: 75,
      },
    ]);

    const effective = buildAnnualInvestmentRows(data, 'effective', 12);
    expect(effective.map((row) => [row.label, row.total])).toEqual([
      ['Corretora', 200],
      [UNCLASSIFIED_INVESTMENT_LABEL, 50],
    ]);
  });

  it('divide pelos meses com lançamento e ano futuro fica nula', () => {
    const onlyJanuary = year([{ investments: [investment({ value: 1200 })] }]);
    expect(buildAnnualInvestmentRows(onlyJanuary, 'effective', 12)[0].average).toBe(1200);

    const everyMonth = year(
      Array.from({ length: 12 }, () => ({ investments: [investment({ value: 100 })] }))
    );
    expect(buildAnnualInvestmentRows(everyMonth, 'effective', 12)[0].average).toBe(100);
    expect(buildAnnualInvestmentRows(onlyJanuary, 'effective', 0)[0].average).toBeNull();
  });
});
