'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, Users, Clock, CheckCircle, Wifi, WifiOff, MapPin, 
  Calendar, ExternalLink, Bell, User, Filter
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import MiniCalendar from '@/components/MiniCalendar';
import { formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

// Custom date format for instructor: "May 6, Wed, 2026"
function formatInstructorDate(dateStr: string | Date): string {
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const year = date.getFullYear();
  return `${month} ${day}, ${weekday}, ${year}`;
}

type WorkshopFilter = 'all' | 'open' | 'course';
type CourseFilter = 'all' | 'mentorship' | 'leadership' | 'wellness';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface Session {
  id: string;
  title: string;
  eventTitle: string;
  venue: string;
  startAt: string;
  endAt: string;
  mode: 'online' | 'in-classroom';
  meetLink?: string;
}

interface InstructorData {
  basicInfo: {
    name: string;
    designation: string;
    department: string;
    employeeId?: string;
    profilePicture?: string;
  };
  upcomingSessions: Session[];
  pastSessions: Session[];
  calendarData: Array<{
    id: string;
    title: string;
    startAt: string;
  }>;
}

function SessionCard({ session }: { session: Session }) {
  const startDate = new Date(session.startAt);
  const endDate = new Date(session.endAt);
  
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight mb-1">
            {session.eventTitle}
          </h3>
          <p className="text-xs text-white/50">{session.title}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
          session.mode === 'online'
            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
        }`}>
          {session.mode === 'online' ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          {session.mode === 'online' ? 'Online' : 'In-Classroom'}
        </span>
      </div>
      
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Calendar className="w-3.5 h-3.5 text-primary/70" />
          <span>{formatInstructorDate(startDate)}</span>
          <Clock className="w-3.5 h-3.5 text-primary/70 ml-1" />
          <span>{formatTime(startDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <MapPin className="w-3.5 h-3.5 text-accent/70" />
          <span className="truncate">{session.venue}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {session.mode === 'online' && session.meetLink && (
          <motion.a
            href={session.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.95 }}
            className="flex-1 btn-primary py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Meet Link
          </motion.a>
        )}
        {session.mode === 'in-classroom' && (
          <div className="flex-1 text-center py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60">
            In-person session
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PastSessionCard({ session }: { session: Session }) {
  const startDate = new Date(session.startAt);
  
  return (
    <div className="glass-card rounded-xl p-4 grid grid-cols-[120px_1fr_auto] gap-4 items-center">
      {/* Date Column - First */}
      <div className="text-center">
        <div className="text-lg font-bold text-white">{startDate.getDate()}</div>
        <div className="text-xs text-white/50">{startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
        <div className="text-[10px] text-white/30 mt-1">{startDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
      </div>
      
      {/* Workshop Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-0.5 truncate">{session.eventTitle}</h4>
            <p className="text-xs text-white/40 truncate">{session.title}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
            session.mode === 'online'
              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
          }`}>
            {session.mode === 'online' ? 'Online' : 'In-Classroom'}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-white/50">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{formatTime(startDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{session.venue}</span>
          </div>
        </div>
      </div>
      
      {/* Feedback Rating */}
      <div className="text-center">
        <div className="flex items-center gap-1 text-yellow-400 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          ))}
        </div>
        <p className="text-[10px] text-white/30">Feedback</p>
      </div>
    </div>
  );
}

export default function InstructorDashboard() {
  const [data, setData] = useState<InstructorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [workshopFilter, setWorkshopFilter] = useState<WorkshopFilter>('all');
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
  const [pastWorkshopFilter, setPastWorkshopFilter] = useState<WorkshopFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instructor/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }

      setData(result.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-white/50">Failed to load dashboard data</p>
        </div>
      </DashboardLayout>
    );
  }

  const todaySessions = data.upcomingSessions.filter(session => {
    const sessionDate = new Date(session.startAt);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  });

  // Students Impacted - count from past sessions attendance
  const studentsImpacted = data.pastSessions.length * 20; // Will be replaced with actual attendance count

  // Filter workshops based on type
  const getFilteredWorkshops = () => {
    let filtered = data.upcomingSessions;
    
    // Apply workshop type filter
    if (workshopFilter === 'open') {
      filtered = filtered.filter(s => s.eventTitle.toLowerCase().includes('open') || 
                                      !s.eventTitle.toLowerCase().includes('course'));
    } else if (workshopFilter === 'course') {
      filtered = filtered.filter(s => s.eventTitle.toLowerCase().includes('course'));
      
      // Apply course sub-filter
      if (courseFilter !== 'all') {
        filtered = filtered.filter(s => 
          s.eventTitle.toLowerCase().includes(courseFilter)
        );
      }
    }
    
    return filtered;
  };

  const filteredWorkshops = getFilteredWorkshops();

  // Filter past workshops
  const getFilteredPastWorkshops = () => {
    let filtered = data.pastSessions;
    
    // Apply workshop type filter
    if (pastWorkshopFilter === 'open') {
      filtered = filtered.filter(s => s.eventTitle.toLowerCase().includes('open') || 
                                      !s.eventTitle.toLowerCase().includes('course'));
    } else if (pastWorkshopFilter === 'course') {
      filtered = filtered.filter(s => s.eventTitle.toLowerCase().includes('course'));
    }
    
    // Apply date range filter
    if (dateRange.startDate) {
      filtered = filtered.filter(s => new Date(s.startAt) >= new Date(dateRange.startDate));
    }
    if (dateRange.endDate) {
      filtered = filtered.filter(s => new Date(s.startAt) <= new Date(dateRange.endDate));
    }
    
    return filtered;
  };

  const filteredPastWorkshops = getFilteredPastWorkshops();

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            <span className="gradient-text">{data.basicInfo.name}</span>
          </h1>
          <p className="text-sm text-white/50 mt-1">
            {data.basicInfo.department && 
             data.basicInfo.department !== 'Humanities and Social Sciences' && 
             data.basicInfo.department !== 'Humanities & Social Sciences' && 
             data.basicInfo.department}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Bell className="w-4 h-4 text-white/60" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <User className="w-4 h-4 text-white/60" />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Upcoming Workshops" 
          value={data.upcomingSessions.length} 
          icon={Video} 
          color="purple" 
        />
        <StatCard 
          title="Completed Workshops" 
          value={data.pastSessions.length} 
          icon={CheckCircle} 
          color="teal" 
        />
        <StatCard 
          title="Today's Sessions" 
          value={todaySessions.length} 
          icon={Clock} 
          color="yellow" 
        />
        <StatCard 
          title="Students Impacted" 
          value={studentsImpacted} 
          icon={Users} 
          color="blue" 
        />
      </div>

      {/* Analytics Section */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Analytics Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Users Impacted */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wider">Total Users Impacted</p>
            <p className="text-2xl font-bold text-white">{studentsImpacted}</p>
            <p className="text-xs text-white/30">Across all workshops</p>
          </div>
          
          {/* Total Past Workshops */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wider">Total Past Workshops</p>
            <p className="text-2xl font-bold text-white">{data.pastSessions.length}</p>
            <p className="text-xs text-white/30">Successfully completed</p>
          </div>
          
          {/* Active Workshops */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wider">Active Workshops</p>
            <p className="text-2xl font-bold text-white">{todaySessions.length}</p>
            <p className="text-xs text-white/30">Happening today</p>
          </div>
          
          {/* Session Load */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wider">Session Load</p>
            <p className="text-2xl font-bold text-white">{data.upcomingSessions.length + data.pastSessions.length}</p>
            <p className="text-xs text-white/30">Total sessions assigned</p>
          </div>
          
          {/* This Week */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wider">This Week</p>
            <p className="text-2xl font-bold text-white">
              {data.upcomingSessions.filter(s => {
                const sessionDate = new Date(s.startAt);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return sessionDate <= weekFromNow;
              }).length}
            </p>
            <p className="text-xs text-white/30">Upcoming sessions</p>
          </div>
          
          {/* Average per Month */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wider">Avg per Month</p>
            <p className="text-2xl font-bold text-white">
              {Math.round((data.pastSessions.length + data.upcomingSessions.length) / 3)}
            </p>
            <p className="text-xs text-white/30">Sessions conducted</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Workshops */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Upcoming Workshops</h2>
              <span className="text-xs text-white/40">
                {filteredWorkshops.length} workshop{filteredWorkshops.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Filters */}
            <div className="mb-4 space-y-3">
              {/* Workshop Type Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-white/40" />
                <button
                  onClick={() => setWorkshopFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    workshopFilter === 'all'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  All Workshops
                </button>
                <button
                  onClick={() => setWorkshopFilter('open')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    workshopFilter === 'open'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Open Workshops
                </button>
                <button
                  onClick={() => { setWorkshopFilter('course'); setCourseFilter('all'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    workshopFilter === 'course'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Course Workshops
                </button>
              </div>
              
              {/* Course Sub-Filter */}
              {workshopFilter === 'course' && (
                <div className="flex items-center gap-2 flex-wrap pl-6">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">Course Type:</span>
                  <button
                    onClick={() => setCourseFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      courseFilter === 'all'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    All Courses
                  </button>
                  <button
                    onClick={() => setCourseFilter('mentorship')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      courseFilter === 'mentorship'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Mentorship
                  </button>
                  <button
                    onClick={() => setCourseFilter('leadership')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      courseFilter === 'leadership'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Leadership
                  </button>
                  <button
                    onClick={() => setCourseFilter('wellness')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      courseFilter === 'wellness'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Wellness
                  </button>
                </div>
              )}
            </div>
            
            {filteredWorkshops.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">
                No workshops found for selected filter
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredWorkshops.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>

          {/* Completed Workshops */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Completed Workshops</h2>
              <span className="text-xs text-white/40">
                {filteredPastWorkshops.length} completed
              </span>
            </div>
            
            {/* Filters */}
            <div className="mb-4 space-y-3">
              {/* Workshop Type Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-white/40" />
                <button
                  onClick={() => setPastWorkshopFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    pastWorkshopFilter === 'all'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  All Workshops
                </button>
                <button
                  onClick={() => setPastWorkshopFilter('open')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    pastWorkshopFilter === 'open'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Open Workshops
                </button>
                <button
                  onClick={() => setPastWorkshopFilter('course')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    pastWorkshopFilter === 'course'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Course Workshops
                </button>
              </div>
              
              {/* Date Range Filter */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Date Range:</span>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="input-dark px-3 py-1.5 rounded-lg text-xs"
                  placeholder="Start Date"
                />
                <span className="text-white/30">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="input-dark px-3 py-1.5 rounded-lg text-xs"
                  placeholder="End Date"
                />
                {(dateRange.startDate || dateRange.endDate) && (
                  <button
                    onClick={() => setDateRange({ startDate: '', endDate: '' })}
                    className="text-xs text-white/40 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            {filteredPastWorkshops.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">
                No completed workshops found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPastWorkshops.map((session) => (
                  <PastSessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Calendar */}
          <MiniCalendar
            registeredEventDates={data.upcomingSessions.map(s => s.startAt)}
            unregisteredEventDates={data.pastSessions.map(s => s.startAt)}
          />

          {/* Profile Card */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Profile</h3>
            
            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xl font-bold text-white overflow-hidden">
                  {data.basicInfo.profilePicture ? (
                    <img 
                      src={data.basicInfo.profilePicture} 
                      alt={data.basicInfo.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    data.basicInfo.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => {
                    toast('Profile picture upload coming soon!', { icon: '📸' });
                  }}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2">Click to upload photo</p>
            </div>
            
            <div className="space-y-3">
              {[
                ['Name', data.basicInfo.name],
                ...(data.basicInfo.employeeId ? [['Instructor ID', data.basicInfo.employeeId]] : []),
                ...(data.basicInfo.department && 
                    data.basicInfo.department !== 'Humanities and Social Sciences' && 
                    data.basicInfo.department !== 'Humanities & Social Sciences' 
                    ? [['Specialization', data.basicInfo.department]] 
                    : []),
                ['Role', 'Instructor'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
                  <p className="text-xs text-white/80 font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Online Workshops</span>
                <span className="text-sm font-semibold text-blue-400">
                  {data.upcomingSessions.filter(s => s.mode === 'online').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">In Classroom Workshops</span>
                <span className="text-sm font-semibold text-teal-400">
                  {data.upcomingSessions.filter(s => s.mode === 'in-classroom').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">This Week</span>
                <span className="text-sm font-semibold text-primary">
                  {data.upcomingSessions.filter(s => {
                    const sessionDate = new Date(s.startAt);
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return sessionDate <= weekFromNow;
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
