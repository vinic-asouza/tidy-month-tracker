/**
 * DEV-66 — Operações de carteira (saque, transferência e exclusão).
 *
 * A transferência grava duas linhas espelhadas com o mesmo
 * `transfer_group_id`, e a exclusão de uma perna remove o grupo inteiro.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mock = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
  return createSupabaseMock();
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));

import {
  createTransfer,
  createWithdrawal,
  deleteAccountOperation,
  getAccountOperations,
} from '../accountOperations';

function operationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'op-1',
    user_id: 'user-1',
    type: 'withdrawal',
    source_account_id: 'acc-1',
    destination_account_id: null,
    transfer_group_id: null,
    credit_card_id: null,
    amount: 300,
    year_month: '2026-03',
    operation_date: '2026-03-12',
    description: null,
    created_at: '2026-03-12T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  mock.clear();
});

describe('getAccountOperations', () => {
  it('lista as operações do mês em ordem decrescente de data', async () => {
    mock.enqueue({ data: [operationRow(), operationRow({ id: 'op-2' })] });

    const operations = await getAccountOperations('user-1', '2026-03');

    expect(operations).toHaveLength(2);
    expect(operations[0].amount).toBe(300);

    const [query] = mock.getOperationsFor('account_operations', 'select');
    expect(query.filters).toContainEqual({
      method: 'order',
      args: ['operation_date', { ascending: false }],
    });
  });
});

describe('createWithdrawal', () => {
  it('grava uma linha do tipo withdrawal com a carteira de origem', async () => {
    mock.enqueue({ data: operationRow() });

    const created = await createWithdrawal({
      userId: 'user-1',
      sourceAccountId: 'acc-1',
      amount: 300,
      yearMonth: '2026-03',
      operationDate: '2026-03-12',
    });

    const [insert] = mock.getOperationsFor('account_operations', 'insert');
    expect(insert.payload).toEqual({
      user_id: 'user-1',
      type: 'withdrawal',
      source_account_id: 'acc-1',
      amount: 300,
      year_month: '2026-03',
      operation_date: '2026-03-12',
      description: null,
    });
    expect(created.type).toBe('withdrawal');
  });

  it('propaga erro do insert', async () => {
    mock.enqueue({ error: { message: 'saque falhou' } });

    await expect(
      createWithdrawal({
        userId: 'user-1',
        sourceAccountId: 'acc-1',
        amount: 300,
        yearMonth: '2026-03',
        operationDate: '2026-03-12',
      })
    ).rejects.toThrow('saque falhou');
  });
});

describe('createTransfer', () => {
  it('grava duas pernas espelhadas com o mesmo transfer_group_id', async () => {
    mock.enqueue({
      data: [
        operationRow({ type: 'transfer_out', transfer_group_id: 'grp-1' }),
        operationRow({
          id: 'op-2',
          type: 'transfer_in',
          source_account_id: null,
          destination_account_id: 'acc-2',
          transfer_group_id: 'grp-1',
        }),
      ],
    });

    const created = await createTransfer({
      userId: 'user-1',
      sourceAccountId: 'acc-1',
      destinationAccountId: 'acc-2',
      amount: 300,
      yearMonth: '2026-03',
      operationDate: '2026-03-12',
      description: 'Reserva',
    });

    const [insert] = mock.getOperationsFor('account_operations', 'insert');
    const rows = insert.payload as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      type: 'transfer_out',
      source_account_id: 'acc-1',
      amount: 300,
      description: 'Reserva',
    });
    expect(rows[1]).toMatchObject({
      type: 'transfer_in',
      destination_account_id: 'acc-2',
      amount: 300,
    });
    expect(rows[0].transfer_group_id).toBe(rows[1].transfer_group_id);
    expect(rows[0].transfer_group_id).toEqual(expect.any(String));
    expect(rows[0].source_account_id).toBe('acc-1');
    expect(rows[1].source_account_id).toBeUndefined();

    expect(created).toHaveLength(2);
    expect(created.map((operation) => operation.type)).toEqual([
      'transfer_out',
      'transfer_in',
    ]);
  });

  it('propaga erro do insert', async () => {
    mock.enqueue({ error: { message: 'transferência falhou' } });

    await expect(
      createTransfer({
        userId: 'user-1',
        sourceAccountId: 'acc-1',
        destinationAccountId: 'acc-2',
        amount: 300,
        yearMonth: '2026-03',
        operationDate: '2026-03-12',
      })
    ).rejects.toThrow('transferência falhou');
  });
});

describe('deleteAccountOperation', () => {
  it('remove as duas pernas quando a operação pertence a um grupo', async () => {
    mock.enqueue({ data: { transfer_group_id: 'grp-1' } }, {});

    await deleteAccountOperation('op-1', 'user-1');

    const [remove] = mock.getOperationsFor('account_operations', 'delete');
    expect(remove.filters).toEqual([
      { method: 'eq', args: ['user_id', 'user-1'] },
      { method: 'eq', args: ['transfer_group_id', 'grp-1'] },
    ]);
  });

  it('remove apenas a operação quando não há grupo', async () => {
    mock.enqueue({ data: { transfer_group_id: null } }, {});

    await deleteAccountOperation('op-1', 'user-1');

    const [remove] = mock.getOperationsFor('account_operations', 'delete');
    expect(remove.filters).toEqual([
      { method: 'eq', args: ['id', 'op-1'] },
      { method: 'eq', args: ['user_id', 'user-1'] },
    ]);
  });

  it('propaga erro do fetch inicial', async () => {
    mock.enqueue({ error: { message: 'fetch falhou' } });

    await expect(deleteAccountOperation('op-1', 'user-1')).rejects.toThrow('fetch falhou');
    expect(mock.getOperationsFor('account_operations', 'delete')).toHaveLength(0);
  });
});
