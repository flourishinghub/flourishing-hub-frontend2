'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { apiCall } from '@/lib/api';
import toast from 'react-hot-toast';

interface BulkImportModalProps {
  showBulkImport: boolean;
  setShowBulkImport: (v: boolean) => void;
  bulkImportFile: File | null;
  setBulkImportFile: (file: File | null) => void;
  bulkImporting: boolean;
  setBulkImporting: (v: boolean) => void;
  courses: any[];
}

const TEMPLATE_HEADERS = ['date', 'day', 'time', 'venue', 'tutorial/batch', 'instructor', 'workshop name'];

export default function BulkImportModal({
  showBulkImport,
  setShowBulkImport,
  bulkImportFile,
  setBulkImportFile,
  bulkImporting,
  setBulkImporting,
  courses,
}: BulkImportModalProps) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [description, setDescription] = useState('');

  // Reset when modal closes
  useEffect(() => {
    if (!showBulkImport) {
      setSelectedCourseId('');
      setModules([]);
      setSelectedModuleId('');
      setDescription('');
    }
  }, [showBulkImport]);

  // Fetch modules when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setModules([]);
      setSelectedModuleId('');
      setDescription('');
      return;
    }
    setLoadingModules(true);
    setSelectedModuleId('');
    setDescription('');
    apiCall(`/courses/${selectedCourseId}/modules`)
      .then(res => setModules(res?.data || []))
      .catch(() => toast.error('Failed to load workshops'))
      .finally(() => setLoadingModules(false));
  }, [selectedCourseId]);

  // Auto-fill description from selected module
  useEffect(() => {
    const mod = modules.find(m => m.id === selectedModuleId);
    setDescription(mod?.description || '');
  }, [selectedModuleId, modules]);

  const downloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event_schedule_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!bulkImportFile) return;
    setBulkImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', bulkImportFile);
      if (selectedCourseId) formData.append('courseId', selectedCourseId);
      if (selectedModuleId) formData.append('courseModuleId', selectedModuleId);
      const token = localStorage.getItem('token');
      const uploadRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/imports/upload`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }
      );
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.message);
      await apiCall('/imports', {
        method: 'POST',
        body: JSON.stringify({
          type: 'EVENTS',
          fileUrl: uploadData.data.fileUrl,
          fileName: bulkImportFile.name,
          courseId: selectedCourseId || null,
          courseModuleId: selectedModuleId || null,
        }),
      });
      toast.success('Import job created! Events will be imported shortly.');
      setShowBulkImport(false);
      setBulkImportFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setBulkImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {showBulkImport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowBulkImport(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ background: '#1A1A2E' }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-white">Bulk Import Events</h2>
              </div>
              <button onClick={() => setShowBulkImport(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Course + Workshop Selection */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Link to Course (Optional)</p>

                {/* Course Dropdown */}
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Course Name</label>
                  <div className="relative">
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm appearance-none pr-10"
                    >
                      <option value="">— Select a course —</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  </div>
                </div>

                {/* Workshop Dropdown — shown after course selected */}
                {selectedCourseId && (
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Workshop Title</label>
                    <div className="relative">
                      {loadingModules ? (
                        <div className="input-dark w-full px-4 py-2.5 rounded-xl text-sm text-white/30 flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border border-white/30 border-t-transparent rounded-full animate-spin" />
                          Loading workshops...
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                            className="input-dark w-full px-4 py-2.5 rounded-xl text-sm appearance-none pr-10"
                          >
                            <option value="">— Select a workshop —</option>
                            {modules.map((m, idx) => (
                              <option key={m.id} value={m.id}>{idx + 1}. {m.title}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        </>
                      )}
                    </div>
                    {modules.length === 0 && !loadingModules && (
                      <p className="text-xs text-white/30 mt-1">No workshops found for this course</p>
                    )}
                  </div>
                )}

                {/* Description — auto-filled from module */}
                {selectedModuleId && (
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">
                      Description <span className="text-white/30">(from workshop template)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="No description in workshop template"
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Download Template */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Schedule Template</p>
                <p className="text-white/50 text-xs">
                  Download the blank template, fill in the schedule, then upload below.
                </p>
                <div className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">Columns</p>
                  <p className="text-xs text-white/50 font-mono">{TEMPLATE_HEADERS.join(', ')}</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-sm font-medium"
                >
                  <Download className="w-4 h-4" /> Download Template
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Upload */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Upload Schedule</p>
                <div
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => document.getElementById('bulk-import-input')?.click()}
                >
                  <FileSpreadsheet className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">
                    {bulkImportFile ? bulkImportFile.name : 'Click to select file (.csv or .xlsx)'}
                  </p>
                  {bulkImportFile && (
                    <p className="text-xs text-white/30 mt-1">
                      {(bulkImportFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                  <input
                    id="bulk-import-input"
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={(e) => setBulkImportFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setShowBulkImport(false); setBulkImportFile(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!bulkImportFile || bulkImporting}
                onClick={handleImport}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkImporting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing...</>
                  : <><Upload className="w-4 h-4" /> Import Events</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
