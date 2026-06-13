'use client';

import { TrendingUp } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import type { Event } from '@/types';

interface OverviewTabProps {
  todaysEvents: Event[];
  dashboardData: any;
  router: { push: (path: string) => void };
}

export default function OverviewTab({ todaysEvents, dashboardData, router }: OverviewTabProps) {
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
