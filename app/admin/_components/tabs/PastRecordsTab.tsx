'use client';

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
  return (
    <div className="space-y-4">
      {eventsLoading && events.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-white/40 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          Loading events...
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-white">Past Records</h3>
        <p className="text-xs text-white/40 mt-0.5">Completed events with attendance data from database</p>
      </div>
      <DataTable
        data={pastRecordsData as unknown as Record<string, unknown>[]}
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
