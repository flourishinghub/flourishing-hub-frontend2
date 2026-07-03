'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, FileSpreadsheet, Users, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BatchUploadModalProps {
  show: boolean;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function BatchUploadModal({ show, onClose }: BatchUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!show) { setFile(null); setResult(null); }
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

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/batch-assignments/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Upload failed');
      setResult(data.data);
      fetchStats();
      toast.success(`Done! ${data.data.matched} matched, ${data.data.stored} stored for later`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ background: '#1A1A2E' }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Upload Student Batch Data</h2>
                  <p className="text-xs text-white/40 mt-0.5">Assign students to batches via Excel/CSV</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
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

              {/* Template */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Step 1 — Download Template</p>
                <div className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">Columns</p>
                  <p className="text-xs text-white/50 font-mono">email · roll_no · batch_code · name · department · programme · year · section</p>
                  <p className="text-[10px] text-white/30 mt-1.5">Required: <span className="text-white/50">batch_code</span> + at least one of <span className="text-white/50">email</span> or <span className="text-white/50">roll_no</span></p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-sm font-medium"
                >
                  <Download className="w-4 h-4" /> Download Template
                </button>
              </div>

              <div className="border-t border-white/5" />

              {/* Upload */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Step 2 — Upload Filled File</p>
                <div
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => document.getElementById('batch-upload-input')?.click()}
                >
                  <FileSpreadsheet className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">
                    {file ? file.name : 'Click to select file (.csv or .xlsx)'}
                  </p>
                  {file && <p className="text-xs text-white/30 mt-1">{(file.size / 1024).toFixed(1)} KB</p>}
                  <input
                    id="batch-upload-input"
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }}
                  />
                </div>
              </div>

              {/* Result */}
              {result && (
                <div className="rounded-xl border border-white/8 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-semibold text-white">Upload Complete</p>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-emerald-400">{result.matched}</p>
                      <p className="text-xs text-white/40">Matched & Updated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-amber-400">{result.stored}</p>
                      <p className="text-xs text-white/40">Stored for Later</p>
                    </div>
                  </div>
                  {result.errors?.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                        <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> {result.errors.length} rows skipped
                        </p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {result.errors.map((e: any, i: number) => (
                            <p key={i} className="text-[10px] text-red-300/70">Row {e.row}: {e.message}</p>
                          ))}
                        </div>
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
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                Close
              </button>
              <button
                disabled={!file || uploading}
                onClick={handleUpload}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                  : <><Upload className="w-4 h-4" /> Upload File</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
