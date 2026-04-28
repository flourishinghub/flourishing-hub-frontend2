'use client';

import { Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAvatarUrl, getRoleLabel } from '@/lib/utils';
import type { UserRole } from '@/types';
import { useState } from 'react';

interface NavbarProps {
  userName: string;
  role: UserRole;
  notifications?: number;
}

export default function Navbar({ userName, role, notifications = 3 }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0F0F1A]/80 backdrop-blur-xl sticky top-0 z-30"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="relative">
          <motion.div
            animate={{ width: searchOpen ? 280 : 40 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden h-9"
          >
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 text-white/40 hover:text-white transition-colors shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
            {searchOpen && (
              <input
                autoFocus
                placeholder="Search modules, events..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none pr-3"
                onBlur={() => setSearchOpen(false)}
              />
            )}
          </motion.div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
        >
          <Bell className="w-4 h-4" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {notifications}
            </span>
          )}
        </motion.button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white leading-none">{userName}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{getRoleLabel(role)}</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-glow-sm"
          >
            {userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
