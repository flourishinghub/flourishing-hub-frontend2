'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'purple' | 'teal' | 'yellow' | 'red' | 'blue';
  trend?: { value: number; label: string };
}

const colorMap = {
  purple: {
    bg: 'from-primary/20 to-primary/5',
    icon: 'bg-primary/20 text-primary',
    border: 'border-primary/20',
    glow: 'hover:border-primary/40 hover:shadow-glow-primary',
  },
  teal: {
    bg: 'from-accent/20 to-accent/5',
    icon: 'bg-accent/20 text-accent',
    border: 'border-accent/20',
    glow: 'hover:border-accent/40 hover:shadow-glow-accent',
  },
  yellow: {
    bg: 'from-yellow-500/20 to-yellow-500/5',
    icon: 'bg-yellow-500/20 text-yellow-400',
    border: 'border-yellow-500/20',
    glow: 'hover:border-yellow-500/40 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]',
  },
  red: {
    bg: 'from-red-500/20 to-red-500/5',
    icon: 'bg-red-500/20 text-red-400',
    border: 'border-red-500/20',
    glow: 'hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  },
  blue: {
    bg: 'from-blue-500/20 to-blue-500/5',
    icon: 'bg-blue-500/20 text-blue-400',
    border: 'border-blue-500/20',
    glow: 'hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',
  },
};

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'purple', trend }: StatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`stat-card border ${c.border} ${c.glow} transition-all duration-300`}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${c.bg} opacity-50`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                trend.value >= 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm font-medium text-white/70">{title}</p>
        {subtitle && <p className="text-xs text-white/35 mt-0.5">{subtitle}</p>}
        {trend && <p className="text-[10px] text-white/30 mt-1">{trend.label}</p>}
      </div>
    </motion.div>
  );
}
