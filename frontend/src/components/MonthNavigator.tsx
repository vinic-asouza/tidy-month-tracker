import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MonthNavigatorProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  compact?: boolean;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const isCurrentMonthKey = (monthKey: string) => monthKey === getCurrentMonthKey();

export const MonthNavigator = ({ currentMonth, onMonthChange, compact = false }: MonthNavigatorProps) => {
  const [year, month] = currentMonth.split('-').map(Number);
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  const goToPrevMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const selectMonth = (monthIndex: number) => {
    onMonthChange(`${pickerYear}-${String(monthIndex + 1).padStart(2, '0')}`);
    setOpen(false);
  };

  return (
    <div className={cn('bg-muted/50 rounded-lg', compact ? 'p-1' : 'p-2')}>
      <div className={cn('flex items-center justify-between', compact ? 'gap-1' : 'gap-2')}>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevMonth}
          aria-label="Mês anterior"
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
            if (next) setPickerYear(year);
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Selecionar mês"
              aria-haspopup="dialog"
              aria-expanded={open}
              className={cn(
                'flex items-center flex-1 justify-center min-w-0 rounded-md outline-none',
                'hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                compact ? 'gap-1 px-1 py-0.5' : 'gap-2 px-2 py-1'
              )}
            >
              <div className="text-center min-w-0">
                <h2
                  className={cn(
                    'font-semibold tracking-tight text-foreground truncate',
                    compact ? 'text-sm' : 'text-base'
                  )}
                >
                  {MONTH_NAMES[month - 1]}
                </h2>
                <p className={cn('font-medium text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
                  {year}
                </p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className={cn('w-[min(100vw-2rem,18rem)] p-3', compact && 'p-2.5')}
            align="center"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Ano anterior no seletor"
                className="h-7 w-7"
                onClick={() => setPickerYear((y) => y - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-sm font-semibold tabular-nums">{pickerYear}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Próximo ano no seletor"
                className="h-7 w-7"
                onClick={() => setPickerYear((y) => y + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5" role="listbox" aria-label="Meses">
              {MONTH_SHORT.map((label, index) => {
                const selected = pickerYear === year && index + 1 === month;
                return (
                  <Button
                    key={label}
                    type="button"
                    variant={selected ? 'default' : 'ghost'}
                    size="sm"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      'h-8 text-xs font-medium',
                      selected && 'pointer-events-none'
                    )}
                    onClick={() => selectMonth(index)}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          aria-label="Próximo mês"
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
