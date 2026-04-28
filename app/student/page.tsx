'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Calendar, Trophy, Clock, TrendingUp } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import ModuleCard from '@/components/ModuleCard';
import MiniCalendar from '@/components/MiniCalendar';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { StatCardSkeleton, ModuleCardSkeleton } from '@/components/ui/skeleton';
import { getGreeting, formatDate, formatTime } from '@/lib/utils';
import { mockStudents, mockEvents } from '@/lib/mockData';
import { getStoredUser } from '@/lib/auth';
import type { Student, StudentModule } from '@/types';

export default function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    setUserName(user?.name ?? 'Student');
    setTimeout(() => {
      setStudent(mockStudents[0]);
      setLoading(false);
    }, 800);
  }, []);

  const completedModules = student?.modules.filter((m) => m.status === 'completed') ?? [];
  const pendingModules = student?.modules.filter((m) => m.status === 'pending') ?? [];
  const totalModules = student?.modules.length ?? 0;
  const progressPercent = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0;

  const eventDates = mockEvents.map((e) => e.date);

  const historyColumns = [
    {
      key: 'title',
      label: 'Module Name',
      sortable: true,
      render: (_: unknown, row: StudentModule) => (
        <span className="font-medium text-white">{row.title}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: StudentModule) => (
        <Badge variant={row.status === 'completed' ? 'green' : row.status === 'pending' ? 'yellow' : 'purple'}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'completedDate',
      label: 'Date',
      sortable: true,
      render: (_: unknown, row: StudentModule) => (
        <span className="text-white/50 text-xs">
          {row.completedDate ? formatDate(row.completedDate) : row.scheduledDate ? formatDate(row.scheduledDate) : '—'}
        </span>
      ),
    },
    {
      key: 'marks',
      label: 'Score',
      render: (_: unknown, row: StudentModule) => row.marks !== undefined ? (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${(row.marks ?? 0) >= 80 ? 'text-accent' : (row.marks ?? 0) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {row.marks}/{row.maxMarks}
          </span>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${(row.marks ?? 0) >= 80 ? 'bg-accent' : (row.marks ?? 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${((row.marks ?? 0) / (row.maxMarks ?? 100)) * 100}%` }}
            />
          </div>
        </div>
      ) : <span className="text-white/30">—</span>,
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;

  return (
    <DashboardLayout expectedRole="student">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/50 text-sm mb-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()},{' '}
            <span className="gradient-text">{userName.split(' ')[0]}</span>! 👋
          </h1>
          <p className="text-white/50 text-sm mt-1">
            You have <span className="text-accent font-semibold">{pendingModules.length} pending modules</span> and{' '}
            <span className="text-primary font-semibold">{mockEvents.length} upcoming events</span>
          </p>
        </div>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-6xl hidden md:block"
        >
          🌱
        </motion.div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Modules Done" value={completedModules.length} subtitle={`of ${totalModules} total`} icon={CheckCircle2} color="teal" index={0} />
            <StatCard title="Pending Modules" value={pendingModules.length} subtitle="to be completed" icon={Clock} color="yellow" index={1} />
            <StatCard title="Workshops Attended" value={student?.workshopsAttended ?? 0} subtitle="this semester" icon={Trophy} color="purple" index={2} />
            <StatCard title="Upcoming Events" value={mockEvents.length} subtitle="registered" icon={Calendar} color="blue" index={3} />
          </>
        )}
      </div>

      {/* Progress + Completed Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 flex flex-col items-center"
        >
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-6">Course Progress</h2>
          <div className="w-36 h-36">
            <CircularProgressbar
              value={progressPercent}
              text={`${progressPercent}%`}
              styles={buildStyles({
                textColor: '#fff',
                textSize: '18px',
                pathColor: '#6C63FF',
                trailColor: 'rgba(255,255,255,0.08)',
                pathTransitionDuration: 1.5,
              })}
            />
          </div>
          <p className="mt-4 text-center text-sm text-white/60">
            <span className="text-white font-semibold">{completedModules.length}</span> of{' '}
            <span className="text-white font-semibold">{totalModules}</span> modules done
          </p>
          {student && (
            <div className="mt-4 w-full space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Attendance</span>
                <span className="text-accent font-semibold">{student.attendancePercentage}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${student.attendancePercentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Programme</span>
                <Badge variant="purple">{student.programme}</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Department</span>
                <span className="text-white/60 text-right max-w-[60%] truncate">{student.department}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Completed Modules Grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" /> Completed Modules
            </h2>
            <Badge variant="green">{completedModules.length} done</Badge>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <ModuleCardSkeleton key={i} />)}
            </div>
          ) : completedModules.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">📚</div>
              <p className="text-white/40 text-sm">No modules completed yet. Start your journey!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedModules.map((mod, i) => (
                <ModuleCard key={mod.id} module={mod} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Modules */}
      {pendingModules.length > 0 && (
        <div id="schedule">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Pending Modules
            </h2>
            <Badge variant="yellow">{pendingModules.length} pending</Badge>
          </div>
          <div className="space-y-3">
            {pendingModules.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{mod.title}</p>
                  <p className="text-xs text-white/40">{mod.courseName}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {mod.scheduledDate && (
                    <Badge variant="ghost">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatDate(mod.scheduledDate)}
                    </Badge>
                  )}
                  {mod.scheduledTime && (
                    <Badge variant="ghost">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(mod.scheduledTime)}
                    </Badge>
                  )}
                  {mod.venue && (
                    <Badge variant="blue">{mod.venue}</Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom: History + Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2" id="history">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Past Records
          </h2>
          <DataTable
            data={(student?.modules ?? []) as unknown as Record<string, unknown>[]}
            columns={historyColumns}
            searchable
            searchKeys={['title' as never]}
            emptyMessage="No module history yet"
            loading={loading}
          />
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" /> My Calendar
          </h2>
          <MiniCalendar eventDates={eventDates} />
        </div>
      </div>
    </DashboardLayout>
  );
}
