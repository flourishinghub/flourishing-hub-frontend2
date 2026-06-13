'use client';

import { motion } from 'framer-motion';
import { Play, Plus, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface VideosTabProps {
  videos: any[];
  videosLoading: boolean;
  setShowVideoModal: (v: boolean) => void;
  handleDeleteVideo: (videoId: string) => void;
  courses: any[];
  bulkEnrollCourseId: string;
  setBulkEnrollCourseId: (v: string) => void;
  bulkEnrollEmails: string;
  setBulkEnrollEmails: (v: string) => void;
  bulkEnrolling: boolean;
  handleBulkEnroll: () => void;
}

export default function VideosTab({
  videos,
  videosLoading,
  setShowVideoModal,
  handleDeleteVideo,
  courses,
  bulkEnrollCourseId,
  setBulkEnrollCourseId,
  bulkEnrollEmails,
  setBulkEnrollEmails,
  bulkEnrolling,
  handleBulkEnroll,
}: VideosTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Video Library</h3>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowVideoModal(true)} className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Video
        </motion.button>
      </div>

      {/* Bulk Enroll Section */}
      <div className="glass-card rounded-2xl p-5 border border-amber-500/20">
        <h4 className="text-sm font-semibold text-white mb-1">Bundle Auto-Enroll (Type 1 — Compulsory)</h4>
        <p className="text-xs text-white/50 mb-3">Upload a CSV roster or paste emails to enroll students into all workshops of a compulsory bundle</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Course / Bundle</label>
            <select value={bulkEnrollCourseId} onChange={e => setBulkEnrollCourseId(e.target.value)} className="input-dark w-full px-3 py-2 rounded-xl text-sm">
              <option value="">— Select Course —</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.isCompulsory ? ' ★' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Student Emails (one per line, or upload CSV)</label>
            {/* CSV Upload */}
            <label className="flex items-center gap-2 cursor-pointer mb-2 w-fit px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs text-white/60 hover:text-white">
              <Upload className="w-3.5 h-3.5" />
              Upload CSV / Excel
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const text = evt.target?.result as string || '';
                    // Extract all email-like strings from CSV
                    const emails = text
                      .split(/[\r\n,;\t]+/)
                      .map(s => s.trim().replace(/^["']|["']$/g, ''))
                      .filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
                    if (emails.length > 0) {
                      setBulkEnrollEmails(emails.join('\n'));
                      toast.success(`${emails.length} email(s) loaded from file`);
                    } else {
                      toast.error('No valid emails found in file');
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>
            <textarea
              value={bulkEnrollEmails}
              onChange={e => setBulkEnrollEmails(e.target.value)}
              placeholder="student1@iitb.ac.in&#10;student2@iitb.ac.in"
              rows={3}
              className="input-dark w-full px-3 py-2 rounded-xl text-sm resize-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleBulkEnroll}
            disabled={bulkEnrolling}
            className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {bulkEnrolling ? 'Enrolling…' : 'Auto-Enroll to All Workshops'}
          </motion.button>
          {bulkEnrollEmails.trim() && (
            <span className="text-xs text-white/40">
              {bulkEnrollEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).length} valid email(s)
            </span>
          )}
        </div>
      </div>

      {videosLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : videos.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Play className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No videos yet</p>
          <p className="text-xs text-white/25 mt-1">Click &quot;Add Video&quot; to add the first one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v: any) => (
            <div key={v.id} className="glass-card rounded-xl overflow-hidden">
              <div className="relative h-36 bg-gradient-to-br from-primary/20 to-accent/20">
                {(v.thumbnailUrl || v.youtubeUrl) && (
                  <img
                    src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1]}/mqdefault.jpg`}
                    alt={v.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                  v.category === 'WELLNESS' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  v.category === 'MENTORSHIP' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  'bg-purple-500/20 text-purple-400 border-purple-500/30'
                }`}>{v.category.charAt(0) + v.category.slice(1).toLowerCase()}</div>
              </div>
              <div className="p-3">
                <h4 className="text-xs font-semibold text-white mb-1 line-clamp-1">{v.title}</h4>
                <p className="text-[10px] text-white/40 mb-2 line-clamp-1">{v.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">{v.duration} · {v.viewCount} views</span>
                  <button onClick={() => handleDeleteVideo(v.id)} className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
