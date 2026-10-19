/**
 * DEV-65 — Adaptador Supabase de cartões de crédito.
 *
 * Cobre validação de nome, unicidade case-insensitive, propagação do rename
 * para `expenses.payment_method` e o guard de exclusão.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mock = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
  return createSupabaseMock();
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));

import {
  canDeleteCreditCard,
  createCreditCard,
  getCardMonthlyStatus,
  setCardMonthlyStatus,
  updateCreditCard,
} from '../creditCards';

function cardRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'card-1',
    user_id: 'user-1',
    name: 'Nubank',
    color: '#820ad1',
    paid: false,
    display_order: 0,
    due_day: 10,
    credit_limit: 5000,
    ...overrides,
  };
}

beforeEach(() => {
  mock.clear();
});

describe('createCreditCard', () => {
  it('rejeita nome vazio sem consultar o banco', async () => {
    await expect(
      createCreditCard({ userId: 'user-1', name: '   ', color: '#fff', paid: false })
    ).rejects.toThrow('Nome do cartão é obrigatório');

    expect(mock.getOperations()).toHaveLength(0);
  });

  it('rejeita nome duplicado detectado por ilike', async () => {
    mock.enqueue({ data: { id: 'card-existente' } });

    await expect(
      createCreditCard({ userId: 'user-1', name: 'nubank', color: '#fff', paid: false })
    ).rejects.toThrow('Já existe um cartão com este nome');

    const [dupCheck] = mock.getOperationsFor('credit_cards', 'select');
    expect(dupCheck.filters).toContainEqual({ method: 'ilike', args: ['name', 'nubank'] });
    expect(mock.getOperationsFor('credit_cards', 'insert')).toHaveLength(0);
  });

  it('cria o cartão usando a contagem global como display_order', async () => {
    mock.enqueue({ data: null }, { count: 2 }, { data: cardRow({ display_order: 2 }) });

    const created = await createCreditCard({
      userId: 'user-1',
      name: '  Nubank  ',
      color: '#820ad1',
      paid: false,
      dueDay: 10,
      creditLimit: 5000,
    });

    const [insert] = mock.getOperationsFor('credit_cards', 'insert');
    expect(insert.payload).toEqual({
      user_id: 'user-1',
      name: 'Nubank',
      color: '#820ad1',
      paid: false,
      display_order: 2,
      due_day: 10,
      credit_limit: 5000,
    });
    expect(created.id).toBe('card-1');
    expect(created.creditLimit).toBe(5000);
  });

  it('respeita o displayOrder informado e não consulta a contagem', async () => {
    mock.enqueue({ data: null }, { data: cardRow({ display_order: 7 }) });

    await createCreditCard({
      userId: 'user-1',
      name: 'Inter',
      color: '#ff7a00',
      paid: false,
      displayOrder: 7,
    });

    const [insert] = mock.getOperationsFor('credit_cards', 'insert');
    expect((insert.payload as Record<string, unknown>).display_order).toBe(7);
  });

  it('propaga erro da checagem de duplicidade', async () => {
    mock.enqueue({ error: { message: 'dup check falhou' } });

    await expect(
      createCreditCard({ userId: 'user-1', name: 'Nubank', color: '#fff', paid: false })
    ).rejects.toThrow('dup check falhou');
  });
});

describe('updateCreditCard', () => {
  it('DEV-145: rename usa a RPC rename_credit_card (cartão + gastos atômicos)', async () => {
    mock.enqueue({});

    await updateCreditCard({
      id: 'card-1',
      userId: 'user-1',
      updates: { name: '  Nubank Ultravioleta  ' },
    });

    expect(mock.getRpcCalls('rename_credit_card')).toEqual([
      {
        fn: 'rename_credit_card',
        args: { p_card_id: 'card-1', p_new_name: 'Nubank Ultravioleta' },
      },
    ]);
    // Sem updates manuais em expenses/credit_cards: a RPC cuida de tudo.
    expect(mock.getOperationsFor('expenses', 'update')).toHaveLength(0);
    expect(mock.getOperationsFor('credit_cards', 'update')).toHaveLength(0);
  });

  it('DEV-145: propaga conflito de nome vindo da RPC', async () => {
    mock.enqueue({ error: { message: 'Já existe um cartão com este nome' } });

    await expect(
      updateCreditCard({ id: 'card-1', userId: 'user-1', updates: { name: 'Inter' } })
    ).rejects.toThrow('Já existe um cartão com este nome');

    expect(mock.getOperationsFor('credit_cards', 'update')).toHaveLength(0);
  });

  it('DEV-145: propaga cartão inexistente vindo da RPC', async () => {
    mock.enqueue({ error: { message: 'Cartão não encontrado' } });

    await expect(
      updateCreditCard({ id: 'card-x', userId: 'user-1', updates: { name: 'Novo' } })
    ).rejects.toThrow('Cartão não encontrado');
  });

  it('rejeita rename para nome vazio sem chamar a RPC', async () => {
    await expect(
      updateCreditCard({ id: 'card-1', userId: 'user-1', updates: { name: '  ' } })
    ).rejects.toThrow('Nome do cartão é obrigatório');

    expect(mock.getOperations()).toHaveLength(0);
    expect(mock.getRpcCalls()).toHaveLength(0);
  });

  it('rename + outros campos: RPC para o nome e update só dos demais campos', async () => {
    mock.enqueue({}, {});

    await updateCreditCard({
      id: 'card-1',
      userId: 'user-1',
      updates: { name: 'Novo', color: '#000' },
    });

    expect(mock.getRpcCalls('rename_credit_card')).toHaveLength(1);
    const [update] = mock.getOperationsFor('credit_cards', 'update');
    expect(update.payload).toEqual({ color: '#000' });
  });

  it('atualiza apenas os campos enviados quando o nome não é alterado', async () => {
    mock.enqueue({});

    await updateCreditCard({
      id: 'card-1',
      userId: 'user-1',
      updates: { paid: true, dueDay: 15 },
    });

    const [update] = mock.getOperationsFor('credit_cards', 'update');
    expect(update.payload).toEqual({ paid: true, due_day: 15 });
    expect(mock.getRpcCalls()).toHaveLength(0);
  });

  it('não dispara update quando não há campos', async () => {
    await updateCreditCard({ id: 'card-1', userId: 'user-1', updates: {} });

    expect(mock.getOperations()).toHaveLength(0);
  });
});

describe('canDeleteCreditCard', () => {
  it('é false quando existem gastos associados por credit_card_id', async () => {
    mock.enqueue({ count: 4 });

    await expect(canDeleteCreditCard('card-1', 'Nubank', 'user-1')).resolves.toBe(false);

    const queries = mock.getOperationsFor('expenses', 'select');
    expect(queries).toHaveLength(1);
    expect(queries[0].filters).toContainEqual({
      method: 'eq',
      args: ['credit_card_id', 'card-1'],
    });
  });

  it('é false quando só há gasto legado (sem credit_card_id) com o nome do cartão', async () => {
    mock.enqueue({ count: 0 }, { count: 2 });

    await expect(canDeleteCreditCard('card-1', 'Nubank', 'user-1')).resolves.toBe(false);

    const [, legacy] = mock.getOperationsFor('expenses', 'select');
    expect(legacy.filters).toEqual([
      { method: 'eq', args: ['user_id', 'user-1'] },
      { method: 'is', args: ['credit_card_id', null] },
      { method: 'eq', args: ['payment_method', 'Nubank'] },
    ]);
  });

  it('é true quando não há gastos por id nem legados por nome', async () => {
    mock.enqueue({ count: 0 }, { count: 0 });
    await expect(canDeleteCreditCard('card-1', 'Nubank', 'user-1')).resolves.toBe(true);
  });

  it('propaga erro da contagem por id', async () => {
    mock.enqueue({ error: { message: 'count falhou' } });
    await expect(canDeleteCreditCard('card-1', 'Nubank', 'user-1')).rejects.toThrow(
      'count falhou'
    );
  });

  it('propaga erro da contagem legada', async () => {
    mock.enqueue({ count: 0 }, { error: { message: 'legacy falhou' } });
    await expect(canDeleteCreditCard('card-1', 'Nubank', 'user-1')).rejects.toThrow(
      'legacy falhou'
    );
  });
});

describe('status mensal do cartão', () => {
  it('retorna null quando não há registro para o mês', async () => {
    mock.enqueue({ data: null });
    await expect(getCardMonthlyStatus('user-1', 'card-1', '2026-03')).resolves.toBeNull();
  });

  it('retorna o status persistido', async () => {
    mock.enqueue({ data: { paid: true } });

    await expect(getCardMonthlyStatus('user-1', 'card-1', '2026-03')).resolves.toEqual({
      creditCardId: 'card-1',
      yearMonth: '2026-03',
      paid: true,
    });
  });

  it('faz upsert com a chave composta do mês', async () => {
    mock.enqueue({});

    await setCardMonthlyStatus('user-1', 'card-1', '2026-03', true);

    const [upsert] = mock.getOperationsFor('credit_card_monthly_status', 'upsert');
    expect(upsert.payload).toEqual({
      user_id: 'user-1',
      credit_card_id: 'card-1',
      year_month: '2026-03',
      paid: true,
    });
    expect(upsert.args[1]).toEqual({ onConflict: 'user_id,credit_card_id,year_month' });
  });
});
