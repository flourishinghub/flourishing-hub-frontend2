export type UserRole = 'student' | 'instructor' | 'admin' | 'volunteer' | 'associate-instructor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

export interface Student extends User {
  role: 'student';
  rollNo: string;
  department: string;
  year: number;
  programme: 'BTech' | 'MTech' | 'PhD' | 'MSc';
  enrolledCourses: string[];
  modules: StudentModule[];
  attendancePercentage: number;
  workshopsAttended: number;
  upcomingEvents: string[];
}

export interface StudentModule {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  status: 'completed' | 'pending' | 'in-progress';
  marks?: number;
  maxMarks?: number;
  completedDate?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  venue?: string;
  duration: number;
}

export interface Instructor extends User {
  role: 'instructor';
  specialization: string;
  sessions: Session[];
  totalStudents: number;
}

export interface AssociateInstructor extends User {
  role: 'associate-instructor';
  assignedSessions: string[];
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

export interface Volunteer extends User {
  role: 'volunteer';
  rollNo: string;
  department: string;
  year: number;
  programme: 'BTech' | 'MTech' | 'PhD' | 'MSc';
  volunteeringEvents: VolunteerEvent[];
  modules: StudentModule[];
  attendancePercentage: number;
  workshopsAttended: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  totalModules: number;
  completedModules: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
  thumbnail?: string;
  tags: string[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: number;
  type: 'lecture' | 'workshop' | 'quiz' | 'assignment';
  scheduledDate?: string;
  scheduledTime?: string;
  venue?: string;
  meetLink?: string;
  status: 'completed' | 'pending' | 'active';
  maxMarks?: number;
}

export interface Session {
  id: string;
  title: string;
  instructorId: string;
  instructorName: string;
  date: string;
  time: string;
  venue: string;
  meetLink?: string;
  participantCount: number;
  actualAttendees?: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  type: 'workshop' | 'seminar' | 'therapy' | 'group-session';
  registrants: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  type: 'workshop' | 'wellness' | 'seminar' | 'social' | 'volunteer';
  organizer: string;
  capacity: number;
  registeredCount: number;
  tags: string[];
  isRecurring: boolean;
  volunteerSlots?: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  sessionId: string;
  sessionTitle: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  markedBy?: string;
}

export interface VolunteerEvent {
  eventId: string;
  eventTitle: string;
  date: string;
  status: 'registered' | 'completed' | 'pending';
  hoursContributed?: number;
}

export interface AnalyticsData {
  workshopsPerMonth: { month: string; workshops: number }[];
  engagementByDept: { dept: string; students: number; engagement: number }[];
  programmeDistribution: { name: string; value: number; color: string }[];
  attendanceHeatmap: { date: string; count: number }[][];
  totalStudents: number;
  totalWorkshops: number;
  activeCourses: number;
  engagementRate: number;
}

export interface AuthPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  rollNo?: string;
  department?: string;
  iat: number;
}

export interface QuizSession {
  sessionId: string;
  sessionTitle: string;
  quizActive: boolean;
  feedbackActive: boolean;
  quizLink?: string;
  feedbackLink?: string;
}
