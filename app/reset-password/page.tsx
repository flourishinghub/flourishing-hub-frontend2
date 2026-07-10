'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [paramError, setParamError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    const u = params.get('userId');
    if (t && u) {
      setToken(t);
      setUserId(u);
    } else {
      setParamError(true);
    }
  }, []);

  const passwordValid = newPassword.length >= 8
    && /[A-Z]/.test(newPassword)
    && /[a-z]/.test(newPassword)
    && /[0-9]/.test(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { toast.error('Please fill in all fields'); return; }
    if (!passwordValid) {
      toast.error('Password must be at least 8 characters with an uppercase, lowercase, and number');
      return;
    }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password');
      setDone(true);
      setTimeout(() => router.push('/login?reset=true'), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (paramError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark p-6">
        <div className="w-full max-w-md glass-card rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-white/50 mb-6">This reset link is missing required parameters. Please request a new one.</p>
          <Link href="/forgot-password" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

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

        {done ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
            <p className="text-sm text-white/50 mb-1">Your password has been updated successfully.</p>
            <p className="text-xs text-white/30">Redirecting to login in 3 seconds…</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-1">Set new password</h2>
            <p className="text-sm text-white/50 mb-8">Choose a strong password for your account.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-dark w-full pl-10 pr-10 py-3 rounded-xl text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && !passwordValid && (
                  <p className="text-xs text-amber-400 mt-1">Must be 8+ chars with uppercase, lowercase, and a number</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-dark w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
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
                  'Reset Password'
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
