import { describe, it, expect } from 'vitest';
import { parseCsvText, applyColumnMapping, guessColumnMapping } from '../csvParse';
import {
  normalizeDescription,
  parseMoneyValue,
  parseCsvDate,
  rebaseDateToYearMonth,
} from '../csvNormalize';
import { detectInstallment, resolveInstallmentFromCsv } from '../installmentDetect';
import { suggestImportAction, scoreFixedCandidates } from '../expenseMatch';
import { buildReviewRows } from '../csvImportBuild';
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

  it('mapeia coluna Parcela (fatura C6)', () => {
    const mapped = applyColumnMapping(
      [
        [
          '13/08/2026',
          'SHOPEE*PAROLLI CONFECE',
          '1/2',
          '63.69',
        ],
      ],
      { 0: 'date', 1: 'description', 2: 'installment', 3: 'value' }
    );
    expect(mapped[0]).toMatchObject({
      descriptionRaw: 'SHOPEE*PAROLLI CONFECE',
      installmentRaw: '1/2',
      valueRaw: '63.69',
    });
  });
});

describe('guessColumnMapping', () => {
  it('Nubank: date/title/amount', () => {
    expect(guessColumnMapping(['date', 'title', 'amount'])).toEqual({
      0: 'date',
      1: 'description',
      2: 'value',
    });
  });

  it('C6: Data / Descrição / Parcela / Valor (em R$)', () => {
    const headers = [
      'Data de Compra',
      'Nome no Cartão',
      'Final do Cartão',
      'Categoria',
      'Descrição',
      'Parcela',
      'Valor (em US$)',
      'Cotação (em R$)',
      'Valor (em R$)',
    ];
    const m = guessColumnMapping(headers);
    expect(m[0]).toBe('date');
    expect(m[4]).toBe('description');
    expect(m[5]).toBe('installment');
    expect(m[6]).toBe('ignore');
    expect(m[8]).toBe('value');
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
    expect(detectInstallment('AMAZON 03/12')).toEqual({ current: 3, total: 12 });
    expect(detectInstallment('Parcela 01/12')).toEqual({ current: 1, total: 12 });
  });

  it('aceita sufixo x comum em faturas', () => {
    expect(detectInstallment('AMAZON 03/12x')).toEqual({ current: 3, total: 12 });
    expect(detectInstallment('MAGALU 2/10X')).toEqual({ current: 2, total: 10 });
  });

  it('não para no primeiro N/M inválido (ex.: data antes da parcela)', () => {
    expect(detectInstallment('COMPRA 15/08 LOJA XYZ 03/12')).toEqual({
      current: 3,
      total: 12,
    });
    expect(detectInstallment('REF 99/01 AMAZON PARC 04/12')).toEqual({
      current: 4,
      total: 12,
    });
  });

  it('ignora inválidos', () => {
    expect(detectInstallment('código 99/01')).toBeNull();
    expect(detectInstallment('Padaria sem parcela')).toBeNull();
  });

  it('Santander-like: Nx / Nx R$ (só total → current=1)', () => {
    expect(detectInstallment('10x R$ 99,90')).toEqual({ current: 1, total: 10 });
    expect(detectInstallment('CASAS BAHIA 5x')).toEqual({ current: 1, total: 5 });
    expect(detectInstallment('AMAZON 03/12x')).toEqual({ current: 3, total: 12 }); // N/M vence Nx
  });
});

describe('resolveInstallmentFromCsv', () => {
  it('usa coluna Parcela quando a descrição não tem N/M', () => {
    expect(resolveInstallmentFromCsv('SHOPEE*PAROLLI CONFECE', '1/2')).toEqual({
      current: 1,
      total: 2,
    });
  });

  it('Única / À vista / 1x na coluna → sem parcelamento', () => {
    expect(resolveInstallmentFromCsv('DROGARIA OTHON', 'Única')).toBeNull();
    expect(resolveInstallmentFromCsv('POSTO IPIRANGA', 'À vista')).toBeNull();
    expect(resolveInstallmentFromCsv('PADARIA', '1x')).toBeNull();
  });

  it('coluna 10x R$ → Novo parcelado 1/10', () => {
    expect(resolveInstallmentFromCsv('CASAS BAHIA', '10x R$ 99,90')).toEqual({
      current: 1,
      total: 10,
    });
  });

  it('sem coluna → cai na descrição', () => {
    expect(resolveInstallmentFromCsv('AMAZON 03/12')).toEqual({ current: 3, total: 12 });
  });
});

describe('buildReviewRows + parcela', () => {
  it('sugere novo parcelado e preenche N/total a partir da descrição', () => {
    const rows = buildReviewRows({
      mapped: [
        {
          sourceIndex: 0,
          dateRaw: '01/09/2026',
          valueRaw: '99,90',
          descriptionRaw: 'AMAZON MARKETPLACE 03/12x',
        },
      ],
      uiYearMonth: '2026-09',
      defaultCategory: 'Compras Gerais',
      defaultPaymentMethod: 'Nubank',
      existingExpenses: [],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].action).toBe('create_installment');
    expect(rows[0].currentInstallment).toBe(3);
    expect(rows[0].totalInstallments).toBe(12);
  });

  it('C6: descrição sem N/M + coluna Parcela 1/2 → Novo parcelado', () => {
    const rows = buildReviewRows({
      mapped: [
        {
          sourceIndex: 0,
          dateRaw: '13/08/2026',
          valueRaw: '63.69',
          descriptionRaw: 'SHOPEE*PAROLLI CONFECE',
          installmentRaw: '1/2',
        },
      ],
      uiYearMonth: '2026-09',
      defaultCategory: 'Moradia',
      defaultPaymentMethod: 'C6 Bank',
      existingExpenses: [],
    });
    expect(rows[0].action).toBe('create_installment');
    expect(rows[0].currentInstallment).toBe(1);
    expect(rows[0].totalInstallments).toBe(2);
    expect(rows[0].suggestionReason).toMatch(/parcela/i);
  });

  it('C6: coluna Única → permanece variável', () => {
    const rows = buildReviewRows({
      mapped: [
        {
          sourceIndex: 0,
          dateRaw: '03/08/2026',
          valueRaw: '57.70',
          descriptionRaw: 'DROGARIA OTHON',
          installmentRaw: 'Única',
        },
      ],
      uiYearMonth: '2026-09',
      defaultCategory: 'Moradia',
      defaultPaymentMethod: 'C6 Bank',
      existingExpenses: [],
    });
    expect(rows[0].action).toBe('create_variable');
    expect(rows[0].currentInstallment).toBeUndefined();
  });

  it('Santander-like: coluna Parcelas 10x R$ → Novo parcelado 1/10', () => {
    const rows = buildReviewRows({
      mapped: [
        {
          sourceIndex: 0,
          dateRaw: '12/03/2025',
          valueRaw: '999,00',
          descriptionRaw: 'CASAS BAHIA',
          installmentRaw: '10x R$ 99,90',
        },
      ],
      uiYearMonth: '2025-03',
      defaultCategory: 'Compras Gerais',
      defaultPaymentMethod: 'Santander',
      existingExpenses: [],
    });
    expect(rows[0].action).toBe('create_installment');
    expect(rows[0].currentInstallment).toBe(1);
    expect(rows[0].totalInstallments).toBe(10);
  });

  it('Santander-like: À vista → variável', () => {
    const rows = buildReviewRows({
      mapped: [
        {
          sourceIndex: 0,
          dateRaw: '10/03/2025',
          valueRaw: '150,00',
          descriptionRaw: 'POSTO IPIRANGA',
          installmentRaw: 'À vista',
        },
      ],
      uiYearMonth: '2025-03',
      defaultCategory: 'Compras Gerais',
      defaultPaymentMethod: 'Santander',
      existingExpenses: [],
    });
    expect(rows[0].action).toBe('create_variable');
    expect(rows[0].currentInstallment).toBeUndefined();
  });

  it('Nubank: title com Parcela N/M → Novo parcelado (pipeline completo)', () => {
    const text = [
      'date,title,amount',
      '2026-08-02,Plano NuCel,"45,00"',
      '2026-07-07,Pagamento recebido,"- 177,00"',
      '2026-07-03,Grupo Casas Bahia - Parcela 7/10,"132,00"',
    ].join('\n');
    const parsed = parseCsvText(text);
    const mapping = guessColumnMapping(parsed.headers);
    expect(mapping).toEqual({ 0: 'date', 1: 'description', 2: 'value' });
    const mapped = applyColumnMapping(parsed.rows, mapping);
    const rows = buildReviewRows({
      mapped,
      uiYearMonth: '2026-08',
      defaultCategory: 'Compras Gerais',
      defaultPaymentMethod: 'Nubank',
      existingExpenses: [],
    });

    const avista = rows.find((r) => r.description === 'Plano NuCel');
    expect(avista?.action).toBe('create_variable');
    expect(avista?.currentInstallment).toBeUndefined();

    const credito = rows.find((r) => r.description === 'Pagamento recebido');
    expect(credito?.ineligible).toBe(true);

    const parcela = rows.find((r) => r.description.includes('Casas Bahia'));
    expect(parcela?.action).toBe('create_installment');
    expect(parcela?.currentInstallment).toBe(7);
    expect(parcela?.totalInstallments).toBe(10);
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
