import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

export type SummaryPieTone = 'income' | 'expense' | 'investment';

export interface SummaryPieSlice {
  name: string;
  value: number;
}

interface SummaryPieChartProps {
  data: SummaryPieSlice[];
  tone: SummaryPieTone;
  className?: string;
}

const PALETTES: Record<SummaryPieTone, string[]> = {
  income: [
    'hsl(160, 84%, 39%)',
    'hsl(150, 70%, 42%)',
    'hsl(170, 65%, 35%)',
    'hsl(140, 60%, 48%)',
    'hsl(155, 55%, 55%)',
    'hsl(165, 75%, 30%)',
    'hsl(145, 80%, 45%)',
    'hsl(175, 50%, 40%)',
  ],
  expense: [
    'hsl(350, 89%, 60%)',
    'hsl(15, 85%, 55%)',
    'hsl(340, 70%, 50%)',
    'hsl(5, 80%, 58%)',
    'hsl(355, 65%, 65%)',
    'hsl(25, 75%, 52%)',
    'hsl(345, 80%, 45%)',
    'hsl(0, 70%, 55%)',
  ],
  investment: [
    'hsl(220, 92%, 60%)',
    'hsl(235, 70%, 55%)',
    'hsl(195, 75%, 42%)',
    'hsl(215, 80%, 70%)',
    'hsl(225, 60%, 45%)',
    'hsl(200, 90%, 55%)',
    'hsl(240, 55%, 58%)',
    'hsl(210, 85%, 50%)',
  ],
};

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: SummaryPieSlice & { percent: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const value = item.value ?? 0;
  const percent = item.payload?.percent ?? 0;
  return (
    <div className="rounded-md border border-border/70 bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium text-foreground">{item.name}</p>
      <p className="tabular-nums text-muted-foreground">
        {formatCurrency(value)} · {percent.toFixed(1)}%
      </p>
    </div>
  );
}

export function SummaryPieChart({ data, tone, className }: SummaryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0 || data.length === 0) return null;

  const palette = PALETTES[tone];
  const chartData = data.map((item) => ({
    ...item,
    percent: (item.value / total) * 100,
  }));

  return (
    <div className={className ?? 'h-52 w-full min-w-0 sm:h-56'} role="img" aria-label="Distribuição em pizza">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="42%"
            outerRadius="72%"
            paddingAngle={1}
            strokeWidth={1}
            stroke="hsl(var(--background))"
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
