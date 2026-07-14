'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Archive, Trash2, X } from 'lucide-react';
import { apiCall } from '@/lib/api';
import toast from 'react-hot-toast';

interface WipeEventsAndCoursesModalProps {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

const CONFIRM_PHRASE = 'DELETE ALL';
type Mode = 'delete' | 'archive';

export default function WipeEventsAndCoursesModal({ open, onClose, onDeleted }: WipeEventsAndCoursesModalProps) {
  const [mode, setMode] = useState<Mode>('delete');
  const [includeEvents, setIncludeEvents] = useState(true);
  const [includeCourses, setIncludeCourses] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  const hasScope = includeEvents || includeCourses;
  const canDelete = mode === 'delete' && hasScope && confirmText === CONFIRM_PHRASE;
  const canArchive = mode === 'archive' && hasScope;
  const canProceed = mode === 'delete' ? canDelete : canArchive;

  const reset = () => {
    setMode('delete');
    setIncludeEvents(true);
    setIncludeCourses(true);
    setConfirmText('');
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleProceed = async () => {
    if (!canProceed) return;
    setBusy(true);
    try {
      if (mode === 'delete') {
        const res = await apiCall('/admin/danger-zone/events-and-courses', {
          method: 'DELETE',
          body: { confirm: CONFIRM_PHRASE, deleteEvents: includeEvents, deleteCourses: includeCourses },
        });
        toast.success(res.message || 'Deleted');
      } else {
        const res = await apiCall('/admin/danger-zone/archive-events-and-courses', {
          method: 'POST',
          body: { archiveEvents: includeEvents, archiveCourses: includeCourses },
        });
        toast.success(res.message || 'Archived');
      }
      reset();
      onDeleted();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Action failed — please try again');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${mode === 'delete' ? 'border-red-500/30' : 'border-amber-500/30'}`}
            style={{ background: 'rgb(var(--color-card))' }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between gap-3 px-6 py-4 border-b border-white/5 ${mode === 'delete' ? 'bg-red-500/5' : 'bg-amber-500/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${mode === 'delete' ? 'bg-red-500/20 border-red-500/30' : 'bg-amber-500/20 border-amber-500/30'}`}>
                  {mode === 'delete'
                    ? <AlertTriangle className="w-5 h-5 text-red-400" />
                    : <Archive className="w-5 h-5 text-amber-400" />
                  }
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Events &amp; Courses</h3>
                  <p className="text-xs text-white/50">{mode === 'delete' ? 'Permanent — cannot be undone' : 'Reversible — hides without deleting'}</p>
                </div>
              </div>
              <button onClick={handleClose} disabled={busy} className="text-white/40 hover:text-white transition-colors disabled:opacity-40">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Mode toggle */}
              <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={() => setMode('delete')}
                  disabled={busy}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'delete' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button
                  onClick={() => setMode('archive')}
                  disabled={busy}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'archive' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              </div>

              {/* Scope checkboxes */}
              <div>
                <p className="text-xs font-medium text-white/60 mb-2">What to include</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEvents}
                      onChange={(e) => setIncludeEvents(e.target.checked)}
                      disabled={busy}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-white/80">Events (workshops, open sessions, registrations, attendance, quiz scores)</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCourses}
                      onChange={(e) => setIncludeCourses(e.target.checked)}
                      disabled={busy}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-white/80">Courses (templates and modules)</span>
                  </label>
                </div>
                {!hasScope && <p className="text-xs text-red-400 mt-2">Select at least one</p>}
              </div>

              {mode === 'delete' ? (
                <>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-xs text-red-400 leading-relaxed">
                      Permanently deletes the selected data above. Student and staff{' '}
                      <strong>accounts are not affected</strong>. There is no undo — consider Archive instead
                      if you might need this data again.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">
                      Type <span className="font-mono text-white">{CONFIRM_PHRASE}</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={CONFIRM_PHRASE}
                      disabled={busy}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm font-mono disabled:opacity-50"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs text-amber-400 leading-relaxed">
                    Marks the selected data as archived — it disappears from active lists but nothing is
                    deleted, and it can be restored later by changing its status back.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleClose}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: canProceed && !busy ? 1.02 : 1 }}
                whileTap={{ scale: canProceed && !busy ? 0.98 : 1 }}
                onClick={handleProceed}
                disabled={!canProceed || busy}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed border ${
                  mode === 'delete'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                }`}
              >
                {busy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#ffffff] border-t-transparent rounded-full animate-spin" />
                    {mode === 'delete' ? 'Deleting...' : 'Archiving...'}
                  </>
                ) : mode === 'delete' ? (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    Archive Selected
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
