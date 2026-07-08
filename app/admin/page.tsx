'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, Activity, Settings,
  TrendingUp, UserCheck, UserCog, BarChart2, Play, Zap,
  BookOpen, Shield, Edit2, ClipboardList, CheckCircle, Clock,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { apiCall, getCurrentUser } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { isEventLive, isEventUpcoming, isEventPast } from '@/lib/dateUtils';
import type { Event, MemberDirectory, UserRole } from '@/types';
import toast from 'react-hot-toast';

// Tab components
import OverviewTab from './_components/tabs/OverviewTab';
import NewEventsTab from './_components/tabs/NewEventsTab';
import EventStatusTab from './_components/tabs/EventStatusTab';
import PastRecordsTab from './_components/tabs/PastRecordsTab';
import AnalyticsTab from './_components/tabs/AnalyticsTab';
import CalendarTab from './_components/tabs/CalendarTab';
import EventsTab from './_components/tabs/EventsTab';
import CoursesTab from './_components/tabs/CoursesTab';
import MembersTab from './_components/tabs/MembersTab';
import VolunteersTab from './_components/tabs/VolunteersTab';
import ApprovalsTab from './_components/tabs/ApprovalsTab';
import RolesTab from './_components/tabs/RolesTab';
import SettingsTab from './_components/tabs/SettingsTab';
import VideosTab from './_components/tabs/VideosTab';

// Modal components
import VideoModal from './_components/modals/VideoModal';
import EventModal from './_components/modals/EventModal';
import CourseModal from './_components/modals/CourseModal';
import ModuleModal from './_components/modals/ModuleModal';
import DeleteModal from './_components/modals/DeleteModal';
import BulkImportModal from './_components/modals/BulkImportModal';
import BatchUploadModal from './_components/modals/BatchUploadModal';

type EventStatus = 'published' | 'completed' | 'draft' | 'cancelled';
type Tab = 'overview' | 'new-events' | 'event-status' | 'past-records' | 'calendar' | 'events' | 'courses' | 'members' | 'volunteers' | 'approvals' | 'roles' | 'settings' | 'analytics' | 'videos';
type CourseStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

interface CourseFormData {
  name: string;
  code: string;
  description: string;
  posterUrl: string;
  duration: string;
  status: CourseStatus;
  isCompulsory: boolean;
  workshopCount: string;
  workshopTopics: string[];
}

const emptyCourseForm: CourseFormData = {
  name: '', code: '', description: '', posterUrl: '', duration: '',
  status: 'ACTIVE', isCompulsory: false, workshopCount: '', workshopTopics: [],
};

const courseStatusColors: Record<CourseStatus, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
  INACTIVE: 'bg-gray-500/15 text-gray-400 border border-gray-500/30 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
  ARCHIVED: 'bg-orange-500/15 text-orange-400 border border-orange-500/30 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
};

interface ModuleFormData {
  title: string;
  description: string;
  posterUrl: string;
  quizLink: string;
  feedbackLink: string;
  duration: string;
  order: string;
}

const emptyModuleForm: ModuleFormData = {
  title: '', description: '', posterUrl: '', quizLink: '', feedbackLink: '', duration: '', order: '0',
};

interface FilterState {
  role: string;
  department: string;
  programme: string;
  year: string;
  volunteerStatus: string;
  search: string;
}

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  venue: string;
  mode: 'Online' | 'In Classroom';
  capacity: string;
  status: EventStatus;
  courseId: string;
  courseModuleId: string;
  batch: string;
  posterUrl: string;
  quizLink: string;
  feedbackLink: string;
  instructorId: string;
  associateInstructorId: string;
  maxVolunteers: string;
  registrationMode: 'compulsory' | 'optional' | 'open';
}

const emptyForm: EventFormData = {
  title: '', description: '', date: '', time: '',
  venue: '', mode: 'In Classroom', capacity: '', status: 'published',
  courseId: '', courseModuleId: '', batch: '', posterUrl: '', quizLink: '', feedbackLink: '',
  endTime: '', instructorId: '', associateInstructorId: '', maxVolunteers: '',
  registrationMode: 'open',
};

const ROLES: UserRole[] = ['student', 'instructor', 'admin', 'volunteer', 'associate-instructor'];

// Frontend role values are lowercase/hyphenated; backend enum is uppercase/underscored
const ROLE_TO_BACKEND: Record<UserRole, string> = {
  student: 'STUDENT',
  instructor: 'INSTRUCTOR',
  admin: 'ADMIN',
  volunteer: 'VOLUNTEER',
  'associate-instructor': 'ASSOCIATE_INSTRUCTOR',
};

const statusColors: Record<EventStatus, string> = {
  published: 'badge-green',
  completed: 'bg-gray-500/15 text-gray-400 border border-gray-500/30 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
  draft: 'badge-yellow',
  cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
};

// Admin Dashboard Component
export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('new-events');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<MemberDirectory[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [filters, setFilters] = useState<FilterState>({
    role: '',
    department: '',
    programme: '',
    year: '',
    volunteerStatus: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false); // Add saving state to prevent double clicks
  const [deleting, setDeleting] = useState<string | null>(null); // Track which event is being deleted
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Custom delete confirmation modal
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null); // Event to be deleted
  const [courseFilter, setCourseFilter] = useState<string>(''); // Course filter for events
  const [courses, setCourses] = useState<any[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormData>(emptyCourseForm);
  const [savingCourse, setSavingCourse] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>(emptyModuleForm);
  const [savingModule, setSavingModule] = useState(false);
  const [deletingModule, setDeletingModule] = useState<string | null>(null);
  const [selectedCourseForEvent, setSelectedCourseForEvent] = useState<any | null>(null);
  const [modulesForEvent, setModulesForEvent] = useState<any[]>([]);
  const [adminUser, setAdminUser] = useState<any | null>(() => {
    if (typeof window === 'undefined') return null;
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'workshop' | 'course'>('all');
  const [overviewFilter, setOverviewFilter] = useState<'live' | 'upcoming' | 'completed'>('upcoming');
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [associateInstructors, setAssociateInstructors] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedAnalyticsEvent, setSelectedAnalyticsEvent] = useState<any | null>(null);
  const [courseStaff, setCourseStaff] = useState<any | null>(null);
  const [courseStaffLoading, setCourseStaffLoading] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [draftFilter, setDraftFilter] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoForm, setVideoForm] = useState({ title: '', description: '', youtubeUrl: '', thumbnailUrl: '', duration: '', category: 'WELLNESS', tags: '' });
  const [bulkEnrollCourseId, setBulkEnrollCourseId] = useState('');
  const [bulkEnrollEmails, setBulkEnrollEmails] = useState('');
  const [bulkEnrolling, setBulkEnrolling] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);

  const transformEventsData = (rawEvents: any[]) => rawEvents.map((event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt || null,
    date: new Date(event.startAt).toISOString().split('T')[0],
    time: new Date(event.startAt).toTimeString().slice(0, 5),
    endTime: event.endAt ? new Date(event.endAt).toTimeString().slice(0, 5) : '',
    venue: event.venue || 'TBD',
    mode: (event.meetLink ? 'Online' : 'In Classroom') as 'Online' | 'In Classroom',
    capacity: event.capacity || 0,
    registeredCount: event._count?.registrations || 0,
    attendedCount: event.attendedCount ?? event._count?.attendances ?? 0,
    status: event.status.toLowerCase() as EventStatus,
    organizer: event.createdBy?.name || 'Admin',
    registrations: event.registrations || [],
    registrationStats: event.registrationStats || {
      total: 0, attended: 0, students: 0, volunteers: 0,
      fillRate: 0, available: event.capacity || 0
    },
    courseId: event.courseId || null,
    courseModuleId: event.courseModuleId || null,
    course: event.course || null,
    courseModule: event.courseModule || null,
    batch: event.batch || null,
    bannerImageUrl: event.bannerImageUrl || null,
    instructorId: event.assignments?.find((a: any) => a.role === 'INSTRUCTOR')?.user?.id || null,
    associateInstructorId: event.assignments?.find((a: any) => a.role === 'ASSOCIATE_INSTRUCTOR')?.user?.id || null,
    volunteersNeeded: event.volunteersNeeded || null,
  }));

  // Handle URL hash navigation for tab switching
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Tab;
      if (hash && ['new-events', 'event-status', 'past-records', 'calendar', 'events', 'courses', 'members', 'volunteers', 'approvals', 'roles', 'settings', 'analytics', 'videos'].includes(hash)) {
        setActiveTab(hash);
      } else if (!hash) {
        setActiveTab('new-events');
      }
    };

    // Check hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setEventsLoading(true);

      // Phase 1: All fast data in parallel (excludes the slow events query)
      try {
        const [userResult, dashboardResult, membersResult, volunteersResult, pendingResult, coursesResult] =
          await Promise.allSettled([
            getCurrentUser(),
            apiCall('/admin/dashboard'),
            apiCall('/admin/members'),
            apiCall('/admin/volunteers'),
            apiCall('/admin/pending-approvals'),
            apiCall('/courses'),
          ]);

        if (userResult.status === 'fulfilled') {
          const u = userResult.value;
          setAdminUser(u?.data?.data || u?.data || u);
        }
        if (dashboardResult.status === 'fulfilled') {
          setDashboardData(dashboardResult.value?.data);
        }
        if (membersResult.status === 'fulfilled') {
          const membersData = membersResult.value?.data || [];
          setMembers(membersData.map((member: any) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role.toLowerCase().replace('_', '-'),
            department: member.department || 'N/A',
            programme: member.programme || 'N/A',
            year: member.yearOfStudy,
            batch: member.cohort,
            rollNo: member.rollNumber,
            empId: member.employeeId || member.adminEmployeeId
          })));
          setInstructors(membersData.filter((m: any) => m.role?.toLowerCase().replace('_', '-') === 'instructor'));
          setAssociateInstructors(membersData.filter((m: any) => m.role?.toLowerCase().replace('_', '-') === 'associate-instructor'));
        }
        if (volunteersResult.status === 'fulfilled') setVolunteers(volunteersResult.value?.data || []);
        if (pendingResult.status === 'fulfilled') setPendingUsers(pendingResult.value?.data || []);
        if (coursesResult.status === 'fulfilled') setCourses(coursesResult.value?.data || []);
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
      } finally {
        setLoading(false); // Show the page now — events still loading in background
      }

      // Phase 2: Events (slow query) — loads after page is already visible
      try {
        const eventsResponse = await apiCall('/admin/events-with-registrations');
        setEvents(transformEventsData(eventsResponse?.data || []));
      } catch (error) {
        console.error('⚠️ Events fetch failed:', error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch videos when videos tab is opened
  useEffect(() => {
    if (activeTab !== 'videos') return;
    const fetchVideos = async () => {
      setVideosLoading(true);
      try {
        const res = await apiCall('/videos');
        setVideos(res.data || []);
      } catch { toast.error('Failed to load videos'); }
      finally { setVideosLoading(false); }
    };
    fetchVideos();
  }, [activeTab]);

  const handleSaveVideo = async () => {
    if (!videoForm.title || !videoForm.youtubeUrl) { toast.error('Title and YouTube URL required'); return; }
    setSavingVideo(true);
    try {
      const payload = { ...videoForm, tags: videoForm.tags.split(',').map(t => t.trim()).filter(Boolean) };
      await apiCall('/videos', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Video added!');
      setShowVideoModal(false);
      setVideoForm({ title: '', description: '', youtubeUrl: '', thumbnailUrl: '', duration: '', category: 'WELLNESS', tags: '' });
      const res = await apiCall('/videos');
      setVideos(res.data || []);
    } catch { toast.error('Failed to save video'); }
    finally { setSavingVideo(false); }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      await apiCall(`/videos/${videoId}`, { method: 'DELETE' });
      setVideos(prev => prev.filter(v => v.id !== videoId));
      toast.success('Video deleted');
    } catch { toast.error('Failed to delete video'); }
  };

  const handleBulkEnroll = async () => {
    if (!bulkEnrollCourseId || !bulkEnrollEmails.trim()) { toast.error('Course and emails required'); return; }
    const userEmails = bulkEnrollEmails.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean);
    if (userEmails.length === 0) { toast.error('No valid emails entered'); return; }
    setBulkEnrolling(true);
    try {
      const res = await apiCall(`/courses/${bulkEnrollCourseId}/bulk-enroll`, {
        method: 'POST',
        body: JSON.stringify({ userEmails }),
      });
      toast.success(`Enrolled ${res.data.enrolled} registrations across ${res.data.workshopCount} workshops`);
      setBulkEnrollEmails('');
    } catch (e: any) { toast.error(e.message || 'Bulk enroll failed'); }
    finally { setBulkEnrolling(false); }
  };

  // Fetch analytics when analytics tab is opened
  useEffect(() => {
    if (activeTab !== 'analytics' || analyticsData.length > 0) return;
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const res = await apiCall('/admin/analytics/workshops');
        setAnalyticsData(res.data || []);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [activeTab]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent animate-pulse mx-auto mb-4" />
            <p className="text-white/60">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Get today's events (published events happening today)
  const today = new Date().toISOString().split('T')[0];
  const todaysEvents = events.filter((e) => e.status === 'published' && e.date === today);
  const activeEvent = events.find((e) => e.status === 'published') ?? null;
  
  // Sort events: live/today first, then by date
  const sortedEvents = [...events].sort((a, b) => {
    const aIsToday = a.date === today && a.status === 'published';
    const bIsToday = b.date === today && b.status === 'published';
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const totalVolunteers = members.filter((m) => m.role === 'volunteer').length;

  const now = new Date();

  // Event filters
  const liveEvents = events.filter(e => e.status === 'published' && isEventLive(e.startAt || (e.date + 'T' + e.time), e.endAt));
  const upcomingEventsAll = events.filter(e => e.status === 'published' && isEventUpcoming(e.startAt || (e.date + 'T' + e.time)));
  const completedEventsAll = events.filter(e =>
    e.status === 'completed' || isEventPast(e.startAt || (e.date + 'T' + e.time), e.endAt)
  );

  const filterByType = (list: Event[]) => {
    if (eventStatusFilter === 'workshop') return list.filter(e => !(e as any).courseId);
    if (eventStatusFilter === 'course') return list.filter(e => !!(e as any).courseId);
    return list;
  };

  const overviewEvents = overviewFilter === 'live'
    ? filterByType(liveEvents)
    : overviewFilter === 'completed'
    ? filterByType(completedEventsAll)
    : filterByType(upcomingEventsAll);

  // New Events: published with 0 registrations
  const newEvents = events.filter(e => e.status === 'published' && e.registeredCount === 0);

  // Calendar dates
  const allEventDates = events.filter(e => e.status === 'published').map(e => e.date);
  const calendarDateEvents = calendarSelectedDate
    ? events.filter(e => e.date === calendarSelectedDate.toISOString().split('T')[0])
    : [];

  // 4 Summary stats
  const coursesCompletedCount = courses.filter(c => c.status === 'ARCHIVED' || (c.endDate && new Date(c.endDate) < now)).length;
  const workshopsCompletedCount = completedEventsAll.length;
  const pendingWorkshopsCount = events.filter(e => e.status === 'draft').length;
  const ongoingCoursesCount = courses.filter(c => c.status === 'ACTIVE').length;

  // Past records table data — attended count from real DB attendance records
  const pastRecordsData = completedEventsAll.map(e => ({
    eventName: e.title,
    courseName: (e as any).course?.name || '—',
    date: formatDate(e.date),
    venue: e.venue,
    registered: e.registeredCount,
    attended: (e as any).attendedCount ?? 0,
  }));

  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    const ev = event as any;
    setForm({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      endTime: (ev as any).endTime || '',
      venue: event.venue,
      mode: event.mode,
      capacity: String(event.capacity),
      status: event.status,
      courseId: ev.courseId || '',
      courseModuleId: ev.courseModuleId || '',
      batch: ev.batch || '',
      posterUrl: ev.bannerImageUrl || '',
      quizLink: ev.quizLink || ev.courseModule?.quizLink || '',
      feedbackLink: ev.feedbackLink || ev.courseModule?.feedbackLink || '',
      registrationMode: (ev.registrationMode === 'COMPULSORY' ? 'compulsory' : ev.registrationMode === 'OPTIONAL_BUNDLE' ? 'optional' : 'open') as 'compulsory' | 'optional' | 'open',
      instructorId: ev.instructorId || '',
      associateInstructorId: ev.associateInstructorId || '',
      maxVolunteers: ev.volunteersNeeded ? String(ev.volunteersNeeded) : '',
    });
    if (ev.courseId) {
      const course = courses.find(c => c.id === ev.courseId);
      setSelectedCourseForEvent(course || null);
      if (ev.courseId) {
        apiCall(`/courses/${ev.courseId}/modules`).then(r => setModulesForEvent(r.data || [])).catch(() => {});
      }
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.description || !form.date || !form.time || !form.venue || !form.capacity) {
      toast.error('Please fill in all required fields (title, description, date, time, venue, capacity)');
      return;
    }

    if (saving) {
      return; // Prevent double submission
    }

    try {
      setSaving(true); // Disable button during save
      
      const regModeMap: Record<string, string> = {
        compulsory: 'COMPULSORY',
        optional: 'OPTIONAL_BUNDLE',
        open: 'OPEN',
      };
      const eventData: any = {
        title: form.title,
        description: form.description,
        startAt: new Date(`${form.date}T${form.time}`).toISOString(),
        endAt: form.endTime
          ? new Date(`${form.date}T${form.endTime}`).toISOString()
          : new Date(new Date(`${form.date}T${form.time}`).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        venue: form.venue,
        meetLink: form.mode === 'Online' ? 'https://meet.google.com/placeholder' : null,
        capacity: parseInt(form.capacity),
        status: form.status.toUpperCase(),
        type: 'WELLNESS_COURSE',
        registrationMode: regModeMap[form.registrationMode] || 'OPEN',
        ...(form.quizLink && { quizLink: form.quizLink }),
        ...(form.feedbackLink && { feedbackLink: form.feedbackLink }),
        ...(form.courseId && { courseId: form.courseId }),
        ...(form.courseModuleId && { courseModuleId: form.courseModuleId }),
        ...(form.batch && { batch: form.batch }),
        ...(form.posterUrl && { bannerImageUrl: form.posterUrl }),
        ...(form.maxVolunteers && { volunteersNeeded: parseInt(form.maxVolunteers) }),
      };

      console.log("📤 Sending event data:", eventData);

      if (editingEvent) {
        const editData: any = {
          ...eventData,
          // Always send staff IDs on edit so backend can sync assignments
          instructorId: form.instructorId || null,
          associateInstructorId: form.associateInstructorId || null,
        };
        await apiCall(`/admin/events/${editingEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(editData)
        });
        toast.success('Event updated!');
      } else {
        const createdEvent = await apiCall('/admin/events', {
          method: 'POST',
          body: JSON.stringify(eventData)
        });
        if (createdEvent?.data?.id) {
          const staffCalls = [
            form.instructorId && { userId: form.instructorId, role: 'INSTRUCTOR' },
            form.associateInstructorId && { userId: form.associateInstructorId, role: 'ASSOCIATE_INSTRUCTOR' },
          ].filter(Boolean) as { userId: string; role: string }[];
          for (const s of staffCalls) {
            try {
              await apiCall('/admin/assign-staff', {
                method: 'POST',
                body: JSON.stringify({ eventId: createdEvent.data.id, userId: s.userId, role: s.role })
              });
            } catch (e: any) {
              toast.error(`Could not assign ${s.role === 'INSTRUCTOR' ? 'instructor' : 'associate instructor'}: ${e?.message || 'unknown error'}`);
            }
          }
        }
        toast.success(form.status === 'published' ? 'Event published!' : 'Event saved as draft');
      }

      // Close modal immediately after success
      setShowModal(false);
      setEditingEvent(null);
      setForm(emptyForm);
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }

    // Refresh events list silently in background (outside try so it never blocks success)
    try {
      const eventsResponse = await apiCall('/admin/events-with-registrations');
      if (eventsResponse?.data) setEvents(transformEventsData(eventsResponse.data));
    } catch {}
  };

  const handleDelete = async (eventId: string, eventTitle: string) => {
    // Show custom confirmation modal instead of browser confirm
    setEventToDelete({ id: eventId, title: eventTitle });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      setDeleting(eventToDelete.id);
      
      await apiCall(`/admin/events/${eventToDelete.id}`, { method: 'DELETE' });

      toast.success('Event deleted successfully!');
      
      // Refresh events list
      const eventsResponse = await apiCall('/admin/events-with-registrations');
      setEvents(transformEventsData(eventsResponse.data));
      
      setShowDeleteModal(false);
      setEventToDelete(null);
      
    } catch (error) {
      console.error('Error cancelling event:', error);
      toast.error('Failed to cancel event');
    } finally {
      setDeleting(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    try {
      await apiCall(`/users/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: ROLE_TO_BACKEND[newRole] }),
      });
      // Only update local state after the API call actually succeeds
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
      toast.success('Role updated successfully');
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error?.message || 'Failed to update role');
    }
  };

  // Filter members based on current filters
  const filteredMembers = members.filter((member) => {
    if (filters.role && member.role !== filters.role) return false;
    if (filters.department && member.department !== filters.department) return false;
    if (filters.programme && member.programme !== filters.programme) return false;
    if (filters.year && member.year?.toString() !== filters.year) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!member.name.toLowerCase().includes(searchLower) &&
          !member.email.toLowerCase().includes(searchLower) &&
          !(member.rollNo?.toLowerCase().includes(searchLower)) &&
          !(member.empId?.toLowerCase().includes(searchLower))) {
        return false;
      }
    }
    return true;
  });

  // Filter volunteers based on volunteer status
  const filteredVolunteers = volunteers.filter((volunteer) => {
    if (filters.volunteerStatus === 'active') {
      return volunteer.status === 'ACTIVE';
    }
    if (filters.volunteerStatus === 'past') {
      return volunteer.status === 'INACTIVE';
    }
    return true; // Show all if no filter
  });

  // Get unique values for filter dropdowns
  const uniqueDepartments = Array.from(new Set(members.map(m => m.department).filter(Boolean)));
  const uniqueProgrammes = Array.from(new Set(members.map(m => m.programme).filter(Boolean)));
  const uniqueYears = Array.from(new Set(members.map(m => m.year).filter(Boolean))).sort();

  // Export to CSV function
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    setExporting(true);
    try {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${data.length} records to CSV`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Export students
  const exportStudents = () => {
    const studentData = filteredMembers
      .filter(m => m.role === 'student')
      .map(m => ({
        Name: m.name,
        Email: m.email,
        'Roll Number': m.rollNo || '',
        Department: m.department,
        Programme: m.programme,
        Year: m.year || '',
        Batch: m.batch || '',
        Role: m.role
      }));
    exportToCSV(studentData, 'students');
  };

  // Export volunteers
  const exportVolunteers = () => {
    const volunteerData = filteredVolunteers.map(m => ({
      Name: m.name,
      Email: m.email,
      'Roll Number': m.rollNo || '',
      Department: m.department,
      Programme: m.programme,
      Year: m.year || '',
      Batch: m.batch || '',
      Status: 'Active', // You can enhance this with real volunteer status
      Role: m.role
    }));
    exportToCSV(volunteerData, 'volunteers');
  };

  // Export all members
  const exportAllMembers = () => {
    const allData = filteredMembers.map(m => ({
      Name: m.name,
      Email: m.email,
      ID: m.rollNo || m.empId || '',
      Department: m.department,
      Programme: m.programme,
      Year: m.year || '',
      Batch: m.batch || '',
      Role: m.role
    }));
    exportToCSV(allData, 'all_members');
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      role: '',
      department: '',
      programme: '',
      year: '',
      volunteerStatus: '',
      search: ''
    });
  };

  const openCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm(emptyCourseForm);
    setShowCourseModal(true);
  };

  const openEditCourse = (course: any) => {
    setEditingCourse(course);
    setCourseForm({
      name: course.name,
      code: course.code || '',
      description: course.description || '',
      posterUrl: course.posterUrl || '',
      duration: course.duration || '',
      status: course.status as CourseStatus,
      isCompulsory: course.isCompulsory === true,
      workshopCount: '',
      workshopTopics: [],
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async () => {
    if (!courseForm.name) {
      toast.error('Course name is required');
      return;
    }
    if (savingCourse) return;

    try {
      setSavingCourse(true);
      const payload: any = {
        name: courseForm.name,
        code: courseForm.code || null,
        description: courseForm.description || '',
        posterUrl: courseForm.posterUrl || null,
        duration: courseForm.duration || null,
        status: courseForm.status,
        isCompulsory: courseForm.isCompulsory,
      };

      if (editingCourse) {
        await apiCall(`/courses/${editingCourse.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Course updated!');
      } else {
        const created = await apiCall('/courses', { method: 'POST', body: JSON.stringify(payload) });
        const courseId = created?.data?.id;

        const topics = courseForm.workshopTopics.filter(t => t.trim());
        if (courseId && topics.length > 0) {
          for (let i = 0; i < topics.length; i++) {
            try {
              await apiCall(`/courses/${courseId}/modules`, {
                method: 'POST',
                body: JSON.stringify({ title: topics[i].trim(), order: i + 1, description: '' }),
              });
            } catch (e) {
              console.warn(`Failed to create workshop topic ${i + 1}:`, e);
            }
          }
        }
        toast.success('Course template created!');
      }

      setShowCourseModal(false);
      setEditingCourse(null);
      setCourseForm(emptyCourseForm);

      // Refresh courses list (non-blocking — don't let failure hide the save success)
      try {
        const coursesResponse = await apiCall('/courses');
        setCourses(coursesResponse?.data || []);
      } catch {
        // ignore refresh error
      }
    } catch (error: any) {
      console.error('Error saving course:', error);
      const msg = error?.message || 'Failed to save course. Check console for details.';
      toast.error(msg);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!window.confirm(`Delete course "${courseName}"? This cannot be undone.`)) return;
    try {
      setDeletingCourse(courseId);
      await apiCall(`/courses/${courseId}`, { method: 'DELETE' });
      toast.success('Course deleted');
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
      const coursesResponse = await apiCall('/courses');
      setCourses(coursesResponse.data || []);
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    } finally {
      setDeletingCourse(null);
    }
  };

  const handleViewModules = async (course: any) => {
    setSelectedCourse(course);
    setCourseStaff(null);
    setLoadingModules(true);
    setCourseStaffLoading(true);
    try {
      const [modulesRes, staffRes] = await Promise.allSettled([
        apiCall(`/courses/${course.id}/modules`),
        apiCall(`/admin/courses/${course.id}/staff`),
      ]);
      if (modulesRes.status === 'fulfilled') setCourseModules(modulesRes.value?.data || []);
      else toast.error('Failed to load modules');
      if (staffRes.status === 'fulfilled') setCourseStaff(staffRes.value?.data || null);
    } finally {
      setLoadingModules(false);
      setCourseStaffLoading(false);
    }
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setCourseModules([]);
    setCourseStaff(null);
  };

  const openCreateModule = () => {
    setEditingModule(null);
    setModuleForm(emptyModuleForm);
    setShowModuleModal(true);
  };

  const openEditModule = (mod: any) => {
    setEditingModule(mod);
    setModuleForm({
      title: mod.title,
      description: mod.description || '',
      posterUrl: mod.posterUrl || '',
      quizLink: mod.quizLink || '',
      feedbackLink: mod.feedbackLink || '',
      duration: mod.duration || '',
      order: String(mod.order ?? 0),
    });
    setShowModuleModal(true);
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title) {
      toast.error('Module title is required');
      return;
    }
    if (!selectedCourse || savingModule) return;

    try {
      setSavingModule(true);
      const payload = {
        title: moduleForm.title,
        description: moduleForm.description,
        posterUrl: moduleForm.posterUrl || null,
        quizLink: moduleForm.quizLink || null,
        feedbackLink: moduleForm.feedbackLink || null,
        duration: moduleForm.duration,
        order: moduleForm.order ? parseInt(moduleForm.order) : 0,
      };

      if (editingModule) {
        await apiCall(`/courses/${selectedCourse.id}/modules/${editingModule.id}`, {
          method: 'PUT', body: JSON.stringify(payload),
        });
        toast.success('Module updated!');
      } else {
        await apiCall(`/courses/${selectedCourse.id}/modules`, {
          method: 'POST', body: JSON.stringify(payload),
        });
        toast.success('Module created!');
      }

      setShowModuleModal(false);
      setEditingModule(null);
      setModuleForm(emptyModuleForm);

      const res = await apiCall(`/courses/${selectedCourse.id}/modules`);
      setCourseModules(res.data || []);
      const coursesRes = await apiCall('/courses');
      setCourses(coursesRes.data || []);
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Failed to save module');
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleTitle: string) => {
    if (!selectedCourse) return;
    if (!window.confirm(`Delete module "${moduleTitle}"?`)) return;
    try {
      setDeletingModule(moduleId);
      await apiCall(`/courses/${selectedCourse.id}/modules/${moduleId}`, { method: 'DELETE' });
      toast.success('Module deleted');
      const res = await apiCall(`/courses/${selectedCourse.id}/modules`);
      setCourseModules(res.data || []);
      const coursesRes = await apiCall('/courses');
      setCourses(coursesRes.data || []);
      const eventsRes = await apiCall('/admin/events-with-registrations');
      setEvents(transformEventsData(eventsRes.data));
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    } finally {
      setDeletingModule(null);
    }
  };

  const handleCreateWorkshopFromModule = (mod: any) => {
    // Clear editing state first
    setEditingEvent(null);
    
    // Set course and modules for dropdown
    if (selectedCourse) {
      setSelectedCourseForEvent(selectedCourse);
      setModulesForEvent(courseModules);
    }
    
    // Set form with module data - ensure all fields are strings
    setForm({
      title: mod.title || '',
      description: mod.description || '',
      date: '',
      time: '',
      venue: '',
      mode: 'In Classroom',
      capacity: '',
      status: 'published',
      courseId: selectedCourse?.id || '',
      courseModuleId: mod.id || '',
      batch: '',
      endTime: '',
      posterUrl: mod.posterUrl || '',
      quizLink: mod.quizLink || '',
      feedbackLink: mod.feedbackLink || '',
      instructorId: '',
      associateInstructorId: '',
      maxVolunteers: '',
      registrationMode: 'open',
    });

    // Open modal after state is set
    setTimeout(() => setShowModal(true), 0);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'new-events', label: 'New Events', icon: Zap },
    { id: 'event-status', label: 'Event Status', icon: TrendingUp },
    { id: 'past-records', label: 'Past Records', icon: ClipboardList },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'events', label: 'Events', icon: Edit2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'volunteers', label: 'Volunteers', icon: UserCheck },
    { id: 'approvals', label: 'Approvals', icon: UserCog },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'videos', label: 'Videos', icon: Play },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">
            Welcome, <span className="gradient-text">{adminUser?.name?.split(' ')[0] || 'Admin'}</span>
          </h1>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-wider">
            Administrator
          </span>
        </div>
        <p className="text-sm text-white/50">Flourishing Hub · IIT Bombay Wellness Center</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={dashboardData?.totals?.totalUsers || 0} 
          icon={Users} 
          color="purple" 
        />
        <StatCard 
          title="Active Events" 
          value={dashboardData?.totals?.totalEvents || 0} 
          subtitle={todaysEvents.length > 0 ? `${todaysEvents.length} today` : 'None today'} 
          icon={Activity} 
          color="teal" 
        />
        <StatCard 
          title="Total Registrations" 
          value={dashboardData?.totals?.totalRegistrations || 0} 
          icon={Calendar} 
          color="yellow" 
        />
        <StatCard
          title="Volunteers"
          value={totalVolunteers}
          icon={Users}
          color="blue"
        />
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Courses Completed" value={coursesCompletedCount} icon={BookOpen} color="teal" />
        <StatCard title="Workshops Completed" value={workshopsCompletedCount} icon={CheckCircle} color="blue" />
        <StatCard title="Pending Workshops" value={pendingWorkshopsCount} icon={Clock} color="yellow" />
        <StatCard title="Ongoing Courses" value={ongoingCoursesCount} icon={Activity} color="purple" />
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                window.history.pushState(null, '', `/admin#${id}`);
              }}
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <OverviewTab
              todaysEvents={todaysEvents}
              dashboardData={dashboardData}
              router={router}
            />
          )}


          {/* New Events Tab */}
          {activeTab === 'new-events' && <NewEventsTab eventsLoading={eventsLoading} events={events} newEvents={newEvents} router={router} />}


          {/* Event Status Tab */}
          {activeTab === 'event-status' && <EventStatusTab eventsLoading={eventsLoading} events={events} eventStatusFilter={eventStatusFilter} setEventStatusFilter={setEventStatusFilter} overviewFilter={overviewFilter} setOverviewFilter={setOverviewFilter} overviewEvents={overviewEvents} router={router} />}

          {/* Past Records Tab */}
          {activeTab === 'past-records' && <PastRecordsTab eventsLoading={eventsLoading} events={events} pastRecordsData={pastRecordsData} />}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && <AnalyticsTab analyticsLoading={analyticsLoading} analyticsData={analyticsData} selectedAnalyticsEvent={selectedAnalyticsEvent} setSelectedAnalyticsEvent={setSelectedAnalyticsEvent} />}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && <CalendarTab eventsLoading={eventsLoading} events={events} allEventDates={allEventDates} calendarSelectedDate={calendarSelectedDate} setCalendarSelectedDate={setCalendarSelectedDate} calendarDateEvents={calendarDateEvents} router={router} />}

          {/* Events Tab */}
          {activeTab === 'events' && <EventsTab eventsLoading={eventsLoading} events={events} sortedEvents={sortedEvents} draftFilter={draftFilter} setDraftFilter={setDraftFilter} courseFilter={courseFilter} setCourseFilter={setCourseFilter} courses={courses} setShowBulkImport={setShowBulkImport} openCreate={openCreate} openEdit={openEdit} handleDelete={handleDelete} deleting={deleting} expandedEvents={expandedEvents} setExpandedEvents={setExpandedEvents} exportToCSV={exportToCSV} exporting={exporting} router={router} />}

          {/* Courses Tab */}
          {activeTab === 'courses' && <CoursesTab courses={courses} selectedCourse={selectedCourse} courseModules={courseModules} loadingModules={loadingModules} deletingCourse={deletingCourse} deletingModule={deletingModule} courseStaff={courseStaff} courseStaffLoading={courseStaffLoading} openCreateCourse={openCreateCourse} openEditCourse={openEditCourse} handleDeleteCourse={handleDeleteCourse} handleViewModules={handleViewModules} handleBackToCourses={handleBackToCourses} openCreateModule={openCreateModule} openEditModule={openEditModule} handleDeleteModule={handleDeleteModule} handleCreateWorkshopFromModule={handleCreateWorkshopFromModule} />}

          {/* Members Tab */}
          {activeTab === 'members' && <MembersTab members={members} filteredMembers={filteredMembers} filters={filters} setFilters={setFilters} showFilters={showFilters} setShowFilters={setShowFilters} exporting={exporting} exportAllMembers={exportAllMembers} exportStudents={exportStudents} clearFilters={clearFilters} uniqueDepartments={uniqueDepartments} uniqueProgrammes={uniqueProgrammes} uniqueYears={uniqueYears} onBatchUpload={() => setShowBatchUpload(true)} />}

          {/* Volunteers Tab */}
          {activeTab === 'volunteers' && <VolunteersTab filteredVolunteers={filteredVolunteers} filters={filters} setFilters={setFilters} exporting={exporting} exportVolunteers={exportVolunteers} />}

          {/* Approvals Tab */}
          {activeTab === 'approvals' && <ApprovalsTab pendingUsers={pendingUsers} setPendingUsers={setPendingUsers} />}

          {/* Roles Tab */}
          {activeTab === 'roles' && <RolesTab members={members} filteredMembers={filteredMembers} filters={filters} setFilters={setFilters} showFilters={showFilters} setShowFilters={setShowFilters} exporting={exporting} exportAllMembers={exportAllMembers} exportStudents={exportStudents} clearFilters={clearFilters} uniqueDepartments={uniqueDepartments} uniqueProgrammes={uniqueProgrammes} uniqueYears={uniqueYears} handleRoleChange={handleRoleChange} />}

          {/* Settings Tab */}
          {activeTab === 'settings' && <SettingsTab />}

          {/* Videos Tab */}
          {activeTab === 'videos' && <VideosTab videos={videos} videosLoading={videosLoading} setShowVideoModal={setShowVideoModal} handleDeleteVideo={handleDeleteVideo} courses={courses} bulkEnrollCourseId={bulkEnrollCourseId} setBulkEnrollCourseId={setBulkEnrollCourseId} bulkEnrollEmails={bulkEnrollEmails} setBulkEnrollEmails={setBulkEnrollEmails} bulkEnrolling={bulkEnrolling} handleBulkEnroll={handleBulkEnroll} />}
        </div>
      </div>

      {/* Add Video Modal */}
      <VideoModal showVideoModal={showVideoModal} setShowVideoModal={setShowVideoModal} videoForm={videoForm} setVideoForm={setVideoForm} handleSaveVideo={handleSaveVideo} savingVideo={savingVideo} />

      {/* Create/Edit Event Modal */}
      <EventModal showModal={showModal} setShowModal={setShowModal} editingEvent={editingEvent} form={form} setForm={setForm} courses={courses} modulesForEvent={modulesForEvent} setModulesForEvent={setModulesForEvent} instructors={instructors} associateInstructors={associateInstructors} handleSave={handleSave} saving={saving} />

      {/* Create/Edit Course Modal */}
      <CourseModal showCourseModal={showCourseModal} setShowCourseModal={setShowCourseModal} editingCourse={editingCourse} courseForm={courseForm} setCourseForm={setCourseForm} handleSaveCourse={handleSaveCourse} savingCourse={savingCourse} />

      {/* Create/Edit Module Modal */}
      <ModuleModal showModuleModal={showModuleModal} setShowModuleModal={setShowModuleModal} editingModule={editingModule} selectedCourse={selectedCourse} moduleForm={moduleForm} setModuleForm={setModuleForm} handleSaveModule={handleSaveModule} savingModule={savingModule} />

      {/* Delete Confirmation Modal */}
      <DeleteModal showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal} eventToDelete={eventToDelete} setEventToDelete={setEventToDelete} confirmDelete={confirmDelete} deleting={deleting} />

      {/* Bulk Import Modal */}
      <BulkImportModal showBulkImport={showBulkImport} setShowBulkImport={setShowBulkImport} bulkImportFile={bulkImportFile} setBulkImportFile={setBulkImportFile} bulkImporting={bulkImporting} setBulkImporting={setBulkImporting} courses={courses} />

      {/* Batch Upload Modal */}
      <BatchUploadModal show={showBatchUpload} onClose={() => setShowBatchUpload(false)} />
    </DashboardLayout>
  );
}
