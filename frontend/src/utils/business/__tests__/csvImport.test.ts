import { describe, it, expect } from 'vitest';
import { parseCsvText, applyColumnMapping } from '../csvParse';
import {
  normalizeDescription,
  parseMoneyValue,
  parseCsvDate,
  rebaseDateToYearMonth,
} from '../csvNormalize';
import { detectInstallment } from '../installmentDetect';
import { suggestImportAction, scoreFixedCandidates } from '../expenseMatch';
import type { Expense } from '@/types/domain';

describe('parseCsvText', () => {
  it('detecta separador ; e lê headers', () => {
    const text = 'Data;Valor;Descrição\n01/09/2026;10,50;Café';
    const r = parseCsvText(text);
    expect(r.delimiter).toBe(';');
    expect(r.headers).toEqual(['Data', 'Valor', 'Descrição']);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0][2]).toBe('Café');
  });

  it('respeita aspas com delimitador interno', () => {
    const text = 'Data,Valor,Descrição\n01/09/2026,"1.234,56","Loja, Centro"';
    const r = parseCsvText(text);
    expect(r.rows[0][1]).toBe('1.234,56');
    expect(r.rows[0][2]).toBe('Loja, Centro');
  });
});

describe('applyColumnMapping', () => {
  it('mapeia colunas', () => {
    const mapped = applyColumnMapping(
      [['01/09/2026', '10,00', 'Teste']],
      { 0: 'date', 1: 'value', 2: 'description' }
    );
    expect(mapped[0].descriptionRaw).toBe('Teste');
  });
});

describe('parseMoneyValue', () => {
  it('parseia BR', () => {
    expect(parseMoneyValue('1.234,56')).toEqual({ amount: 1234.56, isNegative: false });
  });
  it('parseia negativo', () => {
    expect(parseMoneyValue('-50,00')?.isNegative).toBe(true);
    expect(parseMoneyValue('(50,00)')?.isNegative).toBe(true);
  });
});

describe('parseCsvDate', () => {
  it('BR e ISO', () => {
    expect(parseCsvDate('03/09/2026')).toBe('2026-09-03');
    expect(parseCsvDate('2026-09-03')).toBe('2026-09-03');
  });

  it('DD/MM sem ano usa fallbackYear', () => {
    expect(parseCsvDate('02/07', 2026)).toBe('2026-07-02');
    expect(parseCsvDate('31/10', 2026)).toBe('2026-10-31');
    expect(parseCsvDate('09/05', 2026)).toBe('2026-05-09');
  });

  it('DD/MM inválido retorna null', () => {
    expect(parseCsvDate('32/07', 2026)).toBeNull();
    expect(parseCsvDate('02/13', 2026)).toBeNull();
  });
});

describe('normalizeDescription', () => {
  it('remove parcela e acentos', () => {
    expect(normalizeDescription('Café PARC 03/12')).toBe('cafe');
  });
});

describe('detectInstallment', () => {
  it('detecta padrões comuns', () => {
    expect(detectInstallment('AMAZON PARC 03/12')).toEqual({ current: 3, total: 12 });
    expect(detectInstallment('Loja 2 de 6')).toEqual({ current: 2, total: 6 });
  });
  it('ignora inválidos', () => {
    expect(detectInstallment('código 99/01')).toBeNull();
  });
});

describe('rebaseDateToYearMonth', () => {
  it('clampa dia', () => {
    expect(rebaseDateToYearMonth('2026-01-31', '2026-02')).toBe('2026-02-28');
  });
});

describe('suggestImportAction', () => {
  const fixed: Expense[] = [
    {
      id: '1',
      type: 'fixed',
      category: 'Moradia',
      description: 'Aluguel',
      paymentMethod: 'Pix',
      value: 2000,
      paid: false,
    },
  ];

  it('sugere link para fixo parecido', () => {
    const s = suggestImportAction(
      { description: 'Aluguel', value: 2000, paymentMethod: 'Pix' },
      fixed,
      []
    );
    expect(s.action).toBe('link_existing');
    expect(scoreFixedCandidates(
      { description: 'Aluguel', value: 2000 },
      fixed
    )[0].score).toBeGreaterThanOrEqual(0.7);
  });

  it('sugere parcela nova', () => {
    const s = suggestImportAction(
      {
        description: 'AMAZON 03/12',
        value: 100,
        installment: { current: 3, total: 12 },
      },
      [],
      []
    );
    expect(s.action).toBe('create_installment');
  });

  it('default variável', () => {
    const s = suggestImportAction(
      { description: 'Padaria XYZ', value: 12.5 },
      fixed,
      []
    );
    expect(s.action).toBe('create_variable');
  });
});
