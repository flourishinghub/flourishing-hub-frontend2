'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import type { AuthPayload, Notification } from '@/types';
import NotificationDropdown from '@/components/NotificationDropdown';
import ProfileDropdown from '@/components/ProfileDropdown';
import Logo from '@/components/Logo';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface NavbarProps {
  user: AuthPayload;
  notifications?: Notification[];
  onLogout?: () => void;
  onMarkAllRead?: () => void;
  onMenuClick?: () => void;
}

export default function Navbar({ user, notifications = [], onLogout, onMarkAllRead, onMenuClick }: NavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  // Get role-specific dashboard URL
  const getDashboardUrl = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'instructor':
        return '/instructor';
      case 'volunteer':
        return '/volunteer';
      case 'associate-instructor':
        return '/associate-instructor';
      case 'student':
      default:
        return '/student';
    }
  };

  const dashboardUrl = getDashboardUrl(user.role);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-16 flex items-center justify-between px-3 sm:px-6 border-b border-white/5 bg-[#0F0F1A]/80 backdrop-blur-xl sticky top-0 z-30"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>
        <Link href={dashboardUrl} className="flex items-center gap-2.5">
          <Logo className="w-8 h-8 rounded-xl" />
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">Flourishing Hub</p>
            <p className="text-[10px] text-white/40 leading-none mt-0.5">IIT Bombay</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <ThemeSwitcher />

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { const opening = !notifOpen; setNotifOpen(opening); setProfileOpen(false); if (opening && unread > 0) onMarkAllRead?.(); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unread}
              </span>
            )}
          </motion.button>
          <NotificationDropdown
            notifications={notifications}
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
          />
        </div>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-glow-sm"
          >
            {getInitials(user.name)}
          </motion.button>
          <ProfileDropdown
            user={user}
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
            onLogout={onLogout}
          />
        </div>
      </div>
    </motion.header>
  );
}
