export type UserRole = 'student' | 'instructor' | 'admin' | 'volunteer' | 'associate-instructor';

export type Programme = 'BTech' | 'MTech' | 'PhD' | 'MSc' | 'Staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export interface CompletedEvent {
  eventId: string;
  title: string;
  date: string;
  venue: string;
  role?: string;
  marks?: number;
  maxMarks?: number;
  starRating?: number;
}

export interface Student extends User {
  role: 'student';
  rollNo: string;
  department: string;
  year: number;
  batch: string;
  programme: Programme;
  registeredEvents: string[];
  completedEvents: CompletedEvent[];
}

export interface Instructor extends User {
  role: 'instructor';
  empId: string;
  department: string;
  specialization: string;
  sessions: Session[];
  totalStudents: number;
}

export interface AssociateInstructor extends User {
  role: 'associate-instructor';
  empId: string;
  department: string;
  assignedSessions: string[];
}

export interface Admin extends User {
  role: 'admin';
  empId: string;
  permissions: string[];
}

export interface Volunteer extends User {
  role: 'volunteer';
  rollNo: string;
  department: string;
  year: number;
  batch: string;
  programme: Programme;
  registeredEvents: string[];
  completedEvents: CompletedEvent[];
  eventsVolunteered: number;
  eventsCompleted: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  mode: 'Online' | 'Offline';
  capacity: number;
  registeredCount: number;
  status: 'published' | 'completed' | 'draft' | 'cancelled';
  organizer: string;
  volunteerSlots?: number;
}

export interface Session {
  id: string;
  title: string;
  instructorId: string;
  instructorName: string;
  date: string;
  time: string;
  venue: string;
  mode: 'Online' | 'Offline';
  participantCount: number;
  actualAttendees?: number;
  status: 'upcoming' | 'completed';
  registrants: string[];
}

export interface Notification {
  id: string;
  type: 'reminder' | 'general';
  message: string;
  time: string;
  read: boolean;
}

export interface MemberDirectory {
  id: string;
  name: string;
  email: string;
  rollNo?: string;
  empId?: string;
  department: string;
  year?: number;
  batch?: string;
  programme: Programme;
  role: UserRole;
}

export interface VolunteerPool {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  year: number;
  eventId: string;
  available: boolean;
  selected: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  sessionId: string;
  date: string;
  status: 'present' | 'absent';
}

export interface QuizSession {
  sessionId: string;
  sessionTitle: string;
  quizActive: boolean;
  feedbackActive: boolean;
  registrantCount: number;
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

export interface AuthPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  rollNo?: string;
  empId?: string;
  department?: string;
  year?: number;
  batch?: string;
  programme?: Programme;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  interests?: string;
  iat: number;
}
