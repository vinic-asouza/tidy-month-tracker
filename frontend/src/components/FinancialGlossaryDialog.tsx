import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

const GLOSSARY_SECTIONS = [
  {
    title: 'Planejado',
    body: 'Soma de todos os lançamentos do mês, independentemente de estarem marcados como recebidos, pagos ou investidos.',
  },
  {
    title: 'Efetivado',
    body: 'Valores que já entraram, saíram ou foram investidos de fato. Gastos em cartão só contam quando a fatura está marcada como paga.',
  },
  {
    title: 'Fatura',
    body: 'Total de compras no cartão no mês. O pagamento é registrado marcando a fatura como paga, não item a item.',
  },
  {
    title: 'Saldo em caixa',
    body: 'Entradas efetivadas menos gastos efetivados e investimentos efetivados no mês.',
  },
  {
    title: 'Regra 50/30/20',
    body: '50% para necessidades, 30% para desejos e 20% para investimentos — calculada sobre o que você já recebeu no mês.',
  },
] as const;

interface FinancialGlossaryDialogProps {
  trigger?: React.ReactNode;
}

export const FinancialGlossaryDialog = ({ trigger }: FinancialGlossaryDialogProps) => (
  <Dialog>
    <DialogTrigger asChild>
      {trigger ?? (
        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5 mr-1" />
          Como lemos seus números
        </Button>
      )}
    </DialogTrigger>
    <DialogContent className="rounded-lg max-w-md max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Como lemos seus números</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        {GLOSSARY_SECTIONS.map(({ title, body }) => (
          <div key={title}>
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{body}</p>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);
