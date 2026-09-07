export const financeKeys = {
  month: (userId: string, yearMonth: string) =>
    ['finance', 'month', userId, yearMonth] as const,
  year: (userId: string, year: number) =>
    ['finance', 'year', userId, year] as const,
  accountHistory: (userId: string, from: string, to: string) =>
    ['finance', 'accountHistory', userId, from, to] as const,
};

/** Regra financeira: cache único compartilhado entre visão mensal e anual. */
export const financialRuleKeys = {
  detail: (userId: string) => ['financial-rule', userId] as const,
};
