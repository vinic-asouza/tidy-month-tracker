import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface YearNavigatorProps {
  year: number;
  onYearChange: (year: number) => void;
  compact?: boolean;
}

const YEAR_WINDOW = 12;

function yearsAround(center: number): number[] {
  const start = center - Math.floor(YEAR_WINDOW / 2);
  return Array.from({ length: YEAR_WINDOW }, (_, i) => start + i);
}

export const YearNavigator = ({ year, onYearChange, compact = false }: YearNavigatorProps) => {
  const [open, setOpen] = useState(false);
  const [windowCenter, setWindowCenter] = useState(year);

  const years = yearsAround(windowCenter);

  return (
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

        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) setWindowCenter(year);
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Selecionar ano"
              aria-haspopup="dialog"
              aria-expanded={open}
              className={cn(
                'flex items-center flex-1 justify-center min-w-0 rounded-md outline-none',
                'hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                compact ? 'gap-1 px-1 py-0.5' : 'gap-2 px-2 py-1'
              )}
            >
              <h2
                className={cn(
                  'font-semibold tracking-tight text-foreground tabular-nums',
                  compact ? 'text-sm' : 'text-base'
                )}
              >
                {year}
              </h2>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className={cn('w-[min(100vw-2rem,16rem)] p-3', compact && 'p-2.5')}
            align="center"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Anos anteriores"
                className="h-7 w-7"
                onClick={() => setWindowCenter((y) => y - YEAR_WINDOW)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {years[0]}–{years[years.length - 1]}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Próximos anos"
                className="h-7 w-7"
                onClick={() => setWindowCenter((y) => y + YEAR_WINDOW)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5" role="listbox" aria-label="Anos">
              {years.map((y) => {
                const selected = y === year;
                return (
                  <Button
                    key={y}
                    type="button"
                    variant={selected ? 'default' : 'ghost'}
                    size="sm"
                    role="option"
                    aria-selected={selected}
                    className={cn('h-8 text-xs font-medium tabular-nums', selected && 'pointer-events-none')}
                    onClick={() => {
                      onYearChange(y);
                      setOpen(false);
                    }}
                  >
                    {y}
                  </Button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

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
};
