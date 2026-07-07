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
    body: 'Entradas = receitas do mês (salário, extras, rendimentos). Resgates de investimentos geram entrada automática já recebida ao registrar em Carteiras.',
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
    body: 'Total de compras no cartão no mês. Ao marcar como paga, você escolhe a carteira pagadora — o débito é único pelo total da fatura, não por lançamento individual. Toque no chip para ver os lançamentos.',
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
    body: 'Entradas efetivadas (incluindo resgates automáticos em Entradas) menos gastos efetivados e investimentos efetivados no mês. É o resultado líquido do mês corrente — não representa o saldo acumulado de uma conta bancária. Exemplo: recebeu R$ 5.000, pagou R$ 3.000 e investiu R$ 500 → saldo do mês = +R$ 1.500.',
  },
  {
    title: 'Saldo planejado',
    body: 'Entradas planejadas menos gastos e investimentos planejados no mês — o resultado se tudo fosse executado conforme registrado. Não inclui resgates (operações reais de carteira). Use o toggle Planejados no resumo para visualizá-lo.',
  },
  {
    title: 'Saldo estimado na carteira',
    body: 'Saldo declarado ou estimado do mês anterior, mais a variação efetiva acumulada na carteira. Não é o mesmo que o saldo do mês no resumo. Exemplo: você declarou R$ 2.000 na corrente e aportou R$ 300 este mês → saldo estimado ≈ R$ 2.300. Melhora com declarações periódicas e pode divergir do extrato bancário.',
  },
  {
    title: 'Por que os saldos são diferentes?',
    body: 'O saldo do mês mostra o resultado líquido deste período (fluxo). Os chips mostram onde o dinheiro está (posição). Some liquidez + posição + Saldo Livre para ver seu patrimônio estimado. Os três leituras são corretas — medem coisas diferentes.',
  },
  {
    title: 'Regra 50/30/20',
    body: '50% para necessidades, 30% para desejos e 20% para investimentos — calculada sobre o que você já recebeu no mês, incluindo resgates de investimentos.',
  },
  {
    title: 'Não classificado',
    body: 'Gastos efetivados em categorias que ainda não foram mapeadas na regra. Entram no saldo do mês, mas não nas barras de Essenciais ou Estilo de Vida até você mapeá-las.',
  },
  {
    title: 'Saldo Livre',
    body: 'Saldo estimado cumulativo de movimentos efetivados sem carteira vinculada — e destino de resgates registrados em Carteiras. O chip aparece mesmo sem carteiras cadastradas. Ao efetivar, você confirma o envio para o Saldo Livre ou escolhe uma carteira específica.',
  },
  {
    title: 'Carteira de movimentação',
    body: 'Conta de liquidez para entradas, gastos e pagamento de faturas. O chip mostra saldo disponível estimado (entrou − saiu − enviado para investimentos). A reserva de emergência costuma ficar aqui, separada de investimentos de longo prazo.',
  },
  {
    title: 'Carteira de investimentos',
    body: 'Custódia da posição aplicada. Recebe aportes vindos de carteiras de movimentação ou Saldo Livre. O chip mostra posição acumulada (aportado − resgatado).',
  },
  {
    title: 'Carteira na efetivação',
    body: 'Entradas e gastos vinculam carteira de movimentação ou Saldo Livre ao efetivar. Investimentos exigem origem (movimentação ou Saldo Livre) e destino (investimentos) no dialog de aporte. Gastos em cartão seguem o fluxo da fatura.',
  },
  {
    title: 'Aporte (origem e destino)',
    body: 'Ao marcar investido, você informa de qual liquidez saiu o valor (carteira de movimentação ou Saldo Livre) e em qual carteira de investimentos registrar a posição. A liquidez diminui na origem; a posição aumenta no destino. O resumo do mês desconta o aporte.',
  },
  {
    title: 'Resgate',
    body: 'Retirada da carteira de investimentos para uma carteira de movimentação ou Saldo Livre. Cria automaticamente uma entrada em Entradas (tag Resgate de investimentos), já recebida, e atualiza resumo e regra 50/30/20.',
  },
  {
    title: 'Transferência',
    body: 'Movimentação entre carteiras de movimentação ou Saldo Livre. Não altera o resumo do mês nem a regra 50/30/20. Para aplicar dinheiro, use Investimentos (origem → destino).',
  },
  {
    title: 'Reserva de emergência',
    body: 'Dinheiro de fácil acesso para imprevistos. No Finto, costuma ficar em carteira de movimentação (poupança ou conta corrente), separada da carteira de investimentos de longo prazo.',
  },
  {
    title: 'Exemplo: um mês com aporte',
    body: 'Salário R$ 5.000 na corrente, aluguel R$ 1.000 pago, aporte R$ 2.000 para investimentos: resumo do mês ≈ +R$ 2.000 (fluxo); corrente ≈ R$ 2.000 (liquidez); investimentos ≈ R$ 2.000 (posição); patrimônio estimado ≈ R$ 4.000. O resumo mostra o fluxo; os chips mostram onde o dinheiro está.',
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
