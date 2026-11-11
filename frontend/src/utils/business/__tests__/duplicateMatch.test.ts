import { describe, it, expect } from 'vitest';
import {
  findDuplicateExpense,
  findDuplicateIncome,
  findDuplicateInvestment,
  matchesDuplicateFingerprint,
} from '../duplicateMatch';
import type { Expense, Income, Investment } from '@/types/domain';

describe('matchesDuplicateFingerprint', () => {
  it('exige os quatro campos', () => {
    const base = {
      description: 'Café',
      label: 'Alimentação',
      value: 12.5,
      date: '2026-11-10',
    };
    expect(matchesDuplicateFingerprint(base, base)).toBe(true);
    expect(
      matchesDuplicateFingerprint(base, { ...base, description: 'Padaria' })
    ).toBe(false);
    expect(matchesDuplicateFingerprint(base, { ...base, label: 'Outros' })).toBe(false);
    expect(matchesDuplicateFingerprint(base, { ...base, value: 12.6 })).toBe(false);
    expect(matchesDuplicateFingerprint(base, { ...base, date: '2026-11-11' })).toBe(false);
  });

  it('normaliza descrição e tolera 0,01 no valor', () => {
    expect(
      matchesDuplicateFingerprint(
        { description: 'Café Expresso', label: 'A', value: 10, date: '2026-11-01' },
        { description: 'cafe expresso', label: 'A', value: 10.01, date: '2026-11-01' }
      )
    ).toBe(true);
  });
});

describe('findDuplicateExpense', () => {
  const expenses: Expense[] = [
    {
      id: 'v1',
      type: 'variable',
      category: 'Alimentação',
      description: 'Café',
      paymentMethod: 'Pix',
      value: 12.5,
      paid: false,
      date: '2026-11-10',
    },
    {
      id: 'f1',
      type: 'fixed',
      category: 'Alimentação',
      description: 'Café',
      paymentMethod: 'Pix',
      value: 12.5,
      paid: false,
      date: '2026-11-10',
    },
  ];

  it('acha variável igual e ignora fixo por default', () => {
    const dup = findDuplicateExpense(
      {
        description: 'Cafe',
        category: 'Alimentação',
        value: 12.5,
        date: '2026-11-10',
      },
      expenses
    );
    expect(dup?.id).toBe('v1');
  });

  it('respeita excludeId', () => {
    expect(
      findDuplicateExpense(
        {
          description: 'Café',
          category: 'Alimentação',
          value: 12.5,
          date: '2026-11-10',
        },
        expenses,
        { excludeId: 'v1' }
      )
    ).toBeNull();
  });
});

describe('findDuplicateIncome / Investment', () => {
  it('usa tag no lugar de categoria', () => {
    const incomes: Income[] = [
      {
        id: 'i1',
        description: 'Salário',
        tag: 'Trabalho',
        value: 5000,
        date: '2026-11-05',
        received: true,
      },
    ];
    expect(
      findDuplicateIncome(
        { description: 'Salario', tag: 'Trabalho', value: 5000, date: '2026-11-05' },
        incomes
      )?.id
    ).toBe('i1');

    const investments: Investment[] = [
      {
        id: 'inv1',
        description: 'Tesouro',
        tag: 'Renda Fixa',
        value: 200,
        date: '2026-11-05',
        invested: false,
      },
    ];
    expect(
      findDuplicateInvestment(
        { description: 'Tesouro', tag: 'Renda Fixa', value: 200, date: '2026-11-05' },
        investments
      )?.id
    ).toBe('inv1');
  });
});
