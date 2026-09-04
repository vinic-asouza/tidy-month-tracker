/**
 * Detecção heurística de parcelas em descrições / células de extrato/fatura BR.
 */

export interface DetectedInstallment {
  current: number;
  total: number;
}

interface Candidate extends DetectedInstallment {
  index: number;
  /** parc/pcl/de/N/M explícito > Nx genérico */
  rank: number;
}

/**
 * Padrões N/atual / total (rank alto).
 * Aceita sufixo opcional `x`/`X` (ex.: `03/12x`).
 */
const PAIR_PATTERNS: { re: RegExp; rank: number }[] = [
  {
    // PARC / PARCELA / Parc. 03/12 ou 03/12x
    re: /\bparc(?:ela)?\.?\s*(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*x?\b/gi,
    rank: 3,
  },
  {
    // PCL 2/8
    re: /\bpcl\.?\s*(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*x?\b/gi,
    rank: 3,
  },
  {
    // 2 de 6 / 02 de 12
    re: /\b(\d{1,2})\s+de\s+(\d{1,2})\b/gi,
    rank: 3,
  },
  {
    // 03/12, 03/12x, 3-12
    re: /\b(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*x?\b/gi,
    rank: 2,
  },
];

/**
 * Padrão Santander-like: só o total (`10x`, `10x R$ 99,90`).
 * Sem parcela atual → assume current = 1.
 * Não usar se já houver par N/M (evita `03/12x` virar só `12x`).
 */
const TIMES_PATTERN =
  /\b(\d{1,2})\s*x\b(?:\s*(?:de\s+)?r\$?\s*[\d.]+(?:,\d{2})?)?/gi;

function isValidPair(current: number, total: number): boolean {
  return (
    Number.isInteger(current) &&
    Number.isInteger(total) &&
    current >= 1 &&
    total >= 2 &&
    current <= total &&
    total <= 48
  );
}

function isValidTotalOnly(total: number): boolean {
  return Number.isInteger(total) && total >= 2 && total <= 48;
}

/**
 * Tenta extrair parcela atual/total da descrição ou célula.
 * Considera **todos** os matches válidos (não para no primeiro inválido).
 * Prefere N/M explícito; `Nx` só se não houver par (current=1, total=N).
 */
export function detectInstallment(description: string): DetectedInstallment | null {
  const text = description ?? '';
  if (!text.trim()) return null;

  const candidates: Candidate[] = [];

  for (const { re, rank } of PAIR_PATTERNS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const current = Number(m[1]);
      const total = Number(m[2]);
      if (!isValidPair(current, total)) continue;
      candidates.push({
        current,
        total,
        index: m.index ?? 0,
        rank,
      });
    }
  }

  if (candidates.length === 0) {
    TIMES_PATTERN.lastIndex = 0;
    for (const m of text.matchAll(TIMES_PATTERN)) {
      const total = Number(m[1]);
      if (!isValidTotalOnly(total)) continue;
      candidates.push({
        current: 1,
        total,
        index: m.index ?? 0,
        rank: 1,
      });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.rank !== b.rank) return b.rank - a.rank;
    return b.index - a.index;
  });

  const best = candidates[0];
  return { current: best.current, total: best.total };
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

/**
 * Célula de fatura = compra à vista / sem série
 * (C6 `Única`, Santander `À vista` / `1x`).
 */
export function isUniqueInstallmentCell(raw: string): boolean {
  const n = stripAccents(raw).toLowerCase().trim();
  return /^(unica|a\s*vista|avista|1\/1|1\s*x)$/.test(n);
}

/**
 * Resolve parcela a partir da coluna dedicada (preferencial) ou da descrição.
 * Coluna à vista / vazia com significado de à vista → sem parcelamento.
 */
export function resolveInstallmentFromCsv(
  description: string,
  installmentRaw?: string
): DetectedInstallment | null {
  if (installmentRaw != null) {
    const cell = installmentRaw.trim();
    if (!cell) {
      return detectInstallment(description);
    }
    if (isUniqueInstallmentCell(cell)) {
      return null;
    }
    return detectInstallment(cell) ?? detectInstallment(description);
  }
  return detectInstallment(description);
}
