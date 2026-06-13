'use client';

import { BookOpen, Clock, MapPin, Users, Zap } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import type { Event } from '@/types';

interface NewEventsTabProps {
  eventsLoading: boolean;
  events: Event[];
  newEvents: Event[];
  router: { push: (path: string) => void };
}

export default function NewEventsTab({ eventsLoading, events, newEvents, router }: NewEventsTabProps) {
  return (
    <div className="space-y-4">
      {eventsLoading && events.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-white/40 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          Loading events...
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">New Events</h3>
          <p className="text-xs text-white/40 mt-0.5">Published events with no registrations yet</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{newEvents.length} events</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {newEvents.map((event) => (
          <div
            key={event.id}
            className="rounded-xl overflow-hidden bg-white/[0.03] border border-white/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
            onClick={() => router.push(`/admin/events/${event.id}`)}
          >
            <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
              <BookOpen className="w-10 h-10 text-white/20" />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/50 text-white text-[10px] font-medium">{event.mode}</div>
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[10px] font-bold">NEW</div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">{event.title}</h3>
              {(event as any).course && <p className="text-[10px] text-primary mb-2">{(event as any).course.name}</p>}
              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-white/50"><Clock className="w-3 h-3" /><span>{formatDate(event.date)} · {formatTime(event.time)}</span></div>
                <div className="flex items-center gap-1.5 text-xs text-white/50"><MapPin className="w-3 h-3" /><span>{event.venue}</span></div>
                <div className="flex items-center gap-1.5 text-xs text-white/50"><Users className="w-3 h-3" /><span>Capacity: {event.capacity}</span></div>
              </div>
              {event.registeredCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {event.registeredCount} Registered
                </span>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/admin/events/${event.id}`); }}
                  className="w-full py-1.5 rounded-lg text-xs font-bold text-white/40 bg-white/[0.03] border border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                >
                  Click to Register
                </button>
              )}
            </div>
          </div>
        ))}
        {newEvents.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Zap className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No new events</p>
            <p className="text-white/25 text-sm mt-1">All published events have registrations</p>
          </div>
        )}
      </div>
    </div>
  );
}
