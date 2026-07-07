import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { WalletMovementKind, WalletMovementRow } from '@/utils/business/accounts';

const formatItemDate = (date: string | null) => {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
};

const kindLabel: Record<WalletMovementKind, string> = {
  income: 'Entrada',
  expense: 'Gasto',
  investment: 'Aporte',
  withdrawal: 'Resgate',
  transfer_in: 'Transferência',
  transfer_out: 'Transferência',
  invoice_payment: 'Fatura',
};

const kindBadgeClass: Record<WalletMovementKind, string> = {
  income: 'bg-income-light text-income',
  expense: 'bg-expense-light text-expense',
  investment: 'bg-investment-light text-investment',
  withdrawal: 'bg-primary/10 text-primary',
  transfer_in: 'bg-income-light text-income',
  transfer_out: 'bg-expense-light text-expense',
  invoice_payment: 'bg-expense-light text-expense',
};

interface WalletMovementsTableProps {
  rows: WalletMovementRow[];
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export const WalletMovementsTable = ({
  rows,
  onDelete,
  isDeleting = false,
}: WalletMovementsTableProps) => (
  <div className="w-full min-w-0">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b">
          <th className="h-8 px-2 py-1 text-left align-bottom text-xs font-medium text-muted-foreground whitespace-nowrap w-[1%]">
            Data
          </th>
          <th className="h-8 px-2 py-1 text-left align-bottom text-xs font-medium text-muted-foreground whitespace-nowrap w-[1%]">
            Tipo
          </th>
          <th className="h-8 px-2 py-1 text-left align-bottom text-xs font-medium text-muted-foreground">
            Descrição
          </th>
          <th className="h-8 px-2 py-1 text-right align-bottom text-xs font-medium text-muted-foreground whitespace-nowrap w-[1%]">
            Valor
          </th>
          {onDelete && (
            <th className="h-8 px-1 py-1 align-bottom w-[1%]" aria-hidden />
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={`${row.kind}-${row.id}`}
            className="border-b transition-colors last:border-0 hover:bg-muted/50"
          >
            <td className="px-2 py-2 text-xs text-muted-foreground tabular-nums align-top whitespace-nowrap">
              {formatItemDate(row.date)}
            </td>
            <td className="px-2 py-2 align-top whitespace-nowrap">
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0.5 h-auto leading-tight whitespace-nowrap shrink-0 ${kindBadgeClass[row.kind]}`}
              >
                {kindLabel[row.kind]}
              </Badge>
            </td>
            <td className="px-2 py-2 text-xs align-top min-w-0">
              <span className="leading-snug break-words">
                {row.description}
                {row.detail && (
                  <span className="text-muted-foreground"> · {row.detail}</span>
                )}
              </span>
            </td>
            <td className="px-2 py-2 text-xs font-semibold tabular-nums text-right align-top whitespace-nowrap">
              {formatCurrency(row.value)}
            </td>
            {onDelete && (
              <td className="px-1 py-2 align-top whitespace-nowrap">
                {row.deletable ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md hover:bg-destructive/10"
                    onClick={() => onDelete(row.id)}
                    disabled={isDeleting}
                    aria-label="Excluir operação"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                ) : null}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
