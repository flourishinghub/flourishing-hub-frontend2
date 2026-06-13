'use client';

import { ArrowLeft, Download, Eye, Star } from 'lucide-react';

interface AnalyticsTabProps {
  analyticsLoading: boolean;
  analyticsData: any[];
  selectedAnalyticsEvent: any | null;
  setSelectedAnalyticsEvent: (event: any | null) => void;
}

export default function AnalyticsTab({
  analyticsLoading,
  analyticsData,
  selectedAnalyticsEvent,
  setSelectedAnalyticsEvent,
}: AnalyticsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Workshop Analytics</h3>
          <p className="text-xs text-white/40 mt-0.5">Past workshops — click a row for full details</p>
        </div>
        {analyticsData.length > 0 && (
          <button
            onClick={() => {
              const headers = ['Workshop Name', 'Course', 'Instructor', 'Date', 'Batch', 'Registered', 'Attended', 'Absent', 'Avg Rating'];
              const rows = analyticsData.map(r => [r.workshopName, r.courseName, r.instructorName, new Date(r.date).toLocaleDateString('en-IN'), r.batch, r.totalRegistered, r.totalAttended, r.totalAbsent, r.avgRating || 'N/A']);
              const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'workshop-analytics.csv'; a.click();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : selectedAnalyticsEvent ? (
        /* Workshop Detail View */
        <div className="space-y-4">
          <button onClick={() => setSelectedAnalyticsEvent(null)} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
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

            {/* Staff Info */}
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

            {/* Full Student Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-white font-semibold text-sm">Registered Students ({(selectedAnalyticsEvent.students || []).length})</h5>
                <button
                  onClick={() => {
                    const headers = ['Name', 'Email', 'Roll No', 'Batch', 'Attendance', 'Quiz Completed', 'Score', 'Rating', 'Registration Status'];
                    const rows = (selectedAnalyticsEvent.students || []).map((s: any) => [
                      s.name, s.email, s.rollNo, s.batch,
                      s.attendanceStatus, s.quizCompleted ? 'Yes' : 'No',
                      s.score ?? '—', s.rating ?? '—', s.registrationStatus
                    ]);
                    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `${selectedAnalyticsEvent.workshopName}-students.csv`; a.click();
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
                        {['Name', 'Roll No', 'Batch', 'Attendance', 'Quiz', 'Score', 'Rating'].map(h => (
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
                              s.attendanceStatus === 'PRESENT'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : s.attendanceStatus === 'ABSENT'
                                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                : s.attendanceStatus === 'EXCUSED'
                                ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                                : 'bg-white/5 text-white/30 border-white/10'
                            }`}>
                              {s.attendanceStatus === 'NOT_MARKED' ? 'N/A' : s.attendanceStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              s.quizCompleted
                                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                : 'bg-white/5 text-white/30 border-white/10'
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
      ) : (
        /* Analytics Table */
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Course Name', 'Workshop Name', 'Instructor', 'Rating', 'Attended', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analyticsData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-white/30">No completed workshops yet</td></tr>
                ) : analyticsData.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => setSelectedAnalyticsEvent(row)}>
                    <td className="px-4 py-3 text-white/70">{row.courseName}</td>
                    <td className="px-4 py-3 text-white font-medium">{row.workshopName}</td>
                    <td className="px-4 py-3 text-white/60">{row.instructorName}</td>
                    <td className="px-4 py-3">
                      {row.avgRating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 font-semibold">{row.avgRating}</span>
                        </div>
                      ) : <span className="text-white/30">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-400 font-semibold">{row.totalAttended}</span>
                      <span className="text-white/30"> / {row.totalRegistered}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
