/**
 * Detecção heurística de parcelas em descrições de extrato/fatura BR.
 */

export interface DetectedInstallment {
  current: number;
  total: number;
}

const PATTERNS: RegExp[] = [
  /\bparc(?:ela)?\.?\s*(\d{1,2})\s*\/\s*(\d{1,2})\b/i,
  /\b(\d{1,2})\s*\/\s*(\d{1,2})\b/,
  /\b(\d{1,2})\s+de\s+(\d{1,2})\b/i,
];

/**
 * Tenta extrair parcela atual/total da descrição.
 * Descarta pares inválidos (current < 1, total < 2, current > total, total > 48).
 */
export function detectInstallment(description: string): DetectedInstallment | null {
  for (const re of PATTERNS) {
    const m = description.match(re);
    if (!m) continue;
    const current = Number(m[1]);
    const total = Number(m[2]);
    if (
      Number.isInteger(current) &&
      Number.isInteger(total) &&
      current >= 1 &&
      total >= 2 &&
      current <= total &&
      total <= 48
    ) {
      return { current, total };
    }
  }
  return null;
}
