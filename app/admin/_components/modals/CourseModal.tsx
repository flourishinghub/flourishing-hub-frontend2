'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

type CourseStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

interface CourseFormData {
  name: string;
  description: string;
  posterUrl: string;
  duration: string;
  instructorName: string;
  status: CourseStatus;
  isCompulsory: boolean;
  startDate: string;
  endDate: string;
  capacity: string;
}

interface CourseModalProps {
  showCourseModal: boolean;
  setShowCourseModal: (v: boolean) => void;
  editingCourse: any | null;
  courseForm: CourseFormData;
  setCourseForm: (form: CourseFormData) => void;
  handleSaveCourse: () => void;
  savingCourse: boolean;
}

export default function CourseModal({
  showCourseModal,
  setShowCourseModal,
  editingCourse,
  courseForm,
  setCourseForm,
  handleSaveCourse,
  savingCourse,
}: CourseModalProps) {
  return (
    <AnimatePresence>
      {showCourseModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setCourseForm({ ...courseForm, isCompulsory: !courseForm.isCompulsory })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${courseForm.isCompulsory ? 'bg-amber-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${courseForm.isCompulsory ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/80">Compulsory Bundle</p>
                      <p className="text-[10px] text-white/40">Students are auto-enrolled to all workshops</p>
                    </div>
                  </label>
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
  );
}
