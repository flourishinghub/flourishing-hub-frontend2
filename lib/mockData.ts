import type {
  Student, Instructor, Event, Session, MemberDirectory,
  VolunteerPool, AttendanceRecord, QuizSession, Notification, Volunteer,
} from '@/types';

// Today: 2026-04-30  |  Tomorrow: 2026-05-01
export const mockEvents: Event[] = [
  {
    id: 'evt_001',
    title: 'Wellness Wednesday',
    description: 'A mid-week wellness reset. Mindful breathing, guided meditation, and peer connections in a calm environment. Open to all IIT Bombay students and staff.',
    date: '2026-05-01',
    time: '15:00',
    venue: 'LT 101, Lecture Complex',
    mode: 'Offline',
    organizer: 'Dr. Ananya Krishnan',
    capacity: 60,
    registeredCount: 38,
    status: 'active',
    volunteerSlots: 5,
  },
  {
    id: 'evt_002',
    title: 'Flourishing Friday',
    description: 'End your week on a high note. Gratitude circles, positive sharing, and community bonding activities guided by wellness coaches.',
    date: '2026-05-08',
    time: '17:00',
    venue: 'Seminar Hall 2, Main Building',
    mode: 'Offline',
    organizer: 'Dr. Ananya Krishnan',
    capacity: 80,
    registeredCount: 0,
    status: 'draft',
    volunteerSlots: 8,
  },
  {
    id: 'evt_003',
    title: 'Yoga & Movement Session',
    description: 'Gentle yoga and movement practices for stress relief and body awareness. No prior experience needed. Bring a mat!',
    date: '2026-05-15',
    time: '07:00',
    venue: 'SAC Lawn, Student Activity Centre',
    mode: 'Offline',
    organizer: 'Prof. Vikram Singh',
    capacity: 40,
    registeredCount: 0,
    status: 'draft',
    volunteerSlots: 3,
  },
  {
    id: 'evt_004',
    title: 'Academic Stress Workshop',
    description: 'Learn practical tools for managing exam stress, time management, and maintaining work-life balance during semester crunch.',
    date: '2026-04-15',
    time: '14:00',
    venue: 'Kohinoor Hall',
    mode: 'Offline',
    organizer: 'Prof. Vikram Singh',
    capacity: 100,
    registeredCount: 78,
    status: 'archived',
    volunteerSlots: 10,
  },
  {
    id: 'evt_005',
    title: 'Mental Health Awareness Talk',
    description: 'Open conversation on mental health, destigmatization, and available resources at IIT Bombay. Featuring alumni speakers.',
    date: '2026-04-20',
    time: '18:00',
    venue: 'Victor Menezes Convention Centre',
    mode: 'Online',
    organizer: 'Student Wellness Center',
    capacity: 200,
    registeredCount: 143,
    status: 'archived',
    volunteerSlots: 15,
  },
];

export const mockStudents: Student[] = [
  {
    id: 'stu_001',
    name: 'Arjun Sharma',
    email: 'arjun.sharma@iitb.ac.in',
    role: 'student',
    rollNo: '23B030012',
    department: 'Computer Science & Engineering',
    year: 2,
    batch: '2023',
    programme: 'BTech',
    registeredEvents: ['evt_001'],
    completedEvents: [
      { eventId: 'evt_004', title: 'Academic Stress Workshop', date: '2026-04-15', venue: 'Kohinoor Hall', marks: 88, maxMarks: 100, starRating: 4 },
      { eventId: 'evt_005', title: 'Mental Health Awareness Talk', date: '2026-04-20', venue: 'VMCC', marks: 92, maxMarks: 100, starRating: 5 },
    ],
  },
  {
    id: 'stu_002',
    name: 'Priya Patel',
    email: 'priya.patel@iitb.ac.in',
    role: 'student',
    rollNo: '22M10021',
    department: 'Electrical Engineering',
    year: 1,
    batch: '2022',
    programme: 'MTech',
    registeredEvents: ['evt_001'],
    completedEvents: [
      { eventId: 'evt_004', title: 'Academic Stress Workshop', date: '2026-04-15', venue: 'Kohinoor Hall', marks: 95, maxMarks: 100, starRating: 5 },
    ],
  },
  {
    id: 'stu_003',
    name: 'Rohit Kumar',
    email: 'rohit.kumar@iitb.ac.in',
    role: 'student',
    rollNo: '21D02003',
    department: 'Mechanical Engineering',
    year: 3,
    batch: '2021',
    programme: 'PhD',
    registeredEvents: [],
    completedEvents: [
      { eventId: 'evt_005', title: 'Mental Health Awareness Talk', date: '2026-04-20', venue: 'VMCC', marks: 78, maxMarks: 100, starRating: 4 },
    ],
  },
  {
    id: 'stu_004',
    name: 'Kavya Menon',
    email: 'kavya.menon@iitb.ac.in',
    role: 'student',
    rollNo: '23B040045',
    department: 'Civil Engineering',
    year: 1,
    batch: '2023',
    programme: 'BTech',
    registeredEvents: ['evt_001'],
    completedEvents: [
      { eventId: 'evt_004', title: 'Academic Stress Workshop', date: '2026-04-15', venue: 'Kohinoor Hall', marks: 98, maxMarks: 100, starRating: 5 },
      { eventId: 'evt_005', title: 'Mental Health Awareness Talk', date: '2026-04-20', venue: 'VMCC', marks: 96, maxMarks: 100, starRating: 5 },
    ],
  },
  {
    id: 'stu_005',
    name: 'Aditya Verma',
    email: 'aditya.verma@iitb.ac.in',
    role: 'student',
    rollNo: '22M21011',
    department: 'Chemical Engineering',
    year: 2,
    batch: '2022',
    programme: 'MSc',
    registeredEvents: [],
    completedEvents: [
      { eventId: 'evt_004', title: 'Academic Stress Workshop', date: '2026-04-15', venue: 'Kohinoor Hall', marks: 82, maxMarks: 100, starRating: 4 },
    ],
  },
];

export const mockInstructors: Instructor[] = [
  {
    id: 'ins_001',
    name: 'Dr. Ananya Krishnan',
    email: 'instructor@iitb.ac.in',
    role: 'instructor',
    empId: 'EMP2001',
    department: 'Student Wellness Center',
    specialization: 'Mindfulness & Cognitive Behavioral Therapy',
    totalStudents: 142,
    sessions: [
      {
        id: 'ses_001',
        title: 'Wellness Wednesday — Mindful Breathing',
        instructorId: 'ins_001',
        instructorName: 'Dr. Ananya Krishnan',
        date: '2026-05-01',
        time: '10:00',
        venue: 'LT 101',
        mode: 'Offline',
        participantCount: 12,
        status: 'upcoming',
        registrants: ['stu_001', 'stu_002', 'stu_004'],
      },
      {
        id: 'ses_002',
        title: 'Flourishing Friday — Gratitude Circle',
        instructorId: 'ins_001',
        instructorName: 'Dr. Ananya Krishnan',
        date: '2026-05-08',
        time: '17:00',
        venue: 'Seminar Hall 2',
        mode: 'Offline',
        participantCount: 0,
        status: 'upcoming',
        registrants: [],
      },
      {
        id: 'ses_003',
        title: 'Introduction to Mindfulness — Session 1',
        instructorId: 'ins_001',
        instructorName: 'Dr. Ananya Krishnan',
        date: '2026-04-15',
        time: '14:00',
        venue: 'LC 101',
        mode: 'Offline',
        participantCount: 65,
        actualAttendees: 61,
        status: 'completed',
        registrants: [],
      },
      {
        id: 'ses_004',
        title: 'Stress Management Workshop',
        instructorId: 'ins_001',
        instructorName: 'Dr. Ananya Krishnan',
        date: '2026-04-20',
        time: '14:00',
        venue: 'Online — Google Meet',
        mode: 'Online',
        participantCount: 58,
        actualAttendees: 54,
        status: 'completed',
        registrants: [],
      },
    ],
  },
  {
    id: 'ins_002',
    name: 'Prof. Vikram Singh',
    email: 'vikram.instructor@iitb.ac.in',
    role: 'instructor',
    empId: 'EMP2002',
    department: 'Student Wellness Center',
    specialization: 'Positive Psychology & Academic Excellence',
    totalStudents: 98,
    sessions: [],
  },
];

export const mockVolunteers: Volunteer[] = [
  {
    id: 'vol_001',
    name: 'Sana Iyer',
    email: 'volunteer@iitb.ac.in',
    role: 'volunteer',
    rollNo: '23B050011',
    department: 'Computer Science & Engineering',
    year: 2,
    batch: '2023',
    programme: 'BTech',
    registeredEvents: ['evt_001'],
    completedEvents: [
      { eventId: 'evt_004', title: 'Academic Stress Workshop', date: '2026-04-15', venue: 'Kohinoor Hall', marks: 90, maxMarks: 100, starRating: 5 },
    ],
    eventsVolunteered: 3,
    eventsCompleted: 2,
  },
];

export const mockVolunteerPool: VolunteerPool[] = [
  { id: 'vp_001', name: 'Sana Iyer', rollNo: '23B050011', department: 'CSE', year: 2, eventId: 'evt_001', available: true, selected: true },
  { id: 'vp_002', name: 'Rahul Nair', rollNo: '22B030044', department: 'EE', year: 3, eventId: 'evt_001', available: true, selected: false },
  { id: 'vp_003', name: 'Divya Shah', rollNo: '23M10033', department: 'ME', year: 1, eventId: 'evt_001', available: true, selected: true },
  { id: 'vp_004', name: 'Kiran Reddy', rollNo: '21D01002', department: 'PhD-CSE', year: 4, eventId: 'evt_001', available: false, selected: false },
  { id: 'vp_005', name: 'Anisha Gupta', rollNo: '22B040018', department: 'CE', year: 3, eventId: 'evt_001', available: true, selected: false },
  { id: 'vp_006', name: 'Nikhil Joshi', rollNo: '23B060022', department: 'Chem', year: 2, eventId: 'evt_001', available: true, selected: true },
  { id: 'vp_007', name: 'Pooja Desai', rollNo: '22M20015', department: 'Physics', year: 1, eventId: 'evt_001', available: true, selected: false },
  { id: 'vp_008', name: 'Suresh Kumar', rollNo: '21B010077', department: 'Math', year: 4, eventId: 'evt_001', available: true, selected: false },
];

export const mockAttendanceStudents: AttendanceRecord[] = [
  { id: 'att_001', studentId: 'stu_001', studentName: 'Arjun Sharma', rollNo: '23B030012', sessionId: 'ses_001', date: '2026-05-01', status: 'present' },
  { id: 'att_002', studentId: 'stu_002', studentName: 'Priya Patel', rollNo: '22M10021', sessionId: 'ses_001', date: '2026-05-01', status: 'present' },
  { id: 'att_003', studentId: 'stu_003', studentName: 'Rohit Kumar', rollNo: '21D02003', sessionId: 'ses_001', date: '2026-05-01', status: 'absent' },
  { id: 'att_004', studentId: 'stu_004', studentName: 'Kavya Menon', rollNo: '23B040045', sessionId: 'ses_001', date: '2026-05-01', status: 'present' },
  { id: 'att_005', studentId: 'stu_005', studentName: 'Aditya Verma', rollNo: '22M21011', sessionId: 'ses_001', date: '2026-05-01', status: 'absent' },
  { id: 'att_006', studentId: 'stu_006', studentName: 'Meera Pillai', rollNo: '23B020009', sessionId: 'ses_001', date: '2026-05-01', status: 'present' },
  { id: 'att_007', studentId: 'stu_007', studentName: 'Tarun Bhat', rollNo: '22B030055', sessionId: 'ses_001', date: '2026-05-01', status: 'present' },
];

export const mockVolunteerAttendance: AttendanceRecord[] = [
  { id: 'vatt_001', studentId: 'vp_001', studentName: 'Sana Iyer', rollNo: '23B050011', sessionId: 'ses_001', date: '2026-05-01', status: 'present' },
  { id: 'vatt_002', studentId: 'vp_003', studentName: 'Divya Shah', rollNo: '23M10033', sessionId: 'ses_001', date: '2026-05-01', status: 'absent' },
  { id: 'vatt_003', studentId: 'vp_006', studentName: 'Nikhil Joshi', rollNo: '23B060022', sessionId: 'ses_001', date: '2026-05-01', status: 'present' },
];

export const mockQuizSessions: QuizSession[] = [
  { sessionId: 'ses_001', sessionTitle: 'Wellness Wednesday — Mindful Breathing', quizActive: false, feedbackActive: false, registrantCount: 12 },
  { sessionId: 'ses_002', sessionTitle: 'Flourishing Friday — Gratitude Circle', quizActive: false, feedbackActive: false, registrantCount: 0 },
  { sessionId: 'ses_003', sessionTitle: 'Introduction to Mindfulness — Session 1', quizActive: false, feedbackActive: true, registrantCount: 65 },
  { sessionId: 'ses_004', sessionTitle: 'Stress Management Workshop', quizActive: false, feedbackActive: true, registrantCount: 58 },
];

export const mockMemberDirectory: MemberDirectory[] = [
  { id: 'm_001', name: 'Arjun Sharma', email: 'arjun.sharma@iitb.ac.in', rollNo: '23B030012', department: 'CSE', year: 2, batch: '2023', programme: 'BTech', role: 'student' },
  { id: 'm_002', name: 'Priya Patel', email: 'priya.patel@iitb.ac.in', rollNo: '22M10021', department: 'EE', year: 1, batch: '2022', programme: 'MTech', role: 'student' },
  { id: 'm_003', name: 'Rohit Kumar', email: 'rohit.kumar@iitb.ac.in', rollNo: '21D02003', department: 'ME', year: 3, batch: '2021', programme: 'PhD', role: 'student' },
  { id: 'm_004', name: 'Kavya Menon', email: 'kavya.menon@iitb.ac.in', rollNo: '23B040045', department: 'CE', year: 1, batch: '2023', programme: 'BTech', role: 'student' },
  { id: 'm_005', name: 'Aditya Verma', email: 'aditya.verma@iitb.ac.in', rollNo: '22M21011', department: 'Chem', year: 2, batch: '2022', programme: 'MSc', role: 'student' },
  { id: 'm_006', name: 'Sana Iyer', email: 'volunteer@iitb.ac.in', rollNo: '23B050011', department: 'CSE', year: 2, batch: '2023', programme: 'BTech', role: 'volunteer' },
  { id: 'm_007', name: 'Rahul Nair', email: 'rahul.nair@iitb.ac.in', rollNo: '22B030044', department: 'EE', year: 3, batch: '2022', programme: 'BTech', role: 'student' },
  { id: 'm_008', name: 'Divya Shah', email: 'divya.shah@iitb.ac.in', rollNo: '23M10033', department: 'ME', year: 1, batch: '2023', programme: 'MTech', role: 'volunteer' },
  { id: 'm_009', name: 'Kiran Reddy', email: 'kiran.reddy@iitb.ac.in', rollNo: '21D01002', department: 'CSE', year: 4, batch: '2021', programme: 'PhD', role: 'student' },
  { id: 'm_010', name: 'Anisha Gupta', email: 'anisha.gupta@iitb.ac.in', rollNo: '22B040018', department: 'CE', year: 3, batch: '2022', programme: 'BTech', role: 'student' },
  { id: 'm_011', name: 'Dr. Ananya Krishnan', email: 'instructor@iitb.ac.in', empId: 'EMP2001', department: 'Wellness Center', programme: 'Staff', role: 'instructor' },
  { id: 'm_012', name: 'Prof. Vikram Singh', email: 'vikram.instructor@iitb.ac.in', empId: 'EMP2002', department: 'Wellness Center', programme: 'Staff', role: 'instructor' },
  { id: 'm_013', name: 'Ms. Neha Gupta', email: 'associate@iitb.ac.in', empId: 'EMP3001', department: 'Wellness Center', programme: 'Staff', role: 'associate-instructor' },
  { id: 'm_014', name: 'Nikhil Joshi', email: 'nikhil.joshi@iitb.ac.in', rollNo: '23B060022', department: 'Chem', year: 2, batch: '2023', programme: 'BTech', role: 'volunteer' },
  { id: 'm_015', name: 'Pooja Desai', email: 'pooja.desai@iitb.ac.in', rollNo: '22M20015', department: 'Physics', year: 1, batch: '2022', programme: 'MSc', role: 'student' },
];

export const studentNotifications: Notification[] = [
  { id: 'sn_001', type: 'reminder', message: '📅 Reminder: Wellness Wednesday is tomorrow at 3:00 PM, LT 101', time: '1 hour ago', read: false },
  { id: 'sn_002', type: 'reminder', message: '🔔 You have an upcoming event in 2 hours', time: '2 hours ago', read: false },
  { id: 'sn_003', type: 'general', message: 'Your attendance for April has been recorded.', time: '2 days ago', read: true },
  { id: 'sn_004', type: 'general', message: 'Welcome to Flourishing Hub! Explore upcoming events.', time: '5 days ago', read: true },
];

export const instructorNotifications: Notification[] = [
  { id: 'in_001', type: 'reminder', message: '📅 Reminder: Your session starts tomorrow at 10:00 AM', time: '30 mins ago', read: false },
  { id: 'in_002', type: 'reminder', message: '👥 12 students registered for your upcoming session', time: '1 hour ago', read: false },
  { id: 'in_003', type: 'general', message: 'Session feedback form responses are available.', time: '1 day ago', read: true },
  { id: 'in_004', type: 'general', message: 'Your April session report has been submitted.', time: '3 days ago', read: true },
];

export const volunteerNotifications: Notification[] = [
  { id: 'vn_001', type: 'reminder', message: '📅 Reminder: Wellness Wednesday is tomorrow at 3:00 PM, LT 101', time: '1 hour ago', read: false },
  { id: 'vn_002', type: 'reminder', message: '✅ You have been confirmed as a volunteer for Wellness Wednesday', time: '2 days ago', read: false },
  { id: 'vn_003', type: 'general', message: 'Thank you for volunteering at Academic Stress Workshop!', time: '15 days ago', read: true },
];

export const adminNotifications: Notification[] = [
  { id: 'an_001', type: 'general', message: '15 new member registrations this week', time: '2 hours ago', read: false },
  { id: 'an_002', type: 'general', message: 'Wellness Wednesday — 38 students registered so far', time: '1 day ago', read: true },
  { id: 'an_003', type: 'reminder', message: '📅 Wellness Wednesday is tomorrow — ensure volunteer slots are filled', time: '30 mins ago', read: false },
];

export const recentActivity = [
  { id: 1, action: 'Arjun Sharma registered for Wellness Wednesday', time: '5 min ago', icon: '📋' },
  { id: 2, action: 'Kavya Menon registered for Wellness Wednesday', time: '12 min ago', icon: '📋' },
  { id: 3, action: 'Admin published Wellness Wednesday event', time: '1 hr ago', icon: '🎯' },
  { id: 4, action: 'Mental Health Awareness Talk archived', time: '3 hrs ago', icon: '📁' },
  { id: 5, action: 'Sana Iyer confirmed as volunteer for Wellness Wednesday', time: '5 hrs ago', icon: '✅' },
  { id: 6, action: 'New member: Pooja Desai joined Flourishing Hub', time: 'Yesterday', icon: '👥' },
  { id: 7, action: 'Feedback activated for Stress Management Workshop', time: 'Yesterday', icon: '📝' },
];
