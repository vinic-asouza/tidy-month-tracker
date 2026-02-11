import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthNavigatorProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MonthNavigator = ({ currentMonth, onMonthChange }: MonthNavigatorProps) => {
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

  const goToCurrentMonth = () => {
    const now = new Date();
    onMonthChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
  };

  return (
    <div className="bg-muted/50 rounded-xl p-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevMonth}
          className="h-8 w-8 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        
        <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
          <div className="text-center min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground truncate">
              {MONTH_NAMES[month - 1]}
            </h2>
            <p className="text-xs font-medium text-muted-foreground">{year}</p>
          </div>
          {!isCurrentMonth() && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
              className="h-6 px-1.5 text-xs rounded-lg border-primary/30 text-primary hover:bg-accent hover:text-accent-foreground transition-all flex-shrink-0"
            >
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline ml-1">Hoje</span>
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
