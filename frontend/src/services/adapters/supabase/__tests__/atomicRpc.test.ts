/**
 * DEV-145 — Documenta que as escritas multi-linha financeiras usam RPCs
 * Postgres atômicas (SECURITY INVOKER) em vez de multi-insert + rollback no cliente.
 *
 * - create_expense_with_series / create_income_with_series / create_investment_with_series
 * - rename_credit_card
 *
 * Importação CSV em lote permanece fora de escopo (não atômica).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mock = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
  return createSupabaseMock();
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));

import { createExpense } from '../expenses';
import { createIncome } from '../incomes';
import { createInvestment } from '../investments';
import { updateCreditCard } from '../creditCards';
import type {
  CreateExpenseParams,
  CreateIncomeParams,
  CreateInvestmentParams,
} from '@/services/params';

beforeEach(() => {
  mock.clear();
});

describe('DEV-145: escritas atômicas via supabase.rpc', () => {
  it('createExpense usa create_expense_with_series e não insere direto em expenses', async () => {
    mock.enqueue({
      data: {
        id: 'exp-1', type: 'fixed', category: 'Casa', description: 'Aluguel',
        payment_method: 'Pix', credit_card_id: null, value: 1000, paid: false,
        date: '2026-03-01', year_month: '2026-03', repeat_all_months: true,
        base_expense_id: null, current_installment: null, total_installments: null,
        display_order: 0, created_at: '2026-03-01T00:00:00.000Z',
      },
    });

    const created = await createExpense({
      userId: 'user-1', yearMonth: '2026-03', type: 'fixed', category: 'Casa',
      description: 'Aluguel', paymentMethod: 'Pix', value: 1000, paid: false,
      date: '2026-03-01', repeatAllMonths: true,
    } as CreateExpenseParams);

    expect(mock.getRpcCalls().map((c) => c.fn)).toEqual(['create_expense_with_series']);
    expect(mock.getOperationsFor('expenses')).toHaveLength(0);
    expect(created.id).toBe('exp-1');
  });

  it('createIncome usa create_income_with_series', async () => {
    mock.enqueue({
      data: {
        id: 'inc-1', description: 'Salário', value: 5000, tag: 'Salário',
        date: '2026-03-05', received: false, repeat_all_months: true,
        base_income_id: null, year_month: '2026-03', display_order: 0,
        created_at: '2026-03-05T00:00:00.000Z',
      },
    });

    const created = await createIncome({
      userId: 'user-1', yearMonth: '2026-03', description: 'Salário', value: 5000,
      tag: 'Salário', date: '2026-03-05', received: false, repeatAllMonths: true,
    } as CreateIncomeParams);

    expect(mock.getRpcCalls().map((c) => c.fn)).toEqual(['create_income_with_series']);
    expect(mock.getOperationsFor('incomes')).toHaveLength(0);
    expect(created.id).toBe('inc-1');
  });

  it('createInvestment usa create_investment_with_series', async () => {
    mock.enqueue({
      data: {
        id: 'inv-1', description: 'Tesouro', value: 300, tag: 'Renda fixa',
        date: '2026-03-05', invested: false, repeat_all_months: true,
        base_investment_id: null, year_month: '2026-03', display_order: 0,
        created_at: '2026-03-05T00:00:00.000Z',
      },
    });

    const created = await createInvestment({
      userId: 'user-1', yearMonth: '2026-03', description: 'Tesouro', value: 300,
      tag: 'Renda fixa', date: '2026-03-05', repeatAllMonths: true,
    } as CreateInvestmentParams);

    expect(mock.getRpcCalls()).toEqual([
      {
        fn: 'create_investment_with_series',
        args: {
          p_payload: {
            user_id: 'user-1', year_month: '2026-03', description: 'Tesouro', value: 300,
            tag: 'Renda fixa', date: '2026-03-05', repeat_all_months: true, display_order: 0,
          },
        },
      },
    ]);
    expect(mock.getOperationsFor('investments')).toHaveLength(0);
    expect(created.id).toBe('inv-1');
  });

  it('createInvestment propaga o erro da RPC', async () => {
    mock.enqueue({ error: { message: 'rpc falhou' } });

    await expect(
      createInvestment({
        userId: 'user-1', yearMonth: '2026-03', description: 'X', value: 1, tag: 'T',
        repeatAllMonths: true,
      } as CreateInvestmentParams)
    ).rejects.toThrow('rpc falhou');
  });

  it('updateCreditCard (rename) usa rename_credit_card', async () => {
    mock.enqueue({});

    await updateCreditCard({ id: 'card-1', userId: 'user-1', updates: { name: 'Novo' } });

    expect(mock.getRpcCalls().map((c) => c.fn)).toEqual(['rename_credit_card']);
    expect(mock.getOperationsFor('expenses')).toHaveLength(0);
  });
});
