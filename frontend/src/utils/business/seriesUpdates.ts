/**
 * Campos que não devem propagar em updates de série (applyToAllMonths)
 * nem ser copiados entre meses na criação — cada mês efetiva com sua carteira.
 */
export function omitPerMonthFields<T extends Record<string, unknown>>(row: T): T {
  const { paid, received, invested, account_id, source_account_id, ...rest } = row;
  return rest as T;
}

/** @deprecated Use omitPerMonthFields */
export const omitEffectiveStatus = omitPerMonthFields;
