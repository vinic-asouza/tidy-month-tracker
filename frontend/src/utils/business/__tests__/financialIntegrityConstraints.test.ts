import { describe, it, expect } from 'vitest';
import {
  isPositiveValue,
  isValidYearMonth,
  isInstallmentCoherent,
} from '../financialIntegrityConstraints';

describe('financialIntegrityConstraints (DEV-143 / espelho CHECK)', () => {
  describe('isPositiveValue', () => {
    it('aceita valores > 0', () => {
      expect(isPositiveValue(0.01)).toBe(true);
      expect(isPositiveValue(100)).toBe(true);
    });

    it('rejeita value ≤ 0 e não finitos', () => {
      expect(isPositiveValue(0)).toBe(false);
      expect(isPositiveValue(-1)).toBe(false);
      expect(isPositiveValue(NaN)).toBe(false);
    });
  });

  describe('isValidYearMonth', () => {
    it('aceita YYYY-MM', () => {
      expect(isValidYearMonth('2026-10')).toBe(true);
    });

    it('rejeita formatos inválidos', () => {
      expect(isValidYearMonth('2026-1')).toBe(false);
      expect(isValidYearMonth('26-10')).toBe(false);
      expect(isValidYearMonth('2026/10')).toBe(false);
      expect(isValidYearMonth('')).toBe(false);
    });
  });

  describe('isInstallmentCoherent', () => {
    it('não exige parcelas fora de installment', () => {
      expect(
        isInstallmentCoherent({ type: 'fixed', currentInstallment: null, totalInstallments: null })
      ).toBe(true);
    });

    it('exige current/total coerentes em installment', () => {
      expect(
        isInstallmentCoherent({
          type: 'installment',
          currentInstallment: 2,
          totalInstallments: 6,
        })
      ).toBe(true);
      expect(
        isInstallmentCoherent({
          type: 'installment',
          currentInstallment: null,
          totalInstallments: 6,
        })
      ).toBe(false);
      expect(
        isInstallmentCoherent({
          type: 'installment',
          currentInstallment: 7,
          totalInstallments: 6,
        })
      ).toBe(false);
    });
  });
});
