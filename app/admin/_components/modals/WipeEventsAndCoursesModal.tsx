'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { apiCall } from '@/lib/api';
import toast from 'react-hot-toast';

interface WipeEventsAndCoursesModalProps {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

const CONFIRM_PHRASE = 'DELETE ALL';

export default function WipeEventsAndCoursesModal({ open, onClose, onDeleted }: WipeEventsAndCoursesModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const canDelete = confirmText === CONFIRM_PHRASE;

  const handleClose = () => {
    if (deleting) return;
    setConfirmText('');
    onClose();
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      const res = await apiCall('/admin/danger-zone/events-and-courses', {
        method: 'DELETE',
        body: { confirm: CONFIRM_PHRASE },
      });
      toast.success(res.message || 'All events and courses deleted');
      setConfirmText('');
      onDeleted();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete — please try again');
    } finally {
      setDeleting(false);
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
            className="w-full max-w-md rounded-2xl border border-red-500/30 shadow-2xl overflow-hidden"
            style={{ background: 'rgb(var(--color-card))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/5 bg-red-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Delete ALL Events &amp; Courses</h3>
                  <p className="text-xs text-white/50">This cannot be undone</p>
                </div>
              </div>
              <button onClick={handleClose} disabled={deleting} className="text-white/40 hover:text-white transition-colors disabled:opacity-40">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                <p className="text-xs text-red-400 leading-relaxed">
                  This permanently deletes <strong>every event</strong> (workshops, open sessions,
                  registrations, attendance, check-ins, quiz scores, feedback) and{' '}
                  <strong>every course</strong> (templates and modules). Student and staff{' '}
                  <strong>accounts are not affected</strong>. There is no undo.
                </p>
              </div>

              <label className="text-xs font-medium text-white/60 mb-1.5 block">
                Type <span className="font-mono text-white">{CONFIRM_PHRASE}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                disabled={deleting}
                className="input-dark w-full px-4 py-2.5 rounded-xl text-sm font-mono disabled:opacity-50"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleClose}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: canDelete && !deleting ? 1.02 : 1 }}
                whileTap={{ scale: canDelete && !deleting ? 0.98 : 1 }}
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#ffffff] border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Everything
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
