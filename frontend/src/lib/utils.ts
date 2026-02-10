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
 * Formata um valor numérico como moeda brasileira (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}