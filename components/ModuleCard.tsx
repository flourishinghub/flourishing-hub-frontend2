'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, MapPin, Calendar, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, formatTime } from '@/lib/utils';
import type { StudentModule } from '@/types';

interface ModuleCardProps {
  module: StudentModule;
  index?: number;
}

export default function ModuleCard({ module, index = 0 }: ModuleCardProps) {
  const isCompleted = module.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-card rounded-2xl p-5 group cursor-default relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {module.title}
            </h3>
            <p className="text-xs text-white/40 mt-1">{module.courseName}</p>
          </div>
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
            isCompleted ? 'bg-accent/15' : 'bg-primary/15'
          )}>
            {isCompleted
              ? <CheckCircle2 className="w-4 h-4 text-accent" />
              : <Clock className="w-4 h-4 text-primary" />
            }
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <Badge variant={isCompleted ? 'green' : 'purple'}>
            {isCompleted ? 'Completed' : 'Pending'}
          </Badge>
          <Badge variant="ghost">
            <Clock className="w-2.5 h-2.5" />
            {module.duration} min
          </Badge>
        </div>

        {isCompleted && module.marks !== undefined && module.marks !== null && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileHover={{ opacity: 1, scaleX: 1 }}
            className="glass rounded-xl p-3 origin-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50 flex items-center gap-1">
                <Award className="w-3 h-3" /> Score
              </span>
              <span className="text-sm font-bold text-white">
                {module.marks}/{module.maxMarks}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((module.marks ?? 0) / (module.maxMarks ?? 100)) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  (module.marks ?? 0) >= 80 ? 'bg-accent' : (module.marks ?? 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                )}
              />
            </div>
            <p className="text-[10px] text-white/40 mt-1.5">
              Completed {module.completedDate && formatDate(module.completedDate)}
            </p>
          </motion.div>
        )}

        {!isCompleted && module.scheduledDate && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Calendar className="w-3 h-3 text-primary/70" />
              <span>{formatDate(module.scheduledDate)}</span>
              {module.scheduledTime && (
                <>
                  <span className="text-white/20">·</span>
                  <Clock className="w-3 h-3 text-primary/70" />
                  <span>{formatTime(module.scheduledTime)}</span>
                </>
              )}
            </div>
            {module.venue && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <MapPin className="w-3 h-3 text-accent/70" />
                <span>{module.venue}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
