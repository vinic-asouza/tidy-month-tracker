import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AnnualAmountMode } from '@/utils/business/annualAverage';

interface AnnualAmountModeToggleProps {
  amountMode: AnnualAmountMode;
  onAmountModeChange: (mode: AnnualAmountMode) => void;
}

export const AnnualAmountModeToggle = ({
  amountMode,
  onAmountModeChange,
}: AnnualAmountModeToggleProps) => (
  <ToggleGroup
    type="single"
    value={amountMode}
    onValueChange={(value) => value && onAmountModeChange(value as AnnualAmountMode)}
    className="bg-muted rounded-lg p-0.5"
    aria-label="Total ou média mensal do ano"
  >
    <ToggleGroupItem
      value="total"
      aria-label="Visualizar totais do ano"
      className="rounded-md px-2 sm:px-2.5 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm text-muted-foreground hover:bg-muted-foreground/10"
    >
      Total
    </ToggleGroupItem>
    <ToggleGroupItem
      value="average"
      aria-label="Visualizar média mensal"
      className="rounded-md px-2 sm:px-2.5 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm text-muted-foreground hover:bg-muted-foreground/10"
    >
      Média
    </ToggleGroupItem>
  </ToggleGroup>
);
