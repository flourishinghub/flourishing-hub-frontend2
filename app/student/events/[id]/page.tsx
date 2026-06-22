'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, ExternalLink,
  Share2, Heart, CheckCircle, AlertCircle, Radio, Loader2,
  BookOpen, GraduationCap, Fingerprint, ShieldCheck, Zap,
  Wifi, History, Star, Award, Lock, Video, FileText
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiCall } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { isEventLive, isEventLiveOrGrace, isGracePeriodActive, getGraceSecondsRemaining, isEventUpcoming } from '@/lib/dateUtils';
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
  const [quizScore, setQuizScore] = useState<{ totalMarks: number | null; totalMax: number | null; scores: any[] } | null>(null);
  const [graceSecsLeft, setGraceSecsLeft] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scorePollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const graceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const fetchCheckInStatus = async () => {
    try {
      const res = await apiCall('/event-operations/' + eventId + '/my-check-in');
      setCheckIn(res.data || null);
    } catch {
      // silent
    }
  };

  const fetchMyProgress = async () => {
    try {
      const res = await apiCall('/event-operations/' + eventId + '/my-progress');
      if (res.data) setQuizScore(res.data);
    } catch {
      // silent
    }
  };

  // Poll every 2s while PENDING so page transitions immediately when instructor verifies
  useEffect(() => {
    if (checkIn?.status === 'PENDING') {
      pollRef.current = setInterval(() => fetchCheckInStatus(), 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn?.status]);

  // Poll quiz score every 15s once verified
  useEffect(() => {
    if (checkIn?.status === 'VERIFIED') {
      fetchMyProgress();
      scorePollerRef.current = setInterval(() => fetchMyProgress(), 15000);
    } else {
      if (scorePollerRef.current) clearInterval(scorePollerRef.current);
    }
    return () => { if (scorePollerRef.current) clearInterval(scorePollerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn?.status]);

  // Grace period countdown timer
  useEffect(() => {
    if (!event?.endAt) return;
    const tick = () => setGraceSecsLeft(getGraceSecondsRemaining(event.endAt));
    tick();
    graceTimerRef.current = setInterval(tick, 1000);
    return () => { if (graceTimerRef.current) clearInterval(graceTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.endAt]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const fetchData = async () => {
      try {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
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
        const rawQuizLink = eventData.quizLink || eventData.courseModule?.quizLink || eventData.modules?.[0]?.quizLink || null;
        const rawFeedbackLink = eventData.feedbackLink || eventData.courseModule?.feedbackLink || eventData.modules?.[0]?.feedbackLink || null;
        const ensureHttps = (url: string | null) => {
          if (!url) return null;
          return url.startsWith('http') ? url : `https://${url}`;
        };

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
          quizLink: ensureHttps(rawQuizLink),
          feedbackLink: ensureHttps(rawFeedbackLink),
          courseName: eventData.course?.name || null,
          batch: eventData.batch || null,
        };

        setEvent(transformedEvent);

        const userRegistrations = registrationsResponse.data || [];
        const registered = userRegistrations.some((reg: any) =>
          reg.eventId === eventId && (reg.status === 'REGISTERED' || reg.status === 'ATTENDED')
        );
        setIsRegistered(registered);

        if (isEventLive(eventData.startAt, eventData.endAt)) {
          await fetchCheckInStatus();
        }

        const allAttendance: any[] = attendanceResponse.data || [];
        const thisEventRec = allAttendance.find((a: any) => a.eventId === eventId);
        setMyAttendanceRec(thisEventRec || null);
        if (thisEventRec?.starRating) {
          setFeedbackRating(thisEventRec.starRating);
          setFeedbackSubmitted(true);
        }

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
        console.error('Failed to fetch event details:', error);
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
        toast.success('Successfully registered!');
        setEvent((prev: any) => ({ ...prev, registeredCount: prev.registeredCount + 1 }));
      }
    } catch {
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
      toast.error(error?.message || 'Failed to check in.');
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
  const isLiveOrGrace = isEventLiveOrGrace(event.startAt || (event.date + 'T' + event.time), event.endAt);
  const graceActive = isGracePeriodActive(event.endAt);
  const quizWindowOpen = isLive || graceActive;
  const isUpcoming = isEventUpcoming(event.startAt || (event.date + 'T' + event.time));
  const isFull = event.registeredCount >= event.capacity && event.capacity > 0;

  // ─── LIVE EVENT PAGE (includes 30-min grace after endAt) ──────────
  if (isLiveOrGrace && (isRegistered || checkIn !== null)) {
    const isVerified = checkIn?.status === 'VERIFIED';
    const isPending = checkIn?.status === 'PENDING';
    const isRejected = checkIn?.status === 'REJECTED';
    const hasCheckedIn = !!checkIn;

    // Step indicator: 0 = not checked in, 1 = pending, 2 = verified
    const step = isVerified ? 2 : isPending ? 1 : 0;

    return (
      <DashboardLayout user={user} loading={false}>
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Events</span>
        </motion.button>

        {/* ── Top bar: title + status badges ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {isLive ? (
              <motion.span
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold"
              >
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                LIVE NOW
              </motion.span>
            ) : graceActive ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold">
                <Clock className="w-3 h-3" />
                Session Ended · Quiz window closing in {Math.floor(graceSecsLeft / 60)}:{String(graceSecsLeft % 60).padStart(2, '0')}
              </span>
            ) : null}
            {isVerified && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Attendance Verified
              </motion.span>
            )}
            {isPending && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                Awaiting Verification
              </span>
            )}
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">{event.title}</h1>
          <p className="text-white/40 text-sm mt-1">Organized by <span className="text-white/60">{event.organizer}</span></p>
        </motion.div>

        {/* ── Step Progress Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-0 mb-7 p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {[
            { label: 'Check In', icon: Fingerprint },
            { label: 'Verification', icon: Zap },
            { label: 'Session Active', icon: ShieldCheck },
          ].map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                  step > i ? 'bg-emerald-500 text-white' :
                  step === i ? 'bg-primary/20 border-2 border-primary text-primary' :
                  'bg-white/5 border border-white/10 text-white/20'
                }`}>
                  {step > i
                    ? <CheckCircle className="w-4 h-4" />
                    : <s.icon className="w-4 h-4" />
                  }
                </div>
                <span className={`text-[10px] mt-1.5 font-medium transition-colors ${
                  step > i ? 'text-emerald-400' : step === i ? 'text-primary' : 'text-white/25'
                }`}>{s.label}</span>
              </div>
              {i < 2 && (
                <div className="h-px flex-1 mx-1 transition-all duration-500" style={{
                  background: step > i ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.08)'
                }} />
              )}
            </div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════════════
              PHASE 2 — VERIFIED: Session Active
          ══════════════════════════════════════════════════════ */}
          {isVerified ? (
            <motion.div
              key="phase2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              {/* Verified Hero */}
              <div
                className="relative rounded-2xl overflow-hidden p-6 lg:p-8"
                style={{
                  background: 'linear-gradient(135deg, #061a0f 0%, #0a2016 50%, #061820 100%)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 50px rgba(16,185,129,0.07)',
                }}
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-12 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
                  <div className="absolute -top-12 right-1/4 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl" />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center"
                    >
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                    <div>
                      <p className="text-emerald-400 font-bold text-base">Attendance Confirmed</p>
                      <p className="text-white/40 text-xs">Your presence has been verified by the instructor</p>
                    </div>
                  </div>

                  {/* Info chips */}
                  <div className="flex flex-wrap gap-2.5">
                    {event.courseName && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-xs">
                        <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-white/70">{event.courseName}</span>
                      </div>
                    )}
                    {event.batch && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-xs">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-white/70">{event.batch}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white/70">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-white/70">{formatTime(event.time)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span className="text-white/70">{formatDate(event.date)}</span>
                    </div>
                  </div>

                  {/* Meeting link */}
                  {event.meetLink && (
                    <a
                      href={event.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                      style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: '#fff', boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}
                    >
                      <Video className="w-4 h-4" /> Join Online Meeting
                    </a>
                  )}
                </div>
              </div>

              {/* Quiz — UNLOCKED / Grace / Closed */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: quizWindowOpen
                    ? 'linear-gradient(135deg, #1a0e04, #1f1408)'
                    : 'linear-gradient(135deg, #111, #1a1a1a)',
                  border: quizWindowOpen
                    ? '1px solid rgba(249,115,22,0.4)'
                    : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: quizWindowOpen ? '0 0 30px rgba(249,115,22,0.08)' : 'none',
                }}
              >
                <div className="p-5 lg:p-6">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <FileText className={`w-5 h-5 ${quizWindowOpen ? 'text-orange-400' : 'text-white/30'}`} />
                      <h2 className="text-white font-bold text-base">Session Quiz</h2>
                    </div>
                    {quizWindowOpen ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle className="w-3 h-3" /> UNLOCKED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30 text-[10px] font-bold">
                        <Lock className="w-2.5 h-2.5" /> CLOSED
                      </span>
                    )}
                  </div>
                  {quizWindowOpen ? (
                    <>
                      <p className="text-white/40 text-sm mb-1">Attendance verified — complete the quiz to earn your score.</p>
                      {graceActive && (
                        <p className="text-orange-400/80 text-xs mb-3 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Quiz window closes in {Math.floor(graceSecsLeft / 60)}:{String(graceSecsLeft % 60).padStart(2, '0')} — submit before time runs out
                        </p>
                      )}
                      {event.quizLink ? (
                        <a
                          href={event.quizLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                          style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', boxShadow: '0 0 20px rgba(249,115,22,0.3)' }}
                        >
                          <ExternalLink className="w-4 h-4" /> Open Quiz
                        </a>
                      ) : (
                        <p className="text-white/30 text-sm italic">No quiz link configured for this session</p>
                      )}
                    </>
                  ) : (
                    <p className="text-white/30 text-sm mt-2">Submission window has closed (30-minute grace period ended).</p>
                  )}
                </div>
              </motion.div>

              {/* Pass/Fail badge after quiz score received */}
              {quizScore && quizScore.totalMarks !== null && (() => {
                const passed = quizScore.totalMarks >= 3;
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={passed
                      ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }
                      : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }
                    }
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${passed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {passed
                        ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                        : <AlertCircle className="w-5 h-5 text-red-400" />
                      }
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                        {passed ? 'Workshop Completed' : 'Failed'}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {passed
                          ? `Score ${quizScore.totalMarks}/${quizScore.totalMax} — Attendance logged`
                          : `Score ${quizScore.totalMarks}/${quizScore.totalMax} — Minimum score of 3 required`
                        }
                      </p>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Quiz Score */}
              {quizScore && quizScore.totalMarks !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl p-5"
                  style={{ background: 'linear-gradient(135deg,#0a1628,#0d1f3c)', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 0 25px rgba(99,102,241,0.08)' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-white font-bold text-base">Quiz Score</h2>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-4xl font-bold text-white">{quizScore.totalMarks}</span>
                    <span className="text-white/40 text-lg mb-1">/ {quizScore.totalMax}</span>
                  </div>
                  {/* Score bar */}
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((quizScore.totalMarks / (quizScore.totalMax || 1)) * 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg,#6366f1,#818cf8)' }}
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-2">{Math.round((quizScore.totalMarks / (quizScore.totalMax || 1)) * 100)}% score</p>
                </motion.div>
              )}

              {/* Feedback */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-card rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-base font-bold text-white">Rate This Session</h3>
                </div>
                {feedbackSubmitted ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-7 h-7 ${s <= feedbackRating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                      ))}
                    </div>
                    <p className="text-white/50 text-sm">Thanks for your feedback!</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-white/40 text-sm">How was this session?</p>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(s => (
                        <motion.button
                          key={s}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onMouseEnter={() => setFeedbackHover(s)}
                          onMouseLeave={() => setFeedbackHover(0)}
                          onClick={() => handleFeedback(s)}
                          disabled={feedbackSubmitting}
                        >
                          <Star className={`w-8 h-8 transition-all ${s <= (feedbackHover || feedbackRating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* About + Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <h3 className="text-sm font-semibold text-white mb-3">About This Session</h3>
                  <p className="text-white/55 text-sm leading-relaxed">
                    {event.description || 'An interactive session designed to enhance your wellbeing and personal growth.'}
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <h3 className="text-sm font-semibold text-white mb-3">Session Details</h3>
                  <div className="space-y-2.5">
                    {[
                      { icon: Calendar, label: formatDate(event.date) },
                      { icon: Clock, label: formatTime(event.time) },
                      { icon: MapPin, label: event.venue },
                      { icon: Users, label: `${event.registeredCount}${event.capacity > 0 ? `/${event.capacity}` : ''} participants` },
                    ].map(({ icon: Icon, label }, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-white/60">{label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>

          ) : (
            /* ══════════════════════════════════════════════════════
                PHASE 1 — CHECK-IN / PENDING
            ══════════════════════════════════════════════════════ */
            <motion.div
              key="phase1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-5"
            >
              {/* Left: Check-in card (wider) */}
              <div className="lg:col-span-3 space-y-4">
                {/* Check-in / Pending card */}
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: isPending
                      ? 'linear-gradient(135deg, #1a1400, #1f1800)'
                      : 'linear-gradient(135deg, #0f0f23, #1a0a2e)',
                    border: isPending
                      ? '1px solid rgba(245,158,11,0.35)'
                      : '1px solid rgba(239,68,68,0.25)',
                    boxShadow: isPending
                      ? '0 0 40px rgba(245,158,11,0.06)'
                      : '0 0 40px rgba(239,68,68,0.08)',
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <div className={`absolute -top-16 left-1/4 w-64 h-64 rounded-full blur-3xl ${isPending ? 'bg-amber-500/5' : 'bg-violet-500/5'}`} />
                    <div className={`absolute -top-16 right-1/4 w-64 h-64 rounded-full blur-3xl ${isPending ? 'bg-yellow-500/5' : 'bg-red-500/5'}`} />
                  </div>

                  <div className="relative p-6 lg:p-8">
                    <AnimatePresence mode="wait">
                      {/* ── NOT CHECKED IN ── */}
                      {(!hasCheckedIn || isRejected) && (
                        <motion.div
                          key="checkin-btn"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center gap-6 py-4"
                        >
                          {isRejected && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              Check-in was rejected — tap to try again
                            </motion.div>
                          )}

                          <div className="text-center">
                            <p className="text-white/70 text-base font-medium mb-1">Mark Your Attendance</p>
                            <p className="text-white/35 text-sm">Tap the button below to check in</p>
                          </div>

                          {/* Big check-in button */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleCheckIn}
                            disabled={checkingIn}
                            className="relative flex flex-col items-center justify-center w-48 h-48 rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                              background: 'rgba(16,185,129,0.08)',
                              border: '2px solid rgba(16,185,129,0.4)',
                              boxShadow: '0 0 50px rgba(16,185,129,0.15)',
                            }}
                          >
                            {!checkingIn && (
                              <>
                                <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute inset-0 rounded-full border border-emerald-500/25" />
                                <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.2, 0, 0.2] }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }} className="absolute inset-0 rounded-full border border-emerald-500/15" />
                              </>
                            )}
                            {checkingIn
                              ? <Loader2 className="w-14 h-14 text-emerald-400 animate-spin" />
                              : <Fingerprint className="w-14 h-14 text-emerald-400" />
                            }
                            <span className="mt-3 text-emerald-400 font-bold text-base">
                              {checkingIn ? 'Checking in…' : 'Check In'}
                            </span>
                          </motion.button>
                        </motion.div>
                      )}

                      {/* ── PENDING VERIFICATION ── */}
                      {isPending && (
                        <motion.div
                          key="pending"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col items-center gap-5 py-4"
                        >
                          {/* Animated spinner */}
                          <div className="relative w-28 h-28">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                              className="absolute inset-0 rounded-full border-2 border-amber-500/20 border-t-amber-400"
                            />
                            <motion.div
                              animate={{ rotate: -360 }}
                              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                              className="absolute inset-2 rounded-full border border-amber-500/10 border-b-amber-500/40"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Zap className="w-10 h-10 text-amber-400" />
                            </div>
                          </div>

                          <div className="text-center">
                            <p className="text-amber-400 font-bold text-xl mb-1.5">Verification in Progress</p>
                            <p className="text-white/50 text-sm">Associate Instructor is reviewing your check-in</p>
                          </div>

                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/8 border border-amber-500/15 text-amber-400/60 text-xs">
                            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                            Page updates automatically every 2 seconds
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* About */}
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">About This Session</h3>
                  <p className="text-white/55 text-sm leading-relaxed">
                    {event.description || 'An interactive session designed to enhance your wellbeing and personal growth.'}
                  </p>
                </div>
              </div>

              {/* Right: Event info + locked quiz */}
              <div className="lg:col-span-2 space-y-4">
                {/* Event info card */}
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Session Info</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Calendar, label: 'Date', value: formatDate(event.date) },
                      { icon: Clock, label: 'Started at', value: formatTime(event.time) },
                      { icon: MapPin, label: 'Venue', value: event.venue },
                      ...(event.courseName ? [{ icon: BookOpen, label: 'Course', value: event.courseName }] : []),
                      ...(event.batch ? [{ icon: GraduationCap, label: 'Batch', value: event.batch }] : []),
                      { icon: Users, label: 'Participants', value: `${event.registeredCount}${event.capacity > 0 ? `/${event.capacity}` : ''}` },
                    ].map(({ icon: Icon, label, value }, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
                          <p className="text-sm text-white/75 font-medium">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiz — LOCKED */}
                <div
                  className="rounded-2xl p-5 opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-white/30" />
                      <h3 className="text-sm font-semibold text-white/50">Session Quiz</h3>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/25 text-[10px] font-bold">
                      <Lock className="w-2.5 h-2.5" /> LOCKED
                    </span>
                  </div>
                  <p className="text-white/25 text-xs">Get verified by the instructor to unlock the quiz.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DashboardLayout>
    );
  }

  // ─── STANDARD EVENT PAGE (not live / not registered) ───────────────
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative h-64 rounded-2xl overflow-hidden">
            <img
              src={`https://source.unsplash.com/800x400/?workshop,meditation,wellness,${encodeURIComponent(event.title.split(' ').slice(0, 2).join(' '))}`}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {isLive && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE NOW
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">{event.title}</h1>
              <p className="text-white/80 text-sm">Organized by {event.organizer}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">About This Event</h2>
            <p className="text-white/70 leading-relaxed">
              {event.description || 'Join us for an amazing workshop experience.'}
            </p>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Event Details</h3>
            <div className="space-y-4">
              {[
                { icon: Calendar, label: 'Date', value: formatDate(event.date) },
                { icon: Clock, label: 'Time', value: formatTime(event.time) },
                { icon: MapPin, label: 'Venue', value: event.venue },
                { icon: Users, label: 'Participants', value: `${event.registeredCount}${event.capacity > 0 ? `/${event.capacity}` : ''} registered` },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-white font-medium">{value}</p>
                    <p className="text-white/50 text-sm">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRegister}
                disabled={isRegistered || isFull || registering || !isUpcoming}
                className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  isRegistered ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : isFull ? 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed'
                  : !isUpcoming ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                }`}
              >
                {registering ? <><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Registering…</>
                : isRegistered ? <><CheckCircle className="w-4 h-4" /> Registered</>
                : isFull ? <><AlertCircle className="w-4 h-4" /> Event Full</>
                : !isUpcoming ? <><AlertCircle className="w-4 h-4" /> Event Ended</>
                : 'Register Now'}
              </motion.button>

              {event.meetLink && isRegistered && (
                <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
                  className="w-full px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <ExternalLink className="w-4 h-4" /> Join Meeting
                </a>
              )}
            </div>
          </motion.div>

          {/* Rate — completed + present */}
          {!isUpcoming && !isLive && myAttendanceRec?.status === 'PRESENT' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Rate this Event</h3>
              </div>
              {feedbackSubmitted ? (
                <div className="text-center py-2">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`w-6 h-6 ${s <= feedbackRating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />)}
                  </div>
                  <p className="text-white/60 text-sm">Your rating is saved</p>
                </div>
              ) : (
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map(s => (
                    <motion.button key={s} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setFeedbackHover(s)} onMouseLeave={() => setFeedbackHover(0)}
                      onClick={() => handleFeedback(s)} disabled={feedbackSubmitting}
                    >
                      <Star className={`w-7 h-7 transition-all ${s <= (feedbackHover || feedbackRating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
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
                    {item.courseName && <p className="text-primary/80 text-xs mb-1">{item.courseName}</p>}
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
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} className={`w-2.5 h-2.5 ${s <= item.starRating ? 'text-yellow-400 fill-yellow-400' : 'text-white/15'}`} />)}
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
