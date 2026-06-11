/**
 * Design tokens (layout):
 * - Section padding: p-4 sm:p-5
 * - Section gap below header: mb-4
 * - Main blocks gap: space-y-5
 * - Section radius: rounded-lg
 * - Inputs/buttons: rounded-md, h-10
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { SemanticVariant } from './SemanticIconBox';
import { cn } from '@/lib/utils';

interface SectionSurfaceProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconVariant?: SemanticVariant;
  iconGlow?: boolean;
  actions?: ReactNode;
  variant?: 'default' | 'embedded';
  className?: string;
  children: ReactNode;
}

export const sectionSurfaceClass =
  'bg-card rounded-lg border border-border/60 shadow-sm p-4 sm:p-5';

export const SectionSurface = ({
  title,
  subtitle,
  icon,
  iconVariant = 'primary',
  iconGlow = false,
  actions,
  variant = 'default',
  className,
  children,
}: SectionSurfaceProps) => {
  if (variant === 'embedded') {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn(sectionSurfaceClass, className)}>
      {title && (
        <SectionHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          iconVariant={iconVariant}
          iconGlow={iconGlow}
          actions={actions}
        />
      )}
      {children}
    </div>
  );
};
