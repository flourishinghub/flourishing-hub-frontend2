'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getCurrentUser, apiCall } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { isEventLive, isEventUpcoming } from '@/lib/dateUtils';
import { getRegistrationMetrics, getRegisteredEventIds } from '@/lib/registrationUtils';
import type { AuthPayload } from '@/types';
import toast from 'react-hot-toast';

export default function StudentEventsPage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'registered' | 'live' | 'completed'>('all');

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.log("❌ No token found in localStorage");
      setLoading(false);
      return;
    }

    // ✅ CRITICAL: Add timeout to prevent stuck loading
    const timeoutId = setTimeout(() => {
      console.log("⚠️ Events page API timeout - setting loading to false");
      setLoading(false);
    }, 8000); // 8 second timeout for faster UX

    const fetchData = async () => {
      try {
        // 🚀 OPTIMIZATION: Use cached user data if available
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
        
        // If no cached user, fetch from API
        if (!cachedUser) {
          console.log("🔄 Fetching user data from API...");
          const response = await getCurrentUser();
          const userData = response?.data?.data || response?.data || response;
          setUser(userData);
        }

        // 🚀 OPTIMIZATION: Fetch both events and registrations in parallel
        console.log("🔄 Fetching events and registrations in parallel...");
        const [eventsResponse, registrationsResponse] = await Promise.all([
          apiCall('/events'),
          apiCall('/registrations/me')
        ]);
        
        console.log("📦 Events received:", eventsResponse);
        console.log("📦 User registrations received:", registrationsResponse);
        
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
              organizer: event.createdBy?.name || 'Admin',
              meetLink: event.meetLink
            };
          } catch (error) {
            console.error("❌ Error transforming event:", event, error);
            return {
              id: event.id || 'unknown',
              title: event.title || 'Untitled Event',
              description: event.description || '',
              date: '2026-05-04',
              time: '10:00',
              venue: event.venue || 'TBD',
              mode: 'In Classroom',
              capacity: 0,
              registeredCount: 0,
              status: 'draft',
              organizer: 'Admin',
              meetLink: null
            };
          }
        });
        
        setEvents(transformedEvents);

        // Process registrations data
        const userRegistrations = registrationsResponse.data || [];
        setRegistrations(userRegistrations);
        
        // 🔥 FIX: Use safe registration utilities (eliminates duplicate logic)
        const registeredEventIds = getRegisteredEventIds(userRegistrations);
        setRegisteredEvents(registeredEventIds);
        setRegisteredEvents(registeredEventIds);
        
        console.log("✅ Data loaded successfully");
        console.log("📊 Events page data:");
        console.log("🔍 Total registrations:", userRegistrations.length);
        const metrics = getRegistrationMetrics(userRegistrations);
        console.log("🔍 Active registrations:", metrics.activeCount);
        console.log("🔍 Active registered event IDs:", registeredEventIds);
        
      } catch (err) {
        console.error("❌ Data fetch failed:", err);
      } finally {
        clearTimeout(timeoutId); // Clear the timeout
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        
        // Update active registered event IDs with safe filtering
        const updatedRegisteredEventIds = getRegisteredEventIds(updatedRegistrations);
        setRegisteredEvents(updatedRegisteredEventIds);
      }
    } catch (error) {
      console.error("❌ Registration failed:", error);
      toast.error('Registration failed. Please try again.');
    }
  };

  // Filter events based on selected filter
  const filteredEvents = (() => {
    const now = new Date();
    
    switch (filter) {
      case 'registered': {
        // Show upcoming events that user is registered for (ACTIVE registrations only)
        // 🔥 CRITICAL: Ensure past events don't appear in registered tab
        const registeredUpcoming = events.filter(event => {
          const eventStart = new Date(`${event.date}T${event.time}`);
          const isUpcoming = eventStart > now;
          const isRegistered = registeredEvents.includes(event.id);
          return isRegistered && isUpcoming; // Both conditions must be true
        });
        
        // 🚀 SMART SORTING: Live first, then upcoming by date
        return registeredUpcoming.sort((a, b) => {
          const aStart = new Date(`${a.date}T${a.time}`);
          const bStart = new Date(`${b.date}T${b.time}`);
          const aEnd = new Date(aStart.getTime() + 2 * 60 * 60 * 1000);
          const bEnd = new Date(bStart.getTime() + 2 * 60 * 60 * 1000);
          
          const aIsLive = now >= aStart && now <= aEnd;
          const bIsLive = now >= bStart && now <= bEnd;
          
          if (aIsLive && !bIsLive) return -1; // Live events first
          if (!aIsLive && bIsLive) return 1;
          return aStart.getTime() - bStart.getTime(); // Then by start time
        });
      }
      case 'live': {
        // Show only LIVE events (happening right now)
        const liveEvents = events.filter(event => {
          return isEventLive(`${event.date}T${event.time}`);
        });
        
        // Sort by start time
        return liveEvents.sort((a, b) => {
          const aStart = new Date(`${a.date}T${a.time}`);
          const bStart = new Date(`${b.date}T${b.time}`);
          return aStart.getTime() - bStart.getTime();
        });
      }
      case 'completed': {
        // Show events from ATTENDED registrations
        const completedRegistrations = registrations.filter(reg => 
          reg.status === 'ATTENDED' && reg.event
        );
        const completedEvents = completedRegistrations.map(registration => {
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
            status: 'completed',
            organizer: registration.event.createdBy?.name || 'Admin',
            meetLink: registration.event.meetLink
          };
        });
        
        // 🚀 SMART SORTING: Most recent completed events first
        return completedEvents.sort((a, b) => {
          const aStart = new Date(`${a.date}T${a.time}`);
          const bStart = new Date(`${b.date}T${b.time}`);
          return bStart.getTime() - aStart.getTime(); // Most recent first
        });
      }
      default: {
        // Show all upcoming events
        const upcomingEvents = events.filter(event => {
          const eventStart = new Date(`${event.date}T${event.time}`);
          return eventStart > now;
        });
        
        // 🚀 SMART SORTING: Live first, then upcoming by date
        return upcomingEvents.sort((a, b) => {
          const aStart = new Date(`${a.date}T${a.time}`);
          const bStart = new Date(`${b.date}T${b.time}`);
          const aEnd = new Date(aStart.getTime() + 2 * 60 * 60 * 1000);
          const bEnd = new Date(bStart.getTime() + 2 * 60 * 60 * 1000);
          
          const aIsLive = now >= aStart && now <= aEnd;
          const bIsLive = now >= bStart && now <= bEnd;
          
          if (aIsLive && !bIsLive) return -1; // Live events first
          if (!aIsLive && bIsLive) return 1;
          return aStart.getTime() - bStart.getTime(); // Then by start time
        });
      }
    }
  })();

  return (
    <DashboardLayout user={user} loading={loading}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">All Events</h1>
        <p className="text-sm text-white/50 mt-1">
          Discover and register for upcoming events
        </p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All Events' },
          { key: 'live', label: 'Live' },
          { key: 'registered', label: 'Registered' },
          { key: 'completed', label: 'Completed' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? key === 'live'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            {key === 'live' && filter === 'live' && (
              <span className="inline-flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                {label}
              </span>
            )}
            {key !== 'live' || filter !== 'live' ? label : null}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">
              {filter === 'registered' ? 'No registered upcoming events found' :
               filter === 'live' ? 'No live events at the moment' :
               filter === 'completed' ? 'No completed events found' :
               'No upcoming events found'}
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isRegistered = registeredEvents.includes(event.id) || event.status === 'completed';
            const isFull = event.registeredCount >= event.capacity && event.capacity > 0;
            const isLive = isEventLive(`${event.date}T${event.time}`) && event.status !== 'completed';
            const isCompleted = event.status === 'completed';

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all"
              >
                {/* Event Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                      {event.title}
                    </h3>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-medium">
                        ✓ Completed
                      </span>
                    ) : isLive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        LIVE NOW
                      </span>
                    ) : null}
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    event.mode === 'Online' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {event.mode}
                  </span>
                </div>

                {/* Event Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(event.date)} at {formatTime(event.time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <MapPin className="w-4 h-4" />
                    <span>{event.venue}</span>
                  </div>

                  {event.capacity > 0 && (
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Users className="w-4 h-4" />
                      <span>{event.registeredCount}/{event.capacity} registered</span>
                    </div>
                  )}

                  {event.description && (
                    <p className="text-sm text-white/50 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRegister(event.id)}
                    disabled={isRegistered || isFull || isCompleted}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isCompleted
                        ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-default'
                        : isRegistered && !isCompleted
                        ? 'bg-primary/20 text-primary border border-primary/30 cursor-default'
                        : isFull
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed'
                        : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                    }`}
                  >
                    {isCompleted ? '✓ Completed' : isRegistered ? '✓ Registered' : isFull ? 'Full' : 'Register'}
                  </motion.button>

                  {event.meetLink && (
                    <motion.a
                      whileTap={{ scale: 0.95 }}
                      href={event.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}