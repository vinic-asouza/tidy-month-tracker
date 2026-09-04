/**
 * Normalização de valores/datas/descrições para importação CSV (pt-BR).
 */

/** Remove acentos e lower-case. */
export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

/**
 * Normaliza descrição para match: lower, sem acentos, sem sufixo de parcela/data.
 */
export function normalizeDescription(description: string): string {
  let s = stripAccents(description).toLowerCase().trim();
  s = s.replace(/\bparc(?:ela)?\.?\s*\d+\s*\/\s*\d+\b/gi, ' ');
  s = s.replace(/\b\d{1,2}\s*\/\s*\d{1,2}\b/g, ' ');
  s = s.replace(/\b\d{1,2}\s+de\s+\d{1,2}\b/gi, ' ');
  s = s.replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g, ' ');
  s = s.replace(/[^a-z0-9\s]/gi, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Interpreta valor monetário BR ou US.
 * Retorna valor absoluto e se o sinal original era negativo (crédito/entrada típica).
 */
export function parseMoneyValue(raw: string): { amount: number; isNegative: boolean } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let s = trimmed.replace(/\s/g, '');
  // (1.234,56) → negativo
  let isNegative = false;
  if (/^\(.*\)$/.test(s)) {
    isNegative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith('-') || s.startsWith('+')) {
    if (s.startsWith('-')) isNegative = true;
    s = s.slice(1);
  }
  s = s.replace(/^R\$\s?/i, '');

  // 1.234,56 ou 1,234.56 ou 1234.56 ou 1234,56
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // BR: 1.234,56
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 1,234.56
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    // 1234,56 ou 1,234
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      s = parts[0].replace(/\./g, '') + '.' + parts[1];
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes('.')) {
    const parts = s.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // 1234.56
      s = parts[0].replace(/,/g, '') + '.' + parts[1];
    } else if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      // 1.234 milhar sem decimal
      s = s.replace(/\./g, '');
    }
  }

  const amount = Number(s);
  if (!Number.isFinite(amount)) return null;
  return { amount: Math.abs(amount), isNegative: isNegative || amount < 0 };
}

/**
 * Converte data comum BR/ISO para YYYY-MM-DD.
 *
 * Aceita:
 * - YYYY-MM-DD
 * - DD/MM/YYYY (também com `-` / `.`; ano com 2 ou 4 dígitos)
 * - DD/MM (sem ano) — usa `fallbackYear` (ex.: ano do mês aberto na UI)
 *
 * @param fallbackYear Ano (YYYY) quando o CSV omite o ano. Default: ano civil atual (UTC).
 */
export function parseCsvDate(raw: string, fallbackYear?: number): string | null {
  const t = raw.trim();
  if (!t) return null;

  const yearFallback =
    fallbackYear != null && Number.isFinite(fallbackYear)
      ? Math.trunc(fallbackYear)
      : new Date().getUTCFullYear();

  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return isValidYmd(t) ? t : null;
  }

  // DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const withYear = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (withYear) {
    const day = Number(withYear[1]);
    const month = Number(withYear[2]);
    let year = Number(withYear[3]);
    if (year < 100) year += 2000;
    const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return isValidYmd(ymd) ? ymd : null;
  }

  // DD/MM sem ano (comum em export de fatura/cartão)
  const dayMonth = t.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (dayMonth) {
    const day = Number(dayMonth[1]);
    const month = Number(dayMonth[2]);
    const ymd = `${yearFallback}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return isValidYmd(ymd) ? ymd : null;
  }

  return null;
}

function isValidYmd(ymd: string): boolean {
  const [y, m, d] = ymd.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

export function yearMonthFromDate(ymd: string): string {
  return ymd.slice(0, 7);
}

/**
 * Se a data cai fora do mês da UI e o usuário escolheu “mês da UI”,
 * reposiciona o dia no mês aberto (clampa no último dia do mês).
 */
export function rebaseDateToYearMonth(ymd: string, yearMonth: string): string {
  const day = Number(ymd.slice(8, 10));
  const [y, m] = yearMonth.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const d = Math.min(day || 1, lastDay);
  return `${yearMonth}-${String(d).padStart(2, '0')}`;
}
