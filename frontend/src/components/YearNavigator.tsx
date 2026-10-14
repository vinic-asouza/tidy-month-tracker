import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface YearNavigatorProps {
  year: number;
  onYearChange: (year: number) => void;
  compact?: boolean;
}

export const YearNavigator = ({ year, onYearChange, compact = false }: YearNavigatorProps) => (
  <div className={cn('bg-muted/50 rounded-lg', compact ? 'p-1' : 'p-2')}>
    <div className={cn('flex items-center justify-between', compact ? 'gap-1' : 'gap-2')}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onYearChange(year - 1)}
        aria-label="Ano anterior"
        className={cn(
          'rounded-lg hover:bg-muted/50 transition-colors',
          compact ? 'h-7 w-7' : 'h-8 w-8'
        )}
      >
        <ChevronLeft className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </Button>

      <div className={cn('flex items-center flex-1 justify-center min-w-0', compact ? 'gap-1' : 'gap-2')}>
        <h2
          className={cn(
            'font-semibold tracking-tight text-foreground tabular-nums',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          {year}
        </h2>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onYearChange(year + 1)}
        aria-label="Próximo ano"
        className={cn(
          'rounded-lg hover:bg-muted/50 transition-colors',
          compact ? 'h-7 w-7' : 'h-8 w-8'
        )}
      >
        <ChevronRight className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </Button>
    </div>
  </div>
);
