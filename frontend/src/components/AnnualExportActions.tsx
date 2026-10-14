import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { CreditCard, FinancialRule, MonthData } from '@/types/domain';
import { buildAnnualExportDocument } from '@/utils/business/annualExportDocument';
import { downloadAnnualExportCsv } from '@/utils/business/annualExportCsv';
import type { SummaryViewMode } from '@/utils/business/monthTotals';

interface AnnualExportActionsProps {
  year: number;
  mode: SummaryViewMode;
  yearData: MonthData[];
  creditCards: CreditCard[];
  rule: FinancialRule | null;
  expenseCategories: string[];
  today: Date;
  blocked: boolean;
}

export function AnnualExportActions({
  year,
  mode,
  yearData,
  creditCards,
  rule,
  expenseCategories,
  today,
  blocked,
}: AnnualExportActionsProps) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const disabled = blocked || exportingPdf;

  const buildDocument = () =>
    buildAnnualExportDocument({
      year,
      mode,
      yearData,
      creditCards,
      rule,
      expenseCategories,
      today,
    });

  const exportCsv = () => {
    if (disabled) return;
    try {
      downloadAnnualExportCsv(buildDocument());
    } catch {
      toast.error('Não foi possível exportar o CSV.');
    }
  };

  const exportPdf = async () => {
    if (disabled) return;
    setExportingPdf(true);
    try {
      const document = buildDocument();
      const { downloadAnnualExportPdf } = await import('@/utils/business/annualExportPdf');
      await downloadAnnualExportPdf(document);
    } catch {
      toast.error('Não foi possível exportar o PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={disabled}
        onClick={exportCsv}
        aria-label="Exportar CSV do ano"
      >
        <Download className="h-4 w-4" />
        Exportar CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={disabled}
        onClick={exportPdf}
        aria-label="Exportar PDF do ano"
      >
        {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Exportar PDF
      </Button>
    </div>
  );
}
