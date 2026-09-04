/**
 * Parse CSV no browser (separador ; ou ,, aspas, BOM).
 * Sem dependência externa — suficiente para o MVP de importação.
 */

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  delimiter: ',' | ';';
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function detectDelimiter(sample: string): ',' | ';' {
  const firstLine = sample.split(/\r?\n/).find((l) => l.trim().length > 0) ?? '';
  let inQuotes = false;
  let commas = 0;
  let semis = 0;
  for (const ch of firstLine) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (ch === ',') commas += 1;
    if (ch === ';') semis += 1;
  }
  return semis > commas ? ';' : ',';
}

function parseLine(line: string, delimiter: ',' | ';'): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Converte texto CSV em headers + linhas de dados.
 * A primeira linha não vazia é tratada como cabeçalho.
 */
export function parseCsvText(text: string): CsvParseResult {
  const cleaned = stripBom(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const delimiter = detectDelimiter(cleaned);
  const rawLines = cleaned.split('\n').filter((l) => l.trim().length > 0);

  if (rawLines.length === 0) {
    return { headers: [], rows: [], delimiter };
  }

  const headers = parseLine(rawLines[0], delimiter);
  const rows = rawLines.slice(1).map((line) => {
    const cells = parseLine(line, delimiter);
    while (cells.length < headers.length) cells.push('');
    return cells.slice(0, Math.max(headers.length, cells.length));
  });

  return { headers, rows, delimiter };
}

export type CsvFieldKey = 'date' | 'value' | 'description' | 'installment' | 'ignore';

export interface CsvColumnMapping {
  /** Índice da coluna no CSV → campo Finto (ou ignore) */
  [columnIndex: number]: CsvFieldKey;
}

export interface MappedCsvRow {
  dateRaw: string;
  valueRaw: string;
  descriptionRaw: string;
  /** Coluna opcional de parcela (ex.: `1/2`, `Única`) */
  installmentRaw?: string;
  sourceIndex: number;
}

/**
 * Aplica mapeamento de colunas às linhas parseadas.
 * Exige pelo menos date, value e description mapeados.
 */
export function applyColumnMapping(
  rows: string[][],
  mapping: CsvColumnMapping
): MappedCsvRow[] {
  const entries = Object.entries(mapping).map(([idx, key]) => [Number(idx), key] as const);
  const dateIdx = entries.find(([, k]) => k === 'date')?.[0];
  const valueIdx = entries.find(([, k]) => k === 'value')?.[0];
  const descIdx = entries.find(([, k]) => k === 'description')?.[0];
  const installmentIdx = entries.find(([, k]) => k === 'installment')?.[0];

  if (dateIdx == null || valueIdx == null || descIdx == null) {
    throw new Error('Mapeamento incompleto: data, valor e descrição são obrigatórios.');
  }

  return rows.map((cells, sourceIndex) => ({
    sourceIndex,
    dateRaw: cells[dateIdx] ?? '',
    valueRaw: cells[valueIdx] ?? '',
    descriptionRaw: cells[descIdx] ?? '',
    installmentRaw:
      installmentIdx != null ? (cells[installmentIdx] ?? '').trim() : undefined,
  }));
}

/**
 * Sugere mapeamento a partir dos headers (pt-BR / EN comuns em fatura/extrato).
 * Nubank: date/title/amount · C6: Data / Descrição / Parcela / Valor (em R$).
 */
export function guessColumnMapping(headers: string[]): CsvColumnMapping {
  const mapping: CsvColumnMapping = {};
  headers.forEach((h, i) => {
    const n = h.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    if (/data|date/.test(n)) mapping[i] = 'date';
    else if (/us\$|usd|dolar/.test(n)) mapping[i] = 'ignore';
    else if (/^(parcela|parcelas|installment)$/.test(n) || /^parcela\b/.test(n)) {
      mapping[i] = 'installment';
    } else if (
      /valor.*r\$|r\$.*valor|valor \(em r|value|amount|quantia|(^| )valor($| )/.test(n)
    ) {
      mapping[i] = 'value';
    } else if (
      /descric|description|desc|historico|memo|estabelecimento|lancamento|\btitle\b|\btitulo\b/.test(
        n
      )
    ) {
      mapping[i] = 'description';
    } else mapping[i] = 'ignore';
  });
  return mapping;
}
