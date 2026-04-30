'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, CheckCircle, Clock, MapPin } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import MiniCalendar from '@/components/MiniCalendar';
import DataTable from '@/components/DataTable';
import EventCard from '@/components/EventCard';
import { mockVolunteers, mockEvents } from '@/lib/mockData';
import { formatDate, formatTime, renderStars } from '@/lib/utils';
import type { CompletedEvent } from '@/types';
import toast from 'react-hot-toast';

const volunteer = mockVolunteers[0];

const activeEvent = mockEvents.find((e) => e.status === 'active');
const upcomingEvents = mockEvents.filter((e) => e.status !== 'archived');

const registeredEventDates = mockEvents
  .filter((e) => volunteer.registeredEvents.includes(e.id))
  .map((e) => e.date);

const unregisteredEventDates = mockEvents
  .filter((e) => !volunteer.registeredEvents.includes(e.id) && e.status !== 'archived')
  .map((e) => e.date);

function CompletedEventCard({ event }: { event: CompletedEvent }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="glass-card rounded-2xl p-4 cursor-default"
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

export default function VolunteerDashboard() {
  const [volunteerStates, setVolunteerStates] = useState<Record<string, boolean>>(
    volunteer.registeredEvents.reduce((acc, id) => ({ ...acc, [id]: true }), {})
  );

  const handleVolunteer = (eventId: string) => {
    setVolunteerStates((prev) => {
      const next = { ...prev, [eventId]: !prev[eventId] };
      toast.success(next[eventId] ? 'Registered as volunteer!' : 'Removed from volunteer list');
      return next;
    });
  };

  const upcomingRegistered = upcomingEvents.filter((e) => volunteerStates[e.id]);
  const pastRecords = volunteer.completedEvents.map((e) => ({
    title: e.title,
    date: formatDate(e.date),
    venue: e.venue,
    marks: e.marks != null ? `${e.marks}/${e.maxMarks}` : '—',
    status: 'Completed',
  }));

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          Welcome, <span className="gradient-text">{volunteer.name}</span>
        </h1>
        <p className="text-sm text-white/50 mt-1">{volunteer.programme} · {volunteer.department} · Year {volunteer.year}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Events Volunteered" value={volunteer.eventsVolunteered} icon={Heart} color="purple" />
        <StatCard title="Events Completed" value={volunteer.eventsCompleted} icon={CheckCircle} color="teal" />
        <StatCard title="Registered Events" value={Object.values(volunteerStates).filter(Boolean).length} icon={Calendar} color="yellow" />
        <StatCard title="Roll No" value={volunteer.rollNo} icon={Clock} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* FH Events to Volunteer */}
          <div className="glass-card rounded-2xl p-6" id="events">
            <h2 className="text-base font-semibold text-white mb-4">FH Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showVolunteerButton
                  onVolunteer={handleVolunteer}
                  isVolunteered={volunteerStates[event.id]}
                />
              ))}
            </div>
          </div>

          {/* Event Status */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Event Status</h2>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Completed Events</h3>
            {volunteer.completedEvents.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">No completed events yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {volunteer.completedEvents.map((event) => (
                  <CompletedEventCard key={event.eventId} event={event} />
                ))}
              </div>
            )}
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Upcoming Volunteer Slots</h3>
            {upcomingRegistered.length === 0 ? (
              <div className="text-center py-4 text-white/30 text-sm">Register for events above to see them here</div>
            ) : (
              <div className="space-y-2">
                {upcomingRegistered.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <Heart className="w-4 h-4 text-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.title}</p>
                      <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(event.date)}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue.split(',')[0]}</span>
                      </div>
                    </div>
                    <span className="badge-green text-[10px] shrink-0">Volunteering</span>
                  </div>
                ))}
              </div>
            )}
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
                { key: 'status', label: 'Status', render: () => <span className="badge-green">Completed</span> },
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
                ['Name', volunteer.name],
                ['Roll No', volunteer.rollNo],
                ['Programme', volunteer.programme],
                ['Department', volunteer.department],
                ['Year', `Year ${volunteer.year}`],
                ['Batch', volunteer.batch],
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
