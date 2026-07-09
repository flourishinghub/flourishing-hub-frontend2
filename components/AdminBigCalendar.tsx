'use client';

import { useMemo, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Clock, Users, BookOpen, Layers, UserCheck, Star,
  Wifi, WifiOff, ChevronRight, ArrowRight,
} from 'lucide-react';
import { isEventLive } from '@/lib/dateUtils';
import { formatTime } from '@/lib/utils';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

interface AdminBigCalendarProps {
  events: any[];
  router: { push: (path: string) => void };
}

type StatusKey = 'published' | 'draft' | 'completed' | 'cancelled';

const STATUS_COLOR: Record<StatusKey, { bg: string; border: string; dot: string }> = {
  published: { bg: 'rgba(16, 185, 129, 0.25)', border: '#10B981', dot: '#10B981' },
  draft: { bg: 'rgba(234, 179, 8, 0.25)', border: '#EAB308', dot: '#EAB308' },
  completed: { bg: 'rgba(148, 163, 184, 0.2)', border: '#94A3B8', dot: '#94A3B8' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.25)', border: '#EF4444', dot: '#EF4444' },
};

export default function AdminBigCalendar({ events, router }: AdminBigCalendarProps) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const calEvents = useMemo(
    () =>
      events
        .filter((e) => e.startAt)
        .map((e) => ({
          id: e.id,
          title: e.title,
          start: new Date(e.startAt),
          end: e.endAt ? new Date(e.endAt) : new Date(new Date(e.startAt).getTime() + 60 * 60 * 1000),
          resource: e,
        })),
    [events]
  );

  const eventPropGetter = (event: any) => {
    const e = event.resource;
    const live = isEventLive(e.startAt, e.endAt);
    const colors = STATUS_COLOR[(e.status as StatusKey) || 'published'] || STATUS_COLOR.published;
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${live ? '#EF4444' : colors.border}`,
        borderRadius: '6px',
        color: '#fff',
        fontSize: '11px',
        padding: '2px 6px',
      },
    };
  };

  const dayPropGetter = (day: Date) => {
    const isToday = day.toDateString() === new Date().toDateString();
    return isToday
      ? { style: { backgroundColor: 'rgba(108, 99, 255, 0.08)' } }
      : {};
  };

  // Custom toolbar — dark-themed, with Today/Back/Next + view switcher
  const CustomToolbar = (toolbar: any) => {
    const viewLabels: { key: View; label: string }[] = [
      { key: Views.MONTH, label: 'Month' },
      { key: Views.WEEK, label: 'Week' },
      { key: Views.DAY, label: 'Day' },
      { key: Views.AGENDA, label: 'Agenda' },
    ];
    return (
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toolbar.onNavigate('TODAY')}
            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all text-xs font-semibold"
          >
            Today
          </button>
          <button
            onClick={() => toolbar.onNavigate('PREV')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary/20 text-white/60 hover:text-white transition-all"
          >
            ‹
          </button>
          <button
            onClick={() => toolbar.onNavigate('NEXT')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary/20 text-white/60 hover:text-white transition-all"
          >
            ›
          </button>
          <h3 className="text-base font-semibold text-white ml-2">{toolbar.label}</h3>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          {viewLabels.map((v) => (
            <button
              key={v.key}
              onClick={() => toolbar.onView(v.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                toolbar.view === v.key ? 'bg-primary text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const CustomEvent = ({ event }: { event: any }) => {
    const e = event.resource;
    const live = isEventLive(e.startAt, e.endAt);
    return (
      <div className="flex items-center gap-1 truncate">
        {live && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />}
        <span className="truncate font-medium">{event.title}</span>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {(Object.keys(STATUS_COLOR) as StatusKey[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[s].dot }} />
            <span className="text-[11px] text-white/50 capitalize">{s}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[11px] text-white/50">Live now</span>
        </div>
      </div>

      <div className="admin-big-calendar rounded-2xl overflow-hidden">
        <BigCalendar
          localizer={localizer}
          events={calEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          style={{ height: 700 }}
          eventPropGetter={eventPropGetter}
          dayPropGetter={dayPropGetter}
          onSelectEvent={(event: any) => setSelectedEvent(event.resource)}
          components={{ toolbar: CustomToolbar, event: CustomEvent }}
          popup
        />
      </div>

      {/* Event detail slide-in panel */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md z-50 overflow-y-auto border-l border-white/10 shadow-2xl"
              style={{ background: '#16162A' }}
            >
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border capitalize mb-2"
                      style={{
                        backgroundColor: STATUS_COLOR[(selectedEvent.status as StatusKey) || 'published']?.bg,
                        borderColor: STATUS_COLOR[(selectedEvent.status as StatusKey) || 'published']?.border,
                        color: '#fff',
                      }}
                    >
                      {isEventLive(selectedEvent.startAt, selectedEvent.endAt) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      )}
                      {isEventLive(selectedEvent.startAt, selectedEvent.endAt) ? 'Live Now' : selectedEvent.status}
                    </span>
                    <h3 className="text-lg font-bold text-white leading-snug">{selectedEvent.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedEvent.description && (
                  <p className="text-sm text-white/60 leading-relaxed">{selectedEvent.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Date &amp; Time
                    </p>
                    <p className="text-xs text-white font-medium">
                      {new Date(selectedEvent.startAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-white/60">
                      {formatTime(new Date(selectedEvent.startAt).toTimeString().slice(0, 5))}
                      {selectedEvent.endAt && ` – ${formatTime(new Date(selectedEvent.endAt).toTimeString().slice(0, 5))}`}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Venue
                    </p>
                    <p className="text-xs text-white font-medium">{selectedEvent.venue || 'TBD'}</p>
                    <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                      {selectedEvent.mode === 'Online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {selectedEvent.mode}
                    </p>
                  </div>
                </div>

                {selectedEvent.course?.name && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
                    <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-primary/70 uppercase tracking-wider mb-0.5">Course</p>
                      <p className="text-sm text-white font-medium truncate">{selectedEvent.course.name}</p>
                      {selectedEvent.courseModule?.title && (
                        <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                          <Layers className="w-3 h-3" /> {selectedEvent.courseModule.title}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Registered
                    </p>
                    <p className="text-sm text-white font-bold">
                      {selectedEvent.registeredCount ?? 0}
                      {selectedEvent.capacity ? <span className="text-white/40 font-normal"> / {selectedEvent.capacity}</span> : null}
                    </p>
                  </div>
                  {selectedEvent.batch && (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Batch</p>
                      <p className="text-sm text-white font-mono font-semibold">{selectedEvent.batch}</p>
                    </div>
                  )}
                </div>

                {(selectedEvent.instructorName || selectedEvent.organizer) && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-accent shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Instructor</p>
                      <p className="text-sm text-white font-medium">{selectedEvent.instructorName || selectedEvent.organizer}</p>
                    </div>
                  </div>
                )}

                {selectedEvent.avgEventRating != null && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Avg Rating</p>
                      <p className="text-sm text-white font-medium">{selectedEvent.avgEventRating} / 5 · {selectedEvent.feedbackCount ?? 0} reviews</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => router.push(`/admin/events/${selectedEvent.id}`)}
                  className="w-full flex items-center justify-center gap-2 btn-primary py-3 rounded-xl text-sm font-semibold"
                >
                  View Full Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
