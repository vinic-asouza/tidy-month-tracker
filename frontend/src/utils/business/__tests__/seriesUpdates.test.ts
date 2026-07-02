import { describe, expect, it } from 'vitest';
import { omitEffectiveStatus } from '../seriesUpdates';

describe('omitEffectiveStatus', () => {
  it('remove paid, received e invested do objeto', () => {
    expect(
      omitEffectiveStatus({
        description: 'Aluguel',
        value: 1000,
        paid: true,
        received: true,
        invested: true,
        account_id: 'acc-1',
      })
    ).toEqual({
      description: 'Aluguel',
      value: 1000,
      account_id: 'acc-1',
    });
  });

  it('retorna objeto inalterado quando não há campos de status', () => {
    const row = { category: 'Moradia', account_id: null };
    expect(omitEffectiveStatus(row)).toEqual(row);
  });
});
