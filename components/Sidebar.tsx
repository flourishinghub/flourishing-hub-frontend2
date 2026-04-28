'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';
import {
  LayoutDashboard, BookOpen, Calendar, Clock, History, Users,
  Video, BarChart3, GraduationCap, Settings, Heart, ChevronLeft,
  ChevronRight, Activity, FileText, ClipboardList, Star, ShieldCheck,
  Sparkles, LogOut, UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  student: [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'My Modules', href: '/student#modules', icon: BookOpen },
    { label: 'Events', href: '/student#events', icon: Calendar },
    { label: 'Schedule', href: '/student#schedule', icon: Clock },
    { label: 'History', href: '/student#history', icon: History },
  ],
  instructor: [
    { label: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
    { label: 'My Sessions', href: '/instructor#sessions', icon: Video },
    { label: 'Participants', href: '/instructor#participants', icon: Users },
    { label: 'Schedule', href: '/instructor#schedule', icon: Calendar },
  ],
  admin: [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Analytics', href: '/admin#analytics', icon: BarChart3 },
    { label: 'Students', href: '/admin#students', icon: GraduationCap },
    { label: 'Workshops', href: '/admin#workshops', icon: Video },
    { label: 'Courses', href: '/admin#courses', icon: BookOpen },
    { label: 'Events', href: '/admin#events', icon: Calendar },
    { label: 'Roles', href: '/admin#roles', icon: ShieldCheck },
    { label: 'Settings', href: '/admin#settings', icon: Settings },
  ],
  volunteer: [
    { label: 'Dashboard', href: '/volunteer', icon: LayoutDashboard },
    { label: 'My Modules', href: '/volunteer#modules', icon: BookOpen },
    { label: 'Events', href: '/volunteer#events', icon: Calendar },
    { label: 'Volunteer', href: '/volunteer#volunteer', icon: Heart },
    { label: 'History', href: '/volunteer#history', icon: History },
  ],
  'associate-instructor': [
    { label: 'Dashboard', href: '/associate-instructor', icon: LayoutDashboard },
    { label: 'Attendance', href: '/associate-instructor#attendance', icon: UserCheck },
    { label: 'Quizzes', href: '/associate-instructor#quizzes', icon: ClipboardList },
    { label: 'Registrants', href: '/associate-instructor#registrants', icon: Users },
  ],
};

interface SidebarProps {
  role: UserRole;
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const navItems = NAV_ITEMS[role] ?? NAV_ITEMS.student;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

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
              className={cn(
                'sidebar-item',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )}
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
          className={cn(
            'sidebar-item w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
