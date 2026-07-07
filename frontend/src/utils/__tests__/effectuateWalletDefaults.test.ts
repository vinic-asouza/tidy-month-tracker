import { describe, expect, it, beforeEach } from 'vitest';
import {
  EFFECTUATE_WALLET_FREE,
  getDefaultEffectuateAccountId,
  persistEffectuateAccountId,
  toEffectuateAccountId,
} from '../effectuateWalletDefaults';
import type { Account } from '@/types/domain';

const accounts: Account[] = [
  { id: 'acc-1', name: 'Corrente', type: 'checking', color: '#000' },
  { id: 'acc-2', name: 'Poupança', type: 'savings', color: '#111' },
];

describe('effectuateWalletDefaults', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna primeira carteira quando não há preferência salva', () => {
    expect(getDefaultEffectuateAccountId('income', accounts)).toBe('acc-1');
  });

  it('retorna Saldo Livre quando não há carteiras', () => {
    expect(getDefaultEffectuateAccountId('expense', [])).toBe(EFFECTUATE_WALLET_FREE);
  });

  it('persiste e recupera última carteira por contexto', () => {
    persistEffectuateAccountId('expense', 'acc-2', 'Pix');
    expect(getDefaultEffectuateAccountId('expense', accounts, 'Pix')).toBe('acc-2');
  });

  it('persiste Saldo Livre', () => {
    persistEffectuateAccountId('income', null);
    expect(getDefaultEffectuateAccountId('income', accounts)).toBe(EFFECTUATE_WALLET_FREE);
  });

  it('converte seleção para accountId', () => {
    expect(toEffectuateAccountId(EFFECTUATE_WALLET_FREE)).toBeNull();
    expect(toEffectuateAccountId('acc-1')).toBe('acc-1');
  });
});
