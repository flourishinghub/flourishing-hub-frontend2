'use client';

import { motion } from 'framer-motion';
import { BookOpen, Calendar, Clock, Layers, MapPin, Users, X, ChevronRight } from 'lucide-react';
import MiniCalendar from '@/components/MiniCalendar';
import { formatTime } from '@/lib/utils';
import type { Event } from '@/types';

interface CalendarTabProps {
  eventsLoading: boolean;
  events: Event[];
  allEventDates: string[];
  calendarSelectedDate: Date | null;
  setCalendarSelectedDate: (date: Date | null) => void;
  calendarDateEvents: Event[];
  router: { push: (path: string) => void };
}

export default function CalendarTab({
  eventsLoading,
  events,
  allEventDates,
  calendarSelectedDate,
  setCalendarSelectedDate,
  calendarDateEvents,
  router,
}: CalendarTabProps) {
  return (
    <div className="space-y-6">
      {eventsLoading && events.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-white/40 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          Loading events...
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Calendar</h3>
          <p className="text-xs text-white/40 mt-0.5">Click on a date to see workshops scheduled</p>
        </div>
        {calendarSelectedDate && (
          <button
            onClick={() => setCalendarSelectedDate(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Calendar — full width */}
      <div className="max-w-sm">
        <MiniCalendar
          unregisteredEventDates={allEventDates}
          events={events}
          onDateSelect={(date) => setCalendarSelectedDate(date)}
        />
      </div>

      {/* Events panel — below calendar */}
      {calendarSelectedDate && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-primary" />
            <h4 className="text-sm font-semibold text-white">
              {calendarSelectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30">
              {calendarDateEvents.length} workshop{calendarDateEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {calendarDateEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {calendarDateEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-primary/30 hover:bg-white/[0.05] transition-all cursor-pointer"
                  onClick={() => router.push(`/admin/events/${event.id}`)}
                >
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      event.status === 'published' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      event.status === 'completed' ? 'bg-gray-500/15 text-gray-400 border-gray-500/30' :
                      event.status === 'draft' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                      'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}>{event.status}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20" />
                  </div>

                  {/* Workshop Name */}
                  <p className="text-sm font-bold text-white mb-3 line-clamp-2 leading-snug">
                    {event.title}
                  </p>

                  <div className="space-y-2">
                    {/* Course Name */}
                    {(event as any).course?.name && (
                      <div className="flex items-start gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-0.5">Course</p>
                          <p className="text-xs text-primary/90 font-medium truncate">{(event as any).course.name}</p>
                        </div>
                      </div>
                    )}

                    {/* Course Topic (Module) */}
                    {(event as any).courseModule?.title && (
                      <div className="flex items-start gap-2">
                        <Layers className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-0.5">Topic</p>
                          <p className="text-xs text-accent/90 font-medium truncate">{(event as any).courseModule.title}</p>
                        </div>
                      </div>
                    )}

                    {/* Date & Time */}
                    <div className="flex items-center gap-4 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-white/40" />
                        <span className="text-[10px] text-white/50">
                          {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-white/40" />
                        <span className="text-[10px] text-white/50">{formatTime(event.time)}</span>
                      </div>
                    </div>

                    {/* Venue & capacity */}
                    <div className="flex items-center justify-between text-[10px] text-white/35">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.registeredCount}/{event.capacity}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 rounded-2xl border border-dashed border-white/10">
              <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No workshops scheduled on this date</p>
            </div>
          )}
        </div>
      )}

      {!calendarSelectedDate && (
        <div className="text-center py-10 rounded-2xl border border-dashed border-white/8">
          <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Select a date on the calendar above</p>
          <p className="text-white/20 text-xs mt-1">Workshop details will appear here</p>
        </div>
      )}
    </div>
  );
}
