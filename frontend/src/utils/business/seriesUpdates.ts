/**
 * Campos de status efetivo que não devem propagar em updates de série (applyToAllMonths).
 */
export function omitEffectiveStatus<T extends Record<string, unknown>>(row: T): T {
  const { paid, received, invested, ...rest } = row;
  return rest as T;
}
