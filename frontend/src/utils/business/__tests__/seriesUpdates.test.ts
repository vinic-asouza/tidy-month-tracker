import { describe, expect, it } from 'vitest';
import { omitPerMonthFields } from '../seriesUpdates';

describe('omitPerMonthFields', () => {
  it('remove paid, received e invested do objeto', () => {
    expect(
      omitPerMonthFields({
        description: 'Aluguel',
        value: 1000,
        paid: true,
        received: true,
        invested: true,
      })
    ).toEqual({
      description: 'Aluguel',
      value: 1000,
    });
  });

  it('retorna objeto inalterado quando não há campos por mês', () => {
    const row = { category: 'Moradia', description: 'Teste' };
    expect(omitPerMonthFields(row)).toEqual(row);
  });
});
