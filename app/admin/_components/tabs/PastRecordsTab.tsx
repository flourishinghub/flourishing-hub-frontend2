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
    date: string;
    venue: string;
    registered: number;
    attended: number;
  }[];
}

export default function PastRecordsTab({ eventsLoading, events, pastRecordsData }: PastRecordsTabProps) {
  const [courseFilter, setCourseFilter] = useState('');

  const courseOptions = useMemo(
    () => Array.from(new Set(pastRecordsData.map((r) => r.courseName).filter((c) => c && c !== '—'))),
    [pastRecordsData]
  );

  const filteredData = courseFilter
    ? pastRecordsData.filter((r) => r.courseName === courseFilter)
    : pastRecordsData;

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
      </div>
      <DataTable
        data={filteredData as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'eventName', label: 'Event Name', sortable: true },
          { key: 'courseName', label: 'Course Name', sortable: true },
          { key: 'date', label: 'Date', sortable: true },
          { key: 'venue', label: 'Venue' },
          { key: 'registered', label: 'Registered' },
          { key: 'attended', label: 'Attended' },
          { key: 'status', label: 'Status', render: () => <span className="badge-green">Completed</span> },
        ]}
        searchKeys={['eventName', 'courseName'] as never[]}
        searchPlaceholder="Search records..."
        emptyMessage="No completed events yet"
      />
    </div>
  );
}
