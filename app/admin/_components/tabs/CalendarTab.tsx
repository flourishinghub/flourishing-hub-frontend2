'use client';

import AdminBigCalendar from '@/components/AdminBigCalendar';
import type { Event } from '@/types';

interface CalendarTabProps {
  eventsLoading: boolean;
  events: Event[];
  router: { push: (path: string) => void };
}

export default function CalendarTab({ eventsLoading, events, router }: CalendarTabProps) {
  return (
    <div className="space-y-6">
      {eventsLoading && events.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-white/40 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          Loading events...
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-white">Calendar</h3>
        <p className="text-xs text-white/40 mt-0.5">Every workshop, colour-coded by status — click any event for full details</p>
      </div>

      <AdminBigCalendar events={events} router={router} />
    </div>
  );
}
