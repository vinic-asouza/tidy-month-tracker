/**
 * Testes unitários para funções de parcelas
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRemainingInstallments,
  isValidInstallmentExpense,
} from '../installments';
import type { Expense } from '@/types/domain';

describe('calculateRemainingInstallments', () => {
  it('deve calcular parcelas restantes corretamente', () => {
    const result = calculateRemainingInstallments('2024-01', 1, 5);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ yearMonth: '2024-02', installmentNumber: 2 });
    expect(result[1]).toEqual({ yearMonth: '2024-03', installmentNumber: 3 });
    expect(result[2]).toEqual({ yearMonth: '2024-04', installmentNumber: 4 });
    expect(result[3]).toEqual({ yearMonth: '2024-05', installmentNumber: 5 });
  });

  it('deve retornar array vazio se não houver parcelas restantes', () => {
    const result = calculateRemainingInstallments('2024-01', 5, 5);
    expect(result).toHaveLength(0);
  });

  it('deve retornar array vazio se currentInstallment > totalInstallments', () => {
    const result = calculateRemainingInstallments('2024-01', 6, 5);
    expect(result).toHaveLength(0);
  });

  it('deve avançar para o próximo ano quando necessário', () => {
    const result = calculateRemainingInstallments('2024-11', 1, 3);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ yearMonth: '2024-12', installmentNumber: 2 });
    expect(result[1]).toEqual({ yearMonth: '2025-01', installmentNumber: 3 });
  });

  it('deve funcionar com parcelas que cruzam múltiplos anos', () => {
    const result = calculateRemainingInstallments('2024-10', 1, 5);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ yearMonth: '2024-11', installmentNumber: 2 });
    expect(result[1]).toEqual({ yearMonth: '2024-12', installmentNumber: 3 });
    expect(result[2]).toEqual({ yearMonth: '2025-01', installmentNumber: 4 });
    expect(result[3]).toEqual({ yearMonth: '2025-02', installmentNumber: 5 });
  });

  it('deve manter formato YYYY-MM', () => {
    const result = calculateRemainingInstallments('2024-01', 1, 3);
    result.forEach((inst) => {
      expect(inst.yearMonth).toMatch(/^\d{4}-\d{2}$/);
    });
  });
});

describe('isValidInstallmentExpense', () => {
  it('deve retornar true para despesa parcelada válida', () => {
    const expense: Expense = {
      id: '1',
      type: 'installment',
      category: 'test',
      description: 'Test',
      paymentMethod: 'credit',
      value: 1000,
      paid: false,
      currentInstallment: 1,
      totalInstallments: 5,
    };
    expect(isValidInstallmentExpense(expense)).toBe(true);
  });

  it('deve retornar false para tipo diferente de installment', () => {
    const expense: Expense = {
      id: '1',
      type: 'fixed',
      category: 'test',
      description: 'Test',
      paymentMethod: 'credit',
      value: 1000,
      paid: false,
      currentInstallment: 1,
      totalInstallments: 5,
    };
    expect(isValidInstallmentExpense(expense)).toBe(false);
  });

  it('deve retornar false se currentInstallment estiver ausente', () => {
    const expense: Omit<Expense, 'id'> = {
      type: 'installment',
      category: 'test',
      description: 'Test',
      paymentMethod: 'credit',
      value: 1000,
      paid: false,
      totalInstallments: 5,
    };
    expect(isValidInstallmentExpense(expense)).toBe(false);
  });

  it('deve retornar false se totalInstallments estiver ausente', () => {
    const expense: Omit<Expense, 'id'> = {
      type: 'installment',
      category: 'test',
      description: 'Test',
      paymentMethod: 'credit',
      value: 1000,
      paid: false,
      currentInstallment: 1,
    };
    expect(isValidInstallmentExpense(expense)).toBe(false);
  });

  it('deve retornar false se currentInstallment < 1', () => {
    const expense: Expense = {
      id: '1',
      type: 'installment',
      category: 'test',
      description: 'Test',
      paymentMethod: 'credit',
      value: 1000,
      paid: false,
      currentInstallment: 0,
      totalInstallments: 5,
    };
    expect(isValidInstallmentExpense(expense)).toBe(false);
  });

  it('deve retornar false se totalInstallments < 1', () => {
    const expense: Expense = {
      id: '1',
      type: 'installment',
      category: 'test',
      description: 'Test',
      paymentMethod: 'credit',
      value: 1000,
      paid: false,
      currentInstallment: 1,
      totalInstallments: 0,
    };
    expect(isValidInstallmentExpense(expense)).toBe(false);
  });

  it('deve retornar false se currentInstallment > totalInstallments', () => {
    const expense: Expense = {
      id: '1',
      type: 'installment',
      category: 'test',
      description: 'Test',
      paymentMethod: 'credit',
      value: 1000,
      paid: false,
      currentInstallment: 6,
      totalInstallments: 5,
    };
    expect(isValidInstallmentExpense(expense)).toBe(false);
  });

  it('deve funcionar com Expense parcial (sem id)', () => {
    const expense: Omit<Expense, 'id'> = {
      type: 'installment',
      category: 'test',
      description: 'Test',
      paymentMethod: 'credit',
      value: 1000,
      paid: false,
      currentInstallment: 1,
      totalInstallments: 5,
    };
    expect(isValidInstallmentExpense(expense)).toBe(true);
  });
});
