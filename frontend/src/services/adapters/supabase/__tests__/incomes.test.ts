/**
 * DEV-63 — Adaptador Supabase de receitas.
 *
 * Cobre a persistência de carteira, a clonagem para os demais meses do ano,
 * a criação de receita de resgate (tag reservada + vínculo com a operação de
 * origem) e o comportamento de `updateIncome` sobre `account_id`.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mock = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
  return createSupabaseMock();
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));

import { createIncome, createResgateIncome, updateIncome } from '../incomes';
import { RESGATE_INCOME_TAG } from '@/types/finance';
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
    account_id: null,
    source_operation_id: null,
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

describe('createIncome', () => {
  it('persiste account_id no insert raiz', async () => {
    mock.enqueue({ data: incomeRow({ account_id: 'acc-1', received: true }) });

    const created = await createIncome(createParams({ accountId: 'acc-1', received: true }));

    const [insert] = mock.getOperationsFor('incomes', 'insert');
    expect(insert.payload).toMatchObject({
      user_id: 'user-1',
      year_month: '2026-03',
      account_id: 'acc-1',
      received: true,
      source_operation_id: null,
    });
    expect(created.accountId).toBe('acc-1');
  });

  it('clona para os demais meses do ano com received false e sem carteira', async () => {
    mock.enqueue(
      { data: incomeRow({ repeat_all_months: true, account_id: 'acc-1', received: true }) },
      {}
    );

    await createIncome(
      createParams({ repeatAllMonths: true, accountId: 'acc-1', received: true })
    );

    const inserts = mock.getOperationsFor('incomes', 'insert');
    expect(inserts).toHaveLength(2);

    const clones = inserts[1].payload as Array<Record<string, unknown>>;
    // `calculateRemainingMonths` cobre o ano civil inteiro menos o mês atual.
    expect(clones).toHaveLength(11);
    expect(clones.map((row) => row.year_month)).not.toContain('2026-03');
    expect(clones.every((row) => row.received === false)).toBe(true);
    expect(clones.every((row) => row.account_id === null)).toBe(true);
    expect(clones.every((row) => row.base_income_id === 'inc-root')).toBe(true);
    expect(clones.every((row) => row.repeat_all_months === true)).toBe(true);
  });

  it('não clona quando repeatAllMonths é false', async () => {
    mock.enqueue({ data: incomeRow() });

    await createIncome(createParams());

    expect(mock.getOperationsFor('incomes', 'insert')).toHaveLength(1);
  });

  it('propaga o erro do insert raiz', async () => {
    mock.enqueue({ error: { message: 'insert falhou' } });

    await expect(createIncome(createParams())).rejects.toThrow('insert falhou');
  });

  it('propaga o erro do insert dos clones', async () => {
    mock.enqueue(
      { data: incomeRow({ repeat_all_months: true }) },
      { error: { message: 'clones falharam' } }
    );

    await expect(createIncome(createParams({ repeatAllMonths: true }))).rejects.toThrow(
      'clones falharam'
    );
  });

  it('aceita descrição vazia — a validação vive na camada de UI, não no adaptador', async () => {
    mock.enqueue({ data: incomeRow({ description: '' }) });

    await createIncome(createParams({ description: '' }));

    const [insert] = mock.getOperationsFor('incomes', 'insert');
    expect((insert.payload as Record<string, unknown>).description).toBe('');
  });

  it('resolve o usuário via auth quando userId não é informado', async () => {
    mock.setAuthUser({ id: 'user-auth' });
    mock.enqueue({ data: incomeRow({ user_id: 'user-auth' }) });

    await createIncome(createParams({ userId: undefined }));

    const [insert] = mock.getOperationsFor('incomes', 'insert');
    expect((insert.payload as Record<string, unknown>).user_id).toBe('user-auth');
  });
});

describe('createResgateIncome', () => {
  it('grava a tag reservada, marca como recebida e vincula a operação de origem', async () => {
    mock.enqueue({
      data: incomeRow({
        tag: RESGATE_INCOME_TAG,
        received: true,
        account_id: 'acc-1',
        source_operation_id: 'op-1',
      }),
    });

    const created = await createResgateIncome({
      userId: 'user-1',
      yearMonth: '2026-03',
      description: 'Resgate CDB',
      value: 1200,
      date: '2026-03-20',
      accountId: 'acc-1',
      sourceOperationId: 'op-1',
    });

    const [insert] = mock.getOperationsFor('incomes', 'insert');
    expect(insert.payload).toMatchObject({
      tag: RESGATE_INCOME_TAG,
      received: true,
      repeat_all_months: false,
      account_id: 'acc-1',
      source_operation_id: 'op-1',
    });
    expect(created.sourceOperationId).toBe('op-1');
    expect(created.received).toBe(true);
  });

  it('envia account_id null quando a carteira de destino não é informada', async () => {
    mock.enqueue({
      data: incomeRow({ tag: RESGATE_INCOME_TAG, received: true, source_operation_id: 'op-2' }),
    });

    await createResgateIncome({
      userId: 'user-1',
      yearMonth: '2026-03',
      description: 'Resgate',
      value: 500,
      date: '2026-03-20',
      sourceOperationId: 'op-2',
    });

    const [insert] = mock.getOperationsFor('incomes', 'insert');
    expect((insert.payload as Record<string, unknown>).account_id).toBeNull();
  });

  it('propaga erro do insert', async () => {
    mock.enqueue({ error: { message: 'resgate falhou' } });

    await expect(
      createResgateIncome({
        userId: 'user-1',
        yearMonth: '2026-03',
        description: 'Resgate',
        value: 500,
        date: '2026-03-20',
        sourceOperationId: 'op-3',
      })
    ).rejects.toThrow('resgate falhou');
  });
});

describe('updateIncome', () => {
  it('atualiza somente os campos enviados no mês corrente', async () => {
    mock.enqueue({ data: incomeRow({ id: 'inc-1' }) }, {});

    await updateIncome({
      id: 'inc-1',
      userId: 'user-1',
      updates: { value: 5500, received: true, accountId: 'acc-2' },
    });

    const updates = mock.getOperationsFor('incomes', 'update');
    expect(updates).toHaveLength(1);
    expect(updates[0].payload).toEqual({
      value: 5500,
      received: true,
      account_id: 'acc-2',
    });
  });

  it('limpa account_id quando accountId chega como null', async () => {
    mock.enqueue({ data: incomeRow({ id: 'inc-1', account_id: 'acc-1' }) }, {});

    await updateIncome({
      id: 'inc-1',
      userId: 'user-1',
      updates: { received: false, accountId: null as unknown as undefined },
    });

    const [update] = mock.getOperationsFor('incomes', 'update');
    expect(update.payload).toEqual({ received: false, account_id: null });
  });

  it('não limpa a carteira automaticamente ao desmarcar received', async () => {
    // O adaptador só grava `account_id` quando `accountId` vem no payload; a
    // limpeza ao desmarcar é responsabilidade da camada de UI/hook.
    mock.enqueue({ data: incomeRow({ id: 'inc-1', account_id: 'acc-1' }) }, {});

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
