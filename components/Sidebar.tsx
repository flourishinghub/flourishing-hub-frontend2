'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';
import {
  LayoutDashboard, Calendar, Clock, History, Users, Video,
  Settings, Heart, ChevronLeft, ChevronRight, ClipboardList,
  Sparkles, LogOut, UserCheck, ShieldCheck, FileText, User, Compass, CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
import { logout } from '@/lib/auth';

interface NavItem { label: string; href: string; icon: React.ElementType }

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  student: [
    { label: 'Home', href: '/home', icon: Sparkles },
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'Events', href: '/student/events', icon: Calendar },
    { label: 'Attendance', href: '/student#attendance', icon: CheckCircle },
    { label: 'Videos', href: '/videos', icon: Video },
    { label: 'Profile', href: '/student/profile', icon: User },
    { label: 'History', href: '/student#history', icon: History },
  ],
  instructor: [
    { label: 'Home', href: '/home', icon: Sparkles },
    { label: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
    { label: 'My Sessions', href: '/instructor#sessions', icon: Video },
    { label: 'Videos', href: '/videos', icon: Video },
    { label: 'Schedule', href: '/instructor#schedule', icon: Clock },
    { label: 'Profile', href: '/instructor/profile', icon: User },
  ],
  admin: [
    { label: 'Events', href: '/admin/events', icon: Calendar },
    { label: 'Videos', href: '/videos', icon: Video },
  ],
  volunteer: [
    { label: 'Dashboard', href: '/volunteer', icon: LayoutDashboard },
    { label: 'Events', href: '/volunteer#events', icon: Calendar },
    { label: 'Videos', href: '/videos', icon: Video },
    { label: 'Schedule', href: '/volunteer#schedule', icon: Clock },
    { label: 'Volunteer', href: '/volunteer#volunteer', icon: Heart },
    { label: 'History', href: '/volunteer#history', icon: History },
  ],
  'associate-instructor': [
    { label: 'Dashboard', href: '/associate-instructor', icon: LayoutDashboard },
    { label: 'Attendance', href: '/associate-instructor#attendance', icon: UserCheck },
    { label: 'Volunteers', href: '/associate-instructor#volunteers', icon: Users },
    { label: 'Videos', href: '/videos', icon: Video },
    { label: 'Quiz', href: '/associate-instructor#quiz', icon: ClipboardList },
    { label: 'Registrants', href: '/associate-instructor#registrants', icon: FileText },
  ],
};

interface SidebarProps { role: UserRole; userName: string }

export default function Sidebar({ role, userName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const normalizedRole = (role?.toLowerCase() as UserRole) ?? 'student';
  const navItems = NAV_ITEMS[normalizedRole] ?? NAV_ITEMS.student;

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-[#13132A] border-r border-white/5 shrink-0 overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5 h-16">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Flourishing</p>
                <p className="text-[10px] text-white/40 leading-none mt-0.5">Hub • IITB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[4.5rem] z-10 w-6 h-6 rounded-full bg-[#1A1A2E] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-primary/50 transition-all"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 px-2 py-1.5 mb-2">
            Navigation
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (item.href.includes('#')) {
                  const [path, hash] = item.href.split('#');
                  if (window.location.pathname === path) {
                    e.preventDefault();
                    window.location.hash = hash;
                  }
                }
              }}
              className={cn('sidebar-item', isActive && 'active', collapsed && 'justify-center px-2')}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-white/50')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        {!collapsed && (
          <div className="glass rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{userName}</p>
                <p className="text-[10px] text-white/40 capitalize">{role.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn('sidebar-item w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10', collapsed && 'justify-center px-2')}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
