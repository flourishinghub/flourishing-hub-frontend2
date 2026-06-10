'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, ExternalLink,
  Share2, Heart, CheckCircle, AlertCircle, Radio, Loader2,
  BookOpen, GraduationCap, Fingerprint, ShieldCheck, Zap,
  Wifi, History, Star, Award
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
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [myAttendanceRec, setMyAttendanceRec] = useState<any>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const fetchCheckInStatus = async (_currentUserId?: string) => {
    try {
      const res = await apiCall('/event-operations/' + eventId + '/my-check-in');
      setCheckIn(res.data || null);
    } catch (err) {
      console.warn('Could not fetch check-in status:', err);
    }
  };

  // Poll every 5s while PENDING so page auto-transitions to verified state
  useEffect(() => {
    if (checkIn?.status === 'PENDING') {
      pollRef.current = setInterval(() => fetchCheckInStatus(), 5000);
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

        const [eventsResponse, registrationsResponse, attendanceResponse] = await Promise.all([
          apiCall('/events?limit=200'),
          apiCall('/registrations/me'),
          apiCall('/event-operations/attendance/me').catch(() => ({ data: [] })),
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
          startAt: eventData.startAt,
          endAt: eventData.endAt || null,
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
        // Include ATTENDED status — backend may update registration from REGISTERED→ATTENDED
        // after check-in verification, but student should still see the live event page
        const registered = userRegistrations.some((reg: any) =>
          reg.eventId === eventId && (reg.status === 'REGISTERED' || reg.status === 'ATTENDED')
        );
        setIsRegistered(registered);

        // Always fetch check-in status when event is live (don't gate on registration status)
        if (isEventLive(eventData.startAt, eventData.endAt)) {
          await fetchCheckInStatus();
        }

        // Store this event's attendance record (for feedback section)
        const allAttendance: any[] = attendanceResponse.data || [];
        const thisEventRec = allAttendance.find((a: any) => a.eventId === eventId);
        setMyAttendanceRec(thisEventRec || null);
        if (thisEventRec?.starRating) {
          setFeedbackRating(thisEventRec.starRating);
          setFeedbackSubmitted(true);
        }

        // Build history from attended events (field names from getMyAttendance API)
        const history = allAttendance
          .filter((a: any) => a.status === 'PRESENT' && a.eventId !== eventId)
          .slice(0, 5)
          .map((a: any) => ({
            eventTitle: a.eventTitle || 'Workshop',
            date: a.date,
            marks: a.marks,
            maxMarks: a.maxMarks,
            starRating: a.starRating,
            courseName: a.courseName,
          }));
        setAttendanceHistory(history);
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

  const handleFeedback = async (rating: number) => {
    if (feedbackSubmitting) return;
    setFeedbackRating(rating);
    setFeedbackSubmitting(true);
    try {
      await apiCall('/event-operations/' + eventId + '/feedback', {
        method: 'POST',
        body: JSON.stringify({ eventRating: rating }),
      });
      setFeedbackSubmitted(true);
      toast.success('Thanks for your rating!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit rating.');
    } finally {
      setFeedbackSubmitting(false);
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

  const isLive = isEventLive(event.startAt || (event.date + 'T' + event.time), event.endAt);
  const isUpcoming = isEventUpcoming(event.startAt || (event.date + 'T' + event.time));
  const isFull = event.registeredCount >= event.capacity && event.capacity > 0;

  // ── LIVE EVENT FULL PAGE ──
  // Show live page if: registered (any status) OR has a check-in record for this event
  if (isLive && (isRegistered || checkIn !== null)) {
    const isVerified = checkIn?.status === 'VERIFIED';

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

        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════
              PHASE 2 — SESSION ACTIVE (auto-appears when verified)
          ══════════════════════════════════════════════ */}
          {isVerified ? (
            <motion.div
              key="phase2"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              {/* Session Active Hero */}
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0a1f14 0%, #0d2a1a 50%, #061a24 100%)',
                  border: '1px solid rgba(16,185,129,0.35)',
                  boxShadow: '0 0 60px rgba(16,185,129,0.08)',
                }}
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent blur-sm" />
                  <div className="absolute -top-16 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative p-8 lg:p-10">
                  {/* Badges */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Attendance Verified
                    </span>
                    <motion.span
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold"
                    >
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                      LIVE NOW
                    </motion.span>
                  </div>

                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">{event.title}</h1>
                  <p className="text-white/40 text-sm mb-6">
                    {event.courseName && <span className="text-primary/80 mr-2">{event.courseName} ·</span>}
                    {event.venue} · Started {formatTime(event.time)}
                  </p>

                  {/* Links row */}
                  <div className="flex flex-wrap gap-3">
                    {event.meetLink && (
                      <a
                        href={event.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-all text-sm font-semibold"
                      >
                        <Wifi className="w-4 h-4" /> Join Meeting
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Quiz Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1a0e04 0%, #1f1408 100%)',
                  border: '1px solid rgba(249,115,22,0.35)',
                  boxShadow: '0 0 40px rgba(249,115,22,0.07)',
                }}
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-10 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl" />
                </div>
                <div className="relative p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-5 h-5 text-orange-400" />
                    <h2 className="text-white font-bold text-lg">Session Quiz</h2>
                    <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
                      <CheckCircle className="w-3 h-3" /> UNLOCKED
                    </span>
                  </div>
                  <p className="text-white/40 text-sm mb-5">Your attendance is verified. Complete the quiz to earn your score.</p>

                  {event.quizLink ? (
                    <a
                      href={event.quizLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                        color: '#fff',
                        boxShadow: '0 0 24px rgba(249,115,22,0.35)',
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Quiz
                    </a>
                  ) : (
                    <p className="text-white/30 text-sm italic">No quiz link configured for this session</p>
                  )}
                </div>
              </motion.div>

              {/* Session info */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="glass-card rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-white mb-3">About This Session</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {event.description || 'An interactive session designed to enhance your wellbeing and personal growth.'}
                </p>
              </motion.div>
            </motion.div>

          ) : (
            /* ══════════════════════════════════════════════
                PHASE 1 — CHECK-IN (before verification)
            ══════════════════════════════════════════════ */
            <motion.div
              key="phase1"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              {/* Live Hero Banner */}
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0f0f23 0%, #1a0a2e 50%, #0a1628 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  boxShadow: '0 0 60px rgba(239, 68, 68, 0.1)',
                }}
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent blur-sm" />
                  <div className="absolute -top-20 left-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
                  <div className="absolute -top-20 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative p-8 lg:p-12">
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-sm"
                    >
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-2 h-2 bg-red-400 rounded-full" />
                      LIVE NOW
                    </motion.div>
                    <div className="flex items-center gap-1.5 text-white/30 text-xs">
                      <Wifi className="w-3 h-3" /> Session Active
                    </div>
                  </div>

                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">{event.title}</h1>
                  <p className="text-white/50 text-sm mb-8">
                    Organized by <span className="text-white/70">{event.organizer}</span>
                  </p>

                  <div className="flex flex-wrap gap-4 mb-10">
                    {event.courseName && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                        <BookOpen className="w-4 h-4 text-violet-400" />
                        <div><p className="text-white text-sm font-medium">{event.courseName}</p><p className="text-white/40 text-[10px]">Course</p></div>
                      </div>
                    )}
                    {event.batch && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                        <GraduationCap className="w-4 h-4 text-blue-400" />
                        <div><p className="text-white text-sm font-medium">{event.batch}</p><p className="text-white/40 text-[10px]">Batch</p></div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <div><p className="text-white text-sm font-medium">{event.venue}</p><p className="text-white/40 text-[10px]">Venue</p></div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <div><p className="text-white text-sm font-medium">{formatTime(event.time)}</p><p className="text-white/40 text-[10px]">Started at</p></div>
                    </div>
                  </div>

                  {/* Check-in / Pending states */}
                  <AnimatePresence mode="wait">
                    {(!checkIn || checkIn.status === 'REJECTED') ? (
                      <motion.div
                        key="checkin"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center gap-6 py-6"
                      >
                        {checkIn?.status === 'REJECTED' && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" /> Check-in was rejected — you can try again
                          </div>
                        )}
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
                          {!checkingIn && (
                            <>
                              <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut' }} className="absolute inset-0 rounded-full border border-emerald-500/30" />
                              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.4, ease: 'easeOut' }} className="absolute inset-0 rounded-full border border-emerald-500/20" />
                            </>
                          )}
                          <div className="flex flex-col items-center gap-3 relative z-10 mt-16">
                            {checkingIn ? <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" /> : <Fingerprint className="w-12 h-12 text-emerald-400 group-hover:text-emerald-300 transition-colors" />}
                            <span className="text-emerald-400 group-hover:text-emerald-300 font-bold text-lg transition-colors">
                              {checkingIn ? 'Checking in...' : 'Check In'}
                            </span>
                          </div>
                        </motion.button>
                      </motion.div>

                    ) : checkIn.status === 'PENDING' ? (
                      <motion.div
                        key="pending"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center gap-5 py-6"
                      >
                        <div className="relative">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} className="w-24 h-24 rounded-full border-2 border-amber-500/30 border-t-amber-400" />
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
                          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                          Checking every 5 seconds...
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              {/* Quiz Card — LOCKED while not verified */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative rounded-2xl overflow-hidden opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #111 0%, #1a1410 100%)',
                  border: '1px solid rgba(249,115,22,0.15)',
                }}
              >
                <div className="relative p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-5 h-5 text-orange-400/60" />
                    <h2 className="text-white/60 font-bold text-lg">Session Quiz</h2>
                    <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30 text-[10px] font-bold">
                      🔒 LOCKED
                    </span>
                  </div>
                  <p className="text-white/30 text-sm">Complete check-in and get verified by your instructor to unlock the quiz.</p>
                </div>
              </motion.div>

              {/* Session info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-white mb-3">About This Session</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {event.description || 'An interactive session designed to enhance your wellbeing and personal growth.'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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

          {/* Rate this Event — shown for completed events with verified attendance */}
          {!isUpcoming && !isLive && myAttendanceRec?.status === 'PRESENT' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Rate this Event</h3>
              </div>
              {feedbackSubmitted ? (
                <div className="text-center py-3">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-6 h-6 ${s <= feedbackRating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                    ))}
                  </div>
                  <p className="text-white/60 text-sm">Your rating is saved</p>
                </div>
              ) : (
                <div>
                  <p className="text-white/50 text-xs mb-3">Tap a star to rate your experience</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <motion.button
                        key={s}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => setFeedbackHover(s)}
                        onMouseLeave={() => setFeedbackHover(0)}
                        onClick={() => handleFeedback(s)}
                        disabled={feedbackSubmitting}
                        className="disabled:opacity-50"
                      >
                        <Star className={`w-7 h-7 transition-all ${
                          s <= (feedbackHover || feedbackRating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-white/20'
                        }`} />
                      </motion.button>
                    ))}
                  </div>
                  {feedbackSubmitting && <p className="text-white/40 text-xs text-center mt-2">Saving...</p>}
                </div>
              )}
            </motion.div>
          )}

          {/* History Tab — student only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-lg font-semibold text-white">My History</h3>
            </div>

            {attendanceHistory.length === 0 ? (
              <div className="text-center py-6">
                <Award className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">No attended workshops yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceHistory.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-white text-sm font-medium leading-tight mb-1">{item.eventTitle}</p>
                    {item.courseName && (
                      <p className="text-primary/80 text-xs mb-1">{item.courseName}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white/40 text-xs">
                        {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {item.marks != null && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                            {item.marks}/{item.maxMarks ?? 100}
                          </span>
                        )}
                        {item.starRating != null && (
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-2.5 h-2.5 ${s <= item.starRating ? 'text-yellow-400 fill-yellow-400' : 'text-white/15'}`} />
                            ))}
                          </div>
                        )}
                        {item.marks == null && item.starRating == null && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Present</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
