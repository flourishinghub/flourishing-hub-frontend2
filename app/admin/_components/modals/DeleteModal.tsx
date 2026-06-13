'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteModalProps {
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  eventToDelete: { id: string; title: string } | null;
  setEventToDelete: (v: { id: string; title: string } | null) => void;
  confirmDelete: () => void;
  deleting: string | null;
}

export default function DeleteModal({
  showDeleteModal,
  setShowDeleteModal,
  eventToDelete,
  setEventToDelete,
  confirmDelete,
  deleting,
}: DeleteModalProps) {
  return (
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
                  ℹ️ Students who registered will see this event as &quot;Cancelled&quot; in their dashboard
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
  );
}
