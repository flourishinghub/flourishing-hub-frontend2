'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Users, Calendar, TrendingUp, MapPin, ExternalLink, Play } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import MiniCalendar from '@/components/MiniCalendar';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, getGreeting } from '@/lib/utils';
import { mockInstructors } from '@/lib/mockData';
import { getStoredUser } from '@/lib/auth';
import type { Session } from '@/types';
import toast from 'react-hot-toast';

export default function InstructorDashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [sessionModal, setSessionModal] = useState<Session | null>(null);

  const instructor = mockInstructors[0];
  const upcomingSessions = instructor.sessions.filter((s) => s.status === 'upcoming');
  const pastSessions = instructor.sessions.filter((s) => s.status === 'completed');

  useEffect(() => {
    const user = getStoredUser();
    setUserName(user?.name ?? 'Instructor');
    setTimeout(() => setLoading(false), 800);
  }, []);

  const eventDates = upcomingSessions.map((s) => s.date);

  const pastColumns = [
    {
      key: 'title',
      label: 'Session Name',
      sortable: true,
      render: (_: unknown, row: Session) => (
        <span className="font-medium text-white">{row.title}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (_: unknown, row: Session) => (
        <Badge variant="purple">{row.type}</Badge>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (_: unknown, row: Session) => (
        <span className="text-white/50 text-xs">{formatDate(row.date)}</span>
      ),
    },
    {
      key: 'participantCount',
      label: 'Registered',
      render: (_: unknown, row: Session) => (
        <span className="text-white/70">{row.participantCount}</span>
      ),
    },
    {
      key: 'actualAttendees',
      label: 'Attended',
      render: (_: unknown, row: Session) => row.actualAttendees !== undefined ? (
        <div className="flex items-center gap-2">
          <span className="text-accent font-semibold">{row.actualAttendees}</span>
          <span className="text-white/30 text-xs">
            ({Math.round((row.actualAttendees / row.participantCount) * 100)}%)
          </span>
        </div>
      ) : <span className="text-white/30">—</span>,
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;

  return (
    <DashboardLayout expectedRole="instructor">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/50 text-sm mb-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()}, <span className="gradient-text">{userName.split(' ').slice(-1)[0]}</span>!
          </h1>
          <p className="text-white/50 text-sm mt-1">
            You have <span className="text-primary font-semibold">{upcomingSessions.length} upcoming sessions</span> and{' '}
            <span className="text-accent font-semibold">{instructor.totalStudents} students</span> enrolled
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Students" value={instructor.totalStudents} icon={Users} color="purple" index={0} />
            <StatCard title="Upcoming Sessions" value={upcomingSessions.length} icon={Video} color="teal" index={1} />
            <StatCard title="Past Sessions" value={pastSessions.length} icon={TrendingUp} color="yellow" index={2} />
            <StatCard title="Avg. Attendance" value="92%" subtitle="across sessions" icon={Calendar} color="blue" index={3} />
          </>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div id="sessions">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" /> Upcoming Sessions
          </h2>
          <Badge variant="purple">{upcomingSessions.length} scheduled</Badge>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🗓️</div>
            <p className="text-white/40">No upcoming sessions scheduled</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3 }}
                className="glass-card rounded-2xl p-5 group"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white group-hover:text-primary transition-colors line-clamp-2">
                      {session.title}
                    </h3>
                    <p className="text-xs text-white/40 mt-1 capitalize">{session.type.replace('-', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 glass rounded-lg px-2 py-1">
                    <Users className="w-3 h-3 text-accent" />
                    <span className="text-xs font-semibold text-accent">{session.participantCount}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Calendar className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                    <span>{formatDate(session.date)} · {formatTime(session.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <MapPin className="w-3.5 h-3.5 text-accent/60 shrink-0" />
                    <span>{session.venue}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {session.meetLink && (
                    <a
                      href={session.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="default" size="sm" className="w-full gap-1.5">
                        <ExternalLink className="w-3 h-3" /> Join Meet
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSessionModal(session);
                    }}
                    className="flex-1 gap-1.5"
                  >
                    <Play className="w-3 h-3" /> Start Session
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions + Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2" id="participants">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Past Sessions
          </h2>
          <DataTable
            data={pastSessions as unknown as Record<string, unknown>[]}
            columns={pastColumns}
            searchable
            searchKeys={['title' as never]}
            emptyMessage="No past sessions yet"
            loading={loading}
          />
        </div>

        <div id="schedule">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" /> Session Calendar
          </h2>
          <MiniCalendar eventDates={eventDates} />
        </div>
      </div>

      {/* Start Session Modal */}
      <Dialog open={!!sessionModal} onOpenChange={() => setSessionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Session</DialogTitle>
            <DialogDescription>
              You are about to start the following session. This will notify all registered participants.
            </DialogDescription>
          </DialogHeader>
          {sessionModal && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-white">{sessionModal.title}</p>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(sessionModal.date)} · {formatTime(sessionModal.time)}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Users className="w-3.5 h-3.5" />
                  {sessionModal.participantCount} participants registered
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setSessionModal(null)}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => {
                    toast.success('Session started! Participants notified. 🎉');
                    setSessionModal(null);
                  }}
                >
                  <Play className="w-4 h-4" /> Start Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
