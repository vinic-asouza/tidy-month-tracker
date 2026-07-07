import { describe, expect, it } from 'vitest';
import { resolveAccountDisplayName, resolveExpenseWalletLabel } from '../accountLabels';
import type { Account } from '@/types/domain';

const accounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Nubank',
    type: 'checking',
    role: 'movement',
    color: null,
    displayOrder: 0,
  },
];

describe('resolveAccountDisplayName', () => {
  it('retorna Saldo Livre quando accountId é nulo', () => {
    expect(resolveAccountDisplayName(null, accounts)).toBe('Saldo Livre');
    expect(resolveAccountDisplayName(undefined, accounts)).toBe('Saldo Livre');
  });

  it('retorna nome da carteira quando encontrada', () => {
    expect(resolveAccountDisplayName('acc-1', accounts)).toBe('Nubank');
  });

  it('retorna traço quando id desconhecido', () => {
    expect(resolveAccountDisplayName('missing', accounts)).toBe('—');
  });
});

describe('resolveExpenseWalletLabel', () => {
  it('retorna null quando gasto não está pago', () => {
    expect(
      resolveExpenseWalletLabel(
        { paid: false, paymentMethod: 'Pix' },
        {
          isLinkedToCard: false,
          isCardPaid: false,
          creditCardId: null,
          accounts,
        }
      )
    ).toBeNull();
  });

  it('retorna carteira do gasto direto quando pago', () => {
    expect(
      resolveExpenseWalletLabel(
        { paid: true, accountId: 'acc-1', paymentMethod: 'Pix' },
        {
          isLinkedToCard: false,
          isCardPaid: false,
          creditCardId: null,
          accounts,
        }
      )
    ).toBe('Nubank');
  });

  it('retorna carteira da fatura quando cartão está pago', () => {
    expect(
      resolveExpenseWalletLabel(
        { paid: false, paymentMethod: 'Visa' },
        {
          isLinkedToCard: true,
          isCardPaid: true,
          creditCardId: 'card-1',
          accounts,
          accountOperations: [
            {
              id: 'op-1',
              type: 'invoice_payment',
              sourceAccountId: 'acc-1',
              destinationAccountId: null,
              transferGroupId: null,
              creditCardId: 'card-1',
              amount: 100,
              yearMonth: '2026-07',
              operationDate: '2026-07-10',
              description: null,
            },
          ],
        }
      )
    ).toBe('Nubank');
  });
});
