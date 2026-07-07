/**
 * Testes unitários para funções de repetição mensal
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRemainingMonths,
  extractYear,
  extractMonth,
  formatYearMonth,
  getYearRefreshMonths,
} from '../repeatMonths';

describe('calculateRemainingMonths', () => {
  it('deve retornar todos os meses do ano exceto o mês atual', () => {
    const result = calculateRemainingMonths('2024-03');
    expect(result).toHaveLength(11);
    expect(result).not.toContain('2024-03');
    expect(result).toContain('2024-01');
    expect(result).toContain('2024-02');
    expect(result).toContain('2024-04');
    expect(result).toContain('2024-12');
  });

  it('deve funcionar para janeiro', () => {
    const result = calculateRemainingMonths('2024-01');
    expect(result).toHaveLength(11);
    expect(result).not.toContain('2024-01');
    expect(result).toContain('2024-02');
    expect(result).toContain('2024-12');
  });

  it('deve funcionar para dezembro', () => {
    const result = calculateRemainingMonths('2024-12');
    expect(result).toHaveLength(11);
    expect(result).not.toContain('2024-12');
    expect(result).toContain('2024-01');
    expect(result).toContain('2024-11');
  });

  it('deve manter o formato YYYY-MM', () => {
    const result = calculateRemainingMonths('2024-05');
    result.forEach((month) => {
      expect(month).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  it('deve retornar meses em ordem crescente', () => {
    const result = calculateRemainingMonths('2024-06');
    const months = result.map((m) => parseInt(m.split('-')[1]));
    const sorted = [...months].sort((a, b) => a - b);
    expect(months).toEqual(sorted);
  });
});

describe('extractYear', () => {
  it('deve extrair o ano corretamente', () => {
    expect(extractYear('2024-03')).toBe(2024);
    expect(extractYear('2025-12')).toBe(2025);
    expect(extractYear('2020-01')).toBe(2020);
  });
});

describe('extractMonth', () => {
  it('deve extrair o mês corretamente', () => {
    expect(extractMonth('2024-03')).toBe(3);
    expect(extractMonth('2024-12')).toBe(12);
    expect(extractMonth('2024-01')).toBe(1);
  });
});

describe('formatYearMonth', () => {
  it('deve formatar ano e mês corretamente', () => {
    expect(formatYearMonth(2024, 3)).toBe('2024-03');
    expect(formatYearMonth(2024, 12)).toBe('2024-12');
    expect(formatYearMonth(2024, 1)).toBe('2024-01');
  });

  it('deve adicionar zero à esquerda para meses < 10', () => {
    expect(formatYearMonth(2024, 5)).toBe('2024-05');
    expect(formatYearMonth(2024, 9)).toBe('2024-09');
  });
});

describe('getYearRefreshMonths', () => {
  it('retorna vazio quando applyToAllMonths é false e sem extras', () => {
    expect(getYearRefreshMonths('2024-03', false)).toEqual([]);
  });

  it('retorna mês atual e demais meses do ano quando applyToAllMonths', () => {
    const result = getYearRefreshMonths('2024-03', true);
    expect(result).toHaveLength(12);
    expect(result).toContain('2024-03');
    expect(result).toContain('2024-12');
    expect(result).not.toContain('2023-12');
  });

  it('inclui extraMonths sem duplicar', () => {
    const result = getYearRefreshMonths('2024-11', false, ['2024-11', '2025-01']);
    expect(result).toEqual(['2024-11', '2025-01']);
  });
});
