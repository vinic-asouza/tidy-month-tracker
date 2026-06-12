import { cn } from '@/lib/utils';
import logo from '@/assets/brand/logo.png';
import logoDark from '@/assets/brand/Logo-dark.png';

interface BrandMarkProps {
  size?: 'sm' | 'md';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  textClassName?: string;
}

export const BrandMark = ({
  size = 'md',
  showText = true,
  className,
  textClassName,
}: BrandMarkProps) => {
  const iconSize = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';

  return (
    <div className={cn('flex items-center gap-3 shrink-0', className)}>
      <img
        src={logo}
        alt="Finto"
        className={cn(iconSize, 'shrink-0 object-contain dark:hidden')}
        width={size === 'sm' ? 36 : 40}
        height={size === 'sm' ? 36 : 40}
      />
      <img
        src={logoDark}
        alt="Finto"
        className={cn(iconSize, 'hidden shrink-0 object-contain dark:block')}
        width={size === 'sm' ? 36 : 40}
        height={size === 'sm' ? 36 : 40}
      />
      {showText && (
        <div className={cn('min-w-0', textClassName)}>
          <p
            className={cn(
              'font-bold tracking-tight leading-tight',
              size === 'sm' ? 'text-sm' : 'text-lg'
            )}
          >
            Finto
          </p>
        </div>
      )}
    </div>
  );
};
