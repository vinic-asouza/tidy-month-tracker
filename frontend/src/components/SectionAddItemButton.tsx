import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionAddItemButtonProps {
  onClick: () => void;
  label?: string;
  ariaLabel?: string;
  className?: string;
}

export const SectionAddItemButton = ({
  onClick,
  label = 'Adicionar item',
  ariaLabel,
  className,
}: SectionAddItemButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full flex items-center justify-center gap-2 py-2 mb-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors text-xs sm:text-sm',
      className
    )}
    aria-label={ariaLabel ?? label}
  >
    <Plus className="h-4 w-4" />
    <span className="font-medium">{label}</span>
  </button>
);
