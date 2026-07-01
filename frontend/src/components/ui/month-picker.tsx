import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, formatYearMonthName } from '@/lib/utils';
import { compareYearMonth } from '@/utils/business/wishItems';
import { formatYearMonth } from '@/utils/business/repeatMonths';

const SHORT_MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

interface MonthPickerProps {
  value: string;
  onChange: (yearMonth: string) => void;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export const MonthPicker = ({
  value,
  onChange,
  min,
  placeholder = 'Selecione o mês',
  disabled = false,
  id,
}: MonthPickerProps) => {
  const parsedYear = value ? parseInt(value.split('-')[0], 10) : new Date().getFullYear();
  const [displayYear, setDisplayYear] = useState(parsedYear);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && value) {
      setDisplayYear(parseInt(value.split('-')[0], 10));
    }
    setOpen(nextOpen);
  };

  const isMonthDisabled = (month: number) => {
    if (!min) return false;
    const candidate = formatYearMonth(displayYear, month);
    return compareYearMonth(candidate, min) < 0;
  };

  const handleSelectMonth = (month: number) => {
    const yearMonth = formatYearMonth(displayYear, month);
    if (isMonthDisabled(month)) return;
    onChange(yearMonth);
    setOpen(false);
  };

  const displayLabel = value
    ? `${formatYearMonthName(value)} de ${value.split('-')[0]}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal rounded-md h-10',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex items-center justify-between mb-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md"
            onClick={() => setDisplayYear((y) => y - 1)}
            aria-label="Ano anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold tabular-nums">{displayYear}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md"
            onClick={() => setDisplayYear((y) => y + 1)}
            aria-label="Próximo ano"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SHORT_MONTH_NAMES.map((label, index) => {
            const month = index + 1;
            const yearMonth = formatYearMonth(displayYear, month);
            const isSelected = value === yearMonth;
            const monthDisabled = isMonthDisabled(month);

            return (
              <Button
                key={label}
                type="button"
                variant={isSelected ? 'default' : 'ghost'}
                size="sm"
                disabled={monthDisabled}
                className={cn(
                  'h-9 rounded-md text-xs font-medium',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  monthDisabled && 'opacity-40 cursor-not-allowed'
                )}
                onClick={() => handleSelectMonth(month)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
