'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight, Shield, Heart, Brain } from 'lucide-react';
import { mockLogin } from '@/lib/auth';
import { getRolePath } from '@/lib/utils';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: Brain, text: 'Track your wellness journey' },
  { icon: Heart, text: 'Attend mindfulness workshops' },
  { icon: Shield, text: 'Secure & private platform' },
];

const FLOATING_WORDS = ['Mindfulness', 'Resilience', 'Growth', 'Clarity', 'Balance', 'Joy', 'Flourish'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % FLOATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const validateEmail = (val: string) => {
    if (!val) { setEmailError(''); return; }
    if (!val.includes('@')) { setEmailError('Enter a valid email address'); return; }
    if (!val.endsWith('@iitb.ac.in')) {
      setEmailError('Only @iitb.ac.in email addresses are allowed');
    } else {
      setEmailError('');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    validateEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (emailError) {
      toast.error('Please use your @iitb.ac.in email');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const payload = mockLogin(email, password);
      toast.success(`Welcome back, ${payload.name.split(' ')[0]}! 🎉`);
      setTimeout(() => router.push(getRolePath(payload.role)), 500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Panel */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-[55%] relative flex-col items-center justify-center p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 50%, #13132A 100%)' }}
      >
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[80px]"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[60px]"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"
          />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(108,99,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,1) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent mx-auto mb-6 flex items-center justify-center shadow-glow-primary"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl font-black text-white mb-2"
          >
            Flourishing
            <br />
            <span className="gradient-text">Hub</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-white/40 text-sm mb-8"
          >
            IIT Bombay Student Wellness Center
          </motion.p>

          {/* Animated tagline word */}
          <div className="h-12 flex items-center justify-center mb-8">
            <AnimatePresence mode="wait">
              <motion.span
                key={FLOATING_WORDS[wordIndex]}
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold gradient-text"
              >
                {FLOATING_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-center gap-3 glass rounded-xl px-4 py-3 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center shrink-0">
                  <feat.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-white/70">{feat.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 text-xs text-white/20"
          >
            A ₹2,00,000 investment in your wellbeing
          </motion.p>
        </div>
      </motion.div>

      {/* Right Panel — Login Form */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center p-8 bg-[#0F0F1A]"
      >
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Flourishing Hub</p>
              <p className="text-xs text-white/40">IIT Bombay</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-white/40 text-sm mb-8">
              Sign in with your IITB account to continue your wellness journey
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="yourname@iitb.ac.in"
                    className={`input-dark w-full h-12 pl-10 pr-4 rounded-xl text-sm ${emailError ? 'border-red-500/60' : ''}`}
                    autoComplete="email"
                  />
                </div>
                <AnimatePresence>
                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-400 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {emailError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-dark w-full h-12 pl-10 pr-12 rounded-xl text-sm"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demo hint */}
              <div className="glass rounded-xl p-3 text-xs text-white/40 space-y-1">
                <p className="font-medium text-white/50">Demo login hints:</p>
                <p>· <span className="text-primary/70">student@iitb.ac.in</span> → Student dashboard</p>
                <p>· <span className="text-primary/70">instructor@iitb.ac.in</span> → Instructor dashboard</p>
                <p>· <span className="text-primary/70">admin@iitb.ac.in</span> → Admin dashboard</p>
                <p>· <span className="text-primary/70">volunteer@iitb.ac.in</span> → Volunteer dashboard</p>
                <p>· <span className="text-primary/70">associate@iitb.ac.in</span> → Associate dashboard</p>
                <p className="text-white/25 mt-1">Any password works in demo mode</p>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || !!emailError || !email || !password}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full h-12 btn-primary rounded-xl flex items-center justify-center gap-2 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Flourishing Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="text-center text-xs text-white/25 mt-6">
              Secured by IIT Bombay SSO · Student Wellness Center © 2024
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
