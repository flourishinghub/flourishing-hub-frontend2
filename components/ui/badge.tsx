import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'green' | 'yellow' | 'red' | 'purple' | 'blue' | 'ghost';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white/80 border-white/20',
  green: 'bg-accent/15 text-accent border-accent/30',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  purple: 'bg-primary/15 text-primary border-primary/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ghost: 'bg-transparent text-white/50 border-white/10',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
