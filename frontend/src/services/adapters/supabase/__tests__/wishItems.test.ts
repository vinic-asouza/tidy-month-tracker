/**
 * DEV-67 — Adaptador Supabase da lista de desejos.
 *
 * Cobre o payload de criação (status sempre `active`, definido pelo adaptador
 * e não pelo chamador), a marcação de conquistado e a expiração em lote.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mock = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
  return createSupabaseMock();
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));

import {
  createWishItem,
  deleteWishItem,
  expireWishItems,
  getWishItems,
  updateWishItem,
} from '../wishItems';
import type { CreateWishItemInput } from '@/types/domain';

function wishRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'wish-1',
    user_id: 'user-1',
    description: 'Notebook novo',
    value: 6000,
    urgency: 'medium',
    start_month: '2026-03',
    target_month: '2026-09',
    status: 'active',
    conquered_month: null,
    linked_expense_id: null,
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    ...overrides,
  };
}

const NEW_WISH: CreateWishItemInput = {
  description: 'Notebook novo',
  value: 6000,
  urgency: 'medium',
  startMonth: '2026-03',
  targetMonth: '2026-09',
};

beforeEach(() => {
  mock.clear();
});

describe('getWishItems', () => {
  it('lista os desejos do usuário em ordem de criação', async () => {
    mock.enqueue({ data: [wishRow(), wishRow({ id: 'wish-2' })] });

    const items = await getWishItems('user-1');

    expect(items).toHaveLength(2);
    const [query] = mock.getOperationsFor('wish_items', 'select');
    expect(query.filters).toContainEqual({
      method: 'order',
      args: ['created_at', { ascending: true }],
    });
  });

  it('resolve o usuário via auth quando não recebe userId', async () => {
    mock.setAuthUser({ id: 'user-auth' });
    mock.enqueue({ data: [] });

    await getWishItems();

    const [query] = mock.getOperationsFor('wish_items', 'select');
    expect(query.filters).toContainEqual({ method: 'eq', args: ['user_id', 'user-auth'] });
  });
});

describe('createWishItem', () => {
  it('monta o payload em snake_case com status active fixado pelo adaptador', async () => {
    mock.enqueue({ data: wishRow() });

    const created = await createWishItem(NEW_WISH, 'user-1');

    const [insert] = mock.getOperationsFor('wish_items', 'insert');
    expect(insert.payload).toEqual({
      user_id: 'user-1',
      description: 'Notebook novo',
      value: 6000,
      urgency: 'medium',
      start_month: '2026-03',
      target_month: '2026-09',
      status: 'active',
    });
    expect(created.status).toBe('active');
  });

  it('ignora status enviado pelo chamador — quem define é o adaptador', async () => {
    mock.enqueue({ data: wishRow() });

    await createWishItem(
      { ...NEW_WISH, status: 'conquered' } as unknown as CreateWishItemInput,
      'user-1'
    );

    const [insert] = mock.getOperationsFor('wish_items', 'insert');
    expect((insert.payload as Record<string, unknown>).status).toBe('active');
  });

  it('propaga erro do insert', async () => {
    mock.enqueue({ error: { message: 'insert falhou' } });

    await expect(createWishItem(NEW_WISH, 'user-1')).rejects.toThrow('insert falhou');
  });
});

describe('updateWishItem', () => {
  it('marca como conquistado gravando mês e gasto vinculado', async () => {
    mock.enqueue({
      data: wishRow({
        status: 'conquered',
        conquered_month: '2026-05',
        linked_expense_id: 'exp-1',
      }),
    });

    const updated = await updateWishItem(
      'wish-1',
      { status: 'conquered', conqueredMonth: '2026-05', linkedExpenseId: 'exp-1' },
      'user-1'
    );

    const [update] = mock.getOperationsFor('wish_items', 'update');
    expect(update.payload).toMatchObject({
      status: 'conquered',
      conquered_month: '2026-05',
      linked_expense_id: 'exp-1',
    });
    expect(update.filters).toEqual([
      { method: 'eq', args: ['id', 'wish-1'] },
      { method: 'eq', args: ['user_id', 'user-1'] },
      { method: 'select', args: ['*'] },
    ]);
    expect(updated.status).toBe('conquered');
    expect(updated.conqueredMonth).toBe('2026-05');
  });

  it('desfaz a conquista limpando mês e vínculo', async () => {
    mock.enqueue({ data: wishRow() });

    await updateWishItem(
      'wish-1',
      { status: 'active', conqueredMonth: null, linkedExpenseId: null },
      'user-1'
    );

    const [update] = mock.getOperationsFor('wish_items', 'update');
    expect(update.payload).toMatchObject({
      status: 'active',
      conquered_month: null,
      linked_expense_id: null,
    });
  });

  it('sempre atualiza updated_at e envia só os campos informados', async () => {
    mock.enqueue({ data: wishRow({ value: 7000 }) });

    await updateWishItem('wish-1', { value: 7000 }, 'user-1');

    const [update] = mock.getOperationsFor('wish_items', 'update');
    const payload = update.payload as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(['updated_at', 'value']);
    expect(typeof payload.updated_at).toBe('string');
  });

  it('não permite alterar o start_month', async () => {
    mock.enqueue({ data: wishRow() });

    await updateWishItem(
      'wish-1',
      { startMonth: '2026-01' } as unknown as { targetMonth?: string },
      'user-1'
    );

    const [update] = mock.getOperationsFor('wish_items', 'update');
    expect(update.payload).not.toHaveProperty('start_month');
  });

  it('propaga erro do update', async () => {
    mock.enqueue({ error: { message: 'update falhou' } });

    await expect(updateWishItem('wish-1', { value: 1 }, 'user-1')).rejects.toThrow(
      'update falhou'
    );
  });
});

describe('expireWishItems', () => {
  it('marca os ids informados como expired', async () => {
    mock.enqueue({});

    await expireWishItems(['wish-1', 'wish-2'], 'user-1');

    const [update] = mock.getOperationsFor('wish_items', 'update');
    expect(update.payload).toMatchObject({ status: 'expired' });
    expect(update.filters).toEqual([
      { method: 'eq', args: ['user_id', 'user-1'] },
      { method: 'in', args: ['id', ['wish-1', 'wish-2']] },
    ]);
  });

  it('não consulta o banco com lista vazia', async () => {
    await expireWishItems([], 'user-1');

    expect(mock.getOperations()).toHaveLength(0);
  });

  it('propaga erro do update em lote', async () => {
    mock.enqueue({ error: { message: 'expire falhou' } });

    await expect(expireWishItems(['wish-1'], 'user-1')).rejects.toThrow('expire falhou');
  });
});

describe('deleteWishItem', () => {
  it('remove filtrando por id e usuário', async () => {
    mock.enqueue({});

    await deleteWishItem('wish-1', 'user-1');

    const [remove] = mock.getOperationsFor('wish_items', 'delete');
    expect(remove.filters).toEqual([
      { method: 'eq', args: ['id', 'wish-1'] },
      { method: 'eq', args: ['user_id', 'user-1'] },
    ]);
  });
});
