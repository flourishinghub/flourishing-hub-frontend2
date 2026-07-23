'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Download, Eye, Star } from 'lucide-react';
import { downloadCsv } from '@/lib/csv';
import { WorkshopAnalyticsRow } from '@/types';
import { aggregateInstructors, InstructorAggregateRow } from './filterUtils';

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </div>
  );
}

export default function InstructorFilterView({ rows }: { rows: WorkshopAnalyticsRow[] }) {
  const [selected, setSelected] = useState<InstructorAggregateRow | null>(null);

  const instructors = useMemo(() => aggregateInstructors(rows), [rows]);

  const metrics = useMemo(() => {
    const withRating = instructors.filter((i) => i.avgRating != null);
    const avgRating = withRating.length
      ? (withRating.reduce((sum, i) => sum + (i.avgRating as number), 0) / withRating.length).toFixed(1)
      : '—';
    const totalStudentsTaught = new Set<string>();
    rows.forEach((r) => r.students.forEach((s) => { if (s.userId) totalStudentsTaught.add(s.userId); }));
    return {
      totalInstructors: instructors.filter((i) => i.key !== 'unassigned').length,
      avgRating,
      totalStudentsTaught: totalStudentsTaught.size,
    };
  }, [instructors, rows]);

  const exportCSV = () => {
    downloadCsv(
      instructors.map((i) => ({
        Name: i.name,
        Workshops: i.workshopsCount,
        'Students Taught': i.studentsTaught,
        'Avg Rating': i.avgRating ?? '—',
        'Avg Pass Rate': i.avgPassRate != null ? `${i.avgPassRate}%` : '—',
        Courses: i.courses.join(', ') || '—',
        Batches: i.batches.join(', ') || '—',
      })),
      'instructor-analytics',
    );
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Instructors
        </button>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <h4 className="text-xl font-bold text-white">{selected.name}</h4>
            <p className="text-primary text-sm mt-1">{selected.courses.join(', ') || 'No courses on record'}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Workshops', value: selected.workshopsCount },
              { label: 'Students Taught', value: selected.studentsTaught },
              { label: 'Avg Rating', value: selected.avgRating != null ? `${selected.avgRating} / 5` : '—' },
              { label: 'Avg Pass Rate', value: selected.avgPassRate != null ? `${selected.avgPassRate}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-white/40 text-xs mb-1">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-white/5">
                    {['Workshop', 'Course', 'Date', 'Batch', 'Registered', 'Attended', 'Avg Rating'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.workshops.map((w) => (
                    <tr key={w.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">{w.workshopName}</td>
                      <td className="px-3 py-2.5 text-white/60">{w.courseName}</td>
                      <td className="px-3 py-2.5 text-white/60">{new Date(w.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-3 py-2.5 text-white/60">{w.batch}</td>
                      <td className="px-3 py-2.5 text-white/70">{w.totalRegistered}</td>
                      <td className="px-3 py-2.5 text-emerald-400 font-semibold">{w.totalAttended}</td>
                      <td className="px-3 py-2.5">
                        {w.avgRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-yellow-400 font-semibold">{w.avgRating}</span>
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
    );
  }

  return (
    <div className="space-y-5">
      {instructors.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard label="Instructors" value={metrics.totalInstructors} />
        <MetricCard label="Avg Rating" value={metrics.avgRating} />
        <MetricCard label="Students Taught" value={metrics.totalStudentsTaught} />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white mb-3">Instructor Roster</h4>
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Instructor', 'Workshops', 'Students Taught', 'Avg Rating', 'Avg Pass Rate', 'Courses', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {instructors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-white/30">No instructors match the current filter</td>
                  </tr>
                ) : instructors.map((i) => (
                  <tr
                    key={i.key}
                    className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer"
                    onClick={() => setSelected(i)}
                  >
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{i.name}</td>
                    <td className="px-4 py-3 text-white/70 font-semibold">{i.workshopsCount}</td>
                    <td className="px-4 py-3 text-white/70">{i.studentsTaught}</td>
                    <td className="px-4 py-3">
                      {i.avgRating != null ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 font-semibold">{i.avgRating}</span>
                        </div>
                      ) : <span className="text-white/30">—</span>}
                    </td>
                    <td className="px-4 py-3 text-white/70">{i.avgPassRate != null ? `${i.avgPassRate}%` : '—'}</td>
                    <td className="px-4 py-3 text-white/50 max-w-[200px] truncate">{i.courses.join(', ') || '—'}</td>
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
      </div>
    </div>
  );
}
