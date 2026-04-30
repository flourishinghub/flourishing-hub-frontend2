'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, MapPin, Star } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import MiniCalendar from '@/components/MiniCalendar';
import DataTable from '@/components/DataTable';
import { mockStudents, mockEvents } from '@/lib/mockData';
import { formatDate, formatTime, renderStars } from '@/lib/utils';
import type { CompletedEvent } from '@/types';
import toast from 'react-hot-toast';

const student = mockStudents[0];

const activeEvent = mockEvents.find((e) => e.status === 'active');
const upcomingEvents = mockEvents.filter((e) => e.status === 'draft');

const registeredEventDates = mockEvents
  .filter((e) => student.registeredEvents.includes(e.id))
  .map((e) => e.date);

const unregisteredEventDates = mockEvents
  .filter((e) => !student.registeredEvents.includes(e.id) && e.status !== 'archived')
  .map((e) => e.date);

const pastRecords = student.completedEvents.map((e) => ({
  title: e.title,
  date: formatDate(e.date),
  venue: e.venue,
  marks: e.marks != null ? `${e.marks}/${e.maxMarks}` : '—',
  rating: e.starRating ? renderStars(e.starRating) : '—',
  status: 'Completed',
}));

function CompletedEventCard({ event }: { event: CompletedEvent }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="glass-card rounded-2xl p-4 cursor-default relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-white line-clamp-2">{event.title}</h4>
        <span className="badge-green text-[10px] shrink-0">Done</span>
      </div>
      <p className="text-xs text-white/40 mb-3">{formatDate(event.date)}</p>
      <motion.div
        animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 6 }}
        transition={{ duration: 0.2 }}
        className="space-y-1.5"
      >
        {event.marks != null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">Score</span>
            <span className="font-semibold text-white">{event.marks}/{event.maxMarks}</span>
          </div>
        )}
        {event.starRating != null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">Rating</span>
            <span className="text-yellow-400">{renderStars(event.starRating)}</span>
          </div>
        )}
      </motion.div>
      {!hovered && <p className="text-[10px] text-white/25 mt-2">Hover to see details</p>}
    </motion.div>
  );
}

export default function StudentDashboard() {
  const [registeredEvents, setRegisteredEvents] = useState<string[]>(student.registeredEvents);

  const handleRegister = (eventId: string) => {
    if (registeredEvents.includes(eventId)) {
      setRegisteredEvents((prev) => prev.filter((id) => id !== eventId));
      toast.success('Unregistered from event');
    } else {
      setRegisteredEvents((prev) => [...prev, eventId]);
      toast.success('Registered successfully!');
    }
  };

  const upcomingRegistered = [
    ...(activeEvent ? [activeEvent] : []),
    ...upcomingEvents,
  ].filter((e) => registeredEvents.includes(e.id));

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          Welcome, <span className="gradient-text">{student.name}</span>
        </h1>
        <p className="text-sm text-white/50 mt-1">{student.programme} · {student.department} · Year {student.year}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Registered Events" value={registeredEvents.length} icon={Calendar} color="purple" />
        <StatCard title="Completed Events" value={student.completedEvents.length} icon={CheckCircle} color="teal" />
        <StatCard title="Programme" value={student.programme} icon={Star} color="yellow" />
        <StatCard title="Batch" value={student.batch} icon={Clock} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Status */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Event Status</h2>

            {/* Completed Events */}
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Completed Events</h3>
            {student.completedEvents.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">No completed events yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {student.completedEvents.map((event) => (
                  <CompletedEventCard key={event.eventId} event={event} />
                ))}
              </div>
            )}

            {/* Upcoming Events */}
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Upcoming Registered Events</h3>
            {upcomingRegistered.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">No upcoming registered events</div>
            ) : (
              <div className="space-y-2">
                {upcomingRegistered.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.title}</p>
                      <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(event.date)}, {formatTime(event.time)}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue.split(',')[0]}</span>
                      </div>
                    </div>
                    <span className="badge-purple text-[10px] shrink-0">Registered</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Upcoming Events to Register */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">All Events</h2>
            <div className="space-y-3">
              {[...(activeEvent ? [activeEvent] : []), ...upcomingEvents].map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      event.status === 'active' ? 'bg-emerald-500/15' : 'bg-primary/10'
                    }`}>
                      <Calendar className={`w-4 h-4 ${event.status === 'active' ? 'text-emerald-400' : 'text-primary/60'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.title}</p>
                      <p className="text-xs text-white/40">{formatDate(event.date)} · {event.venue.split(',')[0]}</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRegister(event.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      registeredEvents.includes(event.id)
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30'
                    }`}
                  >
                    {registeredEvents.includes(event.id) ? '✓ Registered' : 'Register'}
                  </motion.button>
                </div>
              ))}
            </div>
          </div>

          {/* Past Records */}
          <div className="glass-card rounded-2xl p-6" id="history">
            <h2 className="text-base font-semibold text-white mb-4">Past Records</h2>
            <DataTable
              data={pastRecords as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'title', label: 'Event Name', sortable: true },
                { key: 'date', label: 'Date', sortable: true },
                { key: 'marks', label: 'Marks' },
                { key: 'rating', label: 'Rating' },
                {
                  key: 'status', label: 'Status',
                  render: () => <span className="badge-green">Completed</span>,
                },
              ]}
              searchKeys={['title'] as never[]}
              searchPlaceholder="Search records..."
              emptyMessage="No past records"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <MiniCalendar
            registeredEventDates={registeredEventDates}
            unregisteredEventDates={unregisteredEventDates}
          />

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Profile</h3>
            <div className="space-y-2.5">
              {[
                ['Name', student.name],
                ['Roll No', student.rollNo],
                ['Programme', student.programme],
                ['Department', student.department],
                ['Year', `Year ${student.year}`],
                ['Batch', student.batch],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] text-white/30">{label}</p>
                  <p className="text-xs text-white/80 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
