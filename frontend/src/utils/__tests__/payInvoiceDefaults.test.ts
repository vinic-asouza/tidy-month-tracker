import { describe, expect, it, beforeEach } from 'vitest';
import { getDefaultInvoicePaymentAccountId } from '@/components/PayInvoiceDialog';
import { EFFECTUATE_WALLET_FREE } from '../effectuateWalletDefaults';
import type { Account } from '@/types/domain';

const movementAccounts: Account[] = [
  { id: 'acc-1', name: 'Corrente', type: 'checking', color: '#000' },
  { id: 'acc-2', name: 'Poupança', type: 'savings', color: '#111' },
];

describe('getDefaultInvoicePaymentAccountId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna Saldo Livre quando não há carteiras de movimentação', () => {
    expect(getDefaultInvoicePaymentAccountId('card-1', [])).toBe(EFFECTUATE_WALLET_FREE);
  });

  it('retorna primeira carteira de movimentação por padrão', () => {
    expect(getDefaultInvoicePaymentAccountId('card-1', movementAccounts)).toBe('acc-1');
  });

  it('restaura Saldo Livre do localStorage por cartão', () => {
    localStorage.setItem('invoicePaymentAccount:card-1', EFFECTUATE_WALLET_FREE);
    expect(getDefaultInvoicePaymentAccountId('card-1', movementAccounts)).toBe(
      EFFECTUATE_WALLET_FREE
    );
  });

  it('restaura carteira salva do localStorage por cartão', () => {
    localStorage.setItem('invoicePaymentAccount:card-2', 'acc-2');
    expect(getDefaultInvoicePaymentAccountId('card-2', movementAccounts)).toBe('acc-2');
  });
});
