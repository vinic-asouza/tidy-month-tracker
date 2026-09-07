/**
 * DEV-64 — Adaptador Supabase de gastos.
 *
 * Cobre a persistência de `account_id`, a geração de séries (fixo repetido e
 * parcelado), o rollback quando a inserção da série falha e a exclusão da
 * série inteira de um parcelado.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mock = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
  return createSupabaseMock();
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));

import {
  createExpense,
  deleteInstallmentExpense,
  updateExpense,
} from '../expenses';
import type { CreateExpenseParams } from '@/services/params';
import type { Expense } from '@/types/domain';

function expenseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exp-root',
    user_id: 'user-1',
    year_month: '2026-03',
    type: 'variable',
    category: 'Mercado',
    description: 'Compras',
    payment_method: 'Pix',
    value: 250,
    paid: false,
    date: '2026-03-10',
    repeat_all_months: false,
    base_expense_id: null,
    current_installment: null,
    total_installments: null,
    display_order: 0,
    account_id: null,
    created_at: '2026-03-10T00:00:00.000Z',
    ...overrides,
  };
}

function createParams(overrides: Partial<CreateExpenseParams> = {}): CreateExpenseParams {
  return {
    userId: 'user-1',
    yearMonth: '2026-03',
    type: 'variable',
    category: 'Mercado',
    description: 'Compras',
    paymentMethod: 'Pix',
    value: 250,
    paid: false,
    date: '2026-03-10',
    repeatAllMonths: false,
    ...overrides,
  } as CreateExpenseParams;
}

beforeEach(() => {
  mock.clear();
});

describe('createExpense', () => {
  it('persiste account_id no insert raiz', async () => {
    mock.enqueue({ data: expenseRow({ account_id: 'acc-1', paid: true }) });

    const created = await createExpense(
      createParams({ accountId: 'acc-1', paid: true })
    );

    const inserts = mock.getOperationsFor('expenses', 'insert');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].payload).toMatchObject({
      user_id: 'user-1',
      year_month: '2026-03',
      account_id: 'acc-1',
      paid: true,
    });
    expect(created.accountId).toBe('acc-1');
  });

  it('envia account_id null quando nenhuma carteira é informada', async () => {
    mock.enqueue({ data: expenseRow() });

    await createExpense(createParams());

    const [insert] = mock.getOperationsFor('expenses', 'insert');
    expect((insert.payload as Record<string, unknown>).account_id).toBeNull();
  });

  it('propaga o erro do insert raiz', async () => {
    mock.enqueue({ error: { message: 'insert falhou' } });

    await expect(createExpense(createParams())).rejects.toThrow('insert falhou');
    expect(mock.getOperationsFor('expenses', 'delete')).toHaveLength(0);
  });

  it('clona um gasto fixo repetido para os demais meses do ano com paid false e sem carteira', async () => {
    mock.enqueue(
      { data: expenseRow({ type: 'fixed', repeat_all_months: true, account_id: 'acc-1' }) },
      {}
    );

    await createExpense(
      createParams({ type: 'fixed', repeatAllMonths: true, accountId: 'acc-1', paid: true })
    );

    const inserts = mock.getOperationsFor('expenses', 'insert');
    expect(inserts).toHaveLength(2);

    const clones = inserts[1].payload as Array<Record<string, unknown>>;
    // `calculateRemainingMonths` cobre o ano civil inteiro menos o mês atual,
    // portanto 11 clones para 2026-03 (jan, fev e abr–dez).
    expect(clones).toHaveLength(11);
    expect(clones.map((row) => row.year_month)).not.toContain('2026-03');
    expect(clones.every((row) => row.paid === false)).toBe(true);
    expect(clones.every((row) => row.account_id === null)).toBe(true);
    expect(clones.every((row) => row.base_expense_id === 'exp-root')).toBe(true);
    expect(clones.every((row) => row.repeat_all_months === true)).toBe(true);
  });

  it('não dispara insert de clones quando o gasto fixo não é repetido', async () => {
    mock.enqueue({ data: expenseRow({ type: 'fixed' }) });

    await createExpense(createParams({ type: 'fixed', repeatAllMonths: false }));

    expect(mock.getOperationsFor('expenses', 'insert')).toHaveLength(1);
  });

  it('gera as parcelas restantes com paid false e sem carteira', async () => {
    mock.enqueue(
      {
        data: expenseRow({
          type: 'installment',
          current_installment: 1,
          total_installments: 3,
          account_id: 'acc-1',
        }),
      },
      {}
    );

    await createExpense(
      createParams({
        type: 'installment',
        currentInstallment: 1,
        totalInstallments: 3,
        accountId: 'acc-1',
        paid: true,
      })
    );

    const inserts = mock.getOperationsFor('expenses', 'insert');
    expect(inserts).toHaveLength(2);

    const installments = inserts[1].payload as Array<Record<string, unknown>>;
    expect(installments).toHaveLength(2);
    expect(installments.map((row) => row.year_month)).toEqual(['2026-04', '2026-05']);
    expect(installments.map((row) => row.current_installment)).toEqual([2, 3]);
    expect(installments.every((row) => row.paid === false)).toBe(true);
    expect(installments.every((row) => row.account_id === null)).toBe(true);
    expect(installments.every((row) => row.total_installments === 3)).toBe(true);
    expect(installments.every((row) => row.base_expense_id === 'exp-root')).toBe(true);
  });

  it('não gera parcelas quando a atual já é a última', async () => {
    mock.enqueue({
      data: expenseRow({ type: 'installment', current_installment: 3, total_installments: 3 }),
    });

    await createExpense(
      createParams({ type: 'installment', currentInstallment: 3, totalInstallments: 3 })
    );

    expect(mock.getOperationsFor('expenses', 'insert')).toHaveLength(1);
  });

  it('faz rollback da série e propaga o erro quando o insert das parcelas falha', async () => {
    mock.enqueue(
      { data: expenseRow({ type: 'installment', current_installment: 1, total_installments: 3 }) },
      { error: { message: 'parcelas falharam' } },
      {}
    );

    await expect(
      createExpense(
        createParams({ type: 'installment', currentInstallment: 1, totalInstallments: 3 })
      )
    ).rejects.toThrow('parcelas falharam');

    const deletes = mock.getOperationsFor('expenses', 'delete');
    expect(deletes).toHaveLength(1);
    expect(deletes[0].filters).toEqual([
      { method: 'eq', args: ['user_id', 'user-1'] },
      { method: 'or', args: ['id.eq.exp-root,base_expense_id.eq.exp-root'] },
    ]);
  });

  it('faz rollback quando o insert dos clones do fixo repetido falha', async () => {
    mock.enqueue(
      { data: expenseRow({ type: 'fixed', repeat_all_months: true }) },
      { error: { message: 'clones falharam' } },
      {}
    );

    await expect(
      createExpense(createParams({ type: 'fixed', repeatAllMonths: true }))
    ).rejects.toThrow('clones falharam');

    expect(mock.getOperationsFor('expenses', 'delete')).toHaveLength(1);
  });

  it('resolve o usuário via auth quando userId não é informado', async () => {
    mock.setAuthUser({ id: 'user-auth' });
    mock.enqueue({ data: expenseRow({ user_id: 'user-auth' }) });

    await createExpense(createParams({ userId: undefined }));

    const [insert] = mock.getOperationsFor('expenses', 'insert');
    expect((insert.payload as Record<string, unknown>).user_id).toBe('user-auth');
  });

  it('falha quando não há usuário autenticado e userId não é informado', async () => {
    mock.setAuthUser(null);

    await expect(createExpense(createParams({ userId: undefined }))).rejects.toThrow(
      'Usuário não autenticado'
    );
  });
});

describe('updateExpense', () => {
  it('atualiza apenas o mês corrente com os campos enviados', async () => {
    mock.enqueue(
      { data: expenseRow({ id: 'exp-1' }) },
      {}
    );

    await updateExpense({
      id: 'exp-1',
      userId: 'user-1',
      updates: { value: 300, accountId: 'acc-9' },
    });

    const updates = mock.getOperationsFor('expenses', 'update');
    expect(updates).toHaveLength(1);
    expect(updates[0].payload).toEqual({ value: 300, account_id: 'acc-9' });
  });

  it('limpa account_id quando accountId é null', async () => {
    mock.enqueue({ data: expenseRow({ id: 'exp-1', account_id: 'acc-1' }) }, {});

    await updateExpense({
      id: 'exp-1',
      userId: 'user-1',
      updates: { accountId: null as unknown as undefined },
    });

    const [update] = mock.getOperationsFor('expenses', 'update');
    expect(update.payload).toEqual({ account_id: null });
  });

  it('não dispara update quando não há campos alterados', async () => {
    mock.enqueue({ data: expenseRow({ id: 'exp-1' }) });

    await updateExpense({ id: 'exp-1', userId: 'user-1', updates: {} });

    expect(mock.getOperationsFor('expenses', 'update')).toHaveLength(0);
  });

  it('falha quando o gasto não é encontrado', async () => {
    mock.enqueue({ data: null });

    await expect(
      updateExpense({ id: 'exp-x', userId: 'user-1', updates: { value: 1 } })
    ).rejects.toThrow('Despesa não encontrada');
  });

  it('remove a série ao desligar a repetição de um gasto fixo', async () => {
    mock.enqueue(
      { data: expenseRow({ id: 'exp-1', type: 'fixed', repeat_all_months: true }) },
      {},
      {}
    );

    await updateExpense({
      id: 'exp-1',
      userId: 'user-1',
      updates: { repeatAllMonths: false },
    });

    const deletes = mock.getOperationsFor('expenses', 'delete');
    expect(deletes).toHaveLength(1);
    expect(deletes[0].filters).toEqual([
      { method: 'eq', args: ['base_expense_id', 'exp-1'] },
      { method: 'eq', args: ['user_id', 'user-1'] },
    ]);
  });
});

describe('deleteInstallmentExpense', () => {
  it('remove a série inteira a partir do base_expense_id', async () => {
    mock.enqueue(
      { data: { base_expense_id: 'exp-root', id: 'exp-2' } },
      { data: [{ id: 'exp-root' }, { id: 'exp-2' }, { id: 'exp-3' }] },
      {}
    );

    await deleteInstallmentExpense({ id: 'exp-2' } as Expense, 'user-1');

    const deletes = mock.getOperationsFor('expenses', 'delete');
    expect(deletes).toHaveLength(1);
    expect(deletes[0].filters).toEqual([
      { method: 'in', args: ['id', ['exp-root', 'exp-2', 'exp-3']] },
      { method: 'eq', args: ['user_id', 'user-1'] },
    ]);
  });

  it('usa o próprio id quando o registro é a raiz da série', async () => {
    mock.enqueue(
      { data: { base_expense_id: null, id: 'exp-root' } },
      { data: [{ id: 'exp-root' }] },
      {}
    );

    await deleteInstallmentExpense({ id: 'exp-root' } as Expense, 'user-1');

    const listing = mock.getOperationsFor('expenses', 'select')[1];
    expect(listing.filters).toContainEqual({
      method: 'or',
      args: ['id.eq.exp-root,base_expense_id.eq.exp-root'],
    });
  });

  it('não dispara delete quando o registro não existe', async () => {
    mock.enqueue({ data: null });

    await deleteInstallmentExpense({ id: 'exp-x' } as Expense, 'user-1');

    expect(mock.getOperationsFor('expenses', 'delete')).toHaveLength(0);
  });

  it('propaga erro do fetch inicial', async () => {
    mock.enqueue({ error: { message: 'fetch falhou' } });

    await expect(
      deleteInstallmentExpense({ id: 'exp-1' } as Expense, 'user-1')
    ).rejects.toThrow('fetch falhou');
  });
});
