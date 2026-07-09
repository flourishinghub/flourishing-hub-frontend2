'use client';

import { TrendingUp } from 'lucide-react';
import { formatTime, formatDate } from '@/lib/utils';
import type { Event } from '@/types';

interface OverviewTabProps {
  todaysEvents: Event[];
  liveEvents: Event[];
  upcomingEvents: Event[];
  dashboardData: any;
  router: { push: (path: string) => void };
}

// Groups events by their linked course name; events with no course
// (standalone workshops) are bucketed together, sorted last.
function groupByCourse(events: Event[]): [string, Event[]][] {
  const map = new Map<string, Event[]>();
  events.forEach((e) => {
    const name = (e as any).course?.name || 'Standalone Workshops';
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(e);
  });
  map.forEach((list) => list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  return Array.from(map.entries()).sort((a, b) => {
    if (a[0] === 'Standalone Workshops') return 1;
    if (b[0] === 'Standalone Workshops') return -1;
    return a[0].localeCompare(b[0]);
  });
}

function WorkshopGroupList({
  groups, accentClass, showDate, router,
}: {
  groups: [string, Event[]][]; accentClass: string; showDate?: boolean; router: { push: (path: string) => void };
}) {
  return (
    <div className="space-y-3">
      {groups.map(([courseName, courseEvents]) => (
        <div key={courseName} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-xs font-semibold text-primary mb-2">{courseName}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {courseEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/admin/events/${event.id}`)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${accentClass}`}
              >
                <p className="text-sm font-semibold text-white">{event.title}</p>
                <p className="text-xs text-white/50 mt-0.5">
                  {showDate ? `${formatDate(event.date)} · ` : ''}{formatTime(event.time)} · {event.venue}
                </p>
                <p className="text-[11px] text-white/40 mt-1">{event.registeredCount} / {event.capacity} registered</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OverviewTab({ todaysEvents, liveEvents, upcomingEvents, dashboardData, router }: OverviewTabProps) {
  const liveByCourse = groupByCourse(liveEvents);
  const upcomingByCourse = groupByCourse(upcomingEvents);

  return (
    <div className="space-y-6">
      {todaysEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Today's Events ({todaysEvents.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaysEvents.map((event) => (
              <div key={event.id} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/10 transition-all" onClick={() => router.push(`/admin/events/${event.id}`)}>
                <p className="text-base font-semibold text-white">{event.title}</p>
                <p className="text-sm text-white/50 mt-0.5">{formatTime(event.time)} · {event.venue} · {event.mode}</p>
                <p className="text-xs text-white/40 mt-1">{event.registeredCount} / {event.capacity} registered</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(liveByCourse.length > 0 || upcomingByCourse.length > 0) && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Live &amp; Upcoming Workshops by Course</h4>
          <div className="space-y-5">
            {liveByCourse.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live Now</span>
                </div>
                <WorkshopGroupList
                  groups={liveByCourse}
                  accentClass="bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                  router={router}
                />
              </div>
            )}

            {upcomingByCourse.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Upcoming</span>
                </div>
                <WorkshopGroupList
                  groups={upcomingByCourse}
                  accentClass="bg-blue-500/5 border-blue-500/15 hover:bg-blue-500/10"
                  showDate
                  router={router}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-sm font-semibold text-white mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {dashboardData?.recentActivity?.slice(0, 5).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate">{item.userName} registered for {item.eventTitle}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">{new Date(item.registeredAt).toLocaleDateString()}</p>
                </div>
              </div>
            )) || <p className="text-xs text-white/40">No recent activity</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
