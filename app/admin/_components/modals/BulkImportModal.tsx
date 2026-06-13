'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { apiCall } from '@/lib/api';
import toast from 'react-hot-toast';

interface BulkImportModalProps {
  showBulkImport: boolean;
  setShowBulkImport: (v: boolean) => void;
  bulkImportFile: File | null;
  setBulkImportFile: (file: File | null) => void;
  bulkImporting: boolean;
  setBulkImporting: (v: boolean) => void;
}

export default function BulkImportModal({
  showBulkImport,
  setShowBulkImport,
  bulkImportFile,
  setBulkImportFile,
  bulkImporting,
  setBulkImporting,
}: BulkImportModalProps) {
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
            className="w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: '#1A1A2E' }}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-white">Bulk Import Events</h2>
              </div>
              <button onClick={() => setShowBulkImport(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-white/60 text-sm">Upload a CSV or Excel file with event data. Download the template below to get started.</p>

              <button
                onClick={async () => {
                  try {
                    await apiCall('/imports/templates/EVENTS');
                    toast.success('Template downloaded');
                  } catch {
                    toast.error('Template not available');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-all text-sm"
              >
                <Download className="w-4 h-4" /> Download Template
              </button>

              <div
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => document.getElementById('bulk-import-input')?.click()}
              >
                <FileSpreadsheet className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-sm">{bulkImportFile ? bulkImportFile.name : 'Click to select file (.csv or .xlsx)'}</p>
                <input
                  id="bulk-import-input"
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => setBulkImportFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowBulkImport(false); setBulkImportFile(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button
                disabled={!bulkImportFile || bulkImporting}
                onClick={async () => {
                  if (!bulkImportFile) return;
                  setBulkImporting(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', bulkImportFile);
                    const token = localStorage.getItem('token');
                    const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/imports/upload`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    });
                    const uploadData = await uploadRes.json();
                    if (!uploadData.success) throw new Error(uploadData.message);
                    await apiCall('/imports', { method: 'POST', body: JSON.stringify({ type: 'EVENTS', fileUrl: uploadData.data.fileUrl, fileName: bulkImportFile.name }) });
                    toast.success('Import job created! Events will be imported shortly.');
                    setShowBulkImport(false);
                    setBulkImportFile(null);
                  } catch (err: any) {
                    toast.error(err.message || 'Import failed');
                  } finally {
                    setBulkImporting(false);
                  }
                }}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkImporting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Import Events</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
