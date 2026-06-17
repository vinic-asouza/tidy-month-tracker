import { Square, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelectionToggleProps {
  isSelected: boolean;
  onToggle: () => void;
}

export const SelectionToggle = ({ isSelected, onToggle }: SelectionToggleProps) => (
  <Button
    variant="ghost"
    size="icon"
    className="h-7 w-7 shrink-0"
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
