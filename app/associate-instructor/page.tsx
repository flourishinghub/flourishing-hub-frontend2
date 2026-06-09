'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck, Users, ClipboardList, FileText, Search,
  RefreshCw, ShieldCheck, ShieldX, Clock, ChevronDown,
  ExternalLink, AlertCircle, Calendar, CheckCircle2, Zap, MapPin, BookOpen,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiCall } from '@/lib/api';
import toast from 'react-hot-toast';

type Tab = 'events' | 'attendance' | 'volunteers' | 'quiz' | 'registrants';

export default function AssociateInstructorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('events');

  // ── Shared event state ──
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [refreshingEvents, setRefreshingEvents] = useState(false);

  // ── Attendance state ──
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Registrants state ──
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [registrantSearch, setRegistrantSearch] = useState('');

  // ── Volunteers state ──
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [volSearch, setVolSearch] = useState('');

  // ── Hash-based tab navigation ──
  useEffect(() => {
    const validTabs: Tab[] = ['events', 'attendance', 'volunteers', 'quiz', 'registrants'];
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Tab;
      if (hash && validTabs.includes(hash)) setActiveTab(hash);
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ── Fetch assigned events ──
  const fetchLiveEvents = async (silent = false) => {
    if (!silent) setLoadingEvents(true);
    else setRefreshingEvents(true);
    try {
      const response = await apiCall('/event-operations/my-assigned-events');
      const assigned: any[] = response.data || [];
      setLiveEvents(assigned);
      const ids = assigned.map((e: any) => e.id);
      // Auto-select if only one event; clear selection if selected event was deleted
      setSelectedEventId((prev) => {
        if (assigned.length === 1) return assigned[0].id;
        if (prev && !ids.includes(prev)) return null; // event was deleted
        return prev;
      });
    } catch {
      toast.error('Could not load assigned events');
    } finally {
      setLoadingEvents(false);
      setRefreshingEvents(false);
    }
  };

  useEffect(() => {
    fetchLiveEvents();
    // Re-fetch every 60s so computedStatus stays current and deleted events disappear
    const interval = setInterval(() => fetchLiveEvents(true), 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch check-ins ──
  const fetchCheckIns = async (eventId: string) => {
    setLoadingCheckIns(true);
    try {
      const response = await apiCall('/event-operations/' + eventId + '/check-ins');
      setCheckIns(response.data || []);
    } catch {
      toast.error('Could not load check-ins');
    } finally {
      setLoadingCheckIns(false);
    }
  };

  // ── Fetch registrants ──
  const fetchRegistrants = async (eventId: string) => {
    setLoadingRegistrants(true);
    try {
      const response = await apiCall('/event-operations/' + eventId + '/registrants');
      setRegistrants(response.data || []);
    } catch {
      toast.error('Could not load registrants');
    } finally {
      setLoadingRegistrants(false);
    }
  };

  // ── Fetch volunteers ──
  const fetchVolunteers = async (eventId: string) => {
    setLoadingVolunteers(true);
    try {
      const response = await apiCall('/event-operations/' + eventId + '/event-volunteers');
      setVolunteers(response.data || []);
    } catch {
      toast.error('Could not load volunteers');
    } finally {
      setLoadingVolunteers(false);
    }
  };

  // ── Fetch all data when event is selected ──
  useEffect(() => {
    if (!selectedEventId) {
      // Clear stale data when event is deselected (e.g. deleted by admin)
      setCheckIns([]);
      setRegistrants([]);
      setVolunteers([]);
      return;
    }

    fetchCheckIns(selectedEventId);
    fetchRegistrants(selectedEventId);
    fetchVolunteers(selectedEventId);

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
      autoRefreshRef.current = setInterval(() => fetchCheckIns(selectedEventId), 15000);
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Verify / Reject check-in ──
  const handleVerify = async (checkInId: string, status: 'VERIFIED' | 'REJECTED', note = '') => {
    setVerifyingId(checkInId);
    try {
      await apiCall('/event-operations/check-ins/' + checkInId, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      });
      toast.success(status === 'VERIFIED' ? 'Attendance verified' : 'Marked absent');
      if (selectedEventId) await fetchCheckIns(selectedEventId);
    } catch {
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
    } catch {
      toast.error('Bulk verify failed. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  const verifiedCount = checkIns.filter((c) => c.status === 'VERIFIED').length;
  const pendingCount = checkIns.filter((c) => c.status === 'PENDING').length;
  const selectedEvent = liveEvents.find((e) => (e.id || e.eventId) === selectedEventId);

  const filteredRegistrants = registrants.filter((r) => {
    const name = r.user?.name || '';
    const roll = r.user?.studentProfile?.rollNumber || '';
    const q = registrantSearch.toLowerCase();
    return name.toLowerCase().includes(q) || roll.toLowerCase().includes(q);
  });

  const filteredVolunteers = volunteers.filter((v) => {
    const name = v.user?.name || '';
    const roll = v.user?.studentProfile?.rollNumber || '';
    const q = volSearch.toLowerCase();
    return name.toLowerCase().includes(q) || roll.toLowerCase().includes(q);
  });

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'events', label: 'My Events', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'volunteers', label: 'Volunteers', icon: Users },
    { id: 'quiz', label: 'Quiz & Feedback', icon: ClipboardList },
    { id: 'registrants', label: 'Registrants', icon: FileText },
  ];

  // Recompute status from actual timestamps (overrides cached backend value)
  const recomputeStatus = (e: any): 'live' | 'upcoming' | 'completed' => {
    const now = new Date();
    const start = new Date(e.startAt);
    const end = e.endAt ? new Date(e.endAt) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    if (now > end) return 'completed';
    if (now >= start && now <= end) return 'live';
    return 'upcoming';
  };
  const liveNow = liveEvents.filter((e) => recomputeStatus(e) === 'live');
  const upcoming = liveEvents.filter((e) => recomputeStatus(e) === 'upcoming');
  const completed = liveEvents.filter((e) => recomputeStatus(e) === 'completed');

  // ── Reusable event selector ──
  const EventSelector = () => (
    <>
      {loadingEvents ? (
        <div className="flex items-center gap-2 text-white/50 text-sm py-6 justify-center">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading events...
        </div>
      ) : liveEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
            <Clock className="w-6 h-6 text-white/30" />
          </div>
          <p className="text-white/50 text-sm">No assigned workshops</p>
          <p className="text-white/30 text-xs">Events assigned to you will appear here</p>
        </div>
      ) : (
        <>
          {liveEvents.length > 1 && (
            <div className="relative max-w-sm">
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value || null)}
                className="w-full appearance-none px-4 py-2.5 pr-9 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="" className="bg-gray-900">— Select an event —</option>
                {liveEvents.map((ev: any) => (
                  <option key={ev.id || ev.eventId} value={ev.id || ev.eventId} className="bg-gray-900">
                    {ev.title || ev.sessionTitle || ev.name || 'Unnamed Event'}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          )}
          {selectedEvent && (
            <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/60">
              <span className="text-white/80 font-medium">{selectedEvent.title}</span>
              {selectedEvent.course?.name && (
                <span>Course: <span className="text-white/80">{selectedEvent.course.name}</span></span>
              )}
              {selectedEvent.venue && (
                <span>Venue: <span className="text-white/80">{selectedEvent.venue}</span></span>
              )}
              {selectedEvent.startAt && (
                <span>
                  Date: <span className="text-white/80">
                    {new Date(selectedEvent.startAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </span>
              )}
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          <span className="gradient-text">Associate Instructor</span> Panel
        </h1>
        <p className="text-sm text-white/50 mt-1">Manage attendance, volunteers, quizzes &amp; registrants</p>
      </motion.div>

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

          {/* ─── Events Tab ─── */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Refresh button */}
              <div className="flex justify-end">
                <button
                  onClick={() => fetchLiveEvents(true)}
                  disabled={refreshingEvents || loadingEvents}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 text-xs font-medium transition-all disabled:opacity-40"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshingEvents ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              {loadingEvents ? (
                <div className="flex items-center gap-2 text-white/50 text-sm py-10 justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading your events...
                </div>
              ) : liveEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-white/30" />
                  </div>
                  <p className="text-white/50 text-sm font-medium">No events assigned</p>
                  <p className="text-white/30 text-xs">Events assigned to you by admin will appear here</p>
                </div>
              ) : (
                <>
                  {/* Live Now */}
                  {liveNow.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-semibold text-white">Live Now</h3>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        {liveNow.map((ev: any) => (
                          <EventCard key={ev.id} ev={ev} onSelect={(id) => { setSelectedEventId(id); setActiveTab('attendance'); }} badge="live" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming */}
                  {upcoming.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-white">Upcoming</h3>
                      </div>
                      <div className="space-y-2">
                        {upcoming.map((ev: any) => (
                          <EventCard key={ev.id} ev={ev} onSelect={(id) => { setSelectedEventId(id); setActiveTab('attendance'); }} badge="upcoming" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed */}
                  {completed.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-white/40" />
                        <h3 className="text-sm font-semibold text-white">Completed</h3>
                      </div>
                      <div className="space-y-2">
                        {completed.map((ev: any) => (
                          <EventCard key={ev.id} ev={ev} onSelect={(id) => { setSelectedEventId(id); setActiveTab('attendance'); }} badge="completed" />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── Attendance Tab ─── */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-sm font-semibold text-white">Live Workshop Attendance</h3>
                {selectedEventId && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Auto-refreshes every 15s</span>
                    <button
                      onClick={() => selectedEventId && fetchCheckIns(selectedEventId)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all text-xs"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>
                )}
              </div>

              <EventSelector />

              {!loadingEvents && selectedEventId && (
                <>
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
                            const checkinTime = (ci.checkedInAt || ci.createdAt)
                              ? new Date(ci.checkedInAt || ci.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '—';
                            return (
                              <tr key={ciId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3 text-white font-medium">{ci.user?.name || '—'}</td>
                                <td className="px-4 py-3 text-white/60 text-xs">{ci.user?.studentProfile?.rollNumber || '—'}</td>
                                <td className="px-4 py-3 text-white/60 text-xs">{checkinTime}</td>
                                <td className="px-4 py-3">
                                  {ci.status === 'PENDING' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                                      <Clock className="w-3 h-3" /> Pending
                                    </span>
                                  )}
                                  {ci.status === 'VERIFIED' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                      <ShieldCheck className="w-3 h-3" /> Verified
                                    </span>
                                  )}
                                  {ci.status === 'REJECTED' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">
                                      <ShieldX className="w-3 h-3" /> Rejected
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
                                          {isActing ? <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                                          Verify
                                        </button>
                                        <button
                                          onClick={() => handleVerify(ciId, 'REJECTED', 'Absent')}
                                          disabled={isActing}
                                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all text-xs font-medium disabled:opacity-50"
                                        >
                                          <ShieldX className="w-3 h-3" /> Mark Absent
                                        </button>
                                      </>
                                    )}
                                    {ci.status === 'VERIFIED' && (
                                      <button
                                        onClick={() => handleVerify(ciId, 'REJECTED', 'Unverified by instructor')}
                                        disabled={isActing}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-white/50 border border-white/10 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30 transition-all text-xs font-medium disabled:opacity-50"
                                      >
                                        {isActing ? <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" /> : <ShieldX className="w-3 h-3" />}
                                        Unverify
                                      </button>
                                    )}
                                    {ci.status === 'REJECTED' && (
                                      <button
                                        onClick={() => handleVerify(ciId, 'VERIFIED')}
                                        disabled={isActing}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-medium disabled:opacity-50"
                                      >
                                        {isActing ? <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
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
            </div>
          )}

          {/* ─── Volunteers Tab ─── */}
          {activeTab === 'volunteers' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-sm font-semibold text-white">Assigned Volunteers</h3>
                {selectedEventId && (
                  <button
                    onClick={() => selectedEventId && fetchVolunteers(selectedEventId)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all text-xs"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                )}
              </div>

              <EventSelector />

              {!loadingEvents && selectedEventId && (
                <>
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={volSearch}
                      onChange={(e) => setVolSearch(e.target.value)}
                      placeholder="Search volunteers..."
                      className="input-dark w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                    />
                  </div>

                  {loadingVolunteers ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-white/40 text-sm">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading volunteers...
                    </div>
                  ) : filteredVolunteers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white/30" />
                      </div>
                      <p className="text-white/50 text-sm">
                        {volSearch ? 'No volunteers match your search' : 'No volunteers assigned to this event'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/5">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Name</th>
                            <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Roll No</th>
                            <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Department</th>
                            <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Year</th>
                            <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVolunteers.map((v: any) => (
                            <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 text-white font-medium">{v.user?.name || '—'}</td>
                              <td className="px-4 py-3 text-white/60 text-xs">{v.user?.studentProfile?.rollNumber || '—'}</td>
                              <td className="px-4 py-3 text-white/60 text-xs">{v.user?.studentProfile?.department || '—'}</td>
                              <td className="px-4 py-3 text-white/60 text-xs">
                                {v.user?.studentProfile?.yearOfStudy ? `Year ${v.user.studentProfile.yearOfStudy}` : '—'}
                              </td>
                              <td className="px-4 py-3 text-white/60 text-xs">{v.user?.email || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── Quiz & Feedback Tab ─── */}
          {activeTab === 'quiz' && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-white">Quiz &amp; Feedback Links</h3>

              <EventSelector />

              {!loadingEvents && selectedEventId && (() => {
                const modules = selectedEvent?.modules || [];
                const hasLinks = modules.some((m: any) => m.quizLink || m.feedbackLink);

                if (modules.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-white/30" />
                      </div>
                      <p className="text-white/50 text-sm">No sessions configured for this event</p>
                    </div>
                  );
                }

                if (!hasLinks) {
                  return (
                    <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-yellow-400 font-medium">No links configured</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          Quiz and feedback links for this event&apos;s sessions haven&apos;t been set up yet. Contact the admin.
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {modules.map((mod: any) => (
                      <div key={mod.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-sm font-semibold text-white mb-1">{mod.title}</p>
                        <p className="text-xs text-white/40 mb-3">
                          {new Date(mod.startAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          &nbsp;·&nbsp;
                          {new Date(mod.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(mod.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {mod.quizLink ? (
                            <a
                              href={mod.quizLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all text-xs font-medium"
                            >
                              <ExternalLink className="w-3 h-3" /> Open Quiz
                            </a>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg bg-white/5 text-white/30 border border-white/10 text-xs">
                              No quiz link
                            </span>
                          )}
                          {mod.feedbackLink ? (
                            <a
                              href={mod.feedbackLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-all text-xs font-medium"
                            >
                              <ExternalLink className="w-3 h-3" /> Open Feedback
                            </a>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg bg-white/5 text-white/30 border border-white/10 text-xs">
                              No feedback link
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ─── Registrants Tab ─── */}
          {activeTab === 'registrants' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-sm font-semibold text-white">Event Registrants</h3>
                {selectedEventId && (
                  <button
                    onClick={() => selectedEventId && fetchRegistrants(selectedEventId)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all text-xs"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                )}
              </div>

              <EventSelector />

              {!loadingEvents && selectedEventId && (
                <>
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={registrantSearch}
                      onChange={(e) => setRegistrantSearch(e.target.value)}
                      placeholder="Search by name or roll no..."
                      className="input-dark w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                    />
                  </div>

                  {loadingRegistrants ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-white/40 text-sm">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading registrants...
                    </div>
                  ) : filteredRegistrants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white/30" />
                      </div>
                      <p className="text-white/50 text-sm">
                        {registrantSearch ? 'No registrants match your search' : 'No registrants yet'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-white/40">
                        {filteredRegistrants.length} registrant{filteredRegistrants.length !== 1 ? 's' : ''}
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-white/5">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                              <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Name</th>
                              <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Roll No</th>
                              <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Department</th>
                              <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Year</th>
                              <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Programme</th>
                              <th className="text-left px-4 py-3 text-white/50 font-medium text-xs">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRegistrants.map((r: any) => (
                              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3 text-white font-medium">{r.user?.name || '—'}</td>
                                <td className="px-4 py-3 text-white/60 text-xs">{r.user?.studentProfile?.rollNumber || '—'}</td>
                                <td className="px-4 py-3 text-white/60 text-xs">{r.user?.studentProfile?.department || '—'}</td>
                                <td className="px-4 py-3 text-white/60 text-xs">
                                  {r.user?.studentProfile?.yearOfStudy ? `Year ${r.user.studentProfile.yearOfStudy}` : '—'}
                                </td>
                                <td className="px-4 py-3 text-white/60 text-xs">{r.user?.studentProfile?.programme || '—'}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                    r.status === 'ATTENDED'
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                      : r.status === 'CANCELLED'
                                      ? 'bg-red-500/15 text-red-400 border-red-500/25'
                                      : r.status === 'WAITLISTED'
                                      ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
                                      : 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                                  }`}>
                                    {r.status || 'REGISTERED'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}

function EventCard({ ev, onSelect, badge }: { ev: any; onSelect: (id: string) => void; badge: 'live' | 'upcoming' | 'completed' }) {
  const badgeStyles = {
    live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    upcoming: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    completed: 'bg-white/10 text-white/40 border-white/10',
  };
  const badgeLabel = { live: 'Live Now', upcoming: 'Upcoming', completed: 'Completed' };

  const dateStr = ev.startAt
    ? new Date(ev.startAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const timeStr = ev.startAt
    ? new Date(ev.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-white truncate">{ev.title || 'Unnamed Event'}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeStyles[badge]}`}>
              {badge === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />}
              {badgeLabel[badge]}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-white/40 mt-1">
            {dateStr && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {dateStr} {timeStr && `· ${timeStr}`}
              </span>
            )}
            {ev.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {ev.venue}
              </span>
            )}
            {ev.course?.name && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {ev.course.name}
              </span>
            )}
          </div>
          <div className="flex gap-3 mt-2 text-xs text-white/40">
            <span>{ev.registrationCount ?? ev._count?.registrations ?? 0} registered</span>
            {badge !== 'completed' && (
              <span>{ev.pendingCheckIns ?? 0} pending check-ins</span>
            )}
          </div>
        </div>
        {badge !== 'completed' && (
          <button
            onClick={() => onSelect(ev.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all text-xs font-medium shrink-0"
          >
            <UserCheck className="w-3 h-3" /> Manage
          </button>
        )}
        {badge === 'completed' && (
          <button
            onClick={() => onSelect(ev.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 transition-all text-xs font-medium shrink-0"
          >
            <FileText className="w-3 h-3" /> View
          </button>
        )}
      </div>
    </div>
  );
}
