import { CreditCard, Loader2, PiggyBank, Sparkles, Tags } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { SectionSurface } from '@/components/layout/SectionSurface';
import { cn, formatCurrency } from '@/lib/utils';
import type { CreditCard as CreditCardType, MonthData, WishItem } from '@/types/domain';
import {
  buildAnnualExpenseBreakdown,
  buildAnnualInvestmentRows,
  sumCardPaymentRows,
  type AnnualMoneyRow,
} from '@/utils/business/annualBreakdown';
import type { SummaryViewMode } from '@/utils/business/monthTotals';
import {
  formatShortYearMonth,
  groupWishesForYear,
  WISH_URGENCY_LABELS,
} from '@/utils/business/wishItems';

interface AnnualYearSectionsProps {
  yearData: MonthData[];
  currentYear: number;
  creditCards: CreditCardType[];
  viewMode: SummaryViewMode;
  monthCount: number;
  averageWindowLabel: string;
  wishes: WishItem[];
  wishesLoading?: boolean;
}

type MoneyTone = 'expense' | 'credit' | 'investment';

const toneValueClass: Record<MoneyTone, string> = {
  expense: 'text-expense',
  credit: 'text-credit',
  investment: 'text-investment',
};

const toneBarClass: Record<MoneyTone, string> = {
  expense: 'bg-expense',
  credit: 'bg-credit',
  investment: 'bg-investment',
};

const toneRankClass: Record<MoneyTone, string> = {
  expense: 'bg-expense text-expense-foreground',
  credit: 'bg-credit text-credit-foreground',
  investment: 'bg-investment text-investment-foreground',
};

function formatAverage(average: number | null) {
  if (average == null) return '—';
  return formatCurrency(average);
}

function EmptyLine({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function SubBlock({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/25 p-3 sm:p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function RankMark({ rank, tone }: { rank: number; tone?: MoneyTone }) {
  const highlighted = tone != null && rank <= 3;
  return (
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
        highlighted ? toneRankClass[tone] : 'bg-muted'
      )}
    >
      {rank}
    </span>
  );
}

function MoneyFigures({ row, tone }: { row: AnnualMoneyRow; tone: MoneyTone }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Média</p>
      <p className={cn('text-lg font-semibold tabular-nums leading-tight', toneValueClass[tone])}>
        {row.average == null ? (
          <span title="Nenhum mês com lançamentos neste período">—</span>
        ) : (
          formatAverage(row.average)
        )}
      </p>
      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
        Total {formatCurrency(row.total)}
      </p>
    </div>
  );
}

function VerticalColumns({ items }: { items: ReactNode[] }) {
  const splitAt = Math.ceil(items.length / 2);
  const left = items.slice(0, splitAt);
  const right = items.slice(splitAt);

  if (right.length === 0) {
    return <ul className="grid content-start gap-2">{left}</ul>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <ul className="grid content-start gap-2">{left}</ul>
      <ul className="grid content-start gap-2">{right}</ul>
    </div>
  );
}

function MoneyRows({ rows, tone }: { rows: AnnualMoneyRow[]; tone: MoneyTone }) {
  const sectionTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <VerticalColumns
      items={rows.map((row, index) => {
        const share = sectionTotal > 0 ? Math.min(100, (row.total / sectionTotal) * 100) : 0;
        return (
          <li key={row.key} className="rounded-lg border border-border/60 bg-card px-3 py-3">
            <div className="flex items-center gap-3">
              <RankMark rank={index + 1} tone={tone} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  <span>{row.label}</span>
                  {row.isCard && (
                    <Badge variant="secondary" className="font-normal">
                      Cartão
                    </Badge>
                  )}
                </div>
                <div
                  className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
                  title={`${Math.round(share)}% do total da seção`}
                >
                  <div
                    className={cn('h-full rounded-full', toneBarClass[tone])}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <MoneyFigures row={row} tone={tone} />
              </div>
            </div>
          </li>
        );
      })}
    />
  );
}

function CardPaymentsTotal({ rows }: { rows: AnnualMoneyRow[] }) {
  const total = sumCardPaymentRows(rows);
  if (!total) return null;

  return (
    <SubBlock title="Cartões" hint="Soma dos métodos marcados como cartão.">
      <div className="rounded-md border border-border/50 bg-card px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-semibold tracking-tight">Total</p>
          <MoneyFigures row={total} tone="credit" />
        </div>
      </div>
    </SubBlock>
  );
}

function TypeBreakdown({ rows }: { rows: AnnualMoneyRow[] }) {
  if (rows.length === 0) return null;

  return (
    <SubBlock
      title="Por tipo"
      hint="Os mesmos gastos, separados em fixo, parcelado e variável."
    >
      <VerticalColumns
        items={rows.map((row, index) => (
          <li key={row.key} className="rounded-md border border-border/50 bg-card px-3 py-3">
            <div className="flex items-center gap-3">
              <RankMark rank={index + 1} />
              <p className="min-w-0 flex-1 text-lg font-semibold tracking-tight">{row.label}</p>
              <div className="shrink-0 text-right">
                <MoneyFigures row={row} tone="expense" />
              </div>
            </div>
          </li>
        ))}
      />
    </SubBlock>
  );
}

function WishGroup({ title, wishes }: { title: string; wishes: WishItem[] }) {
  if (wishes.length === 0) return null;

  return (
    <SubBlock title={`${title} · ${wishes.length}`}>
      <VerticalColumns
        items={wishes.map((wish) => (
          <li key={wish.id} className="rounded-md border border-border/50 bg-card px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 font-medium">{wish.description}</p>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatCurrency(wish.value)}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {WISH_URGENCY_LABELS[wish.urgency]} · Prazo {formatShortYearMonth(wish.targetMonth)}
              {wish.status === 'conquered' && wish.conqueredMonth
                ? ` · Conquistado em ${formatShortYearMonth(wish.conqueredMonth)}`
                : ''}
            </p>
          </li>
        ))}
      />
    </SubBlock>
  );
}

export function AnnualYearSections({
  yearData,
  currentYear,
  creditCards,
  viewMode,
  monthCount,
  averageWindowLabel,
  wishes,
  wishesLoading = false,
}: AnnualYearSectionsProps) {
  const expenses = useMemo(
    () => buildAnnualExpenseBreakdown(yearData, viewMode, creditCards, monthCount),
    [yearData, viewMode, creditCards, monthCount]
  );
  const investments = useMemo(
    () => buildAnnualInvestmentRows(yearData, viewMode, monthCount, creditCards),
    [yearData, viewMode, monthCount, creditCards]
  );
  const wishGroups = useMemo(
    () => groupWishesForYear(wishes, currentYear),
    [wishes, currentYear]
  );
  const wishesEmpty =
    wishGroups.conquered.length === 0 &&
    wishGroups.pending.length === 0 &&
    wishGroups.expired.length === 0;
  const emptyExpenses =
    viewMode === 'planned'
      ? 'Nenhum gasto registrado neste ano.'
      : 'Nenhum gasto efetivado neste ano.';
  const emptyInvestments =
    viewMode === 'planned'
      ? 'Nenhum aporte registrado neste ano.'
      : 'Nenhum aporte efetivado neste ano.';

  return (
    <>
      <SectionSurface
        title="Categorias"
        subtitle={averageWindowLabel}
        icon={Tags}
        iconVariant="expense"
      >
        {expenses.categories.length === 0 ? (
          <EmptyLine>{emptyExpenses}</EmptyLine>
        ) : (
          <div className="space-y-4">
            <MoneyRows rows={expenses.categories} tone="expense" />
            <TypeBreakdown rows={expenses.types} />
          </div>
        )}
      </SectionSurface>

      <SectionSurface
        title="Método de pagamento"
        subtitle="Cartão leva o selo quando o nome coincide com um cartão cadastrado."
        icon={CreditCard}
        iconVariant="credit"
      >
        {expenses.paymentMethods.length === 0 ? (
          <EmptyLine>{emptyExpenses}</EmptyLine>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{averageWindowLabel}</p>
            <MoneyRows rows={expenses.paymentMethods} tone="credit" />
            <CardPaymentsTotal rows={expenses.paymentMethods} />
          </div>
        )}
      </SectionSurface>

      <SectionSurface
        title="Investimentos"
        subtitle="Classificação do aporte, não a carteira de destino."
        icon={PiggyBank}
        iconVariant="investment"
      >
        {investments.length === 0 ? (
          <EmptyLine>{emptyInvestments}</EmptyLine>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{averageWindowLabel}</p>
            <MoneyRows rows={investments} tone="investment" />
          </div>
        )}
      </SectionSurface>

      <SectionSurface
        title="Desejos"
        subtitle="Histórico do ano. Não entra no saldo, no gráfico nem na regra."
        icon={Sparkles}
        iconVariant="primary"
      >
        {wishesLoading && wishesEmpty ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando desejos
          </div>
        ) : wishesEmpty ? (
          <EmptyLine>Nenhum desejo conquistado, pendente ou expirado neste ano.</EmptyLine>
        ) : (
          <div className="space-y-3">
            <WishGroup title="Conquistados" wishes={wishGroups.conquered} />
            <WishGroup title="Pendentes" wishes={wishGroups.pending} />
            <WishGroup title="Expirados" wishes={wishGroups.expired} />
          </div>
        )}
      </SectionSurface>
    </>
  );
}
