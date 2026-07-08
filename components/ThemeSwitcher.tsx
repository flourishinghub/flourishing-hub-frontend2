'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Check } from 'lucide-react';
import { useTheme, type ThemeName } from '@/components/ThemeProvider';

const THEMES: { value: ThemeName; label: string; swatch: string }[] = [
  { value: 'dark', label: 'Dark', swatch: '#0F0F1A' },
  { value: 'light-1', label: 'Light — Clean White', swatch: '#F7F7FB' },
  { value: 'light-2', label: 'Light — Soft Lavender', swatch: '#F1EEFB' },
  { value: 'light-3', label: 'Light — Warm Cream', swatch: '#FBF6EE' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
        title="Change theme"
      >
        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 w-56 z-50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: 'rgb(var(--color-card))' }}
          >
            <div className="px-4 py-3 border-b border-white/5">
              <span className="text-sm font-semibold text-white">Appearance</span>
            </div>
            <div className="p-2 space-y-1">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setTheme(t.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    theme === t.value ? 'bg-primary/15 text-primary' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ background: t.swatch }} />
                  <span className="flex-1 text-left">{t.label}</span>
                  {theme === t.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
