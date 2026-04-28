'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'purple' | 'teal' | 'yellow' | 'red' | 'blue';
  trend?: { value: number; label: string };
  index?: number;
}

const colorConfig = {
  purple: {
    icon: 'from-primary/30 to-primary/10 text-primary',
    accent: 'text-primary',
    glow: 'group-hover:shadow-[0_8px_32px_rgba(108,99,255,0.2)]',
    border: 'group-hover:border-primary/40',
    badge: 'bg-primary/10 text-primary',
  },
  teal: {
    icon: 'from-accent/30 to-accent/10 text-accent',
    accent: 'text-accent',
    glow: 'group-hover:shadow-[0_8px_32px_rgba(0,201,167,0.2)]',
    border: 'group-hover:border-accent/40',
    badge: 'bg-accent/10 text-accent',
  },
  yellow: {
    icon: 'from-yellow-500/30 to-yellow-500/10 text-yellow-400',
    accent: 'text-yellow-400',
    glow: 'group-hover:shadow-[0_8px_32px_rgba(245,158,11,0.2)]',
    border: 'group-hover:border-yellow-500/40',
    badge: 'bg-yellow-500/10 text-yellow-400',
  },
  red: {
    icon: 'from-red-500/30 to-red-500/10 text-red-400',
    accent: 'text-red-400',
    glow: 'group-hover:shadow-[0_8px_32px_rgba(239,68,68,0.2)]',
    border: 'group-hover:border-red-500/40',
    badge: 'bg-red-500/10 text-red-400',
  },
  blue: {
    icon: 'from-blue-500/30 to-blue-500/10 text-blue-400',
    accent: 'text-blue-400',
    glow: 'group-hover:shadow-[0_8px_32px_rgba(59,130,246,0.2)]',
    border: 'group-hover:border-blue-500/40',
    badge: 'bg-blue-500/10 text-blue-400',
  },
};

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'purple', trend, index = 0 }: StatCardProps) {
  const cfg = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -3 }}
      className={cn(
        'stat-card group cursor-default transition-all duration-300',
        cfg.glow, cfg.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wide">{title}</p>
          <motion.p
            className="text-3xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.08 + 0.2 }}
          >
            {value}
          </motion.p>
          {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
          {trend && (
            <div className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', cfg.badge)}>
              <span>{trend.value > 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', cfg.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
    </motion.div>
  );
}
