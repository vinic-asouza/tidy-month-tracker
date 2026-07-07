export function comparePendingThenDate<T extends { createdAt?: string }>(
  a: T,
  b: T,
  isPending: (item: T) => boolean,
  getSortDate: (item: T) => string
): number {
  const aPending = isPending(a);
  const bPending = isPending(b);
  if (aPending !== bPending) return aPending ? -1 : 1;

  const dateCmp = getSortDate(b).localeCompare(getSortDate(a));
  if (dateCmp !== 0) return dateCmp;

  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
}
