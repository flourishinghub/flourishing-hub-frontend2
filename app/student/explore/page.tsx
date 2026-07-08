'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, Clock, Calendar, CheckCircle, Lock,
  ChevronRight, Loader2, Star, Layers,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiCall } from '@/lib/api';
import type { AuthPayload } from '@/types';
import toast from 'react-hot-toast';

export default function ExplorePage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) setUser(JSON.parse(cachedUser));

        const [coursesRes, registrationsRes] = await Promise.all([
          apiCall('/courses?status=ACTIVE'),
          apiCall('/registrations/me').catch(() => ({ data: [] })),
        ]);

        const allCourses: any[] = coursesRes.data || [];
        setCourses(allCourses);

        // Determine which courses the student is already enrolled in
        // by checking if they have a registration for any event in each course
        const userRegistrations: any[] = registrationsRes.data || [];
        const registeredEventIds = new Set(
          userRegistrations
            .filter((r: any) => r.status === 'REGISTERED' || r.status === 'ATTENDED')
            .map((r: any) => r.eventId)
        );

        // For each optional course, check if student has registrations via course analytics
        // (fired concurrently instead of one-at-a-time to avoid N sequential round trips)
        const coursesToCheck = allCourses.filter((c: any) => !c.isCompulsory && c._count?.events > 0);
        const enrolledResults = await Promise.all(
          coursesToCheck.map(async (course: any) => {
            try {
              const analyticsRes = await apiCall(`/courses/${course.id}/analytics`);
              const courseEvents: any[] = analyticsRes.data?.moduleStats?.flatMap((m: any) => m.recentWorkshops) || [];
              return courseEvents.some((ev: any) => registeredEventIds.has(ev.id)) ? course.id : null;
            } catch {
              return null;
            }
          })
        );
        setEnrolledCourseIds(new Set(enrolledResults.filter((id): id is string => id !== null)));
      } catch (error) {
        console.error('Failed to load courses:', error);
        toast.error('Failed to load course catalog');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelfEnroll = async (courseId: string, courseName: string) => {
    setEnrolling(courseId);
    try {
      const res = await apiCall(`/courses/${courseId}/self-enroll`, { method: 'POST' });
      if (res.success) {
        setEnrolledCourseIds(prev => { const s = new Set(Array.from(prev)); s.add(courseId); return s; });
        toast.success(`Enrolled in "${courseName}" — ${res.data?.workshopCount || 0} workshops added to your schedule`);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Enrollment failed. Please try again.');
    } finally {
      setEnrolling(null);
    }
  };

  const optionalCourses = courses.filter((c: any) => !c.isCompulsory);
  const compulsoryCourses = courses.filter((c: any) => c.isCompulsory);

  return (
    <DashboardLayout user={user} loading={loading}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Explore <span className="gradient-text">Course Bundles</span>
        </h1>
        <p className="text-sm text-white/50 mt-1">Browse available workshop tracks and register for the ones that interest you</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No active course bundles available</p>
          <p className="text-xs text-white/30 mt-1">Check back later for new offerings</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Optional Course Bundles */}
          {optionalCourses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-white">Optional Bundles</h2>
                <span className="text-xs text-white/40 ml-1">— Browse and register for tracks that interest you</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {optionalCourses.map((course: any, i: number) => {
                  const isEnrolled = enrolledCourseIds.has(course.id);
                  const isEnrollingThis = enrolling === course.id;
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card rounded-2xl overflow-hidden flex flex-col"
                      style={isEnrolled ? { border: '1px solid rgba(16,185,129,0.3)' } : {}}
                    >
                      {/* Course poster / gradient header */}
                      <div
                        className="h-28 relative flex items-end p-4"
                        style={{
                          background: course.posterUrl
                            ? `url(${course.posterUrl}) center/cover`
                            : 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))',
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="relative z-10 flex items-center gap-2">
                          {isEnrolled && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[10px] font-bold">
                              <CheckCircle className="w-3 h-3" /> Enrolled
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-sm font-bold text-white mb-1 leading-tight">{course.name}</h3>
                        <p className="text-xs text-white/50 line-clamp-2 mb-3 flex-1">{course.description}</p>

                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {course._count?.events > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                              <Calendar className="w-3 h-3 text-primary" />
                              {course._count.events} workshop{course._count.events !== 1 ? 's' : ''}
                            </span>
                          )}
                          {course.duration && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {course.duration}
                            </span>
                          )}
                          {course.instructorName && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                              <Users className="w-3 h-3 text-blue-400" />
                              {course.instructorName}
                            </span>
                          )}
                          {course.capacity && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                              <Star className="w-3 h-3 text-yellow-400" />
                              {course.enrolledCount}/{course.capacity} seats
                            </span>
                          )}
                        </div>

                        {/* Register button */}
                        {isEnrolled ? (
                          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Registered for all workshops
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelfEnroll(course.id, course.name)}
                            disabled={isEnrollingThis}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all text-sm font-semibold disabled:opacity-60"
                          >
                            {isEnrollingThis ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</>
                            ) : (
                              <><ChevronRight className="w-4 h-4" /> Register Bundle</>
                            )}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Compulsory Bundles */}
          {compulsoryCourses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-semibold text-white">Compulsory Bundles</h2>
                <span className="text-xs text-white/40 ml-1">— Assigned by admin, no action needed</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {compulsoryCourses.map((course: any, i: number) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-2xl overflow-hidden"
                    style={{ border: '1px solid rgba(245,158,11,0.2)' }}
                  >
                    <div
                      className="h-20 relative"
                      style={{
                        background: course.posterUrl
                          ? `url(${course.posterUrl}) center/cover`
                          : 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.2))',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/80 text-white text-[10px] font-bold">
                          Required
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-white mb-1">{course.name}</h3>
                      <p className="text-xs text-white/50 line-clamp-2 mb-3">{course.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {course._count?.events > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                            <Calendar className="w-3 h-3 text-primary" />
                            {course._count.events} workshop{course._count.events !== 1 ? 's' : ''}
                          </span>
                        )}
                        {course.instructorName && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                            <Users className="w-3 h-3 text-blue-400" />
                            {course.instructorName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/20 text-amber-400/70 text-xs">
                        <Lock className="w-3 h-3 shrink-0" />
                        Auto-enrolled by admin — appears on your dashboard
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </DashboardLayout>
  );
}
