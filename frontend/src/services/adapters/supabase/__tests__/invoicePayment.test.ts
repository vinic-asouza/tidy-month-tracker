/**
 * DEV-65 — Pagamento de fatura como operação de carteira.
 *
 * Cobre a camada de dados de `createInvoicePayment`, `updateInvoicePayment` e
 * `deleteInvoicePaymentByCard`. A orquestração no hook `usePayCardInvoice`
 * (débito na carteira + marcação do mês) fica fora deste escopo.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mock = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
  return createSupabaseMock();
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));

import {
  createInvoicePayment,
  deleteInvoicePaymentByCard,
  updateInvoicePayment,
} from '../accountOperations';

function invoicePaymentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'op-inv-1',
    user_id: 'user-1',
    type: 'invoice_payment',
    source_account_id: 'acc-1',
    destination_account_id: null,
    transfer_group_id: null,
    credit_card_id: 'card-1',
    amount: 1234.56,
    year_month: '2026-03',
    operation_date: '2026-03-10',
    description: 'Fatura Nubank',
    created_at: '2026-03-10T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  mock.clear();
});

describe('createInvoicePayment', () => {
  it('grava a operação vinculada ao cartão e à carteira de origem', async () => {
    mock.enqueue({ data: invoicePaymentRow() });

    const created = await createInvoicePayment({
      userId: 'user-1',
      sourceAccountId: 'acc-1',
      creditCardId: 'card-1',
      amount: 1234.56,
      yearMonth: '2026-03',
      operationDate: '2026-03-10',
      description: 'Fatura Nubank',
    });

    const [insert] = mock.getOperationsFor('account_operations', 'insert');
    expect(insert.payload).toEqual({
      user_id: 'user-1',
      type: 'invoice_payment',
      source_account_id: 'acc-1',
      credit_card_id: 'card-1',
      amount: 1234.56,
      year_month: '2026-03',
      operation_date: '2026-03-10',
      description: 'Fatura Nubank',
    });
    expect(created.creditCardId).toBe('card-1');
    expect(created.amount).toBe(1234.56);
  });

  it('envia description null quando não informada', async () => {
    mock.enqueue({ data: invoicePaymentRow({ description: null }) });

    await createInvoicePayment({
      userId: 'user-1',
      sourceAccountId: 'acc-1',
      creditCardId: 'card-1',
      amount: 100,
      yearMonth: '2026-03',
      operationDate: '2026-03-10',
    });

    const [insert] = mock.getOperationsFor('account_operations', 'insert');
    expect((insert.payload as Record<string, unknown>).description).toBeNull();
  });

  it('propaga erro do insert', async () => {
    mock.enqueue({ error: { message: 'pagamento falhou' } });

    await expect(
      createInvoicePayment({
        userId: 'user-1',
        sourceAccountId: 'acc-1',
        creditCardId: 'card-1',
        amount: 100,
        yearMonth: '2026-03',
        operationDate: '2026-03-10',
      })
    ).rejects.toThrow('pagamento falhou');
  });
});

describe('updateInvoicePayment', () => {
  it('atualiza apenas os campos enviados e restringe ao tipo invoice_payment', async () => {
    mock.enqueue({ data: invoicePaymentRow({ amount: 999 }) });

    const updated = await updateInvoicePayment('op-inv-1', 'user-1', {
      amount: 999,
      sourceAccountId: 'acc-2',
    });

    const [update] = mock.getOperationsFor('account_operations', 'update');
    expect(update.payload).toEqual({ amount: 999, source_account_id: 'acc-2' });
    expect(update.filters).toContainEqual({ method: 'eq', args: ['type', 'invoice_payment'] });
    expect(updated.amount).toBe(999);
  });
});

describe('deleteInvoicePaymentByCard', () => {
  it('remove o pagamento do cartão no mês informado', async () => {
    mock.enqueue({});

    await deleteInvoicePaymentByCard('user-1', 'card-1', '2026-03');

    const [remove] = mock.getOperationsFor('account_operations', 'delete');
    expect(remove.filters).toEqual([
      { method: 'eq', args: ['user_id', 'user-1'] },
      { method: 'eq', args: ['credit_card_id', 'card-1'] },
      { method: 'eq', args: ['year_month', '2026-03'] },
      { method: 'eq', args: ['type', 'invoice_payment'] },
    ]);
  });

  it('propaga erro do delete', async () => {
    mock.enqueue({ error: { message: 'delete falhou' } });

    await expect(deleteInvoicePaymentByCard('user-1', 'card-1', '2026-03')).rejects.toThrow(
      'delete falhou'
    );
  });
});
