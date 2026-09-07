/**
 * DEV-66 — Adaptador Supabase de carteiras.
 *
 * Cobre unicidade de nome, o guard de troca de papel quando já existem
 * movimentos e a busca do mês mais antigo com movimento (mínimo entre as
 * quatro tabelas que referenciam carteira).
 *
 * Obs.: as regras puras de carteira ficam em
 * `src/utils/business/__tests__/accounts.test.ts`; aqui só o acesso a dados.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mock = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
  return createSupabaseMock();
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));

import {
  createAccount,
  deleteAccount,
  getAccounts,
  getEarliestAccountMovementMonth,
  updateAccount,
} from '../accounts';

function accountRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'acc-1',
    user_id: 'user-1',
    name: 'Conta corrente',
    type: 'checking',
    role: 'movement',
    color: '#3b82f6',
    display_order: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const NO_MOVEMENTS = [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }] as const;

beforeEach(() => {
  mock.clear();
});

describe('getAccounts', () => {
  it('mapeia as carteiras e normaliza o papel desconhecido para movement', async () => {
    mock.enqueue({
      data: [accountRow(), accountRow({ id: 'acc-2', role: 'investment' }), accountRow({ id: 'acc-3', role: 'seja-o-que-for' })],
    });

    const accounts = await getAccounts('user-1');

    expect(accounts.map((account) => account.role)).toEqual([
      'movement',
      'investment',
      'movement',
    ]);
  });
});

describe('createAccount', () => {
  it('rejeita nome duplicado detectado por ilike', async () => {
    mock.enqueue({ data: { id: 'acc-existente' } });

    await expect(
      createAccount({
        userId: 'user-1',
        name: 'conta corrente',
        type: 'checking',
        role: 'movement',
      })
    ).rejects.toThrow('Já existe uma carteira com este nome');

    const [dupCheck] = mock.getOperationsFor('accounts', 'select');
    expect(dupCheck.filters).toContainEqual({
      method: 'ilike',
      args: ['name', 'conta corrente'],
    });
    expect(mock.getOperationsFor('accounts', 'insert')).toHaveLength(0);
  });

  it('cria a carteira com color e display_order default', async () => {
    mock.enqueue({ data: null }, { data: accountRow({ color: null }) });

    const created = await createAccount({
      userId: 'user-1',
      name: 'Conta corrente',
      type: 'checking',
      role: 'movement',
    });

    const [insert] = mock.getOperationsFor('accounts', 'insert');
    expect(insert.payload).toEqual({
      user_id: 'user-1',
      name: 'Conta corrente',
      type: 'checking',
      role: 'movement',
      color: null,
      display_order: 0,
    });
    expect(created.id).toBe('acc-1');
  });

  it('propaga erro do insert', async () => {
    mock.enqueue({ data: null }, { error: { message: 'insert falhou' } });

    await expect(
      createAccount({ userId: 'user-1', name: 'Nova', type: 'checking', role: 'movement' })
    ).rejects.toThrow('insert falhou');
  });
});

describe('updateAccount', () => {
  it('bloqueia a troca de papel quando a carteira já tem movimentos', async () => {
    mock.enqueue({ data: { role: 'movement' } }, { count: 1 });

    await expect(
      updateAccount('acc-1', 'user-1', { role: 'investment' })
    ).rejects.toThrow('Não é possível alterar o papel: esta carteira já tem movimentos');

    expect(mock.getOperationsFor('accounts', 'update')).toHaveLength(0);
  });

  it('detecta movimentos em qualquer uma das quatro tabelas', async () => {
    mock.enqueue(
      { data: { role: 'movement' } },
      { count: 0 },
      { count: 0 },
      { count: 0 },
      { count: 3 }
    );

    await expect(
      updateAccount('acc-1', 'user-1', { role: 'investment' })
    ).rejects.toThrow('Não é possível alterar o papel: esta carteira já tem movimentos');

    expect(
      mock
        .getOperations()
        .filter((operation) => operation.op === 'select')
        .map((operation) => operation.table)
    ).toEqual(['accounts', 'incomes', 'expenses', 'investments', 'account_operations']);
  });

  it('permite a troca de papel quando não há movimentos', async () => {
    mock.enqueue({ data: { role: 'movement' } }, ...NO_MOVEMENTS, {});

    await updateAccount('acc-1', 'user-1', { role: 'investment' });

    const [update] = mock.getOperationsFor('accounts', 'update');
    expect(update.payload).toMatchObject({ role: 'investment' });
  });

  it('não checa movimentos quando o papel não muda', async () => {
    mock.enqueue({ data: { role: 'movement' } }, {});

    await updateAccount('acc-1', 'user-1', { role: 'movement' });

    expect(mock.getOperationsFor('incomes', 'select')).toHaveLength(0);
    const [update] = mock.getOperationsFor('accounts', 'update');
    expect(update.payload).toMatchObject({ role: 'movement' });
  });

  it('rejeita rename para um nome já usado por outra carteira', async () => {
    mock.enqueue({ data: { id: 'acc-2' } });

    await expect(updateAccount('acc-1', 'user-1', { name: 'Poupança' })).rejects.toThrow(
      'Já existe uma carteira com este nome'
    );

    const [dupCheck] = mock.getOperationsFor('accounts', 'select');
    expect(dupCheck.filters).toContainEqual({ method: 'neq', args: ['id', 'acc-1'] });
  });

  it('sempre grava updated_at junto com os campos alterados', async () => {
    mock.enqueue({ data: null }, {});

    await updateAccount('acc-1', 'user-1', { name: 'Conta nova', color: '#000' });

    const [update] = mock.getOperationsFor('accounts', 'update');
    const payload = update.payload as Record<string, unknown>;
    expect(payload.name).toBe('Conta nova');
    expect(payload.color).toBe('#000');
    expect(typeof payload.updated_at).toBe('string');
  });
});

describe('deleteAccount', () => {
  it('remove filtrando por id e usuário', async () => {
    mock.enqueue({});

    await deleteAccount('acc-1', 'user-1');

    const [remove] = mock.getOperationsFor('accounts', 'delete');
    expect(remove.filters).toEqual([
      { method: 'eq', args: ['id', 'acc-1'] },
      { method: 'eq', args: ['user_id', 'user-1'] },
    ]);
  });
});

describe('getEarliestAccountMovementMonth', () => {
  it('retorna o menor mês entre as quatro tabelas', async () => {
    mock.enqueue(
      { data: { year_month: '2026-05' } },
      { data: { year_month: '2026-02' } },
      { data: null },
      { data: { year_month: '2026-08' } }
    );

    await expect(getEarliestAccountMovementMonth('user-1')).resolves.toBe('2026-02');
  });

  it('retorna null quando nenhuma tabela tem movimento', async () => {
    mock.enqueue({ data: null }, { data: null }, { data: null }, { data: null });

    await expect(getEarliestAccountMovementMonth('user-1')).resolves.toBeNull();
  });

  it('consulta as colunas de carteira de cada tabela ordenando por year_month', async () => {
    mock.enqueue({ data: null }, { data: null }, { data: null }, { data: null });

    await getEarliestAccountMovementMonth('user-1');

    const operations = mock.getOperations();
    expect(operations.map((operation) => operation.table)).toEqual([
      'incomes',
      'expenses',
      'investments',
      'account_operations',
    ]);
    expect(operations[2].filters).toContainEqual({
      method: 'or',
      args: ['account_id.not.is.null,source_account_id.not.is.null'],
    });
    expect(operations[3].filters).toContainEqual({
      method: 'or',
      args: ['source_account_id.not.is.null,destination_account_id.not.is.null'],
    });
    expect(operations[0].filters).toContainEqual({
      method: 'order',
      args: ['year_month', { ascending: true }],
    });
  });

  it('propaga erro de qualquer uma das consultas', async () => {
    mock.enqueue(
      { data: null },
      { error: { message: 'earliest falhou' } },
      { data: null },
      { data: null }
    );

    await expect(getEarliestAccountMovementMonth('user-1')).rejects.toThrow(
      'earliest falhou'
    );
  });
});
