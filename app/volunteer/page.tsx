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

interface CommitmentItem {
  eventId: string;
  title: string;
  date: string;
  venue: string;
  role: string;
  status: string;
  type: 'VOLUNTEERING' | 'ATTENDING';
}

interface VolunteerData {
  name: string;
  rollNo: string;
  programme: string;
  department: string;
  year: number;
  batch: string;
  sessionsVolunteered: number;
  completedDuties: number;
  hoursVolunteered: number;
  workshopsAttended: number;
  availableEvents: AvailableEvent[];
  myDuties: AssignedDuty[];
  myCommitments: CommitmentItem[];
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
  status: 'AVAILABLE' | 'INTERESTED' | 'ASSIGNED' | 'REGISTERED';
}

interface AssignedDuty {
  eventId: string;
  title: string;
  date: string;
  venue: string;
  role: string;
  status: string;
}

export default function VolunteerDashboard() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [volunteerData, setVolunteerData] = useState<VolunteerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [engagementFilter, setEngagementFilter] = useState<'ALL' | 'VOLUNTEERING' | 'ATTENDING'>('ALL');

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

  const handleRegisterAsAttendee = async (eventId: string) => {
    try {
      // Call API to register as attendee
      await apiCall(`/events/${eventId}/register`, { method: 'POST' });
      toast.success('Registered as attendee!');
      
      // Refresh data
      const dashboardData = await apiCall('/volunteer/dashboard');
      setVolunteerData(dashboardData.data);
    } catch (error) {
      toast.error('Failed to register as attendee');
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

  const pastRecords = (volunteerData.completedEvents || [])
    .filter((e) => {
      if (engagementFilter === 'ALL') return true;
      return e.engagementType === engagementFilter;
    })
    .map((e) => ({
      date: formatDate(e.date),
      title: e.title,
      venue: e.venue || '—',
      instructorName: e.instructorName || '—',
      role: e.role || '—',
      engagementType: e.engagementType || 'VOLUNTEERING',
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

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Workshops Volunteered" value={volunteerData.sessionsVolunteered} icon={Heart} color="purple" />
        <StatCard title="Hours Volunteered" value={volunteerData.hoursVolunteered || 0} icon={Clock} color="teal" />
        <StatCard title="Workshops Attended" value={volunteerData.workshopsAttended || 0} icon={CheckCircle} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* My FH Commitments - All Engagements */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">My FH Commitments</h2>
            <p className="text-xs text-white/50 mb-4">All your upcoming engagements with Flourishing Hub</p>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-[10px] text-white/60">Volunteering</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-[10px] text-white/60">Attending as Participant</span>
              </div>
            </div>

            {(!volunteerData.myCommitments || volunteerData.myCommitments.length === 0) ? (
              <div className="text-center py-6 text-white/30 text-sm">No upcoming commitments</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {volunteerData.myCommitments.map((commitment) => {
                  const isVolunteering = commitment.type === 'VOLUNTEERING';
                  const borderColor = isVolunteering ? 'border-purple-500/30' : 'border-blue-500/30';
                  const bgGradient = isVolunteering 
                    ? 'from-purple-500/10 to-purple-500/5' 
                    : 'from-blue-500/10 to-blue-500/5';
                  const badgeColor = isVolunteering ? 'badge-purple' : 'badge-blue';
                  const roleColor = isVolunteering ? 'text-purple-400' : 'text-blue-400';
                  const iconColor = isVolunteering ? 'text-purple-400' : 'text-blue-400';
                  
                  return (
                    <motion.div
                      key={commitment.eventId}
                      whileHover={{ y: -2 }}
                      className={`glass-card rounded-xl p-4 border ${borderColor} relative overflow-hidden`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-50`} />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-white line-clamp-2">{commitment.title}</h4>
                          <span className={`${badgeColor} text-[10px] shrink-0`}>
                            {isVolunteering ? '🤝 Volunteer' : '👤 Participant'}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-white/60">
                          <p className={iconColor}>
                            <MapPin className="inline w-3 h-3 mr-1" />
                            {commitment.venue}
                          </p>
                          <p className={iconColor}>
                            <Clock className="inline w-3 h-3 mr-1" />
                            {formatDate(commitment.date)}
                          </p>
                          <p className={`${roleColor} font-medium`}>
                            Role: {commitment.role}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Events */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Available Events</h2>
            <p className="text-xs text-white/50 mb-4">Express interest to volunteer or register as attendee</p>
            {volunteerData.availableEvents.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">No upcoming events</div>
            ) : (
              <div className="space-y-3">
                {volunteerData.availableEvents.map((event) => (
                  <div key={event.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-1">{event.title}</h4>
                        <p className="text-xs text-white/50">{formatDate(event.startAt)}</p>
                        <p className="text-xs text-white/40"><MapPin className="inline w-3 h-3 mr-1" />{event.venue}</p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {event.status === 'ASSIGNED' ? (
                          <span className="badge-green text-[10px]">Assigned as Volunteer</span>
                        ) : event.status === 'REGISTERED' ? (
                          <span className="badge-blue text-[10px]">Registered as Attendee</span>
                        ) : event.status === 'INTERESTED' ? (
                          <button
                            onClick={() => handleWithdraw(event.id)}
                            className="btn-secondary text-xs px-3 py-1.5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all whitespace-nowrap"
                          >
                            Applied ✓ (Withdraw)
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleVolunteer(event.id)}
                              className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                            >
                              🤝 Apply as Volunteer
                            </button>
                            <button
                              onClick={() => handleRegisterAsAttendee(event.id)}
                              className="btn-secondary text-xs px-3 py-1.5 whitespace-nowrap"
                            >
                              👤 Register as Attendee
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Records */}
          <div className="glass-card rounded-2xl p-6" id="history">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Past Records</h2>
              
              {/* Engagement Type Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEngagementFilter('ALL')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                    engagementFilter === 'ALL'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setEngagementFilter('VOLUNTEERING')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                    engagementFilter === 'VOLUNTEERING'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  🤝 Volunteering
                </button>
                <button
                  onClick={() => setEngagementFilter('ATTENDING')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                    engagementFilter === 'ATTENDING'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  👤 Attending
                </button>
              </div>
            </div>
            
            <DataTable
              data={pastRecords as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'date', label: 'Date', sortable: true },
                { key: 'title', label: 'Event Name', sortable: true },
                { key: 'instructorName', label: 'Instructor', sortable: true },
                { key: 'venue', label: 'Venue' },
                { 
                  key: 'engagementType', 
                  label: 'Type',
                  render: (value: string) => (
                    <span className={value === 'VOLUNTEERING' ? 'badge-purple text-[10px]' : 'badge-blue text-[10px]'}>
                      {value === 'VOLUNTEERING' ? '🤝 Volunteer' : '👤 Participant'}
                    </span>
                  )
                },
              ]}
              searchKeys={['title', 'instructorName'] as never[]}
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
