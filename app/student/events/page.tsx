'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ChevronRight, Radio, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { getCurrentUser, apiCall } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { isEventLiveOrGrace, isEventUpcoming } from '@/lib/dateUtils';
import { getRegisteredEventIds } from '@/lib/registrationUtils';
import type { AuthPayload } from '@/types';

export default function StudentEventsPage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live' | 'registered'>('all');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    const timeoutId = setTimeout(() => setLoading(false), 8000);

    const fetchData = async () => {
      try {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) setUser(JSON.parse(cachedUser));

        // activeOnly=false + from=24h-ago: without this, the backend's default
        // filter drops any event whose endAt has already passed — so a
        // workshop a student needed to check into (grace window now 45 min,
        // check-in window up to 6h same-day) simply vanished from this list
        // the moment its scheduled end time hit. Bounded to the last 24h
        // (not fully unbounded) so "All Events" doesn't fill up with the
        // entire historical archive.
        const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const [eventsResponse, registrationsResponse] = await Promise.all([
          apiCall(`/events?limit=200&activeOnly=false&from=${encodeURIComponent(from)}`),
          apiCall('/registrations/me'),
        ]);

        const transformed = (eventsResponse.data?.items || []).map((event: any) => {
          const startDate = new Date(event.startAt);
          return {
            id: event.id,
            title: event.title || 'Untitled Event',
            description: event.description || '',
            startAt: event.startAt,
            endAt: event.endAt || null,
            date: startDate.toISOString().split('T')[0],
            time: startDate.toTimeString().slice(0, 5),
            venue: event.venue || 'TBD',
            mode: event.meetLink ? 'Online' : 'In Classroom',
            capacity: event.capacity || 0,
            registeredCount: event._count?.registrations || 0,
            organizer: event.createdBy?.name || 'Admin',
          };
        });

        setEvents(transformed);
        const userRegistrations = registrationsResponse.data || [];
        setRegisteredEvents(getRegisteredEventIds(userRegistrations));
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const now = new Date();

  const filteredEvents = events
    .filter((event) => {
      const isLive = isEventLiveOrGrace(event.startAt || `${event.date}T${event.time}`, event.endAt);
      const isUpcoming = isEventUpcoming(event.startAt || `${event.date}T${event.time}`);

      if (filter === 'live') return isLive;
      if (filter === 'registered') return registeredEvents.includes(event.id) && (isLive || isUpcoming);
      return isLive || isUpcoming; // 'all'
    })
    .sort((a, b) => {
      const aLive = isEventLiveOrGrace(a.startAt || `${a.date}T${a.time}`, a.endAt);
      const bLive = isEventLiveOrGrace(b.startAt || `${b.date}T${b.time}`, b.endAt);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return new Date(a.startAt || `${a.date}T${a.time}`).getTime() - new Date(b.startAt || `${b.date}T${b.time}`).getTime();
    });

  return (
    <DashboardLayout user={user} loading={loading}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-10 w-56 h-56 bg-primary/8 rounded-full blur-3xl pointer-events-none"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        />
        <h1 className="text-2xl font-bold text-white tracking-tight relative">Events</h1>
        <p className="text-sm text-white/50 mt-1 relative">Discover and register for upcoming events</p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap p-1 bg-white/[0.03] border border-white/8 rounded-xl w-fit">
        {[
          { key: 'all', label: 'All Events' },
          { key: 'live', label: 'Live Now' },
          { key: 'registered', label: 'My Events' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? key === 'live'
                  ? 'text-red-400'
                  : 'text-primary'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {filter === key && (
              <motion.div
                layoutId="eventFilterTab"
                className={`absolute inset-0 rounded-lg border ${
                  key === 'live' ? 'bg-red-500/15 border-red-500/40' : 'bg-primary/15 border-primary/30'
                }`}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            {key === 'live' && (
              <motion.div
                animate={filter === 'live' ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className={`relative w-1.5 h-1.5 rounded-full ${filter === 'live' ? 'bg-red-400' : 'bg-white/30'}`}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-white/25" />
            </div>
            <p className="text-white/40 text-sm font-medium">
              {filter === 'live' ? 'No live events right now' :
               filter === 'registered' ? 'No upcoming registered events' :
               'No upcoming events'}
            </p>
            <p className="text-white/25 text-xs mt-1">Check back later or browse a different filter</p>
          </div>
        ) : (
          filteredEvents.map((event, i) => {
            const isLive = isEventLiveOrGrace(event.startAt || `${event.date}T${event.time}`, event.endAt);
            const isRegistered = registeredEvents.includes(event.id);
            const isFull = event.registeredCount >= event.capacity && event.capacity > 0;

            const fillPct = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                onClick={() => router.push(`/student/events/${event.id}`)}
                className="glass-card rounded-2xl p-5 cursor-pointer hover:bg-white/[0.06] hover:border-white/15 hover:shadow-card-hover transition-all group relative overflow-hidden"
                style={isLive ? { borderColor: 'rgba(239,68,68,0.35)', boxShadow: '0 0 24px rgba(239,68,68,0.1)' } : {}}
              >
                {isLive && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
                )}
                {/* Top row: title + mode badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-semibold text-white leading-snug line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                    event.mode === 'Online'
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-violet-500/15 text-violet-400'
                  }`}>
                    {event.mode}
                  </span>
                </div>

                {/* Status badge */}
                <div className="mb-4">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-red-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      />
                      LIVE NOW
                    </span>
                  ) : isRegistered ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                      <Check className="w-3 h-3" /> Registered
                    </span>
                  ) : isFull ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                      Full
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                      Open
                    </span>
                  )}
                </div>

                {/* Event meta */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                    <span>{formatDate(event.date)} · {formatTime(event.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-accent/60" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  {event.capacity > 0 && (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Users className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                      <span className="shrink-0">{event.registeredCount}/{event.capacity}</span>
                      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-gradient-to-r from-primary to-accent'}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* View link */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-white/30 truncate">{event.organizer}</span>
                  <span className="flex items-center gap-1 text-xs text-primary/60 group-hover:text-primary group-hover:gap-1.5 transition-all shrink-0">
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
