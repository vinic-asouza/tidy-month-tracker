import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SemanticVariant = 'primary' | 'income' | 'expense' | 'investment' | 'credit' | 'muted';

const variantClasses: Record<SemanticVariant, { box: string; glow?: string }> = {
  primary: { box: 'gradient-primary', glow: 'shadow-glow' },
  income: { box: 'gradient-income' },
  expense: { box: 'gradient-expense' },
  investment: { box: 'gradient-investment' },
  credit: { box: 'gradient-credit' },
  muted: { box: 'bg-muted' },
};

interface SemanticIconBoxProps {
  icon: LucideIcon;
  variant?: SemanticVariant;
  glow?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const SemanticIconBox = ({
  icon: Icon,
  variant = 'primary',
  glow = false,
  size = 'md',
  className,
}: SemanticIconBoxProps) => {
  const styles = variantClasses[variant];
  const sizeClasses = size === 'sm' ? 'p-2' : 'p-2.5';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div
      className={cn(
        'rounded-md flex items-center justify-center shrink-0',
        sizeClasses,
        styles.box,
        glow && styles.glow,
        variant === 'muted' ? 'text-muted-foreground' : 'text-white dark:text-black',
        className
      )}
    >
      <Icon className={iconSize} />
    </div>
  );
};
