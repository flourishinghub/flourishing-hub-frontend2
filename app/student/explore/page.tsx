'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Heart, Users, Calendar, Star, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getCurrentUser } from '@/lib/api';
import type { AuthPayload } from '@/types';

export default function ExploreFHPage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <DashboardLayout user={user} loading={loading}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Compass className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-white">Explore Flourishing Hub</h1>
            <p className="text-sm text-white/50">Discover what makes our community special</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coming Soon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Coming Soon!</h2>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            We're working on something amazing for you to explore. This section will showcase the heart of Flourishing Hub - our community, values, and impact.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm text-white/70">Community Stories</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white/70">Meet the Team</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white/70">Success Stories</span>
            </div>
          </div>
        </motion.div>

        {/* Placeholder Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Our Mission</h3>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            Flourishing Hub is dedicated to fostering mental wellness and personal growth within the IIT Bombay community.
          </p>
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <span>Learn More</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Community</h3>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            Join a supportive community of students, instructors, and volunteers working together for mental wellness.
          </p>
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <span>Connect</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}