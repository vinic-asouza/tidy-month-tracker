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

  return (
    <div className="flex items-center justify-between bg-card rounded-xl p-4 card-shadow">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevMonth}
        className="h-10 w-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <div className="flex items-center gap-3">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {MONTH_NAMES[month - 1]}
          </h2>
          <p className="text-sm text-muted-foreground">{year}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToCurrentMonth}
          className="flex items-center gap-1.5"
        >
          <Calendar className="h-4 w-4" />
          Hoje
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextMonth}
        className="h-10 w-10"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};
