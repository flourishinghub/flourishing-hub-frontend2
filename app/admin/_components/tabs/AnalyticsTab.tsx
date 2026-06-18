'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Download, Eye, Search, Star, Users, Activity, TrendingUp, BarChart2, ChevronDown } from 'lucide-react';

interface AnalyticsTabProps {
  analyticsLoading: boolean;
  analyticsData: any[];
  selectedAnalyticsEvent: any | null;
  setSelectedAnalyticsEvent: (event: any | null) => void;
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
    </div>
  );
}

function CascadeSelect({
  label, value, options, onChange, disabled,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none w-full pl-3 pr-8 py-2 rounded-xl text-xs font-medium bg-white/[0.04] border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-primary/50 transition-colors"
      >
        <option value="">{label}: All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
    </div>
  );
}

export default function AnalyticsTab({
  analyticsLoading,
  analyticsData,
  selectedAnalyticsEvent,
  setSelectedAnalyticsEvent,
}: AnalyticsTabProps) {
  const [filterCourse, setFilterCourse] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterInstructor, setFilterInstructor] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [rollSearch, setRollSearch] = useState('');
  const [rollProfile, setRollProfile] = useState<{ name: string; rollNo: string; records: any[] } | null>(null);

  /* ── Cascading filter option derivation ── */
  const courseOptions = useMemo(
    () => Array.from(new Set(analyticsData.map((r) => r.courseName).filter(Boolean))),
    [analyticsData],
  );

  const topicOptions = useMemo(() => {
    const base = filterCourse ? analyticsData.filter((r) => r.courseName === filterCourse) : analyticsData;
    return Array.from(new Set(base.map((r) => r.workshopName).filter(Boolean)));
  }, [analyticsData, filterCourse]);

  const instructorOptions = useMemo(() => {
    let base = analyticsData;
    if (filterCourse) base = base.filter((r) => r.courseName === filterCourse);
    if (filterTopic) base = base.filter((r) => r.workshopName === filterTopic);
    return Array.from(new Set(base.map((r) => r.instructorName).filter(Boolean)));
  }, [analyticsData, filterCourse, filterTopic]);

  const batchOptions = useMemo(() => {
    let base = analyticsData;
    if (filterCourse) base = base.filter((r) => r.courseName === filterCourse);
    if (filterTopic) base = base.filter((r) => r.workshopName === filterTopic);
    if (filterInstructor) base = base.filter((r) => r.instructorName === filterInstructor);
    return Array.from(new Set(base.map((r) => r.batch).filter(Boolean)));
  }, [analyticsData, filterCourse, filterTopic, filterInstructor]);

  const filtered = useMemo(() => {
    let base = analyticsData;
    if (filterCourse) base = base.filter((r) => r.courseName === filterCourse);
    if (filterTopic) base = base.filter((r) => r.workshopName === filterTopic);
    if (filterInstructor) base = base.filter((r) => r.instructorName === filterInstructor);
    if (filterBatch) base = base.filter((r) => r.batch === filterBatch);
    return base;
  }, [analyticsData, filterCourse, filterTopic, filterInstructor, filterBatch]);

  /* ── Aggregate metrics ── */
  const metrics = useMemo(() => {
    const uniqueStudents = Array.from(new Set(
      filtered.flatMap((r) => (r.students || []).map((s: any) => s.rollNo).filter(Boolean)),
    ));
    const ratedRows = filtered.filter((r) => r.avgRating);
    const avgRating = ratedRows.length
      ? ratedRows.reduce((sum, r) => sum + r.avgRating, 0) / ratedRows.length
      : null;
    const totalPassed = filtered.reduce((sum, r) => sum + (r.totalAttended || 0), 0);
    const totalRegistered = filtered.reduce((sum, r) => sum + (r.totalRegistered || 0), 0);
    return {
      totalStudents: uniqueStudents.length || totalRegistered,
      totalEvents: filtered.length,
      avgRating: avgRating ? `${avgRating.toFixed(2)} / 5.0` : '—',
      passRate: totalRegistered ? `${Math.round((totalPassed / totalRegistered) * 100)}%` : '—',
    };
  }, [filtered]);

  /* ── Facilitator telemetry ── */
  const facilitatorMap = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      if (r.instructorName) map.set(r.instructorName, (map.get(r.instructorName) || 0) + 1);
      if (r.associateInstructorName && r.associateInstructorName !== '—') {
        map.set(r.associateInstructorName, (map.get(r.associateInstructorName) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  /* ── Student roll lookup ── */
  const handleRollLookup = () => {
    const query = rollSearch.trim().toLowerCase();
    if (!query) return;
    const records: any[] = [];
    analyticsData.forEach((row) => {
      (row.students || []).forEach((s: any) => {
        if (s.rollNo?.toLowerCase() === query) {
          records.push({ ...s, workshopName: row.workshopName, courseName: row.courseName, date: row.date });
        }
      });
    });
    if (records.length > 0) {
      const presentCount = records.filter((r) => r.attendanceStatus === 'PRESENT').length;
      const avgScore =
        records.filter((r) => r.score != null).length > 0
          ? (records.filter((r) => r.score != null).reduce((sum, r) => sum + r.score, 0) /
              records.filter((r) => r.score != null).length).toFixed(1)
          : null;
      setRollProfile({ name: records[0].name, rollNo: records[0].rollNo, records });
    } else {
      setRollProfile(null);
    }
  };

  /* ── CSV export ── */
  const exportRegistryCSV = () => {
    const headers = ['Workshop', 'Course', 'Assigned Conductor', 'Check-In', 'Passed', 'Failed', 'Avg Rating'];
    const rows = filtered.map((r) => {
      const passed = r.totalAttended || 0;
      const failed = (r.students || []).filter(
        (s: any) => s.quizCompleted && s.attendanceStatus !== 'PRESENT',
      ).length;
      return [r.workshopName, r.courseName || '—', r.associateInstructorName || r.instructorName || '—', passed + failed, passed, failed, r.avgRating || '—'];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'workshop-performance.csv';
    a.click();
  };

  /* ══════════════════════════════════════════════════════════
     WORKSHOP DETAIL VIEW (unchanged from original)
  ══════════════════════════════════════════════════════════ */
  if (selectedAnalyticsEvent) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedAnalyticsEvent(null)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Analytics
        </button>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <h4 className="text-xl font-bold text-white">{selectedAnalyticsEvent.workshopName}</h4>
            <p className="text-primary text-sm mt-1">{selectedAnalyticsEvent.courseName}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Date', value: new Date(selectedAnalyticsEvent.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Batch', value: selectedAnalyticsEvent.batch },
              { label: 'Instructor', value: selectedAnalyticsEvent.instructorName },
              { label: 'Avg Rating', value: selectedAnalyticsEvent.avgRating ? `${selectedAnalyticsEvent.avgRating} / 5` : 'N/A' },
              { label: 'Registered', value: selectedAnalyticsEvent.totalRegistered },
              { label: 'Attended', value: selectedAnalyticsEvent.totalAttended },
              { label: 'Absent', value: selectedAnalyticsEvent.totalAbsent },
              { label: 'Venue', value: selectedAnalyticsEvent.venue },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-white/40 text-xs mb-1">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>

          {(selectedAnalyticsEvent.associateInstructorName !== '—' || selectedAnalyticsEvent.volunteerNames?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {selectedAnalyticsEvent.associateInstructorName !== '—' && (
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                  <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">Associate Instructor</p>
                  <p className="text-white text-sm font-medium">{selectedAnalyticsEvent.associateInstructorName}</p>
                </div>
              )}
              {selectedAnalyticsEvent.volunteerNames?.length > 0 && (
                <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/15">
                  <p className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">Volunteers ({selectedAnalyticsEvent.volunteerNames.length})</p>
                  <p className="text-white text-sm">{selectedAnalyticsEvent.volunteerNames.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-white font-semibold text-sm">
                Registered Students ({(selectedAnalyticsEvent.students || []).length})
              </h5>
              <button
                onClick={() => {
                  const headers = ['Name', 'Email', 'Roll No', 'Batch', 'Attendance', 'Quiz Completed', 'Score', 'Rating', 'Registration Status'];
                  const rows = (selectedAnalyticsEvent.students || []).map((s: any) => [
                    s.name, s.email, s.rollNo, s.batch,
                    s.attendanceStatus, s.quizCompleted ? 'Yes' : 'No',
                    s.score ?? '—', s.rating ?? '—', s.registrationStatus,
                  ]);
                  const csv = [headers, ...rows].map((r) => r.map((v: any) => `"${v}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `${selectedAnalyticsEvent.workshopName}-students.csv`;
                  a.click();
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#1A1A2E]">
                    <tr className="border-b border-white/5">
                      {['Name', 'Roll No', 'Batch', 'Attendance', 'Quiz', 'Score', 'Rating'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedAnalyticsEvent.students || []).length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-white/30">No students registered</td></tr>
                    ) : (selectedAnalyticsEvent.students || []).map((s: any, i: number) => (
                      <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">{s.name}</td>
                        <td className="px-3 py-2.5 text-white/60 font-mono">{s.rollNo}</td>
                        <td className="px-3 py-2.5 text-white/60">{s.batch}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            s.attendanceStatus === 'PRESENT' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : s.attendanceStatus === 'ABSENT' ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : s.attendanceStatus === 'EXCUSED' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                              : 'bg-white/5 text-white/30 border-white/10'
                          }`}>
                            {s.attendanceStatus === 'NOT_MARKED' ? 'N/A' : s.attendanceStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            s.quizCompleted ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-white/5 text-white/30 border-white/10'
                          }`}>
                            {s.quizCompleted ? 'Done' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-white/70 font-semibold">{s.score != null ? s.score : '—'}</td>
                        <td className="px-3 py-2.5">
                          {s.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-yellow-400 font-semibold">{s.rating}</span>
                            </div>
                          ) : <span className="text-white/30">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     MAIN ANALYTICS CONSOLE
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Analytics Console</h3>
          <p className="text-xs text-white/40 mt-0.5">Course performance, facilitator telemetry & student lookup</p>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={exportRegistryCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* ── Cascading Filter Bar ── */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2.5">Cascading Filter</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <CascadeSelect
            label="Course"
            value={filterCourse}
            options={courseOptions}
            onChange={(v) => { setFilterCourse(v); setFilterTopic(''); setFilterInstructor(''); setFilterBatch(''); }}
          />
          <CascadeSelect
            label="Topic"
            value={filterTopic}
            options={topicOptions}
            onChange={(v) => { setFilterTopic(v); setFilterInstructor(''); setFilterBatch(''); }}
            disabled={!filterCourse}
          />
          <CascadeSelect
            label="Instructor"
            value={filterInstructor}
            options={instructorOptions}
            onChange={(v) => { setFilterInstructor(v); setFilterBatch(''); }}
            disabled={!filterTopic}
          />
          <CascadeSelect
            label="Batch"
            value={filterBatch}
            options={batchOptions}
            onChange={setFilterBatch}
            disabled={!filterInstructor}
          />
        </div>
      </div>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Metric Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Students" value={metrics.totalStudents} />
            <MetricCard label="Active Events" value={metrics.totalEvents} />
            <MetricCard label="Avg Form Rating" value={metrics.avgRating} />
            <MetricCard label="Avg Pass Rate" value={metrics.passRate} />
          </div>

          {/* ── Performance Registry Table ── */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Consolidated Track Performance Registry</h4>
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Workshop Session', 'Assigned Conductor', 'Check-In', 'Passed', 'Failed', 'Avg Rating', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-white/30">No completed workshops match the current filter</td>
                      </tr>
                    ) : filtered.map((row, i) => {
                      const passed = row.totalAttended || 0;
                      const failed = (row.students || []).filter(
                        (s: any) => s.quizCompleted && s.attendanceStatus !== 'PRESENT',
                      ).length;
                      const checkIn = passed + failed;
                      return (
                        <tr
                          key={i}
                          className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer"
                          onClick={() => setSelectedAnalyticsEvent(row)}
                        >
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{row.workshopName}</p>
                            <p className="text-white/35 text-[10px] mt-0.5">{row.courseName}</p>
                          </td>
                          <td className="px-4 py-3 text-white/60">{row.associateInstructorName !== '—' ? row.associateInstructorName : row.instructorName}</td>
                          <td className="px-4 py-3 text-white/70 font-semibold">{checkIn > 0 ? `${checkIn} Stud` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-emerald-400 font-semibold">{passed > 0 ? `${passed} Users` : '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-red-400 font-semibold">{failed > 0 ? `${failed} Users` : '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {row.avgRating ? (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-yellow-400 font-semibold">{row.avgRating} / 5.0</span>
                              </div>
                            ) : <span className="text-white/30">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button className="flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium">
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Facilitator Telemetry + Student Lookup ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Facilitator Engagement Telemetry */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Facilitator Engagement Telemetry</h4>
              <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                {facilitatorMap.length === 0 ? (
                  <p className="text-center py-8 text-white/30 text-xs">No facilitator data</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">Instructor Name</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">Workshops Run</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facilitatorMap.map(([name, count], i) => (
                        <tr key={i} className="border-b border-white/[0.03]">
                          <td className="px-4 py-2.5 text-white font-medium">{name}</td>
                          <td className="px-4 py-2.5 text-primary font-semibold">{count} Session{count !== 1 ? 's' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Student Timeline Lookup Engine */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Student Timeline Lookup</h4>
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      value={rollSearch}
                      onChange={(e) => { setRollSearch(e.target.value); if (!e.target.value) setRollProfile(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleRollLookup()}
                      placeholder="Search student roll number..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleRollLookup}
                    className="px-4 py-2 rounded-xl bg-primary/15 text-primary border border-primary/30 text-xs font-semibold hover:bg-primary/25 transition-colors"
                  >
                    Search
                  </button>
                </div>

                {rollProfile === null && rollSearch.trim() && (
                  <p className="text-xs text-red-400/70">No records found for &quot;{rollSearch}&quot;</p>
                )}

                {rollProfile && (() => {
                  const presentCount = rollProfile.records.filter((r) => r.attendanceStatus === 'PRESENT').length;
                  const scoredRecords = rollProfile.records.filter((r) => r.score != null);
                  const avgScore = scoredRecords.length
                    ? (scoredRecords.reduce((sum, r) => sum + r.score, 0) / scoredRecords.length).toFixed(1)
                    : null;
                  return (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold text-sm">
                            Targeting Profile: {rollProfile.name} ({rollProfile.rollNo})
                          </p>
                          <p className="text-white/50 text-xs mt-0.5">
                            Attendance Log: {presentCount}/{rollProfile.records.length} Present
                            {avgScore ? ` · Avg Score: ${avgScore}/5` : ''}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                          presentCount === rollProfile.records.length
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {presentCount === rollProfile.records.length ? 'Full Attend.' : 'Partial'}
                        </span>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {rollProfile.records.map((r, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-white/5 last:border-0">
                            <span className="text-white/60 truncate max-w-[60%]">{r.workshopName}</span>
                            <span className={`font-semibold ${
                              r.attendanceStatus === 'PRESENT' ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {r.attendanceStatus === 'PRESENT' ? 'Present' : r.attendanceStatus || 'N/A'}
                              {r.score != null ? ` · ${r.score}/5` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
