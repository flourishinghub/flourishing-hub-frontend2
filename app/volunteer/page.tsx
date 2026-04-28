'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, CheckCircle2, Clock, Calendar, Trophy, Users, MapPin } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import ModuleCard from '@/components/ModuleCard';
import MiniCalendar from '@/components/MiniCalendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { getGreeting, formatDate, formatTime } from '@/lib/utils';
import { mockStudents, mockEvents } from '@/lib/mockData';
import { getStoredUser } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function VolunteerDashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());

  const student = mockStudents[1]; // Priya as volunteer
  const completedModules = student.modules.filter((m) => m.status === 'completed');
  const pendingModules = student.modules.filter((m) => m.status === 'pending');
  const totalModules = student.modules.length;
  const progressPercent = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0;
  const eventDates = mockEvents.map((e) => e.date);

  useEffect(() => {
    const user = getStoredUser();
    setUserName(user?.name ?? 'Volunteer');
    setTimeout(() => setLoading(false), 800);
  }, []);

  const handleRegister = (eventId: string, eventTitle: string) => {
    setRegisteredEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
        toast.success(`Unregistered from ${eventTitle}`);
      } else {
        next.add(eventId);
        toast.success(`Registered as volunteer for ${eventTitle}! 💚`);
      }
      return next;
    });
  };

  return (
    <DashboardLayout expectedRole="volunteer">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm mb-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-2xl font-bold text-white">
              {getGreeting()}, <span className="gradient-text">{userName.split(' ')[0]}</span>! 💚
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Thank you for volunteering! You&apos;ve contributed to{' '}
              <span className="text-accent font-semibold">3 events</span> this semester.
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl hidden md:block"
          >
            💚
          </motion.div>
        </div>
      </motion.div>

      {/* Volunteering Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 border border-accent/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-white">Volunteering Status</p>
              <Badge variant="green">Active Volunteer</Badge>
            </div>
            <p className="text-xs text-white/50">
              3 events completed · 12 hours contributed · Next event: Wellness Wednesday (Mar 13)
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-bold text-accent">12</p>
            <p className="text-xs text-white/40">hours</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Modules Done" value={completedModules.length} icon={CheckCircle2} color="teal" index={0} />
            <StatCard title="Pending" value={pendingModules.length} icon={Clock} color="yellow" index={1} />
            <StatCard title="Events Volunteered" value={3} icon={Heart} color="purple" index={2} />
            <StatCard title="Hours Contributed" value={12} icon={Trophy} color="blue" index={3} />
          </>
        )}
      </div>

      {/* Progress + Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-6">Course Progress</h2>
          <div className="w-32 h-32">
            <CircularProgressbar
              value={progressPercent}
              text={`${progressPercent}%`}
              styles={buildStyles({
                textColor: '#fff',
                textSize: '18px',
                pathColor: '#00C9A7',
                trailColor: 'rgba(255,255,255,0.08)',
              })}
            />
          </div>
          <p className="mt-4 text-sm text-white/60 text-center">
            <span className="text-white font-semibold">{completedModules.length}</span> of{' '}
            <span className="text-white font-semibold">{totalModules}</span> modules done
          </p>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent" /> My Modules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {student.modules.map((mod, i) => (
              <ModuleCard key={mod.id} module={mod} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming FH Events — Volunteer Section */}
      <div id="volunteer">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-accent" /> Upcoming FH Events
          </h2>
          <Badge variant="green">{mockEvents.length} events</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockEvents.map((event, i) => {
            const isRegistered = registeredEvents.has(event.id);
            const slotsLeft = (event.volunteerSlots ?? 0) - (isRegistered ? 1 : 0);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3 }}
                className="glass-card rounded-2xl p-5 group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-accent transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">{event.description}</p>
                  </div>
                  <Badge variant={event.type === 'wellness' ? 'green' : event.type === 'workshop' ? 'purple' : 'blue'}>
                    {event.type}
                  </Badge>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Calendar className="w-3 h-3 text-primary/60" />
                    {formatDate(event.date)} · {formatTime(event.time)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <MapPin className="w-3 h-3 text-accent/60" />
                    {event.venue}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Users className="w-3 h-3 text-primary/60" />
                    {event.registeredCount} registered · {slotsLeft} volunteer slot{slotsLeft !== 1 ? 's' : ''} left
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white/30">Capacity</span>
                    <span className="text-white/50">{event.registeredCount}/{event.capacity}</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                      style={{ width: `${(event.registeredCount / event.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                <Button
                  variant={isRegistered ? 'outline' : 'accent'}
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => handleRegister(event.id, event.title)}
                >
                  <Heart className={`w-3 h-3 ${isRegistered ? 'fill-accent text-accent' : ''}`} />
                  {isRegistered ? 'Registered as Volunteer ✓' : 'Register as Volunteer'}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Calendar */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" /> Event Calendar
        </h2>
        <MiniCalendar eventDates={eventDates} />
      </div>
    </DashboardLayout>
  );
}
