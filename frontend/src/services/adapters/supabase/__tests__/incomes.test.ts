/**
 * DEV-63 — Adaptador Supabase de receitas.
 *
 * Cobre a persistência da receita, a clonagem para os demais meses do ano
 * e o comportamento de `updateIncome` (sem vínculo com carteiras).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mock = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
  return createSupabaseMock();
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));

import { createIncome, updateIncome } from '../incomes';
import type { CreateIncomeParams } from '@/services/params';

function incomeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inc-root',
    user_id: 'user-1',
    year_month: '2026-03',
    description: 'Salário',
    value: 5000,
    tag: 'Salário',
    date: '2026-03-05',
    received: false,
    repeat_all_months: false,
    base_income_id: null,
    display_order: 0,
    created_at: '2026-03-05T00:00:00.000Z',
    ...overrides,
  };
}

function createParams(overrides: Partial<CreateIncomeParams> = {}): CreateIncomeParams {
  return {
    userId: 'user-1',
    yearMonth: '2026-03',
    description: 'Salário',
    value: 5000,
    tag: 'Salário',
    date: '2026-03-05',
    received: false,
    repeatAllMonths: false,
    ...overrides,
  } as CreateIncomeParams;
}

beforeEach(() => {
  mock.clear();
});

describe('createIncome (DEV-145: RPC atômica)', () => {
  it('chama create_income_with_series com o payload em snake_case', async () => {
    mock.enqueue({ data: incomeRow({ received: true }) });

    const created = await createIncome(createParams({ received: true, displayOrder: 2 }));

    const calls = mock.getRpcCalls('create_income_with_series');
    expect(calls).toHaveLength(1);
    expect(calls[0].args).toEqual({
      p_payload: {
        user_id: 'user-1',
        year_month: '2026-03',
        description: 'Salário',
        value: 5000,
        tag: 'Salário',
        date: '2026-03-05',
        received: true,
        repeat_all_months: false,
        display_order: 2,
      },
    });
    expect(created.id).toBe('inc-root');
    expect(mock.getOperationsFor('incomes')).toHaveLength(0);
  });

  it('envia repeat_all_months (clones gerados na RPC, sem insert no cliente)', async () => {
    mock.enqueue({ data: incomeRow({ repeat_all_months: true }) });

    await createIncome(createParams({ repeatAllMonths: true }));

    expect(mock.getRpcCalls()[0].args?.p_payload).toMatchObject({ repeat_all_months: true });
    expect(mock.getOperationsFor('incomes', 'insert')).toHaveLength(0);
  });

  it('propaga o erro da RPC', async () => {
    mock.enqueue({ error: { message: 'clones falharam' } });

    await expect(createIncome(createParams({ repeatAllMonths: true }))).rejects.toThrow(
      'clones falharam'
    );
  });

  it('aceita descrição vazia — a validação vive na camada de UI, não no adaptador', async () => {
    mock.enqueue({ data: incomeRow({ description: '' }) });

    await createIncome(createParams({ description: '' }));

    const [call] = mock.getRpcCalls();
    expect((call.args?.p_payload as Record<string, unknown>).description).toBe('');
  });

  it('resolve o usuário via auth quando userId não é informado', async () => {
    mock.setAuthUser({ id: 'user-auth' });
    mock.enqueue({ data: incomeRow({ user_id: 'user-auth' }) });

    await createIncome(createParams({ userId: undefined }));

    const [call] = mock.getRpcCalls();
    expect((call.args?.p_payload as Record<string, unknown>).user_id).toBe('user-auth');
  });
});

describe('updateIncome', () => {
  it('atualiza somente os campos enviados no mês corrente', async () => {
    mock.enqueue({ data: incomeRow({ id: 'inc-1' }) }, {});

    await updateIncome({
      id: 'inc-1',
      userId: 'user-1',
      updates: { value: 5500, received: true },
    });

    const updates = mock.getOperationsFor('incomes', 'update');
    expect(updates).toHaveLength(1);
    expect(updates[0].payload).toEqual({
      value: 5500,
      received: true,
    });
  });

  it('desmarcar received atualiza somente received', async () => {
    mock.enqueue({ data: incomeRow({ id: 'inc-1' }) }, {});

    await updateIncome({ id: 'inc-1', userId: 'user-1', updates: { received: false } });

    const [update] = mock.getOperationsFor('incomes', 'update');
    expect(update.payload).toEqual({ received: false });
  });

  it('não dispara update quando nada muda', async () => {
    mock.enqueue({ data: incomeRow({ id: 'inc-1' }) });

    await updateIncome({ id: 'inc-1', userId: 'user-1', updates: {} });

    expect(mock.getOperationsFor('incomes', 'update')).toHaveLength(0);
  });

  it('falha quando a receita não existe', async () => {
    mock.enqueue({ data: null });

    await expect(
      updateIncome({ id: 'inc-x', userId: 'user-1', updates: { value: 1 } })
    ).rejects.toThrow('Receita não encontrada');
  });

  it('cria a série ao ligar a repetição e remove ao desligar', async () => {
    mock.enqueue({ data: incomeRow({ id: 'inc-1' }) }, {}, {});

    await updateIncome({
      id: 'inc-1',
      userId: 'user-1',
      updates: { repeatAllMonths: true },
    });

    const inserts = mock.getOperationsFor('incomes', 'insert');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].payload).toHaveLength(11);

    mock.clear();
    mock.enqueue({ data: incomeRow({ id: 'inc-1', repeat_all_months: true }) }, {}, {});

    await updateIncome({
      id: 'inc-1',
      userId: 'user-1',
      updates: { repeatAllMonths: false },
    });

    const deletes = mock.getOperationsFor('incomes', 'delete');
    expect(deletes).toHaveLength(1);
    expect(deletes[0].filters).toEqual([
      { method: 'eq', args: ['base_income_id', 'inc-1'] },
      { method: 'eq', args: ['user_id', 'user-1'] },
    ]);
  });

  it('aplica em todos os meses da série a partir do mês corrente', async () => {
    mock.enqueue(
      { data: incomeRow({ id: 'inc-2', base_income_id: 'inc-root' }) },
      { data: [{ id: 'inc-2' }, { id: 'inc-3' }] },
      {}
    );

    await updateIncome({
      id: 'inc-2',
      userId: 'user-1',
      updates: { value: 6000 },
      applyToAllMonths: true,
    });

    const [update] = mock.getOperationsFor('incomes', 'update');
    expect(update.payload).toEqual({ value: 6000 });
    expect(update.filters).toContainEqual({ method: 'in', args: ['id', ['inc-2', 'inc-3']] });
  });
});
