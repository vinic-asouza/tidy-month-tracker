import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { Expense } from '@/types/domain';

const formatItemDate = (date: string | null | undefined) => {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
};

interface InvoiceExpensesTableProps {
  expenses: Expense[];
}

export const InvoiceExpensesTable = ({ expenses }: InvoiceExpensesTableProps) => (
  <div className="w-full min-w-0">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b">
          <th className="h-8 px-2 py-1 text-left align-bottom text-xs font-medium text-muted-foreground whitespace-nowrap w-[1%]">
            Data
          </th>
          <th className="h-8 px-2 py-1 text-left align-bottom text-xs font-medium text-muted-foreground whitespace-nowrap w-[1%]">
            Categoria
          </th>
          <th className="h-8 px-2 py-1 text-left align-bottom text-xs font-medium text-muted-foreground">
            Descrição
          </th>
          <th className="h-8 px-2 py-1 text-right align-bottom text-xs font-medium text-muted-foreground whitespace-nowrap w-[1%]">
            Valor
          </th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((expense) => (
          <tr
            key={expense.id}
            className="border-b transition-colors last:border-0 hover:bg-muted/50"
          >
            <td className="px-2 py-2 text-xs text-muted-foreground tabular-nums align-top whitespace-nowrap">
              {formatItemDate(expense.date)}
            </td>
            <td className="px-2 py-2 text-xs text-muted-foreground align-top whitespace-nowrap max-w-[7rem] truncate">
              {expense.category}
            </td>
            <td className="px-2 py-2 text-xs align-top min-w-0">
              <span className="leading-snug break-words">{expense.description}</span>
              {expense.type === 'installment' &&
                expense.currentInstallment != null &&
                expense.totalInstallments != null && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 text-[10px] px-1.5 py-0 h-auto leading-tight align-middle"
                  >
                    {expense.currentInstallment}/{expense.totalInstallments}
                  </Badge>
                )}
            </td>
            <td className="px-2 py-2 text-xs font-semibold tabular-nums text-right align-top whitespace-nowrap">
              {formatCurrency(expense.value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
