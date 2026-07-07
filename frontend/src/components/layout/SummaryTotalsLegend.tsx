import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SummaryViewMode } from '@/utils/business/monthTotals';

const LEGEND_TEXT: Record<SummaryViewMode, string> = {
  effective:
    'Valores efetivados: apenas itens marcados como recebido, pago ou investido (inclui faturas de cartão pagas).',
  planned:
    'Valores planejados: soma de todos os lançamentos do mês, independente de status.',
};

interface SummaryTotalsLegendProps {
  mode: SummaryViewMode;
  className?: string;
}

export const SummaryTotalsLegend = ({ mode, className }: SummaryTotalsLegendProps) => (
  <Alert className={className ?? 'bg-muted/50 border-border py-2.5'}>
    <Info className="h-4 w-4" />
    <AlertDescription className="text-xs sm:text-[13px] text-muted-foreground">
      {LEGEND_TEXT[mode]}
    </AlertDescription>
  </Alert>
);
