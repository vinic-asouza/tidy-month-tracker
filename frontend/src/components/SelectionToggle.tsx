import { Square, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SelectionToggleProps {
  isSelected: boolean;
  onToggle: () => void;
  className?: string;
}

export const SelectionToggle = ({ isSelected, onToggle, className }: SelectionToggleProps) => (
  <Button
    variant="ghost"
    size="icon"
    className={cn('h-7 w-7 shrink-0', className)}
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    aria-label={isSelected ? 'Desmarcar seleção' : 'Selecionar item'}
    aria-pressed={isSelected}
  >
    {isSelected ? (
      <CheckSquare className="h-4 w-4 text-primary" />
    ) : (
      <Square className="h-4 w-4 text-muted-foreground" />
    )}
  </Button>
);
