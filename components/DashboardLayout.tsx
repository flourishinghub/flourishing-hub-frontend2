'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { getStoredUser } from '@/lib/auth';
import { apiCall } from '@/lib/api';
import type { AuthPayload, Notification } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: AuthPayload | null;
  loading?: boolean;
}

export default function DashboardLayout({ children, user: propUser, loading }: DashboardLayoutProps) {
  const [user, setUser] = useState<AuthPayload | null>(propUser || null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiCall('/notifications');
      const raw = res.data?.notifications || [];
      setNotifications(raw.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        read: n.isRead,
        type: n.type?.toLowerCase() || 'info',
      })));
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await apiCall('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      return;
    }
    if (loading) return;
    const stored = getStoredUser();
    if (!stored) { router.push('/login'); return; }
    setUser(stored);
  }, [router, propUser, loading]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Re-fetch every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent animate-pulse" />
          <p className="text-sm text-white/40 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dark">
      <Sidebar
        role={user.role}
        userName={user.name}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          user={user}
          notifications={notifications}
          onMarkAllRead={markAllNotificationsRead}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
