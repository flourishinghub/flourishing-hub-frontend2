'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, FileSpreadsheet, Users, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BatchUploadModalProps {
  show: boolean;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface FileResult {
  fileName: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  matched?: number;
  stored?: number;
  skipped?: number;
  errors?: any[];
  errorMessage?: string;
}

export default function BatchUploadModal({ show, onClose }: BatchUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileResults, setFileResults] = useState<FileResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (!show) { setFiles([]); setFileResults([]); setAllDone(false); }
    if (show) fetchStats();
  }, [show]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/batch-assignments/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`${API_BASE}/batch-assignments/template`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'batch_assignment_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template');
    }
  };

  const handleFilesChange = (selected: FileList | null) => {
    if (!selected) return;
    const newFiles = Array.from(selected);
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const unique = newFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
    setFileResults([]);
    setAllDone(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileResults([]);
    setAllDone(false);
  };

  const handleUploadAll = async () => {
    if (!files.length) return;
    setUploading(true);
    setAllDone(false);

    const results: FileResult[] = files.map(f => ({ fileName: f.name, status: 'pending' }));
    setFileResults([...results]);

    let totalMatched = 0, totalStored = 0;

    for (let i = 0; i < files.length; i++) {
      results[i].status = 'uploading';
      setFileResults([...results]);

      try {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await fetch(`${API_BASE}/batch-assignments/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Upload failed');

        results[i] = {
          fileName: files[i].name,
          status: 'done',
          matched: data.data.matched,
          stored: data.data.stored,
          skipped: data.data.skipped,
          errors: data.data.errors
        };
        totalMatched += data.data.matched || 0;
        totalStored += data.data.stored || 0;
      } catch (err: any) {
        results[i] = { fileName: files[i].name, status: 'error', errorMessage: err.message };
      }

      setFileResults([...results]);
    }

    setUploading(false);
    setAllDone(true);
    fetchStats();
    toast.success(`${files.length} files processed — ${totalMatched} matched, ${totalStored} stored`, { duration: 5000 });
  };

  const totalMatched = fileResults.reduce((s, r) => s + (r.matched || 0), 0);
  const totalStored = fileResults.reduce((s, r) => s + (r.stored || 0), 0);
  const doneCount = fileResults.filter(r => r.status === 'done' || r.status === 'error').length;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && !uploading && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ background: '#1A1A2E' }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Upload Student Batch Data</h2>
                  <p className="text-xs text-white/40 mt-0.5">Upload multiple files at once</p>
                </div>
              </div>
              {!uploading && (
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-center">
                    <p className="text-xl font-bold text-white">{stats.total}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Total Records</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-400">{stats.matched}</p>
                    <p className="text-[10px] text-emerald-400/60 mt-0.5">Matched</p>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                    <p className="text-xl font-bold text-amber-400">{stats.pending}</p>
                    <p className="text-[10px] text-amber-400/60 mt-0.5">Pending Signup</p>
                  </div>
                </div>
              )}

              {/* Batch breakdown */}
              {stats?.byBatch?.length > 0 && (
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">By Batch</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.byBatch.map((b: any) => (
                      <span key={b.batchCode} className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-mono">
                        {b.batchCode} · {b.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Template download */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div>
                  <p className="text-xs font-semibold text-white">Column format</p>
                  <p className="text-[10px] text-white/40 mt-0.5 font-mono">email · roll_no · batch_code · name · dept · programme · year · section</p>
                </div>
                <button onClick={handleDownloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-xs font-medium shrink-0">
                  <Download className="w-3.5 h-3.5" /> Template
                </button>
              </div>

              {/* File drop zone */}
              <div>
                <div
                  className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => !uploading && document.getElementById('batch-multi-input')?.click()}
                >
                  <FileSpreadsheet className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/50 text-sm font-medium">Click to select files</p>
                  <p className="text-white/30 text-xs mt-1">Multiple .csv or .xlsx files — select all at once</p>
                  <input
                    id="batch-multi-input"
                    type="file"
                    accept=".csv,.xlsx"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesChange(e.target.files)}
                  />
                </div>
              </div>

              {/* Selected files list */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{files.length} Files Selected</p>
                    {!uploading && allDone && (
                      <p className="text-xs text-emerald-400">{doneCount}/{files.length} processed</p>
                    )}
                    {uploading && (
                      <p className="text-xs text-primary">{doneCount}/{files.length} done...</p>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {files.map((f, i) => {
                      const result = fileResults[i];
                      return (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                          <FileSpreadsheet className="w-4 h-4 text-white/30 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate">{f.name}</p>
                            {result?.status === 'done' && (
                              <p className="text-[10px] text-emerald-400 mt-0.5">
                                ✅ {result.matched} matched · {result.stored} stored
                                {(result.skipped || 0) > 0 && <span className="text-red-400"> · {result.skipped} skipped</span>}
                              </p>
                            )}
                            {result?.status === 'error' && (
                              <p className="text-[10px] text-red-400 mt-0.5">❌ {result.errorMessage}</p>
                            )}
                            {result?.status === 'uploading' && (
                              <p className="text-[10px] text-primary mt-0.5">Uploading...</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {result?.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                            {result?.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                            {result?.status === 'uploading' && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                            {!uploading && !result && (
                              <button onClick={() => removeFile(i)} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-red-400 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary after all done */}
                  {allDone && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                        <p className="text-lg font-bold text-emerald-400">{totalMatched}</p>
                        <p className="text-[10px] text-emerald-400/60">Total Matched</p>
                      </div>
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                        <p className="text-lg font-bold text-amber-400">{totalStored}</p>
                        <p className="text-[10px] text-amber-400/60">Total Stored</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2 flex gap-3 shrink-0 border-t border-white/5">
              <button
                onClick={onClose}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-40"
              >
                {allDone ? 'Close' : 'Cancel'}
              </button>
              <button
                disabled={!files.length || uploading}
                onClick={handleUploadAll}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing {doneCount + 1}/{files.length}...</>
                  : <><Upload className="w-4 h-4" /> Upload {files.length > 0 ? `${files.length} Files` : 'Files'}</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
