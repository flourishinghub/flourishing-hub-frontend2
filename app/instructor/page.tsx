'use client';

import { motion } from 'framer-motion';
import { Video, Users, Clock, CheckCircle, Wifi, WifiOff, MapPin, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import MiniCalendar from '@/components/MiniCalendar';
import DataTable from '@/components/DataTable';
import { mockInstructors } from '@/lib/mockData';
import { formatDate, formatTime } from '@/lib/utils';
import type { Session } from '@/types';

const instructor = mockInstructors[0];

const upcomingSessions = instructor.sessions.filter((s) => s.status === 'upcoming');
const pastSessions = instructor.sessions.filter((s) => s.status === 'completed');

const sessionDates = instructor.sessions.map((s) => s.date);

const pastRecords = pastSessions.map((s) => ({
  title: s.title,
  date: formatDate(s.date),
  time: formatTime(s.time),
  venue: s.venue,
  mode: s.mode,
  attendees: s.actualAttendees ?? s.participantCount,
  registered: s.participantCount,
}));

function SessionCard({ session }: { session: Session }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-white leading-tight">{session.title}</h3>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
          session.mode === 'Online'
            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
        }`}>
          {session.mode === 'Online' ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          {session.mode}
        </span>
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Calendar className="w-3.5 h-3.5 text-primary/70" />
          <span>{formatDate(session.date)}</span>
          <Clock className="w-3.5 h-3.5 text-primary/70 ml-1" />
          <span>{formatTime(session.time)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <MapPin className="w-3.5 h-3.5 text-accent/70" />
          <span className="truncate">{session.venue}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Users className="w-3.5 h-3.5 text-primary/70" />
          <span>{session.participantCount} registered</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="badge-purple text-[10px]">Upcoming</span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="text-xs text-primary hover:text-primary/70 font-medium transition-colors"
        >
          View Details →
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function InstructorDashboard() {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          <span className="gradient-text">{instructor.name}</span>
        </h1>
        <p className="text-sm text-white/50 mt-1">{instructor.specialization} · {instructor.department}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={instructor.totalStudents} icon={Users} color="purple" />
        <StatCard title="Upcoming Sessions" value={upcomingSessions.length} icon={Video} color="teal" />
        <StatCard title="Completed Sessions" value={pastSessions.length} icon={CheckCircle} color="yellow" />
        <StatCard title="Emp ID" value={instructor.empId} icon={Clock} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Sessions */}
          <div className="glass-card rounded-2xl p-6" id="sessions">
            <h2 className="text-base font-semibold text-white mb-4">Upcoming Sessions</h2>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">No upcoming sessions scheduled</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>

          {/* Past Sessions */}
          <div className="glass-card rounded-2xl p-6" id="schedule">
            <h2 className="text-base font-semibold text-white mb-4">Past Sessions</h2>
            <DataTable
              data={pastRecords as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'title', label: 'Session', sortable: true },
                { key: 'date', label: 'Date', sortable: true },
                { key: 'venue', label: 'Venue' },
                {
                  key: 'mode', label: 'Mode',
                  render: (row) => (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      (row as { mode: string }).mode === 'Online'
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                    }`}>
                      {(row as { mode: string }).mode}
                    </span>
                  ),
                },
                { key: 'attendees', label: 'Attended' },
              ]}
              searchKeys={['title'] as never[]}
              searchPlaceholder="Search sessions..."
              emptyMessage="No past sessions"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <MiniCalendar
            registeredEventDates={upcomingSessions.map((s) => s.date)}
            unregisteredEventDates={pastSessions.map((s) => s.date)}
          />

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Profile</h3>
            <div className="space-y-2.5">
              {[
                ['Name', instructor.name],
                ['Emp ID', instructor.empId],
                ['Department', instructor.department],
                ['Specialization', instructor.specialization],
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
