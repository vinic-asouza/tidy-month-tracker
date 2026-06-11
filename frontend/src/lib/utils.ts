import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma data para o formato YYYY-MM-DD
 * Aceita Date, string ISO ou string YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date | string): string {
  if (typeof date === 'string') {
    // Se já está no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Se é ISO string, extrai apenas a parte da data
    if (date.includes('T')) {
      return date.split('T')[0];
    }
    // Tenta parsear como Date
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return formatDateToYYYYMMDD(parsed);
    }
    throw new Error(`Formato de data inválido: ${date}`);
  }
  
  // Date object
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata data do item para exibição discreta (dia/mês).
 * Aceita date (YYYY-MM-DD), ISO string ou created_at; usa created_at quando date for null/undefined.
 */
export function formatItemDayMonth(date: string | null | undefined, createdAt?: string | null): string {
  const raw = date ?? (createdAt ? createdAt.split('T')[0] : null);
  if (!raw) return '';
  const [y, m, d] = raw.split(/[-T]/);
  if (!d) return '';
  const day = String(parseInt(d, 10)).padStart(2, '0');
  const month = String(parseInt(m, 10)).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Nome do mês a partir de yearMonth (ex.: "2024-06" → "Junho") */
export function formatYearMonthName(yearMonth: string): string {
  const month = parseInt(yearMonth.split('-')[1], 10);
  return MONTH_NAMES_PT[month - 1] ?? '';
}

/** Título de bloco mensal (ex.: "Resumo de Mês de Junho") */
export function formatMonthBlockTitle(label: string, yearMonth: string, fallback?: string): string {
  const monthName = formatYearMonthName(yearMonth);
  if (!monthName) return fallback ?? label;
  return `${label} de Mês de ${monthName}`;
}

/** Título do bloco de resumo mensal */
export function formatSummaryMonthTitle(yearMonth: string): string {
  return formatMonthBlockTitle('Resumo', yearMonth, 'Resumo do Mês');
}

/** Título do bloco de registros mensais */
export function formatRecordsMonthTitle(yearMonth: string): string {
  return formatMonthBlockTitle('Registros', yearMonth, 'Registros do Mês');
}