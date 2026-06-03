'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiCall } from '@/lib/api';
import toast from 'react-hot-toast';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  youtubeUrl: string;
  duration: string;
  category: 'MENTORSHIP' | 'LEADERSHIP' | 'WELLNESS';
  tags: string[];
  viewCount: number;
}

const CATEGORY_COLORS = {
  MENTORSHIP: {
    bg: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    text: 'text-purple-400'
  },
  LEADERSHIP: {
    bg: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    text: 'text-blue-400'
  },
  WELLNESS: {
    bg: 'from-teal-500/20 to-teal-500/5',
    border: 'border-teal-500/30',
    badge: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    text: 'text-teal-400'
  }
};

// Helper function to extract YouTube video ID and get thumbnail
const getYouTubeThumbnail = (url: string) => {
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
};

export default function VideosPage() {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'MENTORSHIP' | 'LEADERSHIP' | 'WELLNESS'>('ALL');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== 'ALL' ? `?category=${selectedCategory}` : '';
      const response = await apiCall(`/videos${params}`);
      setVideos(response.data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = async (video: Video) => {
    try {
      // Increment view count
      await apiCall(`/videos/${video.id}/view`, { method: 'POST' });
      // Open YouTube video
      window.open(video.youtubeUrl, '_blank');
    } catch (error) {
      console.error('Failed to track video view:', error);
      // Still open the video even if tracking fails
      window.open(video.youtubeUrl, '_blank');
    }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-2">
          Video <span className="gradient-text">Library</span>
        </h1>
        <p className="text-sm text-white/50">
          Explore our collection of educational videos on mindfulness, leadership, and wellness
        </p>
      </motion.div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`text-sm px-4 py-2 rounded-lg transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
          }`}
        >
          All Videos
        </button>
        <button
          onClick={() => setSelectedCategory('MENTORSHIP')}
          className={`text-sm px-4 py-2 rounded-lg transition-all ${
            selectedCategory === 'MENTORSHIP'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
          }`}
        >
          Mentorship
        </button>
        <button
          onClick={() => setSelectedCategory('LEADERSHIP')}
          className={`text-sm px-4 py-2 rounded-lg transition-all ${
            selectedCategory === 'LEADERSHIP'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
          }`}
        >
          Leadership
        </button>
        <button
          onClick={() => setSelectedCategory('WELLNESS')}
          className={`text-sm px-4 py-2 rounded-lg transition-all ${
            selectedCategory === 'WELLNESS'
              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
          }`}
        >
          Wellness
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12 text-white/50">Loading videos...</div>
      ) : (
        <>
          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
              const colors = CATEGORY_COLORS[video.category];
              const thumbnail = video.thumbnailUrl || getYouTubeThumbnail(video.youtubeUrl);
              
              return (
                <motion.div
                  key={video.id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleVideoClick(video)}
                  className={`glass-card rounded-2xl overflow-hidden cursor-pointer border ${colors.border} relative group`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-50`} />
                  
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-black/50 overflow-hidden">
                    {thumbnail ? (
                      <img 
                        src={thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <Play className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all flex items-center justify-center">
                        <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                      </div>
                    </div>
                    
                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {video.duration}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-4">
                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-1 rounded-full border ${colors.badge}`}>
                        {video.category}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    
                    <p className="text-xs text-white/60 mb-3 line-clamp-2">
                      {video.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {video.tags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {videos.length === 0 && (
            <div className="text-center py-12 text-white/30">
              No videos found in this category
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
