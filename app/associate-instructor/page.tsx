'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Users, ClipboardList, FileText, Search, ToggleLeft, ToggleRight, CheckSquare, Square } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import {
  mockAttendanceStudents, mockVolunteerAttendance,
  mockVolunteerPool, mockQuizSessions, mockStudents,
} from '@/lib/mockData';
import type { AttendanceRecord, VolunteerPool, QuizSession } from '@/types';
import toast from 'react-hot-toast';

type Tab = 'attendance' | 'volunteers' | 'quiz' | 'registrants';

export default function AssociateInstructorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>(mockAttendanceStudents);
  const [volunteerAttendance, setVolunteerAttendance] = useState<AttendanceRecord[]>(mockVolunteerAttendance);
  const [volunteerPool, setVolunteerPool] = useState<VolunteerPool[]>(mockVolunteerPool);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>(mockQuizSessions);
  const [studentSearch, setStudentSearch] = useState('');
  const [volSearch, setVolSearch] = useState('');

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

  const filteredStudents = studentAttendance.filter(
    (r) => r.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      r.rollNo.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredVolunteers = volunteerAttendance.filter(
    (r) => r.studentName.toLowerCase().includes(volSearch.toLowerCase()) ||
      r.rollNo.toLowerCase().includes(volSearch.toLowerCase())
  );

  const presentCount = studentAttendance.filter((r) => r.status === 'present').length;
  const absentCount = studentAttendance.filter((r) => r.status === 'absent').length;

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
        <p className="text-sm text-white/50 mt-1">Manage attendance, volunteers, quizzes & registrants</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Present" value={presentCount} icon={UserCheck} color="teal" />
        <StatCard title="Absent" value={absentCount} icon={UserCheck} color="red" />
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
          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Student Attendance — Wellness Wednesday</h3>
                <div className="flex gap-2">
                  <span className="badge-green">{presentCount} Present</span>
                  <span className="badge-red">{absentCount} Absent</span>
                </div>
              </div>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students..."
                  className="input-dark w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                {filteredStudents.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white">{record.studentName}</p>
                      <p className="text-xs text-white/40">{record.rollNo}</p>
                    </div>
                    <button
                      onClick={() => toggleStudentStatus(record.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        record.status === 'present'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
                      }`}
                    >
                      {record.status === 'present' ? (
                        <ToggleRight className="w-3.5 h-3.5" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5" />
                      )}
                      {record.status === 'present' ? 'Present' : 'Absent'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteers Tab */}
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

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white mb-2">Quiz & Feedback Activation</h3>
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

          {/* Registrants Tab */}
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
