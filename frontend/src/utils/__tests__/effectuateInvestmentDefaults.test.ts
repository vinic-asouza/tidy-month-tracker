import { beforeEach, describe, expect, it } from 'vitest';
import type { Account } from '@/types/domain';
import {
  getDefaultEffectuateInvestmentAccounts,
  persistEffectuateInvestmentAccounts,
} from '../effectuateInvestmentDefaults';
import { EFFECTUATE_WALLET_FREE } from '../effectuateWalletDefaults';

const movement: Account = {
  id: 'mov-1',
  name: 'Nubank',
  type: 'checking',
  role: 'movement',
  color: null,
  displayOrder: 0,
};

const investment: Account = {
  id: 'inv-1',
  name: 'Corretora',
  type: 'investment',
  role: 'investment',
  color: null,
  displayOrder: 1,
};

const accounts = [movement, investment];

describe('effectuateInvestmentDefaults', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna primeira carteira de cada papel quando não há preferência', () => {
    expect(getDefaultEffectuateInvestmentAccounts(accounts)).toEqual({
      sourceId: 'mov-1',
      destId: 'inv-1',
    });
  });

  it('retorna Saldo Livre como origem quando não há carteiras de movimentação', () => {
    expect(getDefaultEffectuateInvestmentAccounts([investment])).toEqual({
      sourceId: EFFECTUATE_WALLET_FREE,
      destId: 'inv-1',
    });
  });

  it('retorna Saldo Livre quando não há carteiras', () => {
    expect(getDefaultEffectuateInvestmentAccounts([])).toEqual({
      sourceId: EFFECTUATE_WALLET_FREE,
      destId: '',
    });
  });

  it('persiste e recupera origem e destino', () => {
    persistEffectuateInvestmentAccounts('mov-1', 'inv-1');
    expect(getDefaultEffectuateInvestmentAccounts(accounts)).toEqual({
      sourceId: 'mov-1',
      destId: 'inv-1',
    });
  });

  it('persiste e recupera Saldo Livre como origem', () => {
    persistEffectuateInvestmentAccounts(EFFECTUATE_WALLET_FREE, 'inv-1');
    expect(getDefaultEffectuateInvestmentAccounts(accounts)).toEqual({
      sourceId: EFFECTUATE_WALLET_FREE,
      destId: 'inv-1',
    });
  });

  it('ignora preferência salva se carteira não existir mais', () => {
    persistEffectuateInvestmentAccounts('gone', 'inv-1');
    expect(getDefaultEffectuateInvestmentAccounts(accounts)).toEqual({
      sourceId: 'mov-1',
      destId: 'inv-1',
    });
  });
});
