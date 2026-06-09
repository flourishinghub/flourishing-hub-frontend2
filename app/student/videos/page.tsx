'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Search, Filter, Eye, Clock, Tag, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiCall } from '@/lib/api';
import toast from 'react-hot-toast';

type VideoCategory = 'ALL' | 'MENTORSHIP' | 'LEADERSHIP' | 'WELLNESS';

interface Video {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  duration: string;
  category: 'MENTORSHIP' | 'LEADERSHIP' | 'WELLNESS';
  tags: string[];
  viewCount: number;
}

function getYoutubeEmbedId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function getYoutubeThumbnail(url: string): string {
  const id = getYoutubeEmbedId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
}

const categoryColors: Record<string, string> = {
  MENTORSHIP: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  LEADERSHIP: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  WELLNESS: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export default function StudentVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<VideoCategory>('ALL');
  const [search, setSearch] = useState('');
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos();
  }, [category]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = category !== 'ALL' ? `?category=${category}` : '';
      const res = await apiCall(`/videos${params}`);
      setVideos(res.data || []);
    } catch {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (video: Video) => {
    setPlayingVideo(video);
    try {
      await apiCall(`/videos/${video.id}/view`, { method: 'POST' });
    } catch {}
  };

  const filtered = videos.filter(v =>
    search === '' ||
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.description.toLowerCase().includes(search.toLowerCase()) ||
    v.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Video Library</h1>
          <p className="text-sm text-white/50 mt-1">Mentorship, leadership, and wellness videos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search videos…"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'MENTORSHIP', 'LEADERSHIP', 'WELLNESS'] as VideoCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                category === cat
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <Play className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No videos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(video => {
            const thumb = video.thumbnailUrl || getYoutubeThumbnail(video.youtubeUrl);
            return (
              <motion.div
                key={video.id}
                whileHover={{ y: -3 }}
                className="glass-card rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => handlePlay(video)}
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                  {thumb && (
                    <img src={thumb} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                  <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryColors[video.category]}`}>
                    {video.category.charAt(0) + video.category.slice(1).toLowerCase()}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{video.title}</h3>
                  <p className="text-xs text-white/50 mb-3 line-clamp-2">{video.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-white/30">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{video.duration}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.viewCount} views</span>
                  </div>
                  {video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {video.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPlayingVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl glass-card rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white line-clamp-1">{playingVideo.title}</h3>
                <button onClick={() => setPlayingVideo(null)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeEmbedId(playingVideo.youtubeUrl)}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-white/60">{playingVideo.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
