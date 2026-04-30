'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
  parseISO, addDays,
} from 'date-fns';

interface MiniCalendarProps {
  registeredEventDates?: string[];
  unregisteredEventDates?: string[];
  onDateSelect?: (date: Date) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function MiniCalendar({
  registeredEventDates = [],
  unregisteredEventDates = [],
  onDateSelect,
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const tomorrow = addDays(new Date(), 1);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const hasRegistered = (day: Date) =>
    registeredEventDates.some((d) => { try { return isSameDay(parseISO(d), day); } catch { return false; } });

  const hasUnregistered = (day: Date) =>
    unregisteredEventDates.some((d) => { try { return isSameDay(parseISO(d), day); } catch { return false; } });

  const hasTomorrowEvent = (day: Date) =>
    isSameDay(day, tomorrow) && (hasRegistered(day) || hasUnregistered(day));

  const handleSelect = (day: Date) => {
    setSelectedDate(day);
    onDateSelect?.(day);
  };

  const registeredCount = registeredEventDates.length;
  const unregisteredCount = unregisteredEventDates.length;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
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
          <div key={d} className="text-center text-[10px] font-semibold text-white/30 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const todayFlag = isToday(day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const reg = inMonth && hasRegistered(day);
          const unreg = inMonth && hasUnregistered(day);
          const tomorrowGlow = inMonth && hasTomorrowEvent(day);

          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: inMonth ? 1.1 : 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => inMonth && handleSelect(day)}
              className={`
                relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                ${!inMonth ? 'text-white/15 cursor-default' : 'cursor-pointer'}
                ${inMonth && !todayFlag && !selected ? 'text-white/70 hover:bg-white/8 hover:text-white' : ''}
                ${todayFlag && !selected ? 'text-primary font-bold' : ''}
                ${selected ? 'bg-primary text-white font-bold' : ''}
              `}
            >
              {todayFlag && !selected && (
                <div className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/30" />
              )}
              {tomorrowGlow && !selected && (
                <div className="absolute inset-0 rounded-lg bg-yellow-400/10 border border-yellow-400/50 shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
              )}
              <span className="relative z-10">{format(day, 'd')}</span>
              {inMonth && (reg || unreg) && (
                <div className="flex gap-0.5 mt-0.5 relative z-10">
                  {reg && <div className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : 'bg-primary'}`} />}
                  {unreg && <div className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : 'bg-accent'}`} />}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {(registeredCount > 0 || unregisteredCount > 0) && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
          {registeredCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] text-white/40">{registeredCount} registered event{registeredCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {unregisteredCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-[10px] text-white/40">{unregisteredCount} upcoming event{unregisteredCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
