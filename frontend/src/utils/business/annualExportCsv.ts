/**
 * CSV da visão anual. UTF-8 com BOM e separador `;` para planilha em português.
 */

import type { AnnualExportDocument } from '@/utils/business/annualExportDocument';

function escapeCell(value: string): string {
  if (/[;"\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function serializeAnnualExportCsv(document: AnnualExportDocument): string {
  const lines = [
    document.title,
    ['Modo', document.modeLabel].map(escapeCell).join(';'),
    ['Janela', document.windowLabel].map(escapeCell).join(';'),
  ];

  for (const table of document.tables) {
    lines.push('');
    lines.push(table.title);
    for (const note of table.notes) lines.push(escapeCell(note));
    if (table.body.length === 0 && table.emptyMessage) {
      lines.push(escapeCell(table.emptyMessage));
      continue;
    }
    if (table.head.length > 0) lines.push(table.head.map(escapeCell).join(';'));
    for (const row of table.body) lines.push(row.map(escapeCell).join(';'));
  }

  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function downloadAnnualExportCsv(document: AnnualExportDocument): void {
  const csv = serializeAnnualExportCsv(document);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = `${document.filenameBase}.csv`;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
