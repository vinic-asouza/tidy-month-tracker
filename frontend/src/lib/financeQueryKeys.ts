export const financeKeys = {
  month: (userId: string, yearMonth: string) =>
    ['finance', 'month', userId, yearMonth] as const,
  year: (userId: string, year: number) =>
    ['finance', 'year', userId, year] as const,
  accountHistory: (userId: string, from: string, to: string) =>
    ['finance', 'accountHistory', userId, from, to] as const,
};
