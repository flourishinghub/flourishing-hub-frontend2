'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface VideoModalProps {
  showVideoModal: boolean;
  setShowVideoModal: (v: boolean) => void;
  videoForm: { title: string; description: string; youtubeUrl: string; thumbnailUrl: string; duration: string; category: string; tags: string };
  setVideoForm: (form: { title: string; description: string; youtubeUrl: string; thumbnailUrl: string; duration: string; category: string; tags: string }) => void;
  handleSaveVideo: () => void;
  savingVideo: boolean;
}

export default function VideoModal({
  showVideoModal,
  setShowVideoModal,
  videoForm,
  setVideoForm,
  handleSaveVideo,
  savingVideo,
}: VideoModalProps) {
  return (
    <AnimatePresence>
      {showVideoModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowVideoModal(false)}
        >
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: '#1A1A2E' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-base font-semibold text-white">Add Video</h3>
              <button onClick={() => setShowVideoModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Title *', key: 'title', placeholder: 'e.g. Managing Exam Stress' },
                { label: 'YouTube URL *', key: 'youtubeUrl', placeholder: 'https://youtu.be/...' },
                { label: 'Description', key: 'description', placeholder: 'Short description…' },
                { label: 'Duration', key: 'duration', placeholder: 'e.g. 12:30' },
                { label: 'Thumbnail URL (optional)', key: 'thumbnailUrl', placeholder: 'https://...' },
                { label: 'Tags (comma-separated)', key: 'tags', placeholder: 'stress, meditation, focus' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">{f.label}</label>
                  <input value={(videoForm as any)[f.key]} onChange={e => setVideoForm({ ...videoForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder} className="input-dark w-full px-4 py-2.5 rounded-xl text-sm" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Category</label>
                <select value={videoForm.category} onChange={e => setVideoForm({ ...videoForm, category: e.target.value })} className="input-dark w-full px-4 py-2.5 rounded-xl text-sm">
                  <option value="WELLNESS">Wellness</option>
                  <option value="MENTORSHIP">Mentorship</option>
                  <option value="LEADERSHIP">Leadership</option>
                </select>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowVideoModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10">Cancel</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSaveVideo} disabled={savingVideo}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                {savingVideo ? 'Saving…' : 'Add Video'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
