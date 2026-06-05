'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, ExternalLink,
  Share2, Heart, CheckCircle, AlertCircle, Radio, Loader2,
  BookOpen, GraduationCap, Fingerprint, ShieldCheck, Zap,
  Wifi
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
      console.warn('Could not fetch check-in status:', err);
    }
  };

  // Auto-poll when PENDING so student sees VERIFIED without manual refresh
  useEffect(() => {
    if (checkIn?.status === 'PENDING') {
      pollRef.current = setInterval(() => fetchCheckInStatus(), 8000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn?.status]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const fetchData = async () => {
      try {
        let currentUserId: string | undefined;
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          currentUserId = userData.id;
        }

        const [eventsResponse, registrationsResponse] = await Promise.all([
          apiCall('/events'),
          apiCall('/registrations/me'),
        ]);

        const eventData = eventsResponse.data.items.find((e: any) => e.id === eventId);
        if (!eventData) {
          toast.error('Event not found');
          router.push('/student/events');
          return;
        }

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

        const userRegistrations = registrationsResponse.data || [];
        const registeredEventIds = getRegisteredEventIds(userRegistrations);
        const registered = registeredEventIds.includes(eventId);
        setIsRegistered(registered);

        if (isEventLive(startDate.toISOString()) && registered && currentUserId) {
          await fetchCheckInStatus(currentUserId);
        }
      } catch (error) {
        console.error('❌ Failed to fetch event details:', error);
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
    if (isRegistered) { toast.error('Already registered for this event'); return; }
    setRegistering(true);
    try {
      const response = await apiCall('/registrations', {
        method: 'POST',
        body: JSON.stringify({ eventId, asVolunteer: false }),
      });
      if (response.success) {
        setIsRegistered(true);
        toast.success('Successfully registered for event!');
        setEvent((prev: any) => ({ ...prev, registeredCount: prev.registeredCount + 1 }));
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await apiCall('/event-operations/' + eventId + '/check-ins', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('Check-in submitted! Awaiting verification.');
      await fetchCheckInStatus();
    } catch (error: any) {
      const msg = error?.message || 'Failed to check in.';
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

  // ── LIVE EVENT FULL PAGE ──
  if (isLive && isRegistered) {
    return (
      <DashboardLayout user={user} loading={false}>
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Events</span>
        </motion.button>

        {/* Live Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-8"
          style={{
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a0a2e 50%, #0a1628 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 0 60px rgba(239, 68, 68, 0.1), inset 0 0 80px rgba(139, 92, 246, 0.05)',
          }}
        >
          {/* Animated glow ring */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent blur-sm" />
            <div className="absolute -top-20 left-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
            <div className="absolute -top-20 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative p-8 lg:p-12">
            {/* Live badge */}
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-sm"
              >
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-2 h-2 bg-red-400 rounded-full"
                />
                LIVE NOW
              </motion.div>
              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <Wifi className="w-3 h-3" />
                Session Active
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
              {event.title}
            </h1>
            <p className="text-white/50 text-sm mb-8">
              Organized by <span className="text-white/70">{event.organizer}</span>
            </p>

            {/* Event meta */}
            <div className="flex flex-wrap gap-4 mb-10">
              {event.courseName && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{event.courseName}</p>
                    <p className="text-white/40 text-[10px]">Course</p>
                  </div>
                </div>
              )}
              {event.batch && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{event.batch}</p>
                    <p className="text-white/40 text-[10px]">Batch</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-white text-sm font-medium">{event.venue}</p>
                  <p className="text-white/40 text-[10px]">Venue</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">{formatTime(event.time)}</p>
                  <p className="text-white/40 text-[10px]">Started at</p>
                </div>
              </div>
            </div>

            {/* Check-in action area */}
            <AnimatePresence mode="wait">
              {!checkIn ? (
                /* ── No check-in yet ── */
                <motion.div
                  key="checkin"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-6 py-6"
                >
                  <div className="text-center">
                    <p className="text-white/60 text-sm mb-1">You&apos;re registered for this session</p>
                    <p className="text-white/40 text-xs">Tap below to mark your attendance</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="relative group flex flex-col items-center gap-3 w-52 h-52 rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.15)' }}
                  >
                    {/* Pulse rings */}
                    {!checkingIn && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut' }}
                          className="absolute inset-0 rounded-full border border-emerald-500/30"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                          transition={{ repeat: Infinity, duration: 2.5, delay: 0.4, ease: 'easeOut' }}
                          className="absolute inset-0 rounded-full border border-emerald-500/20"
                        />
                      </>
                    )}
                    <div className="flex flex-col items-center gap-3 relative z-10 mt-16">
                      {checkingIn ? (
                        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                      ) : (
                        <Fingerprint className="w-12 h-12 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                      )}
                      <span className="text-emerald-400 group-hover:text-emerald-300 font-bold text-lg transition-colors">
                        {checkingIn ? 'Checking in...' : 'Check In'}
                      </span>
                    </div>
                  </motion.button>
                </motion.div>

              ) : checkIn.status === 'PENDING' ? (
                /* ── Verification in progress ── */
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-5 py-6"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                      className="w-24 h-24 rounded-full border-2 border-amber-500/30 border-t-amber-400"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-amber-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-400 font-bold text-xl mb-1">Verification in Progress</p>
                    <p className="text-white/50 text-sm">Your check-in is with the Associate Instructor</p>
                    <p className="text-white/30 text-xs mt-1">This page updates automatically</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400/70 text-xs">
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-1.5 h-1.5 bg-amber-400 rounded-full"
                    />
                    Checking every 8 seconds...
                  </div>
                </motion.div>

              ) : checkIn.status === 'VERIFIED' ? (
                /* ── Verified ── */
                <motion.div
                  key="verified"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-5 py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="relative"
                  >
                    <div
                      className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center"
                      style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)' }}
                    >
                      <ShieldCheck className="w-10 h-10 text-emerald-400" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="absolute inset-0 rounded-full border border-emerald-500/30"
                    />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-emerald-400 font-bold text-2xl mb-1">Attendance Verified!</p>
                    <p className="text-white/50 text-sm">Your attendance has been confirmed</p>
                  </div>
                  {event.quizLink && (
                    <a
                      href={event.quizLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30 transition-all text-sm font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Quiz
                    </a>
                  )}
                  {event.meetLink && (
                    <a
                      href={event.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all text-sm font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join Meeting
                    </a>
                  )}
                </motion.div>

              ) : checkIn.status === 'REJECTED' ? (
                /* ── Rejected ── */
                <motion.div
                  key="rejected"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4 py-6"
                >
                  <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center">
                    <AlertCircle className="w-9 h-9 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-red-400 font-bold text-xl mb-1">Attendance Rejected</p>
                    <p className="text-white/50 text-sm">Please contact your Associate Instructor</p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bottom info row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-3">About This Session</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              {event.description || 'An interactive session designed to enhance your wellbeing and personal growth.'}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-3">Session Details</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span className="text-white/70">{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-white/70">{formatTime(event.time)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <span className="text-white/70">
                  {event.registeredCount}{event.capacity > 0 ? `/${event.capacity}` : ''} participants
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ── STANDARD EVENT PAGE (not live / not registered) ──
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

            {isLive && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE NOW
              </div>
            )}

            <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-black/50 text-white text-sm font-medium">
              {event.mode}
            </div>

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
            <p className="text-white/70 leading-relaxed mb-4">
              {event.description || 'Join us for an amazing workshop experience designed to enhance your wellbeing and personal growth.'}
            </p>
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
          </motion.div>

          {/* Instructor Info */}
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
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details + Registration Card */}
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
                  <><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Registering...</>
                ) : isRegistered ? (
                  <><CheckCircle className="w-4 h-4" /> Registered</>
                ) : isFull ? (
                  <><AlertCircle className="w-4 h-4" /> Event Full</>
                ) : !isUpcoming ? (
                  <><AlertCircle className="w-4 h-4" /> Event Ended</>
                ) : (
                  'Register Now'
                )}
              </motion.button>

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
