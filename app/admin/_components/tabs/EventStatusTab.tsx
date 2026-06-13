'use client';

import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { isEventLive } from '@/lib/dateUtils';
import type { Event } from '@/types';

interface EventStatusTabProps {
  eventsLoading: boolean;
  events: Event[];
  eventStatusFilter: 'all' | 'workshop' | 'course';
  setEventStatusFilter: (f: 'all' | 'workshop' | 'course') => void;
  overviewFilter: 'live' | 'upcoming' | 'completed';
  setOverviewFilter: (f: 'live' | 'upcoming' | 'completed') => void;
  overviewEvents: Event[];
  router: { push: (path: string) => void };
}

export default function EventStatusTab({
  eventsLoading,
  events,
  eventStatusFilter,
  setEventStatusFilter,
  overviewFilter,
  setOverviewFilter,
  overviewEvents,
  router,
}: EventStatusTabProps) {
  return (
    <div className="space-y-4">
      {eventsLoading && events.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-white/40 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          Loading events...
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Event Status</h3>
          <p className="text-xs text-white/40 mt-0.5">Live, upcoming and completed events</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-white/10 overflow-hidden text-xs font-medium">
            {(['all', 'workshop', 'course'] as const).map((f, i) => (
              <button key={f} onClick={() => setEventStatusFilter(f)}
                className={`px-3 py-1.5 ${i > 0 ? 'border-l border-white/10' : ''} transition-colors ${eventStatusFilter === f ? 'bg-primary/20 text-primary' : 'text-white/50 hover:text-white'}`}>
                {f === 'all' ? 'All' : f === 'workshop' ? 'Workshop' : 'Course'}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl border border-white/10 overflow-hidden text-xs font-medium">
            {([
              { val: 'live' as const, label: 'Live', dotCls: 'bg-red-400' },
              { val: 'upcoming' as const, label: 'Upcoming', dotCls: 'bg-primary' },
              { val: 'completed' as const, label: 'Completed', dotCls: 'bg-gray-400' },
            ]).map(({ val, label, dotCls }, i) => (
              <button key={val} onClick={() => setOverviewFilter(val)}
                className={`flex items-center gap-1.5 px-3 py-1.5 ${i > 0 ? 'border-l border-white/10' : ''} transition-colors ${overviewFilter === val ? 'bg-primary/20 text-primary' : 'text-white/50 hover:text-white'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${dotCls} ${val === 'live' && overviewFilter === 'live' ? 'animate-pulse' : ''}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {overviewEvents.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No {overviewFilter} events{eventStatusFilter !== 'all' ? ` (${eventStatusFilter})` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {overviewEvents.map((event) => {
            const live = isEventLive((event as any).startAt || (event.date + 'T' + event.time), (event as any).endAt);
            return (
              <div key={event.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${live ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}
                onClick={() => router.push(`/admin/events/${event.id}`)}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${live ? 'bg-red-400 animate-pulse' : event.status === 'completed' ? 'bg-gray-500' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    {(event as any).course && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{(event as any).course.name}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(event.date)} · {formatTime(event.time)}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>
                    {event.registeredCount > 0 ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <Users className="w-3 h-3" />{event.registeredCount}/{event.capacity} Registered
                      </span>
                    ) : (
                      <span className="font-bold text-white/30 italic">Click to Register</span>
                    )}
                  </div>
                </div>
                {live && (
                  <span className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> LIVE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
