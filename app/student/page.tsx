'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, MapPin, Star, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import MiniCalendar from '@/components/MiniCalendar';
import DataTable from '@/components/DataTable';
import { getCurrentUser, apiCall } from '@/lib/api';
import { formatDate, formatTime, renderStars } from '@/lib/utils';
import { isEventLive, isEventUpcoming } from '@/lib/dateUtils';
import { getRegistrationMetrics, getRegisteredEventIds } from '@/lib/registrationUtils';
import type { CompletedEvent, AuthPayload } from '@/types';
import toast from 'react-hot-toast';

function CompletedEventCard({ event }: { event: CompletedEvent }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="glass-card rounded-2xl p-4 cursor-default relative overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 ${hovered ? 'opacity-100' : ''}`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-white line-clamp-2">{event.title}</h4>
          <span className="badge-green text-[10px] shrink-0">✓ Done</span>
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
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const router = useRouter();

  // Fetch user data, events, and registrations from backend API
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.log("❌ No token found in localStorage");
      setLoading(false);
      return;
    }

    // ✅ CRITICAL: Add timeout to prevent stuck loading
    const timeoutId = setTimeout(() => {
      console.log("⚠️ Student dashboard API timeout - setting loading to false");
      setLoading(false);
      toast.error('Loading timeout. Please refresh the page.');
    }, 10000); // 10 second timeout for better UX

    const fetchData = async () => {
      try {
        // 🚀 OPTIMIZATION: Use cached user data if available, but also fetch fresh data
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            setUser(userData);
            console.log("✅ Using cached user data:", userData.name);
          } catch (e) {
            console.log("⚠️ Invalid cached user data, fetching fresh");
          }
        }
        
        // Always fetch fresh user data from backend to ensure profile is up-to-date
        console.log("🔄 Fetching fresh user data from API...");
        const userResponse = await getCurrentUser();
        const freshUserData = userResponse?.data?.data || userResponse?.data || userResponse;
        
        // Transform and set fresh user data
        const transformedUser = {
          id: freshUserData.id,
          email: freshUserData.email,
          name: freshUserData.name,
          role: freshUserData.role.toLowerCase(),
          rollNo: freshUserData.studentProfile?.rollNumber,
          empId: freshUserData.employeeId || freshUserData.adminProfile?.employeeId,
          department: freshUserData.studentProfile?.department || freshUserData.instructorProfile?.department,
          year: freshUserData.studentProfile?.yearOfStudy,
          batch: freshUserData.studentProfile?.cohort,
          programme: freshUserData.studentProfile?.programme,
          iat: Date.now(),
        };
        
        setUser(transformedUser);
        
        // Update localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(transformedUser));
        console.log("✅ Fresh user data loaded and cached:", transformedUser.name);

        // 🚀 OPTIMIZATION: Fetch both events and registrations in parallel
        console.log("🔄 Fetching events and registrations in parallel...");
        const [eventsResponse, registrationsResponse] = await Promise.all([
          apiCall('/events'),
          apiCall('/registrations/me')
        ]);
        
        console.log("📦 Student events received:", eventsResponse);
        console.log("📦 User registrations received:", registrationsResponse);
        
        // Transform events to match frontend format
        const transformedEvents = eventsResponse.data.items.map((event: any) => {
          try {
            const startDate = new Date(event.startAt);
            return {
              id: event.id,
              title: event.title || 'Untitled Event',
              description: event.description || '',
              date: startDate.toISOString().split('T')[0],
              time: startDate.toTimeString().slice(0, 5),
              venue: event.venue || 'TBD',
              mode: event.meetLink ? 'Online' : 'In Classroom',
              capacity: event.capacity || 0,
              registeredCount: event._count?.registrations || 0,
              status: event.status?.toLowerCase() || 'draft',
              organizer: event.createdBy?.name || 'Admin'
            };
          } catch (error) {
            console.error("❌ Error transforming event:", event, error);
            return {
              id: event.id || 'unknown',
              title: event.title || 'Untitled Event',
              description: event.description || '',
              date: '2026-05-04', // Fallback date
              time: '10:00', // Fallback time
              venue: event.venue || 'TBD',
              mode: 'In Classroom',
              capacity: 0,
              registeredCount: 0,
              status: 'draft',
              organizer: 'Admin'
            };
          }
        });
        
        setEvents(transformedEvents);
        console.log("✅ Student events loaded:", transformedEvents.length);

        // Process registrations data
        const userRegistrations = registrationsResponse.data || [];
        setRegistrations(userRegistrations);
        
        // 🔥 FIX: Use safe registration utilities (eliminates duplicate logic)
        const registrationMetrics = getRegistrationMetrics(userRegistrations);
        const registeredEventIds = getRegisteredEventIds(userRegistrations);
        setRegisteredEvents(registeredEventIds);
        
        console.log("✅ User registrations loaded:", userRegistrations.length);
        console.log("🔍 Active registrations:", registrationMetrics.activeCount);
        console.log("🔍 Active registered event IDs:", registeredEventIds);
        
      } catch (err: any) {
        console.error("❌ Data fetch failed:", err);
        // Fallback to mock data if API fails
        console.log("⚠️ Using fallback mock data for student dashboard");
        const { mockEvents } = await import('@/lib/mockData');
        setEvents(mockEvents);
        
        console.log("❌ Redirecting due to auth failure");
        // If 401, token is invalid - redirect handled by apiCall
        if (err.status !== 401) {
          console.error("❌ Error details:", err.response?.status, err.response?.data);
        }
      } finally {
        clearTimeout(timeoutId); // Clear the timeout
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate active and upcoming events using safe date utilities
  const now = new Date();
  
  // Active event: currently happening (using timezone-safe logic)
  const activeEvent = events.find(event => {
    return isEventLive(event.date + 'T' + event.time);
  });
  
  // Upcoming events: future events (using timezone-safe logic)
  const upcomingEvents = events.filter(event => {
    return isEventUpcoming(event.date + 'T' + event.time);
  });

  // 🔥 CRITICAL: Calculate registered events using safe utilities
  const registrationMetrics = getRegistrationMetrics(registrations);
  const { active: activeRegistrations, completed: completedRegistrations, totalParticipations } = registrationMetrics;

  const upcomingRegistered = activeRegistrations.filter(registration => {
    return isEventUpcoming(registration.event.startAt);
  }).map(registration => {
    // Transform registration.event to match frontend format
    const startDate = new Date(registration.event.startAt);
    return {
      id: registration.event.id,
      title: registration.event.title,
      description: registration.event.description || '',
      date: startDate.toISOString().split('T')[0],
      time: startDate.toTimeString().slice(0, 5),
      venue: registration.event.venue || 'TBD',
      mode: registration.event.meetLink ? 'Online' : 'In Classroom',
      capacity: registration.event.capacity || 0,
      registeredCount: registration.event._count?.registrations || 0,
      status: registration.event.status?.toLowerCase() || 'published',
      organizer: registration.event.createdBy?.name || 'Admin'
    };
  });

  // Calendar data based on real registrations (with safe mapping)
  const registeredEventDates = registrations
    .filter(reg => reg.event && reg.event.startAt)
    .map(reg => new Date(reg.event.startAt).toISOString().split('T')[0]);

  const unregisteredEventDates = events
    .filter((e) => !registeredEvents.includes(e.id))
    .map((e) => e.date);

  console.log("📊 Dashboard calculations:");
  console.log("🔴 Active event:", activeEvent?.title || "None");
  console.log("📋 Upcoming events:", upcomingEvents.length);
  console.log("✅ Active registrations:", activeRegistrations.length);
  console.log("✅ Registered upcoming:", upcomingRegistered.length);
  console.log("🎯 Completed registrations:", completedRegistrations.length);
  console.log("📈 Total participations:", totalParticipations);

  // Mock past records (will be replaced with API data later)
  const pastRecords = [
    {
      title: 'Academic Stress Workshop',
      date: formatDate('2026-04-15'),
      venue: 'LT 101',
      marks: '85/100',
      rating: renderStars(4),
      status: 'Completed',
    },
    {
      title: 'Mental Health Awareness Talk',
      date: formatDate('2026-04-10'),
      venue: 'Seminar Hall',
      marks: '92/100',
      rating: renderStars(5),
      status: 'Completed',
    }
  ];

  // Transform completed registrations to CompletedEvent format
  const completedEvents: CompletedEvent[] = completedRegistrations.map(registration => ({
    eventId: registration.eventId,
    title: registration.event.title,
    date: new Date(registration.event.startAt).toISOString().split('T')[0],
    venue: registration.event.venue || 'TBD',
    marks: 85, // TODO: Get from ModuleProgress when available
    maxMarks: 100,
    starRating: 4, // TODO: Get from Feedback when available
  }));

  const handleRegister = async (eventId: string) => {
    try {
      console.log("🔄 Registering for event:", eventId);
      
      if (registeredEvents.includes(eventId)) {
        toast.error('Already registered for this event');
        return;
      }

      const response = await apiCall('/registrations', {
        method: 'POST',
        body: JSON.stringify({
          eventId,
          asVolunteer: false
        })
      });

      if (response.success) {
        setRegisteredEvents(prev => [...prev, eventId]);
        toast.success('Successfully registered for event!');
        
        // Refresh registrations
        const registrationsResponse = await apiCall('/registrations/me');
        const updatedRegistrations = registrationsResponse.data || [];
        setRegistrations(updatedRegistrations);
        
        // Update registered event IDs
        const updatedRegisteredEventIds = getRegisteredEventIds(updatedRegistrations);
        setRegisteredEvents(updatedRegisteredEventIds);
      }
    } catch (error) {
      console.error("❌ Registration failed:", error);
      toast.error('Registration failed. Please try again.');
    }
  };

  console.log("loading:", loading);
  console.log("user:", user);

  return (
    <DashboardLayout user={user} loading={loading}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          Welcome, <span className="gradient-text">{user?.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <p className="text-sm text-white/50 mt-1">
          {user?.programme || 'N/A'} · {user?.department || 'N/A'} · Year {user?.year || 'N/A'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Active Registrations" value={activeRegistrations.length} icon={Calendar} color="purple" />
        <StatCard title="Completed Events" value={completedRegistrations.length} icon={CheckCircle} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Status */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Event Status</h2>

            {/* Live Events - NEW SECTION */}
            {events.filter(event => isEventLive(event.date + 'T' + event.time)).length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  Live Events
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide mb-6">
                  {events.filter(event => isEventLive(event.date + 'T' + event.time)).map((event) => (
                    <div 
                      key={event.id} 
                      className="flex-shrink-0 w-72 p-3 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/15 transition-all cursor-pointer"
                      onClick={() => router.push(`/student/events/${event.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{event.title}</p>
                          <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(event.date)}, {formatTime(event.time)}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue?.split(',')[0] || 'TBD'}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/30 text-red-400 text-[10px] font-semibold shrink-0">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                          LIVE
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Completed Events */}
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Completed Events</h3>
            {completedEvents.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">No completed events yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {completedEvents.map((event) => (
                  <CompletedEventCard key={event.eventId} event={event} />
                ))}
              </div>
            )}

            {/* Upcoming Events */}
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Upcoming Registered Events</h3>
            {upcomingRegistered.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming registered events</p>
                <p className="text-xs text-white/20 mt-1">Register for events to see them here</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {upcomingRegistered.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex-shrink-0 w-72 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all cursor-pointer"
                    onClick={() => router.push(`/student/events/${event.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{event.title}</p>
                        <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(event.date)}, {formatTime(event.time)}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue?.split(',')[0] || 'TBD'}</span>
                        </div>
                      </div>
                      <span className="badge-purple text-[10px] shrink-0">Registered</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Upcoming Events to Register */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">All Events</h2>
            
            {/* Horizontal Slider */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {[...(activeEvent ? [activeEvent] : []), ...upcomingEvents].map((event) => (
                <div 
                  key={event.id} 
                  className="flex-shrink-0 w-80 rounded-xl overflow-hidden bg-white/[0.03] border border-white/5 hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => {
                    router.push(`/student/events/${event.id}`);
                  }}
                >
                  {/* Event Image */}
                  <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                    <img 
                      src={`https://source.unsplash.com/400x200/?workshop,meditation,wellness,${encodeURIComponent(event.title)}`}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        // Fallback gradient if image fails
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Live Badge */}
                    {isEventLive(event.date + 'T' + event.time) && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-semibold flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE NOW
                      </div>
                    )}
                    {/* Mode Badge */}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/50 text-white text-xs font-medium">
                      {event.mode}
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* Event Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{event.title}</h3>
                    <p className="text-sm text-white/60 mb-3 line-clamp-2">
                      {event.description || 'Join us for an amazing workshop experience designed to enhance your wellbeing and personal growth.'}
                    </p>
                    
                    {/* Event Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(event.date)} at {formatTime(event.time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <MapPin className="w-3 h-3" />
                        <span>{event.venue?.split(',')[0] || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Users className="w-3 h-3" />
                        <span>{event.registeredCount}/{event.capacity || 'Unlimited'} registered</span>
                      </div>
                    </div>
                    
                    {/* Register Button */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleRegister(event.id);
                      }}
                      disabled={registeredEvents.includes(event.id)}
                      className={`w-full px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 ${
                        registeredEvents.includes(event.id)
                          ? 'bg-primary/15 text-primary border-primary/30 cursor-default'
                          : 'bg-white/5 text-white/60 border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30 hover:shadow-lg'
                      }`}
                    >
                      {registeredEvents.includes(event.id) ? '✓ Registered' : 'Register Now'}
                    </motion.button>
                  </div>
                </div>
              ))}
              
              {/* Empty State */}
              {[...(activeEvent ? [activeEvent] : []), ...upcomingEvents].length === 0 && (
                <div className="flex-shrink-0 w-80 h-64 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/40 text-sm">No upcoming events</p>
                  </div>
                </div>
              )}
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
            events={events}
            registrations={registrations}
          />

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Profile</h3>
            <div className="space-y-2.5">
              {[
                ['Name', user?.name || 'N/A'],
                ['Roll No', user?.rollNo || 'N/A'],
                ['Programme', user?.programme || 'N/A'],
                ['Department', user?.department || 'N/A'],
                ['Year', user?.year ? `Year ${user.year}` : 'N/A'],
                ['Batch', user?.batch || 'N/A'],
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
