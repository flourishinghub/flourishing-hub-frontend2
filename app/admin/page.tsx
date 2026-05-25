'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, Activity, Plus, X, Edit2, AlertTriangle,
  Wifi, WifiOff, Shield, Settings, Check, TrendingUp, Filter,
  Download, FileSpreadsheet, Search, ChevronDown, UserCheck,
  UserCog, BookOpen, Layers, ArrowLeft, Link2, ClipboardList,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import VolunteerAssignment from '@/components/VolunteerAssignment';
import PendingApprovalsTab from '@/components/PendingApprovalsTab';
import { apiCall } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import type { Event, MemberDirectory, UserRole } from '@/types';
import toast from 'react-hot-toast';

type EventStatus = 'published' | 'completed' | 'draft' | 'cancelled';
type Tab = 'overview' | 'events' | 'courses' | 'members' | 'volunteers' | 'approvals' | 'roles' | 'settings';
type CourseStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

interface CourseFormData {
  name: string;
  description: string;
  posterUrl: string;
  duration: string;
  instructorName: string;
  status: CourseStatus;
  startDate: string;
  endDate: string;
  capacity: string;
}

const emptyCourseForm: CourseFormData = {
  name: '', description: '', posterUrl: '', duration: '', instructorName: '',
  status: 'ACTIVE', startDate: '', endDate: '', capacity: '',
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
}

const emptyForm: EventFormData = {
  title: '', description: '', date: '', time: '',
  venue: '', mode: 'In Classroom', capacity: '', status: 'published',
  courseId: '', courseModuleId: '', batch: '', posterUrl: '', quizLink: '', feedbackLink: '',
};

const ROLES: UserRole[] = ['student', 'instructor', 'admin', 'volunteer', 'associate-instructor'];

const statusColors: Record<EventStatus, string> = {
  published: 'badge-green',
  completed: 'bg-gray-500/15 text-gray-400 border border-gray-500/30 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
  draft: 'badge-yellow',
  cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
};

// Admin Dashboard Component
export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
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

  const transformEventsData = (rawEvents: any[]) => rawEvents.map((event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    date: new Date(event.startAt).toISOString().split('T')[0],
    time: new Date(event.startAt).toTimeString().slice(0, 5),
    venue: event.venue || 'TBD',
    mode: (event.meetLink ? 'Online' : 'In Classroom') as 'Online' | 'In Classroom',
    capacity: event.capacity || 0,
    registeredCount: event._count?.registrations || 0,
    status: event.status.toLowerCase() as EventStatus,
    organizer: event.createdBy?.name || 'Admin',
    registrations: event.registrations || [],
    registrationStats: event.registrationStats || {
      total: 0, students: 0, volunteers: 0,
      fillRate: 0, available: event.capacity || 0
    },
    courseId: event.courseId || null,
    courseModuleId: event.courseModuleId || null,
    course: event.course || null,
    courseModule: event.courseModule || null,
    batch: event.batch || null,
    bannerImageUrl: event.bannerImageUrl || null,
  }));

  // Handle URL hash navigation for tab switching
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Tab;
      if (hash && ['overview', 'events', 'courses', 'members', 'volunteers', 'approvals', 'roles', 'settings'].includes(hash)) {
        setActiveTab(hash);
      } else if (!hash) {
        setActiveTab('overview');
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
      try {
        setLoading(true);
        
        console.log("🔄 Fetching admin dashboard data...");
        
        // Fetch admin dashboard data with retry
        let dashboardResponse;
        try {
          dashboardResponse = await apiCall('/admin/dashboard');
          console.log("✅ Dashboard data fetched:", dashboardResponse);
        } catch (error) {
          console.log("⚠️ Dashboard API failed, retrying...", error);
          // Retry once after 2 seconds
          await new Promise(resolve => setTimeout(resolve, 2000));
          dashboardResponse = await apiCall('/admin/dashboard');
        }
        setDashboardData(dashboardResponse.data);
        
        // Fetch events with registration details
        console.log("🔄 Fetching events with registrations...");
        const eventsResponse = await apiCall('/admin/events-with-registrations');
        console.log("✅ Events with registrations fetched:", eventsResponse);
        setEvents(transformEventsData(eventsResponse.data));
        
        // Fetch members
        console.log("🔄 Fetching members...");
        const membersResponse = await apiCall('/admin/members');
        console.log("✅ Members fetched:", membersResponse);
        const transformedMembers = membersResponse.data.map((member: any) => ({
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
        }));
        setMembers(transformedMembers);

        // Fetch volunteers with activity data
        console.log("🔄 Fetching volunteers...");
        const volunteersResponse = await apiCall('/admin/volunteers');
        console.log("✅ Volunteers fetched:", volunteersResponse);
        setVolunteers(volunteersResponse.data);
        
        // Fetch pending approval users
        console.log("🔄 Fetching pending approvals...");
        try {
          const pendingResponse = await apiCall('/admin/pending-approvals');
          console.log("✅ Pending approvals fetched:", pendingResponse);
          setPendingUsers(pendingResponse.data || []);
        } catch (error) {
          console.log("⚠️ No pending approvals or API not available");
          setPendingUsers([]);
        }

        // Fetch courses
        console.log("🔄 Fetching courses...");
        try {
          const coursesResponse = await apiCall('/courses');
          console.log("✅ Courses fetched:", coursesResponse);
          setCourses(coursesResponse.data || []);
        } catch (error) {
          console.log("⚠️ Courses API not available");
          setCourses([]);
        }
        
        console.log("🎉 All admin data loaded successfully!");
        
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
      venue: event.venue,
      mode: event.mode,
      capacity: String(event.capacity),
      status: event.status,
      courseId: ev.courseId || '',
      courseModuleId: ev.courseModuleId || '',
      batch: ev.batch || '',
      posterUrl: ev.bannerImageUrl || '',
      quizLink: ev.quizLink || '',
      feedbackLink: ev.feedbackLink || '',
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
    if (!form.title || !form.date || !form.time || !form.venue || !form.capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (saving) {
      return; // Prevent double submission
    }

    try {
      setSaving(true); // Disable button during save
      
      const eventData: any = {
        title: form.title,
        description: form.description,
        startAt: new Date(`${form.date}T${form.time}`).toISOString(),
        endAt: new Date(`${form.date}T${form.time}`).toISOString(),
        venue: form.venue,
        meetLink: form.mode === 'Online' ? 'https://meet.google.com/placeholder' : null,
        capacity: parseInt(form.capacity),
        status: form.status.toUpperCase(),
        type: 'WELLNESS_COURSE',
        ...(form.courseId && { courseId: form.courseId }),
        ...(form.courseModuleId && { courseModuleId: form.courseModuleId }),
        ...(form.batch && { batch: form.batch }),
        ...(form.posterUrl && { bannerImageUrl: form.posterUrl }),
      };

      console.log("📤 Sending event data:", eventData);

      if (editingEvent) {
        await apiCall(`/admin/events/${editingEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(eventData)
        });
        toast.success('Event updated!');
      } else {
        await apiCall('/admin/events', {
          method: 'POST',
          body: JSON.stringify(eventData)
        });
        toast.success(form.status === 'published' ? 'Event published!' : 'Event saved as draft');
      }

      // Close modal immediately after success
      setShowModal(false);
      setEditingEvent(null);
      setForm(emptyForm);

      // Refresh events list with registration details in background
      const eventsResponse = await apiCall('/admin/events-with-registrations');
      setEvents(transformEventsData(eventsResponse.data));
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setSaving(false); // Re-enable button
    }
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
      
      console.log("🗑️ Cancelling event (soft delete):", eventToDelete.id);
      
      // Instead of deleting, mark event as CANCELLED
      await apiCall(`/admin/events/${eventToDelete.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'CANCELLED'
        })
      });
      
      toast.success('Event cancelled successfully!');
      
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
      // Note: You'll need to implement a role change API endpoint
      // For now, just update locally
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
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
      description: course.description || '',
      posterUrl: course.posterUrl || '',
      duration: course.duration || '',
      instructorName: course.instructorName || '',
      status: course.status as CourseStatus,
      startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
      endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '',
      capacity: course.capacity ? String(course.capacity) : '',
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
        description: courseForm.description,
        posterUrl: courseForm.posterUrl || null,
        duration: courseForm.duration,
        instructorName: courseForm.instructorName,
        status: courseForm.status,
        startDate: courseForm.startDate || null,
        endDate: courseForm.endDate || null,
        capacity: courseForm.capacity ? parseInt(courseForm.capacity) : null,
      };

      if (editingCourse) {
        await apiCall(`/courses/${editingCourse.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Course updated!');
      } else {
        await apiCall('/courses', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Course created!');
      }

      setShowCourseModal(false);
      setEditingCourse(null);
      setCourseForm(emptyCourseForm);

      const coursesResponse = await apiCall('/courses');
      setCourses(coursesResponse.data || []);
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course');
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
    setLoadingModules(true);
    try {
      const res = await apiCall(`/courses/${course.id}/modules`);
      setCourseModules(res.data || []);
    } catch {
      toast.error('Failed to load modules');
    } finally {
      setLoadingModules(false);
    }
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setCourseModules([]);
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
      posterUrl: mod.posterUrl || '',
      quizLink: mod.quizLink || '',
      feedbackLink: mod.feedbackLink || '',
    });
    
    // Open modal after state is set
    setTimeout(() => setShowModal(true), 0);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'volunteers', label: 'Volunteers', icon: UserCheck },
    { id: 'approvals', label: 'Approvals', icon: UserCog },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          <span className="gradient-text">Admin</span> Dashboard
        </h1>
        <p className="text-sm text-white/50 mt-1">Flourishing Hub · IIT Bombay Wellness Center</p>
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

      {/* Tabs */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                if (id === 'overview') {
                  window.history.pushState(null, '', '/admin');
                } else {
                  window.history.pushState(null, '', `/admin#${id}`);
                }
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
            <div className="space-y-6">
              {todaysEvents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Today's Events ({todaysEvents.length})
                    </span>
                  </div>
                  {todaysEvents.map((event) => (
                    <div key={event.id} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-base font-semibold text-white">{event.title}</p>
                      <p className="text-sm text-white/50 mt-0.5">
                        {formatTime(event.time)} · {event.venue} · {event.mode}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        {event.registeredCount} / {event.capacity} registered
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Dashboard Stats */}
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <h4 className="text-sm font-semibold text-white mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {dashboardData?.recentActivity?.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/80 truncate">{item.userName} registered for {item.eventTitle}</p>
                          <p className="text-[10px] text-white/35 mt-0.5">{new Date(item.registeredAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-xs text-white/40">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6" id="events">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Event Management</h3>
                <div className="flex items-center gap-3">
                  {/* Course Filter */}
                  <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="input-dark px-4 py-2 rounded-xl text-sm font-medium"
                  >
                    <option value="">All Workshops</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={openCreate}
                    className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" /> Create Event
                  </motion.button>
                </div>
              </div>

              <div className="space-y-6">
                {sortedEvents
                  .filter(event => {
                    if (!courseFilter) return true;
                    return (event as any).courseId === courseFilter;
                  })
                  .map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => router.push(`/admin/events/${event.id}`)}
                    className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-2 border-white/10 hover:border-primary/30 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                  >
                    {/* Event Header */}
                    <div className="p-6 border-b border-white/5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                            event.status === 'published' ? 'bg-emerald-400' :
                            event.status === 'draft' ? 'bg-yellow-400' : 'bg-gray-500'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h4 className="text-lg font-bold text-white">{event.title}</h4>
                              <span className={statusColors[event.status]}>{event.status}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                event.mode === 'Online'
                                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                  : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                              }`}>
                                {event.mode === 'Online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                {event.mode}
                              </span>
                              {(event as any).course && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                  <BookOpen className="w-3 h-3" />
                                  {(event as any).course.name}
                                  {(event as any).courseModule && (
                                    <span className="text-primary/70"> › {(event as any).courseModule.title}</span>
                                  )}
                                </span>
                              )}
                              {(event as any).batch && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-white/5 text-white/50 text-xs border border-white/10">
                                  {(event as any).batch}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(event.date)} · {formatTime(event.time)}
                              </span>
                              <span>{event.venue}</span>
                            </div>
                            <p className="text-sm text-white/50">{event.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(event);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                          >
                            <Edit2 className="w-4 h-4" /> Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(event.id, event.title);
                            }}
                            disabled={deleting === event.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            {deleting === event.id ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Event Stats */}
                    <div className="p-6 border-b border-white/5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="text-2xl font-bold text-white mb-1">{event.registeredCount}</div>
                          <div className="text-xs text-white/50">Registered</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="text-2xl font-bold text-white mb-1">{event.capacity}</div>
                          <div className="text-xs text-white/50">Capacity</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="text-2xl font-bold text-emerald-400 mb-1">
                            {event.capacity > 0 ? Math.round((event.registeredCount / event.capacity) * 100) : 0}%
                          </div>
                          <div className="text-xs text-white/50">Fill Rate</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="text-2xl font-bold text-blue-400 mb-1">
                            {event.capacity - event.registeredCount}
                          </div>
                          <div className="text-xs text-white/50">Available</div>
                        </div>
                      </div>
                    </div>

                    {/* Registration Details */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-sm font-semibold text-white">Registered Participants</h5>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              // Export event registrations with real data
                              const eventRegistrations = (event as any).registrations?.map((reg: any) => ({
                                Name: reg.user.name,
                                Email: reg.user.email,
                                'Roll Number': reg.user.rollNumber || '',
                                Department: reg.user.department || '',
                                Programme: reg.user.programme || '',
                                Year: reg.user.yearOfStudy || '',
                                Section: reg.user.section || '',
                                Cohort: reg.user.cohort || '',
                                'Is Volunteer': reg.isVolunteer ? 'Yes' : 'No',
                                'Registration Date': new Date(reg.registeredAt).toLocaleDateString(),
                                'Event': event.title
                              })) || [];
                              
                              if (eventRegistrations.length > 0) {
                                exportToCSV(eventRegistrations, `${event.title.replace(/\s+/g, '_')}_registrations`);
                              } else {
                                toast.error('No registrations to export');
                              }
                            }}
                            disabled={exporting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-all disabled:opacity-50"
                          >
                            <Download className="w-3 h-3" />
                            Export
                          </motion.button>
                        </div>
                      </div>

                      {event.registeredCount > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {/* Real registered users from database */}
                          {(event as any).registrations?.map((registration: any) => (
                            <div key={registration.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-bold text-xs">
                                  {registration.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{registration.user.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-white/50">
                                    <span>{registration.user.rollNumber || registration.user.email}</span>
                                    {registration.user.department && (
                                      <>
                                        <span>•</span>
                                        <span>{registration.user.department}</span>
                                      </>
                                    )}
                                    {registration.user.yearOfStudy && (
                                      <>
                                        <span>•</span>
                                        <span>Year {registration.user.yearOfStudy}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {registration.isVolunteer && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                                    Volunteer
                                  </span>
                                )}
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  Registered
                                </span>
                                <span className="text-xs text-white/40">
                                  {new Date(registration.registeredAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )) || (
                            // Fallback if registrations array is empty but count > 0
                            <div className="text-center py-4">
                              <p className="text-white/40 text-sm">Registration details loading...</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                          <p className="text-white/40">No registrations yet</p>
                          <p className="text-white/30 text-sm mt-1">Participants will appear here once they register</p>
                        </div>
                      )}
                    </div>

                    {/* Volunteer Assignment Section */}
                    <VolunteerAssignment eventId={event.id} />
                  </motion.div>
                ))}
              </div>

              {events.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40 text-lg">No events created yet</p>
                  <p className="text-white/30 text-sm mt-1">Create your first event to get started</p>
                </div>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-6" id="courses">
              {!selectedCourse ? (
                /* ── Course List View ── */
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Course Management</h3>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={openCreateCourse}
                      className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" /> Create Course
                    </motion.button>
                  </div>

                  <div className="space-y-4">
                    {courses.map((course) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 hover:border-primary/30 overflow-hidden transition-all duration-300"
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Poster thumbnail */}
                            {course.posterUrl ? (
                              <img src={course.posterUrl} alt={course.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 mb-1.5">
                                <h4 className="text-base font-bold text-white">{course.name}</h4>
                                <span className={courseStatusColors[course.status as CourseStatus]}>{course.status}</span>
                              </div>
                              {course.description && (
                                <p className="text-sm text-white/50 mb-2 line-clamp-2">{course.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                                <span className="flex items-center gap-1">
                                  <Layers className="w-3 h-3" />
                                  <span className="text-white/70 font-medium">{course._count?.modules ?? 0}</span> modules
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span className="text-white/70 font-medium">{course._count?.events ?? 0}</span> workshops conducted
                                </span>
                                {course.instructorName && <span>by {course.instructorName}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                              <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => handleViewModules(course)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all"
                              >
                                <Layers className="w-3.5 h-3.5" /> View Modules
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => openEditCourse(course)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => handleDeleteCourse(course.id, course.name)}
                                disabled={deletingCourse === course.id}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-50"
                              >
                                {deletingCourse === course.id
                                  ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                  : <X className="w-3.5 h-3.5" />}
                                Delete
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {courses.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <p className="text-white/40 text-lg">No courses yet</p>
                      <p className="text-white/30 text-sm mt-1">Create your first course to get started</p>
                    </div>
                  )}
                </>
              ) : (
                /* ── Module List View (Course Detail) ── */
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={handleBackToCourses}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Courses
                    </motion.button>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {selectedCourse.posterUrl ? (
                        <img src={selectedCourse.posterUrl} alt={selectedCourse.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                          <BookOpen className="w-7 h-7 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-white">{selectedCourse.name}</h3>
                        <p className="text-sm text-white/50 mt-0.5">
                          {courseModules.length} modules · {selectedCourse._count?.events ?? 0} workshops conducted
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={openCreateModule}
                      className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add Module
                    </motion.button>
                  </div>

                  {loadingModules ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courseModules.map((mod, idx) => (
                        <motion.div
                          key={mod.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 hover:border-primary/20 transition-all"
                        >
                          <div className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 text-white/60 font-bold text-sm">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-white">{mod.title}</h4>
                                {mod.description && <p className="text-xs text-white/50 mt-1">{mod.description}</p>}
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/40">
                                  {mod.duration && <span>Duration: {mod.duration}</span>}
                                  {mod.quizLink && (
                                    <a href={mod.quizLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                      <Link2 className="w-3 h-3" /> Quiz
                                    </a>
                                  )}
                                  {mod.feedbackLink && (
                                    <a href={mod.feedbackLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-400 hover:text-teal-300">
                                      <ClipboardList className="w-3 h-3" /> Feedback
                                    </a>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <span className="text-primary font-semibold">{mod._count?.events ?? 0}</span> workshops
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <motion.button
                                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                  onClick={() => handleCreateWorkshopFromModule(mod)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                                >
                                  <Plus className="w-3 h-3" /> Workshop
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                  onClick={() => openEditModule(mod)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                  onClick={() => handleDeleteModule(mod.id, mod.title)}
                                  disabled={deletingModule === mod.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-50"
                                >
                                  {deletingModule === mod.id
                                    ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                    : <X className="w-3 h-3" />}
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {courseModules.length === 0 && (
                        <div className="text-center py-10">
                          <Layers className="w-12 h-12 text-white/20 mx-auto mb-3" />
                          <p className="text-white/40">No modules yet</p>
                          <p className="text-white/30 text-sm mt-1">Add your first module to this course</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div id="members">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Member Directory</h3>
                <div className="flex items-center gap-3">
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={exportAllMembers}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all disabled:opacity-50"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export All
                  </motion.button>
                </div>
              </div>

              {/* Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {/* Search */}
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-2 block">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                          <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            placeholder="Name, email, ID..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-primary/50 focus:outline-none transition-colors text-sm"
                          />
                        </div>
                      </div>

                      {/* Role Filter */}
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-2 block">Role</label>
                        <select
                          value={filters.role}
                          onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                        >
                          <option value="">All Roles</option>
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="admin">Admin</option>
                          <option value="associate-instructor">Associate Instructor</option>
                        </select>
                      </div>

                      {/* Department Filter */}
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-2 block">Department</label>
                        <select
                          value={filters.department}
                          onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                        >
                          <option value="">All Departments</option>
                          {uniqueDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      {/* Programme Filter */}
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-2 block">Programme</label>
                        <select
                          value={filters.programme}
                          onChange={(e) => setFilters(prev => ({ ...prev, programme: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                        >
                          <option value="">All Programmes</option>
                          {uniqueProgrammes.map(prog => (
                            <option key={prog} value={prog}>{prog}</option>
                          ))}
                        </select>
                      </div>

                      {/* Year Filter */}
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-2 block">Year</label>
                        <select
                          value={filters.year}
                          onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                        >
                          <option value="">All Years</option>
                          {uniqueYears.map(year => (
                            <option key={year} value={year?.toString() || ''}>Year {year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-white/60">
                        Showing {filteredMembers.length} of {members.length} members
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={clearFilters}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                        >
                          Clear Filters
                        </button>
                        <button
                          onClick={exportStudents}
                          disabled={exporting}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all disabled:opacity-50"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          Export Students
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Members Table */}
              <DataTable
                data={filteredMembers.map((m) => ({
                  ...m,
                  yearDisplay: m.year ? `Year ${m.year}` : '—',
                  batchDisplay: m.batch ?? '—',
                  idDisplay: m.rollNo ?? m.empId ?? '—',
                })) as unknown as Record<string, unknown>[]}
                columns={[
                  { key: 'name', label: 'Name', sortable: true },
                  { key: 'idDisplay', label: 'ID' },
                  { key: 'department', label: 'Department', sortable: true },
                  { key: 'programme', label: 'Programme', sortable: true },
                  { key: 'yearDisplay', label: 'Year' },
                  {
                    key: 'role', label: 'Role',
                    render: (row) => {
                      const r = (row as unknown as MemberDirectory & { yearDisplay: string; batchDisplay: string; idDisplay: string });
                      return (
                        <span className={
                          r.role === 'admin' ? 'badge-red' :
                          r.role === 'instructor' ? 'badge-purple' :
                          r.role === 'volunteer' ? 'badge-green' :
                          r.role === 'associate-instructor' ? 'badge-yellow' : 'badge-purple'
                        }>
                          {r.role}
                        </span>
                      );
                    },
                  },
                ]}
                searchKeys={['name', 'department', 'programme'] as never[]}
                searchPlaceholder="Search members..."
                emptyMessage="No members found"
              />
            </div>
          )}

          {/* Volunteers Tab */}
          {activeTab === 'volunteers' && (
            <div id="volunteers">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Volunteer Management</h3>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={exportVolunteers}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-all disabled:opacity-50"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export Volunteers
                  </motion.button>
                </div>
              </div>

              {/* Volunteer Status Filter */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-white/60">Status:</label>
                  <select
                    value={filters.volunteerStatus}
                    onChange={(e) => setFilters(prev => ({ ...prev, volunteerStatus: e.target.value }))}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                  >
                    <option value="">All Volunteers</option>
                    <option value="active">Active Volunteers</option>
                    <option value="past">Past Volunteers</option>
                  </select>
                </div>
                <div className="text-sm text-white/60">
                  {filteredVolunteers.length} volunteers found
                </div>
              </div>

              {/* Volunteers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVolunteers.map((volunteer) => (
                  <motion.div
                    key={volunteer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center text-white font-bold text-sm">
                          {volunteer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{volunteer.name}</p>
                          <p className="text-xs text-white/40">{volunteer.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        volunteer.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'
                      }`}>
                        {volunteer.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/50">Roll No:</span>
                        <span className="text-white/80">{volunteer.rollNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Department:</span>
                        <span className="text-white/80">{volunteer.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Programme:</span>
                        <span className="text-white/80">{volunteer.programme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Year:</span>
                        <span className="text-white/80">{volunteer.yearOfStudy ? `Year ${volunteer.yearOfStudy}` : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/50">Events Volunteered:</span>
                        <span className="text-green-400 font-semibold">{volunteer.totalVolunteerEvents || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredVolunteers.length === 0 && (
                <div className="text-center py-12">
                  <UserCheck className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No volunteers found</p>
                  <p className="text-white/30 text-sm mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}

          {/* Approvals Tab */}
          {activeTab === 'approvals' && (
            <div id="approvals">
              <PendingApprovalsTab 
                pendingUsers={pendingUsers} 
                onUpdate={async () => {
                  // Refresh pending users list
                  try {
                    const pendingResponse = await apiCall('/admin/pending-approvals');
                    setPendingUsers(pendingResponse.data || []);
                  } catch (error) {
                    console.error("Failed to refresh pending users:", error);
                  }
                }}
              />
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div id="roles">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Role Management</h3>
                <div className="flex items-center gap-3">
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={exportAllMembers}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all disabled:opacity-50"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export All
                  </motion.button>
                </div>
              </div>

              {/* Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {/* Search */}
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-2 block">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                          <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            placeholder="Name, email, ID..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-primary/50 focus:outline-none transition-colors text-sm"
                          />
                        </div>
                      </div>

                      {/* Role Filter */}
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-2 block">Role</label>
                        <select
                          value={filters.role}
                          onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                        >
                          <option value="">All Roles</option>
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="admin">Admin</option>
                          <option value="associate-instructor">Associate Instructor</option>
                        </select>
                      </div>

                      {/* Department Filter */}
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-2 block">Department</label>
                        <select
                          value={filters.department}
                          onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                        >
                          <option value="">All Departments</option>
                          {uniqueDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      {/* Programme Filter */}
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-2 block">Programme</label>
                        <select
                          value={filters.programme}
                          onChange={(e) => setFilters(prev => ({ ...prev, programme: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                        >
                          <option value="">All Programmes</option>
                          {uniqueProgrammes.map(prog => (
                            <option key={prog} value={prog}>{prog}</option>
                          ))}
                        </select>
                      </div>

                      {/* Year Filter */}
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-2 block">Year</label>
                        <select
                          value={filters.year}
                          onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm"
                        >
                          <option value="">All Years</option>
                          {uniqueYears.map(year => (
                            <option key={year} value={year?.toString() || ''}>Year {year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-white/60">
                        Showing {filteredMembers.length} of {members.length} members
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={clearFilters}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                        >
                          Clear Filters
                        </button>
                        <button
                          onClick={exportStudents}
                          disabled={exporting}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all disabled:opacity-50"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          Export Students
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Role Management Cards */}
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-sm font-semibold text-white">{member.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            member.role === 'admin' ? 'badge-red' :
                            member.role === 'instructor' ? 'badge-purple' :
                            member.role === 'volunteer' ? 'badge-green' :
                            member.role === 'associate-instructor' ? 'badge-yellow' : 'badge-blue'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/50">
                          <span>{member.email}</span>
                          {member.department && <span>• {member.department}</span>}
                          {member.programme && <span>• {member.programme}</span>}
                          {member.year && <span>• Year {member.year}</span>}
                          {(member.rollNo || member.empId) && <span>• {member.rollNo || member.empId}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors text-sm min-w-[160px]"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="bg-[#1A1A2E] text-white capitalize">
                            {r.replace('-', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredMembers.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No members found</p>
                  <p className="text-white/30 text-sm mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div id="settings" className="space-y-4">
              <h3 className="text-sm font-semibold text-white mb-4">Platform Settings</h3>
              {[
                { label: 'Allow self-registration', description: 'Students can register for events themselves' },
                { label: 'Email notifications', description: 'Send reminders via email' },
                { label: 'Volunteer opt-in', description: 'Allow volunteers to self-select events' },
              ].map(({ label, description }) => (
                <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{description}</p>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-primary/30 flex items-center px-1 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-primary shadow" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ background: '#1A1A2E' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-base font-semibold text-white">
                  {editingEvent ? 'Edit Event' : 'Create Event'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Warning Banner */}
                {form.status === 'published' && activeEvent && activeEvent.id !== editingEvent?.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
                  >
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-yellow-400">Active Event Conflict</p>
                      <p className="text-xs text-yellow-400/80 mt-0.5">
                        ⚠️ <strong>{activeEvent.title}</strong> is currently active. Publishing this will archive it.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Course & Module Selection ── */}
                {courses.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                    <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider">Link to Course (optional)</p>
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1.5 block">Course / Program</label>
                      <select
                        value={form.courseId}
                        onChange={async (e) => {
                          const cId = e.target.value;
                          setForm({ ...form, courseId: cId, courseModuleId: '' });
                          if (cId) {
                            try {
                              const r = await apiCall(`/courses/${cId}/modules`);
                              setModulesForEvent(r.data || []);
                            } catch { setModulesForEvent([]); }
                          } else {
                            setModulesForEvent([]);
                          }
                        }}
                        className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                      >
                        <option value="">— No course —</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    {form.courseId && modulesForEvent.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-1.5 block">Module (auto-fills details)</label>
                        <select
                          value={form.courseModuleId}
                          onChange={(e) => {
                            const mId = e.target.value;
                            const mod = modulesForEvent.find(m => m.id === mId);
                            if (mod) {
                              setForm({
                                ...form,
                                courseModuleId: mId,
                                title: form.title || mod.title,
                                description: form.description || mod.description || '',
                                posterUrl: mod.posterUrl || form.posterUrl,
                                quizLink: mod.quizLink || '',
                                feedbackLink: mod.feedbackLink || '',
                              });
                            } else {
                              setForm({ ...form, courseModuleId: mId });
                            }
                          }}
                          className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                        >
                          <option value="">— No module —</option>
                          {modulesForEvent.map(m => (
                            <option key={m.id} value={m.id}>{m.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Workshop Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Introduction to Mindfulness - Batch 2024"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Workshop description..."
                    rows={2}
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Time *</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Venue *</label>
                  <input
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g. LT 101, Lecture Complex"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Target Batch / Cohort</label>
                  <input
                    value={form.batch}
                    onChange={(e) => setForm({ ...form, batch: e.target.value })}
                    placeholder="e.g. BTech 2024, MTech 2023"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Mode</label>
                    <div className="flex gap-2">
                      {(['Online', 'In Classroom'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForm({ ...form, mode: m })}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            form.mode === m
                              ? m === 'Online'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                : 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                              : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {m === 'Online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Capacity *</label>
                    <input
                      type="number"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      placeholder="e.g. 60"
                      min="1"
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Extra links (quiz/feedback) if from module or manually entered */}
                {(form.quizLink !== undefined || form.feedbackLink !== undefined) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1.5 block">Quiz Link</label>
                      <input
                        value={form.quizLink}
                        onChange={(e) => setForm({ ...form, quizLink: e.target.value })}
                        placeholder="https://forms.gle/..."
                        className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1.5 block">Feedback Link</label>
                      <input
                        value={form.feedbackLink}
                        onChange={(e) => setForm({ ...form, feedbackLink: e.target.value })}
                        placeholder="https://forms.gle/..."
                        className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Status</label>
                  <div className="flex gap-2">
                    {([
                      { val: 'draft' as EventStatus, label: 'Draft', cls: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
                      { val: 'published' as EventStatus, label: 'Publish (Active)', cls: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
                      { val: 'completed' as EventStatus, label: 'Complete', cls: 'border-gray-500/40 text-gray-400 bg-gray-500/10' },
                    ]).map(({ val, label, cls }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm({ ...form, status: val })}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          form.status === val ? cls : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {form.status === val && <Check className="w-3 h-3" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: saving ? 1 : 1.02 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    form.status === 'published' ? 'Publish Event' : 'Save Event'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Course Modal */}
      <AnimatePresence>
        {showCourseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowCourseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ background: '#1A1A2E' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-base font-semibold text-white">
                  {editingCourse ? 'Edit Course' : 'Create Course'}
                </h3>
                <button onClick={() => setShowCourseModal(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Course Name *</label>
                  <input
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    placeholder="e.g. Mentorship Program"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Description</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Course description..."
                    rows={2}
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Poster / Banner URL</label>
                  <input
                    value={courseForm.posterUrl}
                    onChange={(e) => setCourseForm({ ...courseForm, posterUrl: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Instructor</label>
                    <input
                      value={courseForm.instructorName}
                      onChange={(e) => setCourseForm({ ...courseForm, instructorName: e.target.value })}
                      placeholder="Instructor name"
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Duration</label>
                    <input
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                      placeholder="e.g. 8 weeks"
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Start Date</label>
                    <input
                      type="date"
                      value={courseForm.startDate}
                      onChange={(e) => setCourseForm({ ...courseForm, startDate: e.target.value })}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">End Date</label>
                    <input
                      type="date"
                      value={courseForm.endDate}
                      onChange={(e) => setCourseForm({ ...courseForm, endDate: e.target.value })}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Capacity</label>
                    <input
                      type="number"
                      value={courseForm.capacity}
                      onChange={(e) => setCourseForm({ ...courseForm, capacity: e.target.value })}
                      placeholder="e.g. 30"
                      min="1"
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Status</label>
                    <select
                      value={courseForm.status}
                      onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value as CourseStatus })}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowCourseModal(false)}
                  disabled={savingCourse}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: savingCourse ? 1 : 1.02 }}
                  whileTap={{ scale: savingCourse ? 1 : 0.98 }}
                  onClick={handleSaveCourse}
                  disabled={savingCourse}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingCourse ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingCourse ? 'Update Course' : 'Create Course'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Module Modal */}
      <AnimatePresence>
        {showModuleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowModuleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ background: '#1A1A2E' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {editingModule ? 'Edit Module' : 'Add Module'}
                  </h3>
                  {selectedCourse && (
                    <p className="text-xs text-white/40 mt-0.5">to: {selectedCourse.name}</p>
                  )}
                </div>
                <button onClick={() => setShowModuleModal(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Module Title *</label>
                  <input
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    placeholder="e.g. Introduction to Mindfulness"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Brief Description</label>
                  <textarea
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    placeholder="Short description of this module..."
                    rows={2}
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Poster / Banner URL</label>
                  <input
                    value={moduleForm.posterUrl}
                    onChange={(e) => setModuleForm({ ...moduleForm, posterUrl: e.target.value })}
                    placeholder="https://example.com/poster.jpg"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Quiz Link (optional)</label>
                    <input
                      value={moduleForm.quizLink}
                      onChange={(e) => setModuleForm({ ...moduleForm, quizLink: e.target.value })}
                      placeholder="https://forms.gle/..."
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Feedback Link (optional)</label>
                    <input
                      value={moduleForm.feedbackLink}
                      onChange={(e) => setModuleForm({ ...moduleForm, feedbackLink: e.target.value })}
                      placeholder="https://forms.gle/..."
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Duration (optional)</label>
                    <input
                      value={moduleForm.duration}
                      onChange={(e) => setModuleForm({ ...moduleForm, duration: e.target.value })}
                      placeholder="e.g. 2 hours"
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Order / Sequence</label>
                    <input
                      type="number"
                      value={moduleForm.order}
                      onChange={(e) => setModuleForm({ ...moduleForm, order: e.target.value })}
                      placeholder="0"
                      min="0"
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowModuleModal(false)}
                  disabled={savingModule}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: savingModule ? 1 : 1.02 }}
                  whileTap={{ scale: savingModule ? 1 : 0.98 }}
                  onClick={handleSaveModule}
                  disabled={savingModule}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingModule ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingModule ? 'Update Module' : 'Add Module'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && eventToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden"
              style={{ background: '#1A1A2E' }}
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-red-500/5">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Cancel Event</h3>
                  <p className="text-xs text-white/50">Event will be marked as cancelled</p>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-sm text-white/70 mb-2">
                  Are you sure you want to cancel this event?
                </p>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 mb-4">
                  <p className="text-sm font-semibold text-white">{eventToDelete.title}</p>
                  <p className="text-xs text-white/40 mt-1">Event will be marked as cancelled but registration data will be preserved</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-blue-400">
                    ℹ️ Students who registered will see this event as "Cancelled" in their dashboard
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEventToDelete(null);
                  }}
                  disabled={deleting !== null}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: deleting ? 1 : 1.02 }}
                  whileTap={{ scale: deleting ? 1 : 0.98 }}
                  onClick={confirmDelete}
                  disabled={deleting !== null}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Cancel Event
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
