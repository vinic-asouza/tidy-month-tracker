import { BarChart2 } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { formatCurrency } from '@/lib/utils';
import type { AnnualChartSeries, AnnualMonthlyChartPoint } from '@/utils/business/annualMonthlySeries';

const SERIES_PALETTE = [
  'hsl(350, 89%, 60%)',
  'hsl(220, 92%, 60%)',
  'hsl(160, 84%, 39%)',
  'hsl(45, 93%, 47%)',
  'hsl(280, 70%, 55%)',
  'hsl(25, 90%, 55%)',
  'hsl(190, 80%, 40%)',
  'hsl(330, 70%, 50%)',
] as const;

const formatAxisValue = (value: number) => {
  if (Math.abs(value) < 1000) return String(Math.round(value));
  return `${(value / 1000).toFixed(0)}k`;
};

function sortedTooltipPayload(
  payload: TooltipProps<ValueType, NameType>['payload']
): NonNullable<TooltipProps<ValueType, NameType>['payload']> {
  if (!payload?.length) return [];
  return [...payload].sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0));
}

function AnnualChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  const items = sortedTooltipPayload(payload);

  return (
    <div
      className="rounded-lg border border-border bg-card px-3 py-2 shadow-md"
      style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
    >
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="space-y-1">
        {items.map((entry) => (
          <li
            key={String(entry.dataKey ?? entry.name)}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 tabular-nums font-medium">
              {formatCurrency(Number(entry.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AnnualSectionChartProps {
  points: AnnualMonthlyChartPoint[];
  series: AnnualChartSeries[];
  hasData: boolean;
  emptyMessage: string;
  currentMonthIndex?: number;
}

export function AnnualSectionChart({
  points,
  series,
  hasData,
  emptyMessage,
  currentMonthIndex = -1,
}: AnnualSectionChartProps) {
  if (!hasData || series.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <BarChart2 className="h-10 w-10 text-muted-foreground/50" />
        <p className="max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const renderXAxisTick = (props: { x: number; y: number; payload: { value: string; index: number } }) => {
    const { x, y, payload } = props;
    const isCurrent = payload.index === currentMonthIndex;
    return (
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        fill={isCurrent ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
        fontSize={isCurrent ? 13 : 12}
        fontWeight={isCurrent ? 700 : 400}
      >
        {payload.value}
      </text>
    );
  };

  return (
    <div className="mt-2 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={renderXAxisTick} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={formatAxisValue}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<AnnualChartTooltip />} />
          <Legend iconType="circle" formatter={(value) => <span className="text-sm">{value}</span>} />
          {series.map((item, index) => {
            const color = item.color ?? SERIES_PALETTE[index % SERIES_PALETTE.length];
            return (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
