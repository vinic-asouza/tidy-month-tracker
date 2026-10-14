import { describe, expect, it } from 'vitest';
import type { CreditCard, Expense, FinancialRule, Income, MonthData } from '@/types/domain';
import { formatCurrency } from '@/lib/utils';
import { RESGATE_INCOME_TAG } from '@/types/finance';
import {
  ANNUAL_EXPORT_ABSENCE,
  buildAnnualExportDocument,
  formatExportMoney,
} from '../annualExportDocument';
import { serializeAnnualExportCsv } from '../annualExportCsv';
import { createAnnualExportPdf } from '../annualExportPdf';

const today = new Date(2026, 9, 14);
const card: CreditCard = { id: 'c1', name: 'Nubank', color: '#111', paid: false };

const rule: FinancialRule = {
  id: 'rule-1',
  userId: 'user-1',
  essentialsPercentage: 50,
  lifestylePercentage: 30,
  investmentsPercentage: 20,
  categoryMapping: { Moradia: 'essentials', Lazer: 'lifestyle' },
  isCustom: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'e1',
  type: 'variable',
  category: 'Mercado',
  description: 'Compra',
  paymentMethod: 'Pix',
  value: 100,
  paid: true,
  date: null,
  ...overrides,
});

const income = (overrides: Partial<Income> = {}): Income => ({
  id: 'in1',
  description: 'Salário',
  value: 1000,
  tag: 'Salário',
  date: null,
  received: true,
  ...overrides,
});

const year = (months: Partial<MonthData>[]): MonthData[] =>
  Array.from({ length: 12 }, (_, index) => ({
    incomes: [],
    expenses: [],
    investments: [],
    ...months[index],
  }));

describe('buildAnnualExportDocument', () => {
  it('separa efetivado e planejado e deixa o cartão de fora sem fatura paga', () => {
    const data = year([
      {
        expenses: [
          expense({ id: 'pix', value: 40, paymentMethod: 'Pix', paid: true }),
          expense({
            id: 'card',
            value: 90,
            paymentMethod: 'Nubank',
            paid: false,
            category: 'Moradia',
          }),
        ],
        cardMonthlyStatuses: { c1: false },
      },
    ]);

    const effective = buildAnnualExportDocument({
      year: 2025,
      mode: 'effective',
      yearData: data,
      creditCards: [card],
      rule: null,
      expenseCategories: [],
      today,
    });
    const planned = buildAnnualExportDocument({
      year: 2025,
      mode: 'planned',
      yearData: data,
      creditCards: [card],
      rule: null,
      expenseCategories: [],
      today,
    });

    const effectivePayments = effective.tables.find((item) => item.title === 'Método de pagamento');
    const plannedPayments = planned.tables.find((item) => item.title === 'Método de pagamento');
    expect(effectivePayments?.body.map((row) => row[0])).toEqual(['Pix']);
    expect(plannedPayments?.body.map((row) => row[0])).toEqual(['Nubank', 'Pix']);
    expect(effective.tables.some((item) => item.title === 'Cartões')).toBe(false);
    expect(planned.tables.find((item) => item.title === 'Cartões')?.body[0]?.[2]).toBe(
      formatCurrency(90)
    );
    expect(effective.filenameBase).toBe('finto-anual-2025-efetivados');
    expect(planned.filenameBase).toBe('finto-anual-2025-planejados');
    expect(effective.modeLabel).toBe('Efetivados');
  });

  it('mostra ausência na média de ano futuro e mantém o total', () => {
    const data = year([{ expenses: [expense({ value: 200 })] }]);
    const document = buildAnnualExportDocument({
      year: 2027,
      mode: 'effective',
      yearData: data,
      creditCards: [],
      rule: null,
      expenseCategories: [],
      today,
    });

    const summary = document.tables.find((item) => item.title === 'Resumo');
    const gastos = summary?.body.find((row) => row[0] === 'Gastos');
    expect(gastos?.[1]).toBe(ANNUAL_EXPORT_ABSENCE);
    expect(gastos?.[1]).not.toBe(formatCurrency(0));
    expect(gastos?.[2]).toBe(formatCurrency(200));
    expect(document.tables.find((item) => item.title === 'Mês a mês')?.body).toHaveLength(12);
  });

  it('omite linha com total zero e não cria seção de desejos', () => {
    const data = year([
      {
        expenses: [
          expense({ id: 'zero', value: 0, category: 'Lazer' }),
          expense({ id: 'ok', value: 80, category: 'Moradia', type: 'fixed' }),
        ],
      },
    ]);
    const document = buildAnnualExportDocument({
      year: 2025,
      mode: 'planned',
      yearData: data,
      creditCards: [],
      rule,
      expenseCategories: ['Moradia'],
      today,
    });

    const categories = document.tables.find((item) => item.title === 'Categorias');
    expect(categories?.body.map((row) => row[0])).toEqual(['Moradia']);
    expect(document.tables.map((item) => item.title)).not.toContain('Desejos');
    expect(document.tables.some((item) => item.title === 'Por tipo')).toBe(true);
  });

  it('diz que a regra não está configurada e não inventa faixas', () => {
    const document = buildAnnualExportDocument({
      year: 2025,
      mode: 'effective',
      yearData: year([]),
      creditCards: [],
      rule: null,
      expenseCategories: [],
      today,
    });
    const financialRule = document.tables.find((item) => item.title.startsWith('Regra Financeira'));
    expect(financialRule?.emptyMessage).toMatch(/Configure sua regra/);
    expect(financialRule?.body).toEqual([]);
  });

  it('inclui não classificado quando a categoria não está na regra', () => {
    const data = year([
      {
        incomes: [income({ value: 1000 })],
        expenses: [expense({ value: 250, category: 'Outros', paid: true })],
      },
    ]);
    const document = buildAnnualExportDocument({
      year: 2025,
      mode: 'effective',
      yearData: data,
      creditCards: [],
      rule,
      expenseCategories: ['Moradia', 'Outros'],
      today,
    });
    const financialRule = document.tables.find((item) => item.title.startsWith('Regra Financeira'));
    expect(financialRule?.notes.some((note) => note.includes('categoria(s) sem mapeamento'))).toBe(true);
    expect(financialRule?.body.some((row) => row[0].startsWith('Não classificado'))).toBe(true);
    expect(financialRule?.body.find((row) => row[0] === 'Essenciais' && row[1] === 'Gasto')?.[3]).toBe(
      formatCurrency(0)
    );
  });

  it('registra o resgate na nota da regra sem tratar a operação como linha de carteira', () => {
    const data = year([
      {
        incomes: [income({ id: 'r1', value: 300, tag: RESGATE_INCOME_TAG, received: true })],
      },
    ]);
    const document = buildAnnualExportDocument({
      year: 2025,
      mode: 'effective',
      yearData: data,
      creditCards: [],
      rule,
      expenseCategories: [],
      today,
    });
    const financialRule = document.tables.find((item) => item.title.startsWith('Regra Financeira'));
    expect(financialRule?.notes.some((note) => note.startsWith('Resgates na renda'))).toBe(true);
    expect(document.tables.map((item) => item.title)).not.toContain('Carteiras');
  });
});

describe('serializeAnnualExportCsv', () => {
  it('usa BOM, separador ; e a mesma ausência da tela', () => {
    const document = buildAnnualExportDocument({
      year: 2027,
      mode: 'effective',
      yearData: year([{ expenses: [expense({ value: 200 })] }]),
      creditCards: [],
      rule: null,
      expenseCategories: [],
      today,
    });
    const csv = serializeAnnualExportCsv(document);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('\r\n');
    expect(csv).toContain('Modo;Efetivados');
    expect(csv).toContain(`Gastos;${ANNUAL_EXPORT_ABSENCE};${formatCurrency(200)}`);
    expect(csv).not.toMatch(/Desejos|conquistado|pendente|expirado|urgência/i);
    expect(document.tables.map((item) => item.title).every((title) => csv.includes(title))).toBe(true);
  });

  it('formata saldo positivo com o mesmo sinal do card', () => {
    expect(formatExportMoney(10, true)).toBe(`+${formatCurrency(10)}`);
    expect(formatExportMoney(null)).toBe(ANNUAL_EXPORT_ABSENCE);
  });
});

describe('createAnnualExportPdf', () => {
  it('gera um PDF com as seções do mesmo documento', async () => {
    const document = buildAnnualExportDocument({
      year: 2025,
      mode: 'planned',
      yearData: year([{ expenses: [expense({ value: 80, category: 'Moradia' })] }]),
      creditCards: [],
      rule,
      expenseCategories: ['Moradia'],
      today,
    });
    const pdf = await createAnnualExportPdf(document);
    expect(pdf.getNumberOfPages()).toBeGreaterThan(0);
    expect(pdf.output('arraybuffer').byteLength).toBeGreaterThan(1000);
    expect(document.tables.map((item) => item.title)).toEqual(
      expect.arrayContaining(['Resumo', 'Mês a mês', 'Categorias', 'Por tipo', 'Método de pagamento', 'Investimentos'])
    );
    expect(document.tables.map((item) => item.title)).not.toContain('Desejos');
  });
});
