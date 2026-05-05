'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Heart, CheckCircle, Clock, MapPin } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import MiniCalendar from '@/components/MiniCalendar';
import DataTable from '@/components/DataTable';
import { getCurrentUser, apiCall } from '@/lib/api';
import { formatDate, renderStars } from '@/lib/utils';
import type { CompletedEvent, AuthPayload } from '@/types';
import toast from 'react-hot-toast';

interface VolunteerData {
  name: string;
  rollNo: string;
  programme: string;
  department: string;
  year: number;
  batch: string;
  sessionsVolunteered: number;
  completedDuties: number;
  availableEvents: AvailableEvent[];
  myDuties: AssignedDuty[];
  completedEvents: CompletedEvent[];
  interestedEventIds: string[];
  assignedEventIds: string[];
}

interface AvailableEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  venue: string;
  status: 'AVAILABLE' | 'INTERESTED' | 'ASSIGNED';
}

interface AssignedDuty {
  eventId: string;
  title: string;
  date: string;
  venue: string;
  role: string;
  status: string;
}

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
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">Venue</span>
          <span className="font-medium text-white">{event.venue || '—'}</span>
        </div>
        {event.role && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">Role</span>
            <span className="text-purple-400 font-medium">{event.role}</span>
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
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [volunteerData, setVolunteerData] = useState<VolunteerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        const dashboardData = await apiCall('/volunteer/dashboard');
        setVolunteerData(dashboardData.data);
      } catch (error) {
        console.error('Failed to load volunteer data:', error);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !volunteerData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-white/50">Loading...</div>
      </DashboardLayout>
    );
  }

  const handleVolunteer = async (eventId: string) => {
    try {
      // Call API to express interest
      await apiCall(`/events/${eventId}/volunteer`, { method: 'POST' });
      toast.success('Interest registered!');
      
      // Refresh data
      const dashboardData = await apiCall('/volunteer/dashboard');
      setVolunteerData(dashboardData.data);
    } catch (error) {
      toast.error('Failed to register interest');
    }
  };

  const handleWithdraw = async (eventId: string) => {
    try {
      // Call API to withdraw interest
      await apiCall(`/events/${eventId}/volunteer/withdraw`, { method: 'DELETE' });
      toast.success('Interest withdrawn!');
      
      // Refresh data
      const dashboardData = await apiCall('/volunteer/dashboard');
      setVolunteerData(dashboardData.data);
    } catch (error) {
      toast.error('Failed to withdraw interest');
    }
  };

  const pastRecords = (volunteerData.completedEvents || []).map((e) => ({
    title: e.title,
    date: formatDate(e.date),
    venue: e.venue || '—',
    role: e.role || '—',
    status: 'Completed',
  }));

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          Welcome, <span className="gradient-text">{volunteerData.name}</span>
        </h1>
        <p className="text-sm text-white/50 mt-1">
          {volunteerData.programme} · {volunteerData.department} · Year {volunteerData.year}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Sessions Volunteered" value={volunteerData.sessionsVolunteered} icon={Heart} color="purple" />
        <StatCard title="Completed Duties" value={volunteerData.completedDuties} icon={CheckCircle} color="teal" />
        <StatCard title="Assigned Duties" value={volunteerData.myDuties.length} icon={Calendar} color="yellow" />
        <StatCard title="Roll No" value={volunteerData.rollNo} icon={Clock} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* My Duties - Assigned Events */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">My Duties</h2>
            <p className="text-xs text-white/50 mb-4">Events where you have been assigned by admin</p>
            {volunteerData.myDuties.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">No assigned duties yet</div>
            ) : (
              <div className="space-y-3">
                {volunteerData.myDuties.map((duty) => (
                  <div key={duty.eventId} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-white">{duty.title}</h4>
                      <span className="badge-yellow text-[10px]">Assigned</span>
                    </div>
                    <div className="space-y-1 text-xs text-white/60">
                      <p><MapPin className="inline w-3 h-3 mr-1" />{duty.venue}</p>
                      <p><Clock className="inline w-3 h-3 mr-1" />{formatDate(duty.date)}</p>
                      <p className="text-purple-400 font-medium">Role: {duty.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Events */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Available Events</h2>
            <p className="text-xs text-white/50 mb-4">Express interest to volunteer</p>
            {volunteerData.availableEvents.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">No upcoming events</div>
            ) : (
              <div className="space-y-3">
                {volunteerData.availableEvents.map((event) => (
                  <div key={event.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-1">{event.title}</h4>
                        <p className="text-xs text-white/50">{formatDate(event.startAt)}</p>
                        <p className="text-xs text-white/40"><MapPin className="inline w-3 h-3 mr-1" />{event.venue}</p>
                      </div>
                      {event.status === 'ASSIGNED' ? (
                        <span className="badge-green text-[10px]">Assigned</span>
                      ) : event.status === 'INTERESTED' ? (
                        <button
                          onClick={() => handleWithdraw(event.id)}
                          className="btn-secondary text-xs px-3 py-1.5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                        >
                          Applied ✓ (Click to withdraw)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVolunteer(event.id)}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          Apply as Volunteer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Events */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Completed Duties</h2>
            {(!volunteerData.completedEvents || volunteerData.completedEvents.length === 0) ? (
              <div className="text-center py-6 text-white/30 text-sm">No completed duties yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {volunteerData.completedEvents.map((event) => (
                  <CompletedEventCard key={event.eventId} event={event} />
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6" id="history">
            <h2 className="text-base font-semibold text-white mb-4">Past Records</h2>
            <DataTable
              data={pastRecords as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'title', label: 'Event Name', sortable: true },
                { key: 'date', label: 'Date', sortable: true },
                { key: 'role', label: 'Role' },
                { key: 'status', label: 'Status', render: () => <span className="badge-green">Completed</span> },
              ]}
              searchKeys={['title'] as never[]}
              searchPlaceholder="Search records..."
              emptyMessage="No past records"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Profile</h3>
            <div className="space-y-2.5">
              {[
                ['Name', volunteerData.name],
                ['Roll No', volunteerData.rollNo],
                ['Programme', volunteerData.programme],
                ['Department', volunteerData.department],
                ['Year', `Year ${volunteerData.year}`],
                ['Batch', volunteerData.batch],
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
