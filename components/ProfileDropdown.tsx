'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Badge as BadgeIcon, Building, GraduationCap, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { getInitials, getRoleLabel } from '@/lib/utils';
import type { AuthPayload } from '@/types';

interface ProfileDropdownProps {
  user: AuthPayload;
  open: boolean;
  onClose: () => void;
}

export default function ProfileDropdown({ user, open, onClose }: ProfileDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const fields = [
    user.rollNo && { icon: BadgeIcon, label: 'Roll No', value: user.rollNo },
    user.empId && { icon: BadgeIcon, label: 'Emp ID', value: user.empId },
    user.department && { icon: Building, label: 'Department', value: user.department },
    user.programme && { icon: GraduationCap, label: 'Programme', value: user.programme },
    user.year && { icon: GraduationCap, label: 'Year', value: `Year ${user.year}` },
    { icon: Mail, label: 'Email', value: user.email },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  return (
    <div ref={ref} className="relative">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: '#1A1A2E' }}
          >
            <div className="px-5 py-4 bg-gradient-to-br from-primary/10 to-accent/5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-base font-bold text-white shadow-glow-sm">
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{user.name}</p>
                  <p className="text-[11px] text-white/50 mt-0.5">{getRoleLabel(user.role)}</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 space-y-2.5">
              {fields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white/30" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-white/30 leading-none">{label}</p>
                    <p className="text-xs text-white/80 mt-0.5 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
