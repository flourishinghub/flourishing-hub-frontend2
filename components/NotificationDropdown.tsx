'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, X, Info } from 'lucide-react';
import type { Notification } from '@/types';

interface NotificationDropdownProps {
  notifications: Notification[];
  open: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ notifications, open, onClose }: NotificationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: '#1A1A2E' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 text-white/20" />
                  <p className="text-xs text-white/40">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-white/5 last:border-0 transition-colors ${
                      !n.read ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type === 'reminder'
                            ? 'bg-yellow-500/15 text-yellow-400'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {n.type === 'reminder' ? (
                          <BellRing className="w-3.5 h-3.5" />
                        ) : (
                          <Info className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${!n.read ? 'text-white' : 'text-white/60'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-white/30 mt-1">{n.time}</p>
                      </div>
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-white/5">
              <button onClick={onClose} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mx-auto">
                <X className="w-3 h-3" /> Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
