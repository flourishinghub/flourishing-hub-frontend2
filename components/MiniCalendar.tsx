'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, parseISO,
} from 'date-fns';

interface MiniCalendarProps {
  eventDates?: string[];
  onDateSelect?: (date: Date) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function MiniCalendar({ eventDates = [], onDateSelect }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const hasEvent = (day: Date) =>
    eventDates.some((d) => {
      try { return isSameDay(parseISO(d), day); } catch { return false; }
    });

  const handleSelect = (day: Date) => {
    setSelectedDate(day);
    onDateSelect?.(day);
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary/20 text-white/50 hover:text-white transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary/20 text-white/50 hover:text-white transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-white/30 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const event = hasEvent(day);

          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(day)}
              className={`
                relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                ${!inMonth ? 'text-white/15 cursor-default' : 'cursor-pointer'}
                ${inMonth && !today && !selected ? 'text-white/70 hover:bg-white/8 hover:text-white' : ''}
                ${today && !selected ? 'text-primary font-bold' : ''}
                ${selected ? 'bg-primary text-white shadow-glow-sm font-bold' : ''}
              `}
            >
              {today && !selected && (
                <div className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/30" />
              )}
              <span className="relative z-10">{format(day, 'd')}</span>
              {event && inMonth && (
                <div className={`w-1 h-1 rounded-full mt-0.5 ${selected ? 'bg-white' : 'bg-accent'}`} />
              )}
            </motion.button>
          );
        })}
      </div>

      {eventDates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-xs text-white/40">{eventDates.length} event{eventDates.length !== 1 ? 's' : ''} this period</span>
        </div>
      )}
    </div>
  );
}
