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
    <div className="bg-card rounded-2xl p-4 card-shadow">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevMonth}
          className="h-11 w-11 rounded-xl hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {MONTH_NAMES[month - 1]}
            </h2>
            <p className="text-sm font-medium text-muted-foreground">{year}</p>
          </div>
          {!isCurrentMonth() && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
              className="flex items-center gap-2 rounded-xl border-primary/30 text-primary hover:bg-accent hover:text-accent-foreground transition-all"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Hoje</span>
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-11 w-11 rounded-xl hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
