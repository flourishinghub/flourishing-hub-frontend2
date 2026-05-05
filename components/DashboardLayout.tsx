'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { getStoredUser } from '@/lib/auth';
import {
  studentNotifications, instructorNotifications,
  volunteerNotifications, adminNotifications,
} from '@/lib/mockData';
import type { AuthPayload, UserRole, Notification } from '@/types';

function getNotifications(role: UserRole): Notification[] {
  switch (role) {
    case 'student': return studentNotifications;
    case 'instructor': return instructorNotifications;
    case 'volunteer': return volunteerNotifications;
    case 'admin': return adminNotifications;
    default: return [];
  }
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: AuthPayload | null;
  loading?: boolean;
}

export default function DashboardLayout({ children, user: propUser, loading }: DashboardLayoutProps) {
  const [user, setUser] = useState<AuthPayload | null>(propUser || null);
  const router = useRouter();

  useEffect(() => {
    if (propUser) {
      console.log("🔄 DashboardLayout: Received prop user:", propUser.name);
      setUser(propUser);
      return;
    }
    
    // Don't redirect if we're still loading (propUser might come later)
    if (loading) {
      console.log("🔄 DashboardLayout: Still loading, waiting for prop user");
      return;
    }
    
    // Only check stored user as fallback if not loading and no prop user
    const stored = getStoredUser();
    if (!stored) { 
      console.log("🔄 DashboardLayout: No stored user found, redirecting to login");
      router.push('/login'); 
      return; 
    }
    console.log("🔄 DashboardLayout: Using stored user:", stored.name);
    setUser(stored);
  }, [router, propUser, loading]);

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

  const notifications = getNotifications(user.role);

  return (
    <div className="flex h-screen overflow-hidden bg-dark">
      <Sidebar role={user.role} userName={user.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} notifications={notifications} />
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
