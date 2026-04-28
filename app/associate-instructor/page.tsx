'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, ClipboardList, Users, Search, Download, Play, CheckCircle2, XCircle, ToggleLeft, ToggleRight,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { getGreeting } from '@/lib/utils';
import { mockStudents, mockQuizSessions, mockAttendanceStudents } from '@/lib/mockData';
import { getStoredUser } from '@/lib/auth';
import type { QuizSession } from '@/types';
import toast from 'react-hot-toast';

type AttendanceStatus = 'present' | 'absent';

interface AttendanceEntry {
  studentId: string;
  name: string;
  rollNo: string;
  department: string;
  status: AttendanceStatus;
}

export default function AssociateInstructorDashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [search, setSearch] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>(mockQuizSessions);

  useEffect(() => {
    const user = getStoredUser();
    setUserName(user?.name ?? 'Associate');
    setTimeout(() => {
      setAttendance(
        mockStudents.map((s) => ({
          studentId: s.id,
          name: s.name,
          rollNo: s.rollNo,
          department: s.department,
          status: 'present' as AttendanceStatus,
        }))
      );
      setLoading(false);
    }, 800);
  }, []);

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.studentId === studentId
          ? { ...a, status: a.status === 'present' ? 'absent' : 'present' }
          : a
      )
    );
  };

  const toggleQuiz = (sessionId: string, type: 'quiz' | 'feedback') => {
    setQuizSessions((prev) =>
      prev.map((s) => {
        if (s.sessionId !== sessionId) return s;
        const updated = type === 'quiz'
          ? { ...s, quizActive: !s.quizActive }
          : { ...s, feedbackActive: !s.feedbackActive };
        const label = type === 'quiz' ? 'Quiz' : 'Feedback';
        const action = (type === 'quiz' ? updated.quizActive : updated.feedbackActive) ? 'activated' : 'deactivated';
        toast.success(`${label} ${action} for "${s.sessionTitle.split('—')[0].trim()}"!`);
        return updated;
      })
    );
  };

  const handleSaveAttendance = () => {
    const present = attendance.filter((a) => a.status === 'present').length;
    toast.success(`Attendance saved! ${present}/${attendance.length} students marked present ✅`);
  };

  const handleExport = () => {
    toast.success('Registrant list exported as CSV 📥');
  };

  const filteredAttendance = attendance.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      a.department.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRegistrants = mockStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(regSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(regSearch.toLowerCase()) ||
      s.department.toLowerCase().includes(regSearch.toLowerCase())
  );

  const presentCount = attendance.filter((a) => a.status === 'present').length;

  return (
    <DashboardLayout expectedRole="associate-instructor">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/50 text-sm mb-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()}, <span className="gradient-text">{userName.split(' ').slice(-1)[0]}</span>!
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Associate Instructor Panel · Wellness Wednesday — Mindful Breathing
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Students" value={attendance.length} icon={Users} color="purple" index={0} />
            <StatCard title="Present Today" value={presentCount} icon={CheckCircle2} color="teal" index={1} />
            <StatCard title="Absent" value={attendance.length - presentCount} icon={XCircle} color="red" index={2} />
            <StatCard title="Quiz Sessions" value={quizSessions.length} icon={ClipboardList} color="yellow" index={3} />
          </>
        )}
      </div>

      {/* Attendance Panel */}
      <div id="attendance">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" /> Mark Attendance
          </h2>
          <div className="flex items-center gap-3">
            <Badge variant="green">{presentCount} Present</Badge>
            <Badge variant="red">{attendance.length - presentCount} Absent</Badge>
            <Button variant="default" size="sm" onClick={handleSaveAttendance} className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Save Attendance
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, roll number, or department..."
                className="input-dark w-full pl-9 h-9 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredAttendance.length === 0 ? (
              <div className="p-12 text-center text-white/40 text-sm">No students found</div>
            ) : (
              filteredAttendance.map((student, i) => (
                <motion.div
                  key={student.studentId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                    student.status === 'present' ? 'hover:bg-accent/5' : 'hover:bg-red-500/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    student.status === 'present'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{student.name}</p>
                    <p className="text-xs text-white/40">{student.rollNo} · {student.department}</p>
                  </div>

                  <Badge variant={student.status === 'present' ? 'green' : 'red'}>
                    {student.status === 'present' ? 'Present' : 'Absent'}
                  </Badge>

                  <button
                    onClick={() => toggleAttendance(student.studentId)}
                    className="flex items-center gap-1 text-white/30 hover:text-white transition-colors ml-2"
                    title="Toggle attendance"
                  >
                    {student.status === 'present'
                      ? <ToggleRight className="w-7 h-7 text-accent" />
                      : <ToggleLeft className="w-7 h-7 text-red-400" />
                    }
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quiz / Feedback Activation */}
      <div id="quizzes">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" /> Quiz & Feedback Activation
        </h2>

        <div className="space-y-3">
          {quizSessions.map((session, i) => (
            <motion.div
              key={session.sessionId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{session.sessionTitle}</p>
                  <div className="flex gap-3 mt-2">
                    <span className={`text-xs flex items-center gap-1 ${session.quizActive ? 'text-accent' : 'text-white/30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${session.quizActive ? 'bg-accent animate-pulse' : 'bg-white/20'}`} />
                      Quiz {session.quizActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${session.feedbackActive ? 'text-primary' : 'text-white/30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${session.feedbackActive ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
                      Feedback {session.feedbackActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={session.quizActive ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => toggleQuiz(session.sessionId, 'quiz')}
                    className="gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    {session.quizActive ? 'Deactivate Quiz' : 'Activate Quiz'}
                  </Button>
                  <Button
                    variant={session.feedbackActive ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => toggleQuiz(session.sessionId, 'feedback')}
                    className="gap-1.5"
                  >
                    <ClipboardList className="w-3 h-3" />
                    {session.feedbackActive ? 'Deactivate Feedback' : 'Activate Feedback'}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Registrants List */}
      <div id="registrants">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Registrants List
          </h2>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder="Search registrants..."
                className="input-dark w-full pl-9 h-9 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-dark">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Roll No.</th>
                  <th className="px-5 py-3 text-left">Department</th>
                  <th className="px-5 py-3 text-left">Programme</th>
                  <th className="px-5 py-3 text-left">Year</th>
                  <th className="px-5 py-3 text-left">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrants.map((student, i) => {
                  const att = attendance.find((a) => a.studentId === student.id);
                  return (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td className="px-5 py-3.5 text-xs text-white/30">{i + 1}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-white">{student.name}</td>
                      <td className="px-5 py-3.5 text-xs text-white/50 font-mono">{student.rollNo}</td>
                      <td className="px-5 py-3.5 text-xs text-white/60">{student.department}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="purple">{student.programme}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/50">Year {student.year}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={att?.status === 'present' ? 'green' : 'red'}>
                          {att?.status ?? 'N/A'}
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-white/5 text-xs text-white/30">
            Showing {filteredRegistrants.length} of {mockStudents.length} registrants
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
