'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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
  const count = parseInt(courseForm.workshopCount) || 0;

  const handleCountChange = (val: string) => {
    const n = Math.max(0, parseInt(val) || 0);
    const newTopics = Array.from({ length: n }, (_, i) => courseForm.workshopTopics[i] ?? '');
    setCourseForm({ ...courseForm, workshopCount: val, workshopTopics: newTopics });
  };

  const handleTopicChange = (idx: number, val: string) => {
    const newTopics = [...courseForm.workshopTopics];
    newTopics[idx] = val;
    setCourseForm({ ...courseForm, workshopTopics: newTopics });
  };

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
            style={{ background: 'rgb(var(--color-card))' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-base font-semibold text-white">
                {editingCourse ? 'Edit Course' : 'Create Course Template'}
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Course Name *</label>
                  <input
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    placeholder="e.g. Wellness Program"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Course Code</label>
                  <input
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. WELL101"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm font-mono"
                  />
                </div>
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
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Duration <span className="text-white/30">(optional)</span></label>
                  <input
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                    placeholder="e.g. 8 weeks"
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

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setCourseForm({ ...courseForm, isCompulsory: !courseForm.isCompulsory })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${courseForm.isCompulsory ? 'bg-amber-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#ffffff] shadow transition-transform ${courseForm.isCompulsory ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/80">Compulsory Bundle</p>
                    <p className="text-[10px] text-white/40">Students are auto-enrolled to all workshops</p>
                  </div>
                </label>
              </div>

              {/* Workshop section — only for create */}
              {!editingCourse && (
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Number of Workshops</label>
                    <input
                      type="number"
                      min="0"
                      value={courseForm.workshopCount}
                      onChange={(e) => handleCountChange(e.target.value)}
                      placeholder="e.g. 4"
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>

                  {count > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 block">Workshop Topics</label>
                      {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-white/30 text-xs w-5 text-right shrink-0">{i + 1}.</span>
                          <input
                            value={courseForm.workshopTopics[i] ?? ''}
                            onChange={(e) => handleTopicChange(i, e.target.value)}
                            placeholder={`Workshop ${i + 1} topic`}
                            className="input-dark flex-1 px-4 py-2 rounded-xl text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                    <div className="w-4 h-4 border-2 border-[#ffffff] border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingCourse ? 'Update Course' : 'Create Course Template'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
