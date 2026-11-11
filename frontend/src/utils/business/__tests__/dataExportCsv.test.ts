import { describe, expect, it } from 'vitest';
import type { CreditCard, Expense, Income, Investment } from '@/types/domain';
import {
  buildDataExportFiles,
  dataExportFilenameBase,
  isValidExportYearMonth,
  listYearMonthsInRange,
  serializeCardStatusesCsv,
  serializeCreditCardsCsv,
  serializeExpensesCsv,
  serializeIncomesCsv,
  serializeInvestmentsCsv,
  type DataExportPayload,
} from '../dataExportCsv';

const income = (overrides: Partial<Income> & { yearMonth: string }) => ({
  id: 'in1',
  description: 'Salário',
  value: 1000.5,
  tag: 'Salário',
  date: '2026-01-05',
  received: true,
  repeatAllMonths: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const expense = (overrides: Partial<Expense> & { yearMonth: string; creditCardName: string }) => ({
  id: 'e1',
  type: 'variable' as const,
  category: 'Mercado',
  description: 'Compra; "promo"',
  paymentMethod: 'Nubank',
  creditCardId: 'c1',
  value: 42,
  paid: false,
  date: '2026-01-10',
  ...overrides,
});

const investment = (
  overrides: Partial<Investment> & { yearMonth: string }
): Investment & { yearMonth: string } => ({
  id: 'iv1',
  description: 'Aporte',
  value: 200,
  tag: 'Renda fixa',
  date: null,
  invested: true,
  ...overrides,
});

const card: CreditCard = {
  id: 'c1',
  name: 'Nubank',
  color: '#820AD1',
  paid: false,
  dueDay: 10,
  creditLimit: 5000,
  hidden: false,
};

describe('listYearMonthsInRange', () => {
  it('lista meses inclusivos atravessando o ano', () => {
    expect(listYearMonthsInRange('2025-11', '2026-02')).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
  });

  it('rejeita from > to', () => {
    expect(() => listYearMonthsInRange('2026-03', '2026-01')).toThrow(/anterior/);
  });

  it('rejeita mês inválido', () => {
    expect(isValidExportYearMonth('2026-13')).toBe(false);
    expect(() => listYearMonthsInRange('2026-13', '2026-14')).toThrow(/inválido/);
  });
});

describe('serialize data export CSV', () => {
  it('usa BOM, separador ; e escapa células', () => {
    const csv = serializeIncomesCsv([
      income({ yearMonth: '2026-01', description: 'Linha; com "aspas"' }),
    ]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('id;year_month;description;value;tag;date;received');
    expect(csv).toContain('"Linha; com ""aspas"""');
    expect(csv).toContain('1000.5');
    expect(csv).toContain('true');
  });

  it('serializa gastos com credit_card_name e booleanos', () => {
    const csv = serializeExpensesCsv([
      expense({ yearMonth: '2026-01', creditCardName: 'Nubank' }),
    ]);
    expect(csv).toContain('credit_card_id;credit_card_name');
    expect(csv).toContain('c1;Nubank');
    expect(csv).toContain('false');
    expect(csv).toContain('"Compra; ""promo"""');
  });

  it('serializa investimentos, cartões e status', () => {
    expect(serializeInvestmentsCsv([investment({ yearMonth: '2026-02' })])).toContain(
      '2026-02;Aporte;200'
    );
    expect(serializeCreditCardsCsv([card])).toContain('Nubank;#820AD1;false;10;5000');
    expect(
      serializeCardStatusesCsv([
        {
          id: 'c1|2026-01',
          creditCardId: 'c1',
          creditCardName: 'Nubank',
          yearMonth: '2026-01',
          paid: true,
        },
      ])
    ).toContain('c1|2026-01;c1;Nubank;2026-01;true');
  });

  it('monta cinco arquivos com nomes do contrato', () => {
    const payload: DataExportPayload = {
      from: '2026-01',
      to: '2026-02',
      incomes: [income({ yearMonth: '2026-01' })],
      expenses: [],
      investments: [],
      creditCards: [card],
      cardStatuses: [],
    };
    const files = buildDataExportFiles(payload);
    expect(files).toHaveLength(5);
    expect(files.map((file) => file.filename)).toEqual([
      `${dataExportFilenameBase('2026-01', '2026-02', 'incomes')}.csv`,
      `${dataExportFilenameBase('2026-01', '2026-02', 'expenses')}.csv`,
      `${dataExportFilenameBase('2026-01', '2026-02', 'investments')}.csv`,
      `${dataExportFilenameBase('2026-01', '2026-02', 'credit_cards')}.csv`,
      `${dataExportFilenameBase('2026-01', '2026-02', 'credit_card_monthly_status')}.csv`,
    ]);
  });
});
