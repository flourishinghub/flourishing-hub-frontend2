'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email address'); return; }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong');
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-8">
          <Logo className="w-8 h-8 rounded-xl" />
          <p className="font-bold text-white">Flourishing Hub</p>
        </div>

        {sent ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
            <p className="text-sm text-white/50 mb-1">
              If <span className="text-white/80">{email}</span> is registered, you'll receive a password reset link shortly.
            </p>
            <p className="text-xs text-white/30 mb-6">The link expires in 15 minutes.</p>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-1">Forgot your password?</h2>
            <p className="text-sm text-white/50 mb-8">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@iitb.ac.in"
                    className="input-dark w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-primary w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Send className="w-4 h-4" /> Send Reset Link</>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
