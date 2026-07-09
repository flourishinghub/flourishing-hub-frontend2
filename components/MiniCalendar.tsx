'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
  parseISO, addDays,
} from 'date-fns';

interface EventDetail {
  id: string;
  title: string;
  time: string;
  venue: string;
  isRegistered: boolean;
}

interface MiniCalendarProps {
  registeredEventDates?: string[];
  unregisteredEventDates?: string[];
  events?: any[]; // Full event data for details
  registrations?: any[]; // Registration data
  onDateSelect?: (date: Date) => void;
  // Labels for the legend entries corresponding to registeredEventDates / unregisteredEventDates.
  // Callers that pass non-registration data (e.g. upcoming/past sessions) should override these
  // so the legend never mislabels the bucket it's describing.
  registeredLabel?: string;
  unregisteredLabel?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MiniCalendar({
  registeredEventDates = [],
  unregisteredEventDates = [],
  events = [],
  registrations = [],
  onDateSelect,
  registeredLabel = 'registered event',
  unregisteredLabel = 'upcoming event',
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const tomorrow = addDays(new Date(), 1);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Get events for a specific date with enhanced data integration
  const getEventsForDate = (date: Date): EventDetail[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents: EventDetail[] = [];

    // Check all events for this date
    events.forEach(event => {
      if (event.date === dateStr) {
        const isRegistered = registrations.some(reg => 
          reg.eventId === event.id && reg.status === 'REGISTERED'
        );
        
        dayEvents.push({
          id: event.id,
          title: event.title,
          time: event.time || '10:00',
          venue: event.venue?.split(',')[0] || 'TBD',
          isRegistered
        });
      }
    });

    // Also check registrations for events that might not be in the events array
    registrations.forEach(reg => {
      if (reg.event && reg.event.startAt) {
        const eventDate = new Date(reg.event.startAt);
        const eventDateStr = format(eventDate, 'yyyy-MM-dd');
        
        if (eventDateStr === dateStr && !dayEvents.some(e => e.id === reg.eventId)) {
          dayEvents.push({
            id: reg.eventId,
            title: reg.event.title,
            time: format(eventDate, 'HH:mm'),
            venue: reg.event.venue?.split(',')[0] || 'TBD',
            isRegistered: reg.status === 'REGISTERED'
          });
        }
      }
    });

    return dayEvents.sort((a, b) => a.time.localeCompare(b.time));
  };

  const hasRegistered = (day: Date) =>
    registeredEventDates.some((d) => { try { return isSameDay(parseISO(d), day); } catch { return false; } });

  const hasUnregistered = (day: Date) =>
    unregisteredEventDates.some((d) => { try { return isSameDay(parseISO(d), day); } catch { return false; } });

  const hasTomorrowEvent = (day: Date) =>
    isSameDay(day, tomorrow) && (hasRegistered(day) || hasUnregistered(day));

  const handleSelect = (day: Date) => {
    if (selectedDate && isSameDay(day, selectedDate)) {
      setSelectedDate(null); // toggle off on second click
    } else {
      setSelectedDate(day);
    }
    onDateSelect?.(day);
  };

  const handleMouseEnter = (day: Date) => {
    const dayEvents = getEventsForDate(day);
    if (dayEvents.length > 0) {
      setHoveredDate(day);
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
    setShowTooltip(false);
  };

  const registeredCount = registeredEventDates.length;
  const unregisteredCount = unregisteredEventDates.length;

  const thisYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => thisYear - 3 + i);
  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  const jumpToMonth = (monthIndex: number) => setCurrentMonth((d) => new Date(d.getFullYear(), monthIndex, 1));
  const jumpToYear = (year: number) => setCurrentMonth((d) => new Date(year, d.getMonth(), 1));

  return (
    <div className="glass-card rounded-2xl p-5 relative">
      <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <select
            value={currentMonth.getMonth()}
            onChange={(e) => jumpToMonth(Number(e.target.value))}
            className="filter-select bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-lg px-2 py-1 border border-white/10 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select
            value={currentMonth.getFullYear()}
            onChange={(e) => jumpToYear(Number(e.target.value))}
            className="filter-select bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-lg px-2 py-1 border border-white/10 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-2.5 h-7 flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold transition-all"
            >
              Today
            </button>
          )}
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
          const dayEvents = getEventsForDate(day);
          const hasEvents = dayEvents.length > 0;

          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: inMonth ? 1.1 : 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => inMonth && handleSelect(day)}
              onMouseEnter={() => inMonth && hasEvents && handleMouseEnter(day)}
              onMouseLeave={handleMouseLeave}
              className={`
                relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                ${!inMonth ? 'text-white/15 cursor-default' : 'cursor-pointer'}
                ${inMonth && !todayFlag && !selected ? 'text-white/70 hover:bg-white/8 hover:text-white' : ''}
                ${todayFlag && !selected ? 'text-primary font-bold' : ''}
                ${selected ? 'bg-primary text-white font-bold' : ''}
                ${hasEvents ? 'hover:bg-primary/10' : ''}
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
              {inMonth && dayEvents.length > 1 && (
                <span className={`absolute top-0.5 right-0.5 z-10 min-w-[13px] h-[13px] px-0.5 flex items-center justify-center rounded-full text-[8px] font-bold ${
                  selected ? 'bg-white text-primary' : 'bg-primary text-white'
                }`}>
                  {dayEvents.length}
                </span>
              )}

              {/* Hover preview — lists up to 3 event titles for the day */}
              <AnimatePresence>
                {showTooltip && hoveredDate && isSameDay(hoveredDate, day) && hasEvents && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-xl border border-white/10 bg-[#1A1A2E] shadow-2xl p-2.5 text-left pointer-events-none"
                  >
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                      {format(day, 'MMM d')} · {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                    </p>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.isRegistered ? 'bg-primary' : 'bg-accent'}`} />
                          <p className="text-[11px] text-white/80 truncate">{ev.title}</p>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] text-white/30 pl-3">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A1A2E] border-r border-b border-white/10 rotate-45 -mt-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Selected date events — shown below calendar grid */}
      <AnimatePresence>
        {selectedDate && (() => {
          const selectedEvents = getEventsForDate(selectedDate);
          return (
            <motion.div
              key={selectedDate.toISOString()}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-3 border-t border-white/5 pt-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-white">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </span>
              </div>
              {selectedEvents.length === 0 ? (
                <p className="text-[11px] text-white/30 py-2 text-center">No events on this date</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((event) => (
                    <div key={event.id} className="p-2.5 rounded-lg bg-white/[0.04] border border-white/8">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-medium text-white leading-tight">{event.title}</p>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          event.isRegistered ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                        }`}>
                          {event.isRegistered ? 'Registered' : 'Open'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-white/50">
                        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{event.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{event.venue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {(registeredCount > 0 || unregisteredCount > 0) && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
          {registeredCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] text-white/40">{registeredCount} {registeredLabel}{registeredCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {unregisteredCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-[10px] text-white/40">{unregisteredCount} {unregisteredLabel}{unregisteredCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
