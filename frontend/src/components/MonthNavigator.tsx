import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const isCurrentMonthKey = (monthKey: string) => monthKey === getCurrentMonthKey();

export const MonthNavigator = ({ currentMonth, onMonthChange, compact = false }: MonthNavigatorProps) => {
  const [year, month] = currentMonth.split('-').map(Number);
  
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

  return (
    <div className={cn('bg-muted/50 rounded-lg', compact ? 'p-1' : 'p-2')}>
      <div className={cn('flex items-center justify-between', compact ? 'gap-1' : 'gap-2')}>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevMonth}
          className={cn(
            'rounded-lg hover:bg-muted/50 transition-colors',
            compact ? 'h-7 w-7' : 'h-8 w-8'
          )}
        >
          <ChevronLeft className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </Button>
        
        <div className={cn('flex items-center flex-1 justify-center min-w-0', compact ? 'gap-1' : 'gap-2')}>
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
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
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
