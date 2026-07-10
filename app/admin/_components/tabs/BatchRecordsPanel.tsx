'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, Filter } from 'lucide-react';
import { apiCall } from '@/lib/api';
import DataTable from '@/components/DataTable';

interface BatchRecordsPanelProps {
  onBack: () => void;
}

// Full-page view of every batch-uploaded student record, mirroring the layout
// of the Member Directory (header + collapsible filter panel + DataTable) so
// admins get the same experience instead of a one-off modal.
export default function BatchRecordsPanel({ onBack }: BatchRecordsPanelProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    apiCall('/courses').then((res) => setCourses(res?.data || [])).catch(() => {});
  }, []);

  // Records/stats are fetched scoped to the selected course (server-side
  // filter) rather than fetching everything and filtering client-side —
  // course-wise datasets can each be sizeable, so this keeps each request
  // to just the rows that matter instead of the whole table every time.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const courseQuery = courseFilter ? `?courseId=${courseFilter}` : '';
      const [recordsRes, statsRes] = await Promise.all([
        apiCall(`/batch-assignments/records${courseQuery}`),
        apiCall(`/batch-assignments/stats${courseQuery}`),
      ]);
      setRecords(recordsRes?.data || []);
      setStats(statsRes?.data || null);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [courseFilter]);

  useEffect(() => { load(); }, [load]);

  // Keyed by course+batch (not batch alone) — the same batch code (e.g.
  // "Batch 1") can exist under multiple different courses, and those are
  // different real-world groups of students. Deduping by batch code alone
  // previously let "Batch 1" merge every course's Batch 1 into one filter.
  const batchOptions = useMemo(() => {
    const map = new Map<string, { key: string; batchCode: string; courseName: string }>();
    records.forEach((r) => {
      if (!r.batchCode) return;
      const key = `${r.courseId || r.course?.id || ''}::${r.batchCode}`;
      if (!map.has(key)) {
        map.set(key, { key, batchCode: r.batchCode, courseName: r.course?.name || 'Unknown Course' });
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => a.batchCode.localeCompare(b.batchCode) || a.courseName.localeCompare(b.courseName)
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (batchFilter && `${r.courseId || r.course?.id || ''}::${r.batchCode}` !== batchFilter) return false;
      if (statusFilter === 'matched' && !r.isMatched) return false;
      if (statusFilter === 'pending' && r.isMatched) return false;
      return true;
    });
  }, [records, batchFilter, statusFilter]);

  const clearFilters = () => { setCourseFilter(''); setBatchFilter(''); setStatusFilter(''); };

  return (
    <div id="batch-records">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Members
          </button>
          <h3 className="text-lg font-semibold text-white">Batch Assignment Records</h3>
          <p className="text-xs text-white/40 mt-0.5">Every uploaded student, by course — who has signed up vs who is still pending</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all"
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-center">
            <p className="text-xl font-bold text-white">{stats.total}</p>
            <p className="text-[10px] text-white/40 mt-0.5">Total Records</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{stats.matched}</p>
            <p className="text-[10px] text-emerald-400/60 mt-0.5">Signed Up</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
            <p className="text-xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-[10px] text-amber-400/60 mt-0.5">Not Signed Up Yet</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block">Course</label>
                <select
                  value={courseFilter}
                  onChange={(e) => { setCourseFilter(e.target.value); setBatchFilter(''); }}
                  className="filter-select w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                >
                  <option value="">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code ? `${c.code} · ${c.name}` : c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block">Batch</label>
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="filter-select w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                >
                  <option value="">All Batches</option>
                  {batchOptions.map((b) => (
                    <option key={b.key} value={b.key}>{b.batchCode} · {b.courseName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-2 block">Signup Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                >
                  <option value="">All</option>
                  <option value="matched">Signed Up</option>
                  <option value="pending">Not Signed Up Yet</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">
                Showing {filteredRecords.length} of {records.length} records
              </div>
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DataTable
          data={filteredRecords as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'rollNumber', label: 'Roll No' },
            { key: 'email', label: 'Email' },
            {
              key: 'course', label: 'Course', sortable: true,
              sortValue: (row: any) => row.course?.name || '',
              render: (value: any) => value?.name || '—',
            },
            { key: 'batchCode', label: 'Batch', sortable: true },
            { key: 'department', label: 'Department', sortable: true },
            {
              key: 'isMatched', label: 'Signup Status', sortable: true,
              render: (value) => (
                <span className={value ? 'badge-green' : 'badge-yellow'}>
                  {value ? 'Signed Up' : 'Not Signed Up Yet'}
                </span>
              ),
            },
          ]}
          searchKeys={['name', 'email', 'rollNumber', 'batchCode', 'department'] as never[]}
          searchPlaceholder="Search by name, email, roll no, batch..."
          emptyMessage="No batch records found"
        />
      )}
    </div>
  );
}
