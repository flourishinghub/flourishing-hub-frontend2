'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Video, BookOpen, TrendingUp, Upload, Plus, ShieldCheck, Activity,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCardSkeleton, ChartSkeleton } from '@/components/ui/skeleton';
import { mockAnalytics, recentActivity } from '@/lib/mockData';
import toast from 'react-hot-toast';

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: '#1A1A2E',
    border: '1px solid rgba(108,99,255,0.3)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
  },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#6C63FF' }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const data = mockAnalytics;

  useEffect(() => {
    setTimeout(() => setLoading(false), 900);
  }, []);

  return (
    <DashboardLayout expectedRole="admin">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm">Admin Control Panel</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">
              Flourishing Hub <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="green">Live Data</Badge>
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Students" value={data.totalStudents.toLocaleString()} trend={{ value: 12, label: 'vs last sem' }} icon={Users} color="purple" index={0} />
            <StatCard title="Total Workshops" value={data.totalWorkshops} trend={{ value: 8, label: 'vs last sem' }} icon={Video} color="teal" index={1} />
            <StatCard title="Active Courses" value={data.activeCourses} icon={BookOpen} color="yellow" index={2} />
            <StatCard title="Engagement Rate" value={`${data.engagementRate}%`} trend={{ value: 5, label: 'vs last sem' }} icon={TrendingUp} color="blue" index={3} />
          </>
        )}
      </div>

      {/* Main analytics + Activity feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Charts column */}
        <div className="xl:col-span-2 space-y-6" id="analytics">
          {/* Line Chart — Workshops per month */}
          {loading ? <ChartSkeleton /> : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">Workshops Conducted</h3>
                  <p className="text-xs text-white/40 mt-0.5">Monthly trend — Aug to Mar</p>
                </div>
                <Badge variant="purple">This Year</Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.workshopsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="workshops"
                    stroke="#6C63FF"
                    strokeWidth={2.5}
                    dot={{ fill: '#6C63FF', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#00C9A7' }}
                    name="Workshops"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Bar Chart — Engagement by Department */}
          {loading ? <ChartSkeleton /> : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">Student Engagement by Department</h3>
                  <p className="text-xs text-white/40 mt-0.5">Engagement % and student count</p>
                </div>
                <Badge variant="green">Current Sem</Badge>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.engagementByDept} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="dept" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                  <Bar dataKey="students" fill="#6C63FF" radius={[4, 4, 0, 0]} name="Students" />
                  <Bar dataKey="engagement" fill="#00C9A7" radius={[4, 4, 0, 0]} name="Engagement %" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Pie + Heatmap row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart — Programme Distribution */}
            {loading ? <ChartSkeleton /> : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-sm font-semibold text-white mb-6">Programme Distribution</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={data.programmeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.programmeDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {data.programmeDistribution.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                      <span className="text-xs text-white/50">{p.name}</span>
                      <span className="text-xs font-semibold text-white ml-auto">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Attendance Heatmap */}
            {loading ? <ChartSkeleton /> : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-sm font-semibold text-white mb-4">Attendance Heatmap</h3>
                <p className="text-xs text-white/40 mb-4">Session activity over last 12 weeks</p>
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
                  {data.attendanceHeatmap[0].map((_, col) => (
                    <div key={col} className="flex flex-col gap-1">
                      {data.attendanceHeatmap.map((row, rowIdx) => {
                        const count = row[col]?.count ?? 0;
                        const opacity = count > 40 ? 1 : count > 25 ? 0.7 : count > 10 ? 0.4 : 0.1;
                        return (
                          <div
                            key={rowIdx}
                            title={`${count} sessions`}
                            className="w-full aspect-square rounded-sm transition-all hover:scale-110 cursor-pointer"
                            style={{ background: `rgba(108, 99, 255, ${opacity})` }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-white/30">Less</span>
                  <div className="flex gap-1">
                    {[0.1, 0.3, 0.5, 0.7, 1].map((op) => (
                      <div key={op} className="w-3 h-3 rounded-sm" style={{ background: `rgba(108,99,255,${op})` }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-white/30">More</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right column — Activity + Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="default"
                className="w-full justify-start gap-2.5"
                onClick={() => toast.success('Import dialog opening...')}
              >
                <Upload className="w-4 h-4" /> Import Excel Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2.5"
                onClick={() => toast.success('Add event form opening...')}
              >
                <Plus className="w-4 h-4" /> Add New Event
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start gap-2.5"
                onClick={() => toast.success('Role assignment panel opening...')}
              >
                <ShieldCheck className="w-4 h-4" /> Assign Role
              </Button>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto no-scrollbar">
              {recentActivity.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-default"
                >
                  <span className="text-base mt-0.5 shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 leading-snug">{item.action}</p>
                    <p className="text-[10px] text-white/30 mt-1">{item.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
