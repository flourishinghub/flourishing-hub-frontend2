'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, ExternalLink,
  Share2, Heart, CheckCircle, AlertCircle, Radio, Loader2,
  BookOpen, GraduationCap
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getCurrentUser, apiCall } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { isEventLive, isEventUpcoming } from '@/lib/dateUtils';
import { getRegisteredEventIds } from '@/lib/registrationUtils';
import type { AuthPayload } from '@/types';
import toast from 'react-hot-toast';

export default function EventDetailPage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkIn, setCheckIn] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const fetchCheckInStatus = async (currentUserId?: string) => {
    try {
      const checkInsResponse = await apiCall('/event-operations/' + eventId + '/check-ins');
      const checkIns = checkInsResponse.data || [];
      const uid = currentUserId || user?.id;
      const myCheckIn = checkIns.find((ci: any) => ci.userId === uid || ci.user?.id === uid);
      setCheckIn(myCheckIn || null);
    } catch (err) {
      // silently fail — check-in endpoint may 403 if event not live
      console.warn('Could not fetch check-in status:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Get user data
        let currentUserId: string | undefined;
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          currentUserId = userData.id;
        }

        // Fetch event details and user registrations in parallel
        const [eventsResponse, registrationsResponse] = await Promise.all([
          apiCall('/events'),
          apiCall('/registrations/me')
        ]);

        // Find the specific event
        const eventData = eventsResponse.data.items.find((e: any) => e.id === eventId);

        if (!eventData) {
          toast.error('Event not found');
          router.push('/student/events');
          return;
        }

        // Transform event data
        const startDate = new Date(eventData.startAt);
        const transformedEvent = {
          id: eventData.id,
          title: eventData.title || 'Untitled Event',
          description: eventData.description || '',
          date: startDate.toISOString().split('T')[0],
          time: startDate.toTimeString().slice(0, 5),
          venue: eventData.venue || 'TBD',
          mode: eventData.meetLink ? 'Online' : 'In Classroom',
          capacity: eventData.capacity || 0,
          registeredCount: eventData._count?.registrations || 0,
          status: eventData.status?.toLowerCase() || 'draft',
          organizer: eventData.createdBy?.name || 'Admin',
          meetLink: eventData.meetLink,
          quizLink: eventData.modules?.[0]?.quizLink || null,
          courseName: eventData.course?.name || null,
          batch: eventData.batch || null,
        };

        setEvent(transformedEvent);

        // Check if user is registered
        const userRegistrations = registrationsResponse.data || [];
        const registeredEventIds = getRegisteredEventIds(userRegistrations);
        const registered = registeredEventIds.includes(eventId);
        setIsRegistered(registered);

        // Fetch check-in status if event is live and user is registered
        const isLiveNow = isEventLive(startDate.toISOString());
        if (isLiveNow && registered && currentUserId) {
          await fetchCheckInStatus(currentUserId);
        }

      } catch (error) {
        console.error("❌ Failed to fetch event details:", error);
        toast.error('Failed to load event details');
        router.push('/student/events');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, router]);

  const handleRegister = async () => {
    if (isRegistered) {
      toast.error('Already registered for this event');
      return;
    }

    setRegistering(true);
    try {
      const response = await apiCall('/registrations', {
        method: 'POST',
        body: JSON.stringify({
          eventId,
          asVolunteer: false
        })
      });

      if (response.success) {
        setIsRegistered(true);
        toast.success('Successfully registered for event!');

        // Update event registered count
        setEvent((prev: any) => ({
          ...prev,
          registeredCount: prev.registeredCount + 1
        }));
      }
    } catch (error) {
      console.error("❌ Registration failed:", error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleRecordAttendance = async () => {
    setCheckingIn(true);
    try {
      await apiCall('/event-operations/' + eventId + '/check-ins', {
        method: 'POST',
        body: JSON.stringify({})
      });
      toast.success('Attendance recorded! Awaiting verification.');
      await fetchCheckInStatus();
    } catch (error: any) {
      console.error("❌ Check-in failed:", error);
      const msg = error?.message || 'Failed to record attendance.';
      toast.error(msg);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading || !event) {
    return (
      <DashboardLayout user={user} loading={loading}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const isLive = isEventLive(event.date + 'T' + event.time);
  const isUpcoming = isEventUpcoming(event.date + 'T' + event.time);
  const isFull = event.registeredCount >= event.capacity && event.capacity > 0;

  return (
    <DashboardLayout user={user} loading={false}>
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Events</span>
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-64 rounded-2xl overflow-hidden"
          >
            <img
              src={`https://source.unsplash.com/800x400/?workshop,meditation,wellness,${encodeURIComponent(event.title.split(' ').slice(0, 2).join(' '))}`}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Live Badge */}
            {isLive && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE NOW
              </div>
            )}

            {/* Mode Badge */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-black/50 text-white text-sm font-medium">
              {event.mode}
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{event.title}</h1>
              <p className="text-white/80 text-sm">Organized by {event.organizer}</p>
            </div>
          </motion.div>

          {/* Event Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">About This Event</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/70 leading-relaxed mb-4">
                {event.description || 'Join us for an amazing workshop experience designed to enhance your wellbeing and personal growth. This interactive session will provide you with practical tools and techniques that you can apply in your daily life.'}
              </p>

              {/* Additional Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div>
                  <h4 className="text-white font-semibold mb-2">What You&apos;ll Learn</h4>
                  <ul className="text-white/60 text-sm space-y-1">
                    <li>• Practical mindfulness techniques</li>
                    <li>• Stress management strategies</li>
                    <li>• Building emotional resilience</li>
                    <li>• Creating healthy daily habits</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">What to Bring</h4>
                  <ul className="text-white/60 text-sm space-y-1">
                    <li>• Comfortable clothing</li>
                    <li>• Notebook and pen</li>
                    <li>• Open mind and positive attitude</li>
                    <li>• Water bottle (recommended)</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Instructor/Organizer Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Meet the Instructor</h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-bold text-lg">
                {event.organizer.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">{event.organizer}</h3>
                <p className="text-white/60 text-sm mb-2">Wellness &amp; Mindfulness Instructor</p>
                <p className="text-white/50 text-sm leading-relaxed">
                  Experienced instructor with over 5 years in wellness coaching and mindfulness practices.
                  Passionate about helping students develop healthy coping mechanisms and emotional intelligence.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* LIVE Workshop Card — only when event is live and student is registered */}
          {isLive && isRegistered ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6 border border-red-500/30"
            >
              {/* Live Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  LIVE NOW
                </span>
              </div>

              {/* Course / Batch info */}
              <div className="space-y-3 mb-5">
                {event.courseName && (
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">{event.courseName}</p>
                      <p className="text-white/40 text-xs">Course</p>
                    </div>
                  </div>
                )}
                {event.batch && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">{event.batch}</p>
                      <p className="text-white/40 text-xs">Batch</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm">{event.venue}</p>
                    <p className="text-white/40 text-xs">Venue / Room</p>
                  </div>
                </div>
              </div>

              {/* Check-in status & actions */}
              {!checkIn ? (
                /* No check-in yet — show Record Attendance button */
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRecordAttendance}
                  disabled={checkingIn}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {checkingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Record Attendance
                    </>
                  )}
                </motion.button>
              ) : checkIn.status === 'PENDING' ? (
                /* Pending verification */
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Pending Verification from Associate Instructor
                  </div>
                </div>
              ) : checkIn.status === 'VERIFIED' ? (
                /* Verified — show success + optional quiz link */
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Attendance Verified
                  </div>
                  {event.quizLink && (
                    <a
                      href={event.quizLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-3 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Quiz
                    </a>
                  )}
                </div>
              ) : checkIn.status === 'REJECTED' ? (
                /* Rejected */
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Attendance Rejected — contact your instructor
                </div>
              ) : null}
            </motion.div>
          ) : (
            /* Standard Event Details Card for non-live events */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Event Details</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-white font-medium">{formatDate(event.date)}</p>
                    <p className="text-white/50 text-sm">Date</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-white font-medium">{formatTime(event.time)}</p>
                    <p className="text-white/50 text-sm">Time</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-white font-medium">{event.venue}</p>
                    <p className="text-white/50 text-sm">Venue</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-white font-medium">
                      {event.registeredCount}{event.capacity > 0 ? `/${event.capacity}` : ''} registered
                    </p>
                    <p className="text-white/50 text-sm">Participants</p>
                  </div>
                </div>
              </div>

              {/* Registration Button */}
              <div className="mt-6 space-y-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRegister}
                  disabled={isRegistered || isFull || registering || !isUpcoming}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    isRegistered
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : isFull
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed'
                      : !isUpcoming
                      ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed'
                      : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                  }`}
                >
                  {registering ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Registering...
                    </>
                  ) : isRegistered ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Registered
                    </>
                  ) : isFull ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Event Full
                    </>
                  ) : !isUpcoming ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Event Ended
                    </>
                  ) : (
                    'Register Now'
                  )}
                </motion.button>

                {/* Meet Link */}
                {event.meetLink && isRegistered && (
                  <motion.a
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    href={event.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join Meeting
                  </motion.a>
                )}
              </div>
            </motion.div>
          )}

          {/* Share Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Share Event</h3>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="px-4 py-2 rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all">
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
