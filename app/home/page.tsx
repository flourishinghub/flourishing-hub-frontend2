'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Sparkles, Calendar, ArrowRight, Star, MapPin, Clock, Users, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { getRolePath, formatDate, formatTime } from '@/lib/utils';
import { getCurrentUser, apiCall } from '@/lib/api';
import { mockEvents } from '@/lib/mockData';
import DashboardLayout from '@/components/DashboardLayout';
import EventCard from '@/components/EventCard';
import FlourishingTagline from '@/components/FlourishingTagline';
import type { AuthPayload } from '@/types';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [volunteerStates, setVolunteerStates] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Fetch user data and events from backend API
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      router.push("/login");
      setLoading(false); // ✅ FIX: Set loading false before return
      return;
    }
    
    // ✅ CRITICAL: Add timeout to prevent stuck loading
    const timeoutId = setTimeout(() => {
      console.log("⚠️ API call timeout - setting loading to false");
      setLoading(false);
    }, 10000); // 10 second timeout
    
    const fetchData = async () => {
      try {
        // Fetch user data
        const userData = await getCurrentUser();
        
        // Transform backend user data with safe access
        const transformedUser: AuthPayload = {
          id: userData?.id || 'unknown',
          email: userData?.email || '',
          name: userData?.name || 'User',
          role: (userData?.role?.toLowerCase().replace(/_/g, '-') || 'student') as AuthPayload['role'],
          department: userData?.studentProfile?.department || 
                     userData?.instructorProfile?.department || 
                     userData?.adminProfile?.department || 
                     'IIT Bombay',
          rollNo: userData?.studentProfile?.rollNumber,
          empId: userData?.adminProfile?.employeeId || userData?.employeeId,
          year: userData?.studentProfile?.yearOfStudy,
          batch: userData?.studentProfile?.cohort,
          programme: userData?.studentProfile?.programme || 'Staff',
          iat: Date.now(),
        };
        
        setUser(transformedUser);
        localStorage.setItem('user', JSON.stringify(transformedUser));

        // Fetch real events from backend
        console.log("🔄 Fetching events from backend...");
        const eventsResponse = await apiCall('/events'); // Use public events endpoint
        console.log("📦 Events received:", eventsResponse);
        
        // Transform events to match frontend format
        const transformedEvents = eventsResponse.data.items.map((event: any) => {
          try {
            const startDate = new Date(event.startAt);
            return {
              id: event.id, // ✅ CRITICAL: Keep original database ID
              title: event.title || 'Untitled Event',
              description: event.description || '',
              date: startDate.toISOString().split('T')[0],
              time: startDate.toTimeString().slice(0, 5),
              venue: event.venue || 'TBD',
              mode: event.meetLink ? 'Online' : 'In Classroom',
              capacity: event.capacity || 0,
              registeredCount: event._count?.registrations || 0,
              status: event.status?.toLowerCase() || 'draft', // Keep original status from backend
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
        console.log("✅ Events loaded:", transformedEvents.length);
        console.log("🔍 Event IDs:", transformedEvents.map((e: any) => ({ id: e.id, title: e.title })));

        // 🔥 CRITICAL: Fetch user's registrations to show correct button states
        console.log("🔄 Fetching user registrations for home page...");
        const registrationsResponse = await apiCall('/registrations/me');
        console.log("📦 User registrations received:", registrationsResponse);
        
        const userRegistrations = registrationsResponse.data || [];
        setRegistrations(userRegistrations);
        console.log("✅ User registrations loaded:", userRegistrations.length);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to mock data if API fails
        console.log("⚠️ Using fallback mock data");
        const { mockEvents } = await import('@/lib/mockData');
        setEvents(mockEvents);
        
        // Only redirect to login if it's an auth error
        if ((error as any)?.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } finally {
        clearTimeout(timeoutId); // Clear the timeout
        setLoading(false); // ✅ CRITICAL: Always set loading to false
      }
    };
    
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent animate-pulse" />
      </div>
    );
  }

  if (!user) {
    // User is null but loading is false - redirect is happening or failed
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "100px" }}>
        Redirecting to login...
      </div>
    );
  }

  // Calculate active and upcoming events based on strict time logic
  const now = new Date();
  
  // Active event: currently happening (strict time window)
  const activeEvent = events.find(event => {
    const startTime = new Date(`${event.date}T${event.time}`);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2-hour duration
    return now >= startTime && now <= endTime;
  });
  
  // Upcoming events: future events (starting after now)
  const upcomingEvents = events.filter(event => {
    const startTime = new Date(`${event.date}T${event.time}`);
    return startTime > now;
  });

  // Check if user is registered for events
  const isRegisteredForEvent = (eventId: string) => {
    return registrations.some(reg => reg.eventId === eventId);
  };
  
  console.log("⏰ Strict time-based event filtering:");
  console.log("📅 Current time:", now.toISOString());
  console.log("🔴 Active event:", activeEvent?.title || "None");
  console.log("📋 Upcoming events:", upcomingEvents.length);
  console.log("📊 Total events loaded:", events.length);
  console.log("✅ User registrations:", registrations.length);
  
  const roleLabel = {
    student: 'Student',
    instructor: 'Instructor',
    admin: 'Administrator',
    volunteer: 'Volunteer',
    'associate-instructor': 'Associate Instructor',
  }[user.role];

  const dashboardPath = getRolePath(user.role);

  const handleRegister = async (eventId: string, eventTitle: string) => {
    try {
      console.log("🔄 REGISTERING EVENT ID:", eventId);
      console.log("📝 Event Title:", eventTitle);
      
      const response = await apiCall('/registrations', {
        method: 'POST',
        body: JSON.stringify({
          eventId: eventId,
          asVolunteer: false
        })
      });
      
      console.log("✅ Registration successful:", response);
      toast.success(`Successfully registered for ${eventTitle}!`);
      
      // 🔥 CRITICAL: Refresh registrations to update UI
      const registrationsResponse = await apiCall('/registrations/me');
      setRegistrations(registrationsResponse.data || []);
      
    } catch (error: any) {
      console.error("❌ Registration failed:", error);
      if (error.message?.includes('already registered')) {
        toast.error('You are already registered for this event');
      } else if (error.message?.includes('capacity is full')) {
        toast.error('Event is full - registration closed');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  const handleVolunteer = async (eventId: string, eventTitle: string) => {
    try {
      console.log("🔄 VOLUNTEERING FOR EVENT ID:", eventId);
      
      const isCurrentlyVolunteered = volunteerStates[eventId];
      
      if (isCurrentlyVolunteered) {
        // TODO: Implement unregister API if needed
        toast('Volunteer unregistration not implemented yet', { icon: 'ℹ️' });
        return;
      }
      
      const response = await apiCall('/registrations', {
        method: 'POST',
        body: JSON.stringify({
          eventId: eventId,
          asVolunteer: true
        })
      });
      
      console.log("✅ Volunteer registration successful:", response);
      setVolunteerStates((prev) => ({ ...prev, [eventId]: true }));
      toast.success(`Registered as volunteer for ${eventTitle}!`);
      
    } catch (error: any) {
      console.error("❌ Volunteer registration failed:", error);
      if (error.message?.includes('already registered')) {
        toast.error('You are already registered for this event');
      } else {
        toast.error('Volunteer registration failed. Please try again.');
      }
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto w-full space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-white/50 text-sm mb-1">
                {user.role === 'instructor' 
                  ? (() => {
                      const date = new Date();
                      const month = date.toLocaleDateString('en-US', { month: 'short' });
                      const day = date.getDate();
                      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
                      const year = date.getFullYear();
                      return `${month} ${day}, ${weekday}, ${year}`;
                    })()
                  : format(new Date(), 'EEEE, MMMM d, yyyy')
                }
              </p>
              <h1 className="text-3xl font-black text-white mb-2">
                Welcome back, <span className="gradient-text">{user.name.split(' ')[0]}</span>! 👋
              </h1>
              <p className="text-white/50 text-sm">
                {roleLabel}
                {user.department && 
                 user.role === 'instructor' && 
                 (user.department === 'Humanities and Social Sciences' || 
                  user.department === 'Humanities & Social Sciences') 
                  ? '' 
                  : user.department ? ` · ${user.department}` : ' · IIT Bombay'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                router.push(dashboardPath);
              }}
              className="btn-primary px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> Go to Dashboard <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Active Event */}
        {activeEvent && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Currently Active Event</h2>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-3xl overflow-hidden border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
              style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #13131f 100%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 to-transparent pointer-events-none" />
              <div className="relative z-10 p-8">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        ● Live Now
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        activeEvent.mode === 'Online'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                      }`}>
                        {activeEvent.mode}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{activeEvent.title}</h3>
                    <p className="text-white/50 text-sm mb-4 max-w-xl">{activeEvent.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" />
                        {formatDate(activeEvent.date)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        {formatTime(activeEvent.time)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-accent" />
                        {activeEvent.venue}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" />
                        {activeEvent.registeredCount} / {activeEvent.capacity}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 shrink-0">
                    {(user.role === 'student') && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleRegister(activeEvent.id, activeEvent.title)}
                        className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                          isRegisteredForEvent(activeEvent.id)
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'btn-primary'
                        }`}
                      >
                        {isRegisteredForEvent(activeEvent.id) ? 'Registered ✓' : 'Register Now'}
                      </motion.button>
                    )}
                    {user.role === 'volunteer' && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleVolunteer(activeEvent.id, activeEvent.title)}
                        className={`px-6 py-3 rounded-xl font-semibold text-sm border transition-all ${
                          volunteerStates[activeEvent.id]
                            ? 'bg-accent/20 text-accent border-accent/30'
                            : 'bg-white/5 text-white/70 border-white/15 hover:bg-accent/10 hover:text-accent hover:border-accent/30'
                        }`}
                      >
                        {volunteerStates[activeEvent.id] ? '✓ Volunteered' : 'Register as Volunteer'}
                      </motion.button>
                    )}
                    {(user.role === 'instructor' || user.role === 'associate-instructor') && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push(dashboardPath)}
                        className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm"
                      >
                        View Details
                      </motion.button>
                    )}
                    {user.role === 'admin' && (
                      <Link href="/admin#events">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm"
                        >
                          Manage Event
                        </motion.button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Flourishing Hub Tagline */}
        <FlourishingTagline />

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <EventCard
                    event={event}
                    onRegister={user.role === 'student' ? (eventId) => handleRegister(eventId, event.title) : undefined}
                    isRegistered={isRegisteredForEvent(event.id)}
                    showVolunteerButton={user.role === 'volunteer'}
                    onVolunteer={user.role === 'volunteer' ? (eventId) => handleVolunteer(eventId, event.title) : undefined}
                    isVolunteered={volunteerStates[event.id]}
                    hideActions={user.role === 'instructor' || user.role === 'associate-instructor'}
                    onClick={
                      user.role === 'instructor' || user.role === 'associate-instructor'
                        ? () => {
                            toast('Workshop details page coming soon!', { icon: '📋' });
                          }
                        : undefined
                    }
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div>
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(user.role === 'admin' ? [
              { label: 'Admin Panel', href: '/admin', icon: Sparkles, color: 'primary' },
              { label: 'Events', href: '/admin#events', icon: Calendar, color: 'teal' },
              { label: 'Members', href: '/admin#members', icon: Users, color: 'yellow' },
              { label: 'Courses', href: '/admin#courses', icon: Star, color: 'purple' },
            ] : [
              { label: 'My Dashboard', href: dashboardPath, icon: Sparkles, color: 'primary' },
              { label: 'All Events', href: `${dashboardPath}#events`, icon: Calendar, color: 'teal' },
              { label: 'Schedule', href: `${dashboardPath}#schedule`, icon: Clock, color: 'yellow' },
              { label: 'History', href: `${dashboardPath}#history`, icon: Star, color: 'purple' },
            ]).map(({ label, href, icon: Icon, color }) => (
              <Link key={label} href={href}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="glass-card rounded-2xl p-4 text-center cursor-pointer group transition-all hover:border-primary/30"
                >
                  <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                    color === 'primary' ? 'bg-primary/15 text-primary' :
                    color === 'teal' ? 'bg-accent/15 text-accent' :
                    color === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-primary/15 text-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">{label}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
