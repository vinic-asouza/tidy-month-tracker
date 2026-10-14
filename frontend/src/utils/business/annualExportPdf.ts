/**
 * PDF da visão anual. A lib entra só neste módulo, carregado no clique.
 */

import type { AnnualExportDocument } from '@/utils/business/annualExportDocument';
import type { jsPDF } from 'jspdf';

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

export async function createAnnualExportPdf(document: AnnualExportDocument): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' }) as PdfWithTable;
  const margin = 14;
  let y = 18;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(document.title, margin, y);
  y += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Modo: ${document.modeLabel}`, margin, y);
  y += 5;
  const windowLines = pdf.splitTextToSize(document.windowLabel, 180);
  pdf.text(windowLines, margin, y);
  y += windowLines.length * 5 + 4;
  pdf.setTextColor(15, 23, 42);

  for (const table of document.tables) {
    if (y > 260) {
      pdf.addPage();
      y = 18;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(table.title, margin, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    for (const note of table.notes) {
      const lines = pdf.splitTextToSize(note, 180);
      pdf.text(lines, margin, y);
      y += lines.length * 4 + 2;
    }
    pdf.setTextColor(15, 23, 42);

    if (table.body.length === 0) {
      if (table.emptyMessage) {
        const lines = pdf.splitTextToSize(table.emptyMessage, 180);
        pdf.text(lines, margin, y);
        y += lines.length * 4 + 8;
      }
      continue;
    }

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [table.head],
      body: table.body,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    y = (pdf.lastAutoTable?.finalY ?? y) + 10;
  }

  return pdf;
}

export async function downloadAnnualExportPdf(document: AnnualExportDocument): Promise<void> {
  const pdf = await createAnnualExportPdf(document);
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = `${document.filenameBase}.pdf`;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
