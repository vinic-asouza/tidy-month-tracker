import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const EffectiveTotalsLegend = ({ className }: { className?: string }) => (
  <Alert className={className ?? 'bg-muted/50 border-border py-2.5'}>
    <Info className="h-4 w-4" />
    <AlertDescription className="text-xs sm:text-[13px] text-muted-foreground">
      Valores efetivados: apenas itens marcados como recebido, pago ou investido (inclui
      faturas de cartão pagas).
    </AlertDescription>
  </Alert>
);
