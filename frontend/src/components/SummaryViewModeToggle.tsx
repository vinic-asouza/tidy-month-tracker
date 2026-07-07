import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { SummaryViewMode } from '@/utils/business/monthTotals';

interface SummaryViewModeToggleProps {
  viewMode: SummaryViewMode;
  onViewModeChange: (mode: SummaryViewMode) => void;
}

export const SummaryViewModeToggle = ({
  viewMode,
  onViewModeChange,
}: SummaryViewModeToggleProps) => (
  <ToggleGroup
    type="single"
    value={viewMode}
    onValueChange={(value) => value && onViewModeChange(value as SummaryViewMode)}
    className="bg-muted rounded-lg p-0.5"
  >
    <ToggleGroupItem
      value="effective"
      aria-label="Visualizar valores efetivados"
      className="rounded-md px-2 sm:px-2.5 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm text-muted-foreground hover:bg-muted-foreground/10"
    >
      Efetivados
    </ToggleGroupItem>
    <ToggleGroupItem
      value="planned"
      aria-label="Visualizar valores planejados"
      className="rounded-md px-2 sm:px-2.5 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm text-muted-foreground hover:bg-muted-foreground/10"
    >
      Planejados
    </ToggleGroupItem>
  </ToggleGroup>
);
