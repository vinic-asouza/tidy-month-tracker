import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnnualSectionChart } from '@/components/AnnualSectionChart';
import type {
  AnnualChartSelectOption,
  AnnualMonthlyChartModel,
} from '@/utils/business/annualMonthlySeries';

interface AnnualChartTabsProps {
  valuesContent: ReactNode;
  chart: AnnualMonthlyChartModel;
  emptyMessage: string;
  currentMonthIndex?: number;
  selectOptions?: AnnualChartSelectOption[];
  selectValue?: string;
  onSelectChange?: (value: string) => void;
  selectAriaLabel?: string;
}

export function AnnualChartTabs({
  valuesContent,
  chart,
  emptyMessage,
  currentMonthIndex = -1,
  selectOptions,
  selectValue,
  onSelectChange,
  selectAriaLabel = 'Filtrar séries do gráfico',
}: AnnualChartTabsProps) {
  const showSelect = (selectOptions?.length ?? 0) > 1 && selectValue != null && onSelectChange;

  return (
    <Tabs defaultValue="values" className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="values" className="flex-1 sm:flex-initial">
            Valores
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex-1 sm:flex-initial">
            Gráficos
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="values" className="mt-4 focus-visible:ring-0">
        {valuesContent}
      </TabsContent>

      <TabsContent value="charts" className="mt-4 focus-visible:ring-0">
        {showSelect && (
          <div className="mb-3 flex justify-end">
            <Select value={selectValue} onValueChange={onSelectChange}>
              <SelectTrigger className="w-full sm:w-64" aria-label={selectAriaLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectOptions!.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <AnnualSectionChart
          points={chart.points}
          series={chart.series}
          hasData={chart.hasData}
          emptyMessage={emptyMessage}
          currentMonthIndex={currentMonthIndex}
        />
      </TabsContent>
    </Tabs>
  );
}
