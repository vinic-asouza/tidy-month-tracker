/**
 * DEV-63 / DEV-64 (RN-G06) — Guard de uso em categorias e tags.
 *
 * Excluir uma categoria/tag já usada no histórico deve falhar; renomear não
 * passa pelo guard e deve propagar o novo nome para os lançamentos.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mock = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
  return createSupabaseMock();
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));

import {
  getSettings,
  isExpenseCategoryInUse,
  isIncomeTagInUse,
  isInvestmentTagInUse,
  renameExpenseCategory,
  renameIncomeTag,
  updateExpenseCategories,
  updateIncomeTags,
  updateInvestmentTags,
} from '../settings';

function settingsRow(overrides: Record<string, unknown> = {}) {
  return {
    income_tags: ['Salário', 'Freelance'],
    expense_categories: ['Mercado', 'Lazer'],
    investment_tags: ['CDB', 'Ações'],
    payment_methods: ['Pix', 'Nubank'],
    ...overrides,
  };
}

const UPDATE_OK = { data: [{ user_id: 'user-1' }] };

beforeEach(() => {
  mock.clear();
});

describe('getSettings', () => {
  it('mapeia as listas persistidas', async () => {
    mock.enqueue({ data: settingsRow() });

    const settings = await getSettings('user-1');

    expect(settings.expenseCategories).toEqual(['Mercado', 'Lazer']);
    expect(settings.incomeTags).toEqual(['Salário', 'Freelance']);
  });

  it('cai nos defaults quando não há registro', async () => {
    mock.enqueue({ data: null });

    const settings = await getSettings('user-1');

    expect(settings.expenseCategories.length).toBeGreaterThan(0);
    expect(settings.paymentMethods.length).toBeGreaterThan(0);
  });

  it('propaga erro da consulta', async () => {
    mock.enqueue({ error: { message: 'select falhou' } });

    await expect(getSettings('user-1')).rejects.toThrow('select falhou');
  });
});

describe('guards de uso', () => {
  it('isExpenseCategoryInUse é true quando existe gasto na categoria', async () => {
    mock.enqueue({ count: 3 });

    await expect(isExpenseCategoryInUse('user-1', 'Mercado')).resolves.toBe(true);

    const [query] = mock.getOperationsFor('expenses', 'select');
    expect(query.filters).toContainEqual({ method: 'eq', args: ['category', 'Mercado'] });
  });

  it('isExpenseCategoryInUse é false quando a contagem é zero', async () => {
    mock.enqueue({ count: 0 });
    await expect(isExpenseCategoryInUse('user-1', 'Mercado')).resolves.toBe(false);
  });

  it('isIncomeTagInUse consulta a tabela de receitas pela tag', async () => {
    mock.enqueue({ count: 1 });

    await expect(isIncomeTagInUse('user-1', 'Salário')).resolves.toBe(true);

    const [query] = mock.getOperationsFor('incomes', 'select');
    expect(query.filters).toContainEqual({ method: 'eq', args: ['tag', 'Salário'] });
  });

  it('isInvestmentTagInUse consulta a tabela de aportes pela tag', async () => {
    mock.enqueue({ count: 0 });
    await expect(isInvestmentTagInUse('user-1', 'CDB')).resolves.toBe(false);
  });
});

describe('updateExpenseCategories', () => {
  it('bloqueia a remoção de uma categoria em uso', async () => {
    mock.enqueue({ data: settingsRow() }, { count: 2 });

    await expect(updateExpenseCategories('user-1', ['Mercado'])).rejects.toThrow(
      'Não é possível excluir: esta categoria está em uso no histórico de gastos'
    );

    expect(mock.getOperationsFor('finance_settings', 'update')).toHaveLength(0);
  });

  it('permite remover uma categoria não utilizada', async () => {
    mock.enqueue({ data: settingsRow() }, { count: 0 }, UPDATE_OK);

    await updateExpenseCategories('user-1', ['Mercado']);

    const [update] = mock.getOperationsFor('finance_settings', 'update');
    expect(update.payload).toEqual({ expense_categories: ['Mercado'] });
  });

  it('não checa uso quando nenhuma categoria é removida', async () => {
    mock.enqueue({ data: settingsRow() }, UPDATE_OK);

    await updateExpenseCategories('user-1', ['Mercado', 'Lazer', 'Saúde']);

    expect(mock.getOperationsFor('expenses', 'select')).toHaveLength(0);
    const [update] = mock.getOperationsFor('finance_settings', 'update');
    expect(update.payload).toEqual({
      expense_categories: ['Mercado', 'Lazer', 'Saúde'],
    });
  });

  it('normaliza a lista removendo vazios e duplicatas', async () => {
    mock.enqueue({ data: settingsRow() }, UPDATE_OK);

    await updateExpenseCategories('user-1', [
      'Mercado',
      '  Lazer  ',
      'lazer',
      '   ',
      'Saúde',
    ]);

    const [update] = mock.getOperationsFor('finance_settings', 'update');
    expect(update.payload).toEqual({
      expense_categories: ['Mercado', 'Lazer', 'Saúde'],
    });
  });

  it('cria o registro de settings com defaults quando o update não afeta linhas', async () => {
    mock.enqueue({ data: settingsRow() }, { data: [] }, {});

    await updateExpenseCategories('user-1', ['Mercado', 'Lazer', 'Saúde']);

    const [insert] = mock.getOperationsFor('finance_settings', 'insert');
    expect(insert.payload).toMatchObject({
      user_id: 'user-1',
      expense_categories: ['Mercado', 'Lazer', 'Saúde'],
    });
  });
});

describe('updateIncomeTags', () => {
  it('bloqueia a remoção de uma tag em uso', async () => {
    mock.enqueue({ data: settingsRow() }, { count: 1 });

    await expect(updateIncomeTags('user-1', ['Salário'])).rejects.toThrow(
      'Não é possível excluir: esta categoria está em uso no histórico de entradas'
    );

    expect(mock.getOperationsFor('finance_settings', 'update')).toHaveLength(0);
  });

  it('permite remover uma tag não utilizada', async () => {
    mock.enqueue({ data: settingsRow() }, { count: 0 }, UPDATE_OK);

    await updateIncomeTags('user-1', ['Salário']);

    const [update] = mock.getOperationsFor('finance_settings', 'update');
    expect(update.payload).toEqual({ income_tags: ['Salário'] });
  });
});

describe('updateInvestmentTags', () => {
  it('bloqueia a remoção de uma tag de aporte em uso', async () => {
    mock.enqueue({ data: settingsRow() }, { count: 4 });

    await expect(updateInvestmentTags('user-1', ['CDB'])).rejects.toThrow(
      'Não é possível excluir: esta tag está em uso no histórico de aportes'
    );
  });
});

describe('rename não passa pelo guard de uso', () => {
  it('renameExpenseCategory grava a lista e propaga o novo nome mesmo em uso', async () => {
    mock.enqueue({ data: settingsRow() }, UPDATE_OK, {});

    await renameExpenseCategory('user-1', 'Lazer', 'Entretenimento');

    // Nenhuma contagem de uso é feita no caminho de rename.
    expect(mock.getOperationsFor('expenses', 'select')).toHaveLength(0);

    const [settingsUpdate] = mock.getOperationsFor('finance_settings', 'update');
    expect(settingsUpdate.payload).toEqual({
      expense_categories: ['Mercado', 'Entretenimento'],
    });

    const [expenseUpdate] = mock.getOperationsFor('expenses', 'update');
    expect(expenseUpdate.payload).toEqual({ category: 'Entretenimento' });
    expect(expenseUpdate.filters).toContainEqual({ method: 'eq', args: ['category', 'Lazer'] });
  });

  it('renameIncomeTag grava a lista e propaga o novo nome nas receitas', async () => {
    mock.enqueue({ data: settingsRow() }, UPDATE_OK, {});

    await renameIncomeTag('user-1', 'Freelance', 'Autônomo');

    expect(mock.getOperationsFor('incomes', 'select')).toHaveLength(0);

    const [settingsUpdate] = mock.getOperationsFor('finance_settings', 'update');
    expect(settingsUpdate.payload).toEqual({ income_tags: ['Salário', 'Autônomo'] });

    const [incomeUpdate] = mock.getOperationsFor('incomes', 'update');
    expect(incomeUpdate.payload).toEqual({ tag: 'Autônomo' });
    expect(incomeUpdate.filters).toContainEqual({ method: 'eq', args: ['tag', 'Freelance'] });
  });
});
