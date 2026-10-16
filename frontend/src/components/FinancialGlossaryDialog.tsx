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
    title: 'Entradas',
    body: 'Entradas = receitas do mês (salário, extras, rendimentos). Marque cada entrada como recebida quando o valor cair.',
  },
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
    body: 'Total de compras no cartão no mês. Ao marcar como paga, a fatura inteira passa a contar como efetivada — não é preciso marcar cada lançamento individualmente. Toque no chip para ver os lançamentos.',
  },
  {
    title: 'Vencimento',
    body: 'Dia informativo do cartão — não altera como a fatura é calculada no app. Quando a fatura está pendente e a data se aproxima, o chip mostra um alerta.',
  },
  {
    title: 'Limite de crédito',
    body: 'Valor opcional que você cadastra no cartão. O app mostra quanto da fatura do mês representa desse limite (% utilizado). Por enquanto é só informativo — em versões futuras poderá alertar ou impedir novos lançamentos.',
  },
  {
    title: 'Saldo do mês',
    body: 'Entradas efetivadas menos gastos efetivados e investimentos efetivados no mês. É o resultado líquido do mês corrente — não representa o saldo acumulado de uma conta bancária. Exemplo: recebeu R$ 5.000, pagou R$ 3.000 e investiu R$ 500 → saldo do mês = +R$ 1.500.',
  },
  {
    title: 'Saldo planejado',
    body: 'Entradas planejadas menos gastos e investimentos planejados no mês — o resultado se tudo fosse executado conforme registrado. Entradas com tag de resgate só entram no efetivado. Use o toggle Planejados no resumo para visualizá-lo.',
  },
  {
    title: 'Aporte',
    body: 'Valor destinado a investimentos no mês. Ao marcar como investido, o aporte passa a contar como efetivado e é descontado do saldo do mês.',
  },
  {
    title: 'Regra 50/30/20',
    body: '50% para necessidades, 30% para desejos e 20% para investimentos — calculada sobre o que você já recebeu no mês, incluindo entradas com tag de resgate.',
  },
  {
    title: 'Não classificado',
    body: 'Gastos efetivados em categorias que ainda não foram mapeadas na regra. Entram no saldo do mês, mas não nas barras de Essenciais ou Estilo de Vida até você mapeá-las.',
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
