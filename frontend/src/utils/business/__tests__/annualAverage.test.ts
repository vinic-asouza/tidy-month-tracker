import { describe, expect, it } from 'vitest';
import {
  averageAmount,
  formatAverageWindowLabel,
  resolveAnnualAverageWindow,
  sliceYearMonths,
} from '../annualAverage';

const today = new Date(2026, 9, 13);

describe('resolveAnnualAverageWindow', () => {
  it('ano encerrado usa os 12 meses', () => {
    expect(resolveAnnualAverageWindow(2025, today)).toEqual({
      monthCount: 12,
      closedYear: true,
    });
  });

  it('em 13 de outubro a média vai até setembro, sem o mês corrente', () => {
    expect(resolveAnnualAverageWindow(2026, today)).toEqual({
      monthCount: 9,
      closedYear: false,
    });
  });

  it('em janeiro ainda não há mês completo no ano corrente', () => {
    expect(resolveAnnualAverageWindow(2026, new Date(2026, 0, 13)).monthCount).toBe(0);
  });

  it('ano futuro não entra na média', () => {
    expect(resolveAnnualAverageWindow(2027, today)).toEqual({
      monthCount: 0,
      closedYear: false,
    });
  });
});

describe('averageAmount', () => {
  it('divide a soma da janela pelo tamanho', () => {
    expect(averageAmount(1200, 10)).toBe(120);
  });

  it('não divide por zero', () => {
    expect(averageAmount(100, 0)).toBe(0);
  });
});

describe('sliceYearMonths', () => {
  it('recorta a partir de janeiro', () => {
    expect(sliceYearMonths(['jan', 'fev', 'mar', 'abr'], 2)).toEqual(['jan', 'fev']);
  });
});

describe('formatAverageWindowLabel', () => {
  it('descreve a janela até o último mês completo', () => {
    expect(formatAverageWindowLabel(2026, today)).toBe(
      'Média mensal de janeiro a setembro (9 meses)'
    );
  });

  it('descreve o ano encerrado como 12 meses', () => {
    expect(formatAverageWindowLabel(2025, today)).toBe('Média mensal dos 12 meses');
  });

  it('avisa quando o ano corrente ainda não tem mês completo', () => {
    expect(formatAverageWindowLabel(2026, new Date(2026, 0, 2))).toBe(
      'Nenhum mês completo neste ano'
    );
  });
});
