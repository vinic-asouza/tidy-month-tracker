/**
 * Campos que não devem propagar em updates de série (applyToAllMonths)
 * nem ser copiados entre meses na criação — cada mês efetiva individualmente.
 */
export function omitPerMonthFields<T extends Record<string, unknown>>(row: T): T {
  const { paid, received, invested, ...rest } = row;
  return rest as T;
}

/** @deprecated Use omitPerMonthFields */
export const omitEffectiveStatus = omitPerMonthFields;
