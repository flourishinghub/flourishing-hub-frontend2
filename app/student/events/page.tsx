'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ChevronRight, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { getCurrentUser, apiCall } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { isEventLive, isEventUpcoming } from '@/lib/dateUtils';
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

        const [eventsResponse, registrationsResponse] = await Promise.all([
          apiCall('/events?limit=200'),
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
      const isLive = isEventLive(event.startAt || `${event.date}T${event.time}`, event.endAt);
      const isUpcoming = isEventUpcoming(event.startAt || `${event.date}T${event.time}`);

      if (filter === 'live') return isLive;
      if (filter === 'registered') return registeredEvents.includes(event.id) && (isLive || isUpcoming);
      return isLive || isUpcoming; // 'all'
    })
    .sort((a, b) => {
      const aLive = isEventLive(a.startAt || `${a.date}T${a.time}`, a.endAt);
      const bLive = isEventLive(b.startAt || `${b.date}T${b.time}`, b.endAt);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return new Date(a.startAt || `${a.date}T${a.time}`).getTime() - new Date(b.startAt || `${b.date}T${b.time}`).getTime();
    });

  return (
    <DashboardLayout user={user} loading={loading}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <p className="text-sm text-white/50 mt-1">Discover and register for upcoming events</p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All Events' },
          { key: 'live', label: 'Live Now' },
          { key: 'registered', label: 'My Events' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? key === 'live'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            {key === 'live' && (
              <motion.div
                animate={filter === 'live' ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className={`w-1.5 h-1.5 rounded-full ${filter === 'live' ? 'bg-red-400' : 'bg-white/30'}`}
              />
            )}
            {label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-sm">
              {filter === 'live' ? 'No live events right now' :
               filter === 'registered' ? 'No upcoming registered events' :
               'No upcoming events'}
            </p>
          </div>
        ) : (
          filteredEvents.map((event, i) => {
            const isLive = isEventLive(event.startAt || `${event.date}T${event.time}`, event.endAt);
            const isRegistered = registeredEvents.includes(event.id);
            const isFull = event.registeredCount >= event.capacity && event.capacity > 0;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/student/events/${event.id}`)}
                className="glass-card rounded-2xl p-5 cursor-pointer hover:bg-white/[0.08] hover:border-white/15 transition-all group"
                style={isLive ? { borderColor: 'rgba(239,68,68,0.3)', boxShadow: '0 0 20px rgba(239,68,68,0.07)' } : {}}
              >
                {/* Top row: title + mode badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-semibold text-white leading-snug line-clamp-2 flex-1">
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
                      <Radio className="w-3 h-3" />
                      LIVE NOW
                    </span>
                  ) : isRegistered ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                      ✓ Registered
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
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDate(event.date)} · {formatTime(event.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  {event.capacity > 0 && (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>{event.registeredCount}/{event.capacity} registered</span>
                    </div>
                  )}
                </div>

                {/* View link */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-white/30">{event.organizer}</span>
                  <span className="flex items-center gap-1 text-xs text-primary/60 group-hover:text-primary transition-colors">
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
