'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import DataTable from '@/components/DataTable';
import type { Event } from '@/types';

interface PastRecordsTabProps {
  eventsLoading: boolean;
  events: Event[];
  pastRecordsData: {
    eventName: string;
    courseName: string;
    batch: string | null;
    date: string;
    rawDate: string;
    venue: string;
    registered: number;
    attended: number;
    instructorName: string;
    avgRating: number | null;
    feedbackCount: number;
  }[];
  courses: any[];
}

const OPEN_WORKSHOPS_LABEL = 'Open Workshops';
const NO_BATCH_LABEL = 'No Batch';

export default function PastRecordsTab({ eventsLoading, events, pastRecordsData, courses }: PastRecordsTabProps) {
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  // Real course names come from the full /courses list (not just past records) so
  // every course is filterable even before it has any completed events. "Open
  // Workshops" is always offered too, covering events with no linked course.
  const courseOptions = useMemo(() => {
    const realCourseNames = Array.from(new Set(courses.map((c) => c.name).filter(Boolean)));
    return [...realCourseNames.sort((a, b) => a.localeCompare(b)), OPEN_WORKSHOPS_LABEL];
  }, [courses]);

  // Batch has no equivalent standalone list — it only ever exists on an
  // actual scheduled event — so options are derived from whatever past
  // records already have one. "No Batch" covers open/ad-hoc workshops that
  // were never scheduled per-batch.
  const batchOptions = useMemo(() => {
    const realBatches = Array.from(new Set(pastRecordsData.map((r) => r.batch).filter(Boolean))) as string[];
    return [...realBatches.sort((a, b) => a.localeCompare(b)), NO_BATCH_LABEL];
  }, [pastRecordsData]);

  const filteredData = pastRecordsData
    .filter((r) => !courseFilter || r.courseName === courseFilter)
    .filter((r) => !batchFilter || (batchFilter === NO_BATCH_LABEL ? !r.batch : r.batch === batchFilter));

  return (
    <div className="space-y-4">
      {eventsLoading && events.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-white/40 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          Loading events...
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Past Records</h3>
          <p className="text-xs text-white/40 mt-0.5">Completed events with attendance data from database</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="input-dark appearance-none pl-4 pr-9 py-2 rounded-xl text-sm"
            >
              <option value="">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="input-dark appearance-none pl-4 pr-9 py-2 rounded-xl text-sm"
            >
              <option value="">All Batches</option>
              {batchOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
        </div>
      </div>
      <DataTable
        data={filteredData as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'eventName', label: 'Event Name', sortable: true },
          { key: 'courseName', label: 'Course Name', sortable: true },
          { key: 'batch', label: 'Batch', sortable: true, render: (value: string | null) => value || <span className="text-white/30">—</span> },
          { key: 'date', label: 'Date', sortable: true, sortValue: (row: any) => new Date(row.rawDate).getTime() },
          { key: 'venue', label: 'Venue' },
          { key: 'instructorName', label: 'Instructor', sortable: true },
          { key: 'registered', label: 'Registered' },
          { key: 'attended', label: 'Attended' },
          {
            key: 'avgRating',
            label: 'Avg Rating',
            sortable: true,
            render: (value: number | null, row: any) => value != null
              ? <span className="inline-flex items-center gap-1 text-yellow-400 font-semibold">★ {value.toFixed(1)} <span className="text-white/30 font-normal">({row.feedbackCount})</span></span>
              : <span className="text-white/30">No ratings</span>,
          },
          { key: 'status', label: 'Status', render: () => <span className="badge-green">Completed</span> },
        ]}
        searchKeys={['eventName', 'courseName', 'instructorName'] as never[]}
        searchPlaceholder="Search records..."
        emptyMessage="No completed events yet"
      />
    </div>
  );
}
