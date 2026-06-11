import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { SemanticIconBox, SemanticVariant } from './SemanticIconBox';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconVariant?: SemanticVariant;
  iconGlow?: boolean;
  actions?: ReactNode;
  className?: string;
}

export const SectionHeader = ({
  title,
  subtitle,
  icon,
  iconVariant = 'primary',
  iconGlow = false,
  actions,
  className,
}: SectionHeaderProps) => (
  <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
    <div className="flex items-center gap-3 min-w-0">
      {icon && <SemanticIconBox icon={icon} variant={iconVariant} glow={iconGlow} />}
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="shrink-0">{actions}</div>}
  </div>
);
