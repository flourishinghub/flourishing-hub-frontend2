'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck, Users, ClipboardList, FileText, Search,
  ToggleLeft, ToggleRight, CheckSquare, Square,
  RefreshCw, ShieldCheck, ShieldX, Clock, ChevronDown,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import { apiCall } from '@/lib/api';
import {
  mockAttendanceStudents, mockVolunteerAttendance,
  mockVolunteerPool, mockQuizSessions, mockStudents,
} from '@/lib/mockData';
import type { AttendanceRecord, VolunteerPool, QuizSession } from '@/types';
import toast from 'react-hot-toast';

type Tab = 'attendance' | 'volunteers' | 'quiz' | 'registrants';

function isTodayOrOngoing(session: any): boolean {
  if (!session) return false;
  if (session.status === 'ongoing' || session.status === 'ONGOING') return true;
  const dateStr: string | undefined =
    session.date || session.startAt || session.scheduledAt || session.startDate;
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr.startsWith(today);
}

export default function AssociateInstructorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('attendance');

  // ── Existing mock-data state (volunteers / quiz / registrants) ──
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>(mockAttendanceStudents);
  const [volunteerAttendance, setVolunteerAttendance] = useState<AttendanceRecord[]>(mockVolunteerAttendance);
  const [volunteerPool, setVolunteerPool] = useState<VolunteerPool[]>(mockVolunteerPool);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>(mockQuizSessions);
  const [studentSearch, setStudentSearch] = useState('');
  const [volSearch, setVolSearch] = useState('');

  // ── Real attendance state ──
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch live/today events on mount ──
  useEffect(() => {
    const fetchLiveEvents = async () => {
      setLoadingEvents(true);
      try {
        const response = await apiCall('/frontend/dashboard');
        const sessions: any[] = response.data?.dashboard?.sessions || [];
        const todaySessions = sessions.filter(isTodayOrOngoing);
        setLiveEvents(todaySessions);
        if (todaySessions.length === 1) {
          setSelectedEventId(todaySessions[0].id || todaySessions[0].eventId || null);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard sessions:', err);
        toast.error('Could not load live events');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchLiveEvents();
  }, []);

  // ── Fetch check-ins when a live event is selected ──
  const fetchCheckIns = async (eventId: string) => {
    setLoadingCheckIns(true);
    try {
      const response = await apiCall('/event-operations/' + eventId + '/check-ins');
      setCheckIns(response.data || []);
    } catch (err) {
      console.error('Failed to fetch check-ins:', err);
      toast.error('Could not load check-ins');
    } finally {
      setLoadingCheckIns(false);
    }
  };

  useEffect(() => {
    if (!selectedEventId) return;

    fetchCheckIns(selectedEventId);

    // Auto-refresh every 15 seconds
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    autoRefreshRef.current = setInterval(() => {
      fetchCheckIns(selectedEventId);
    }, 15000);

    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  // ── Stop auto-refresh when leaving attendance tab ──
  useEffect(() => {
    if (activeTab !== 'attendance') {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    } else if (selectedEventId) {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = setInterval(() => {
        fetchCheckIns(selectedEventId);
      }, 15000);
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Verify / Reject a single check-in ──
  const handleVerify = async (checkInId: string, status: 'VERIFIED' | 'REJECTED', note = '') => {
    setVerifyingId(checkInId);
    try {
      await apiCall('/event-operations/check-ins/' + checkInId, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      });
      toast.success(status === 'VERIFIED' ? 'Attendance verified' : 'Marked absent');
      if (selectedEventId) await fetchCheckIns(selectedEventId);
    } catch (err) {
      console.error('Failed to update check-in:', err);
      toast.error('Action failed. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  // ── Verify all pending ──
  const handleVerifyAll = async () => {
    if (!selectedEventId) return;
    setVerifyingId('__all__');
    try {
      await apiCall('/event-operations/' + selectedEventId + '/check-ins/verify-all', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('All pending check-ins verified');
      await fetchCheckIns(selectedEventId);
    } catch (err) {
      console.error('Failed to verify all:', err);
      toast.error('Bulk verify failed. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  // ── Existing mock-data handlers (volunteers / quiz) ──
  const toggleStudentStatus = (id: string) => {
    setStudentAttendance((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: r.status === 'present' ? 'absent' : 'present' } : r)
    );
  };

  const toggleVolunteerStatus = (id: string) => {
    setVolunteerAttendance((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: r.status === 'present' ? 'absent' : 'present' } : r)
    );
  };

  const toggleVolunteerSelect = (id: string) => {
    setVolunteerPool((prev) => prev.map((v) => v.id === id ? { ...v, selected: !v.selected } : v));
  };

  const confirmVolunteerPool = () => {
    const selected = volunteerPool.filter((v) => v.selected);
    toast.success(`${selected.length} volunteer${selected.length !== 1 ? 's' : ''} confirmed for the event`);
  };

  const toggleQuiz = (sessionId: string) => {
    setQuizSessions((prev) => prev.map((s) => s.sessionId === sessionId ? { ...s, quizActive: !s.quizActive } : s));
    toast.success('Quiz status updated');
  };

  const toggleFeedback = (sessionId: string) => {
    setQuizSessions((prev) => prev.map((s) => s.sessionId === sessionId ? { ...s, feedbackActive: !s.feedbackActive } : s));
    toast.success('Feedback status updated');
  };

  const filteredVolunteers = volunteerAttendance.filter(
    (r) => r.studentName.toLowerCase().includes(volSearch.toLowerCase()) ||
      r.rollNo.toLowerCase().includes(volSearch.toLowerCase())
  );

  // ── Derived stats ──
  const verifiedCount = checkIns.filter((c) => c.status === 'VERIFIED').length;
  const pendingCount = checkIns.filter((c) => c.status === 'PENDING').length;
  const presentCount = studentAttendance.filter((r) => r.status === 'present').length;
  const absentCount = studentAttendance.filter((r) => r.status === 'absent').length;

  const selectedEvent = liveEvents.find(
    (e) => (e.id || e.eventId) === selectedEventId
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'volunteers', label: 'Volunteers', icon: Users },
    { id: 'quiz', label: 'Quiz & Feedback', icon: ClipboardList },
    { id: 'registrants', label: 'Registrants', icon: FileText },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          <span className="gradient-text">Associate Instructor</span> Panel
        </h1>
        <p className="text-sm text-white/50 mt-1">Manage attendance, volunteers, quizzes &amp; registrants</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Verified" value={verifiedCount || presentCount} icon={UserCheck} color="teal" />
        <StatCard title="Pending" value={pendingCount || absentCount} icon={UserCheck} color="red" />
        <StatCard title="Volunteers" value={volunteerPool.filter((v) => v.selected).length} icon={Users} color="purple" />
        <StatCard title="Registrants" value={mockStudents.length} icon={FileText} color="yellow" />
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'text-white border-b-2 border-primary bg-primary/5'
                  : 'text-white/50 hover:text-white/80 border-b-2 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ─── Attendance Tab ─── */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-sm font-semibold text-white">Live Workshop Attendance</h3>
                {selectedEventId && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">
                      Auto-refreshes every 15s
                    </span>
                    <button
                      onClick={() => selectedEventId && fetchCheckIns(selectedEventId)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all text-xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>
                )}
              </div>

              {/* Loading events */}
              {loadingEvents ? (
                <div className="flex items-center gap-2 text-white/50 text-sm py-6 justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading events...
                </div>
              ) : liveEvents.length === 0 ? (
                /* No live events */
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/50 text-sm">No live workshops right now</p>
                  <p className="text-white/30 text-xs">Live events will appear here automatically</p>
                </div>
              ) : (
                <>
                  {/* Event selector (shown when >1 live event) */}
                  {liveEvents.length > 1 && (
                    <div className="relative max-w-sm">
                      <select
                        value={selectedEventId || ''}
                        onChange={(e) => setSelectedEventId(e.target.value || null)}
                        className="w-full appearance-none px-4 py-2.5 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 cursor-pointer"
                      >
                        <option value="" className="bg-gray-900">— Select an event —</option>
                        {liveEvents.map((ev: any) => (
                          <option
                            key={ev.id || ev.eventId}
                            value={ev.id || ev.eventId}
                            className="bg-gray-900"
                          >
                            {ev.title || ev.sessionTitle || ev.name || 'Unnamed Event'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    </div>
                  )}

                  {/* Selected event info */}
                  {selectedEvent && (
                    <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/60">
                      {(selectedEvent.course?.name || selectedEvent.courseName) && (
                        <span>
                          Course: <span className="text-white/80 font-medium">{selectedEvent.course?.name || selectedEvent.courseName}</span>
                        </span>
                      )}
                      {(selectedEvent.batch || selectedEvent.batchName) && (
                        <span>
                          Batch: <span className="text-white/80 font-medium">{selectedEvent.batch || selectedEvent.batchName}</span>
                        </span>
                      )}
                      {(selectedEvent.venue || selectedEvent.room) && (
                        <span>
                          Room: <span className="text-white/80 font-medium">{selectedEvent.venue || selectedEvent.room}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Check-ins section */}
                  {selectedEventId && (
                    <>
                      {/* Verify All button */}
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            {verifiedCount} Verified
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                            {pendingCount} Pending
                          </span>
                        </div>
                        {pendingCount > 0 && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleVerifyAll}
                            disabled={verifyingId === '__all__'}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-semibold disabled:opacity-60"
                          >
                            {verifyingId === '__all__' ? (
                              <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            Verify All Pending
                          </motion.button>
                        )}
                      </div>

                      {/* Check-ins table */}
                      {loadingCheckIns ? (
                        <div className="flex items-center justify-center py-8 gap-2 text-white/40 text-sm">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Loading check-ins...
                        </div>
                      ) : checkIns.length === 0 ? (
                        <div className="text-center py-8 text-white/40 text-sm">
                          No check-ins yet — students will appear here once they record attendance
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-white/5">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Name</th>
                                <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Roll No</th>
                                <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Check-in Time</th>
                                <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Status</th>
                                <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {checkIns.map((ci: any) => {
                                const ciId = ci.id;
                                const isActing = verifyingId === ciId;
                                const checkinTime = ci.createdAt
                                  ? new Date(ci.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : '—';
                                const userName = ci.user?.name || ci.studentName || '—';
                                const rollNo = ci.user?.studentProfile?.rollNumber || ci.rollNo || '—';

                                return (
                                  <tr
                                    key={ciId}
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                  >
                                    <td className="px-4 py-3 text-white font-medium">{userName}</td>
                                    <td className="px-4 py-3 text-white/60 text-xs">{rollNo}</td>
                                    <td className="px-4 py-3 text-white/60 text-xs">{checkinTime}</td>
                                    <td className="px-4 py-3">
                                      {ci.status === 'PENDING' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                                          <Clock className="w-3 h-3" />
                                          Pending
                                        </span>
                                      )}
                                      {ci.status === 'VERIFIED' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                          <ShieldCheck className="w-3 h-3" />
                                          Verified
                                        </span>
                                      )}
                                      {ci.status === 'REJECTED' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">
                                          <ShieldX className="w-3 h-3" />
                                          Rejected
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {ci.status === 'PENDING' && (
                                          <>
                                            <button
                                              onClick={() => handleVerify(ciId, 'VERIFIED')}
                                              disabled={isActing}
                                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-medium disabled:opacity-50"
                                            >
                                              {isActing ? (
                                                <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                              ) : (
                                                <ShieldCheck className="w-3 h-3" />
                                              )}
                                              Verify
                                            </button>
                                            <button
                                              onClick={() => handleVerify(ciId, 'REJECTED', 'Absent')}
                                              disabled={isActing}
                                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all text-xs font-medium disabled:opacity-50"
                                            >
                                              <ShieldX className="w-3 h-3" />
                                              Mark Absent
                                            </button>
                                          </>
                                        )}
                                        {ci.status === 'VERIFIED' && (
                                          <button
                                            onClick={() => handleVerify(ciId, 'REJECTED', 'Unverified by instructor')}
                                            disabled={isActing}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-white/50 border border-white/10 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30 transition-all text-xs font-medium disabled:opacity-50"
                                          >
                                            {isActing ? (
                                              <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <ShieldX className="w-3 h-3" />
                                            )}
                                            Unverify
                                          </button>
                                        )}
                                        {ci.status === 'REJECTED' && (
                                          <button
                                            onClick={() => handleVerify(ciId, 'VERIFIED')}
                                            disabled={isActing}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-medium disabled:opacity-50"
                                          >
                                            {isActing ? (
                                              <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <ShieldCheck className="w-3 h-3" />
                                            )}
                                            Re-verify
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── Volunteers Tab (unchanged mock data) ─── */}
          {activeTab === 'volunteers' && (
            <div className="space-y-6">
              {/* Volunteer Attendance */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Volunteer Attendance</h3>
                <div className="relative max-w-sm mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    value={volSearch}
                    onChange={(e) => setVolSearch(e.target.value)}
                    placeholder="Search volunteers..."
                    className="input-dark w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  {filteredVolunteers.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">{record.studentName}</p>
                        <p className="text-xs text-white/40">{record.rollNo}</p>
                      </div>
                      <button
                        onClick={() => toggleVolunteerStatus(record.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          record.status === 'present'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {record.status === 'present' ? 'Present' : 'Absent'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volunteer Pool */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Volunteer Pool — Wellness Wednesday</h3>
                  <span className="text-xs text-white/40">{volunteerPool.filter((v) => v.selected).length} selected</span>
                </div>
                <div className="space-y-2 mb-4">
                  {volunteerPool.map((vol) => (
                    <div
                      key={vol.id}
                      onClick={() => vol.available && toggleVolunteerSelect(vol.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        vol.available ? 'cursor-pointer hover:bg-white/[0.04]' : 'opacity-50 cursor-not-allowed'
                      } ${vol.selected ? 'bg-primary/5 border-primary/30' : 'bg-white/[0.02] border-white/5'}`}
                    >
                      {vol.selected ? (
                        <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-white/30 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{vol.name}</p>
                        <p className="text-xs text-white/40">{vol.rollNo} · {vol.department} · Year {vol.year}</p>
                      </div>
                      {!vol.available && (
                        <span className="text-[10px] text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmVolunteerPool}
                  className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold"
                >
                  Confirm Selection ({volunteerPool.filter((v) => v.selected).length} volunteers)
                </motion.button>
              </div>
            </div>
          )}

          {/* ─── Quiz Tab (unchanged mock data) ─── */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white mb-2">Quiz &amp; Feedback Activation</h3>
              {quizSessions.map((session) => (
                <div key={session.sessionId} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{session.sessionTitle}</p>
                      <p className="text-xs text-white/40">{session.registrantCount} registrants</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleQuiz(session.sessionId)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          session.quizActive
                            ? 'bg-primary/20 text-primary border-primary/40'
                            : 'bg-white/5 text-white/50 border-white/10 hover:bg-primary/10 hover:text-primary/80'
                        }`}
                      >
                        {session.quizActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        Quiz {session.quizActive ? 'Active' : 'Off'}
                      </button>
                      <button
                        onClick={() => toggleFeedback(session.sessionId)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          session.feedbackActive
                            ? 'bg-accent/20 text-accent border-accent/40'
                            : 'bg-white/5 text-white/50 border-white/10 hover:bg-accent/10 hover:text-accent/80'
                        }`}
                      >
                        {session.feedbackActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        Feedback {session.feedbackActive ? 'Active' : 'Off'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Registrants Tab (unchanged mock data) ─── */}
          {activeTab === 'registrants' && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Registrants — Wellness Wednesday</h3>
              <DataTable
                data={mockStudents.map((s) => ({
                  name: s.name,
                  rollNo: s.rollNo,
                  dept: s.department,
                  year: `Year ${s.year}`,
                  programme: s.programme,
                  registered: s.registeredEvents.includes('evt_001') ? 'Yes' : 'No',
                })) as unknown as Record<string, unknown>[]}
                columns={[
                  { key: 'name', label: 'Name', sortable: true },
                  { key: 'rollNo', label: 'Roll No' },
                  { key: 'dept', label: 'Department', sortable: true },
                  { key: 'year', label: 'Year' },
                  { key: 'programme', label: 'Programme' },
                  {
                    key: 'registered', label: 'Registered',
                    render: (row) => (
                      <span className={(row as { registered: string }).registered === 'Yes' ? 'badge-green' : 'badge-red'}>
                        {(row as { registered: string }).registered === 'Yes' ? 'Yes' : 'No'}
                      </span>
                    ),
                  },
                ]}
                searchKeys={['name', 'rollNo'] as never[]}
                searchPlaceholder="Search registrants..."
                emptyMessage="No registrants found"
              />
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
