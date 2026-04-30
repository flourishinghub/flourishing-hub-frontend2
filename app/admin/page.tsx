'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, Activity, Plus, X, Edit2, AlertTriangle,
  Wifi, WifiOff, Shield, Settings, Check,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import { mockEvents, mockMemberDirectory, recentActivity } from '@/lib/mockData';
import { formatDate, formatTime } from '@/lib/utils';
import type { Event, MemberDirectory, UserRole } from '@/types';
import toast from 'react-hot-toast';

type EventStatus = 'active' | 'archived' | 'draft';
type Tab = 'overview' | 'events' | 'members' | 'roles' | 'settings';

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  mode: 'Online' | 'Offline';
  capacity: string;
  status: EventStatus;
}

const emptyForm: EventFormData = {
  title: '', description: '', date: '', time: '',
  venue: '', mode: 'Offline', capacity: '', status: 'draft',
};

const ROLES: UserRole[] = ['student', 'instructor', 'admin', 'volunteer', 'associate-instructor'];

const statusColors: Record<EventStatus, string> = {
  active: 'badge-green',
  archived: 'bg-gray-500/15 text-gray-400 border border-gray-500/30 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
  draft: 'badge-yellow',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [members, setMembers] = useState<MemberDirectory[]>(mockMemberDirectory);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm);

  const activeEvent = events.find((e) => e.status === 'active');
  const totalVolunteers = members.filter((m) => m.role === 'volunteer').length;

  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      venue: event.venue,
      mode: event.mode,
      capacity: String(event.capacity),
      status: event.status,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title || !form.date || !form.time || !form.venue || !form.capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    let updatedEvents = [...events];

    if (form.status === 'active' && activeEvent && activeEvent.id !== editingEvent?.id) {
      updatedEvents = updatedEvents.map((e) =>
        e.id === activeEvent.id ? { ...e, status: 'archived' as EventStatus } : e
      );
    }

    if (editingEvent) {
      updatedEvents = updatedEvents.map((e) =>
        e.id === editingEvent.id
          ? { ...e, ...form, capacity: parseInt(form.capacity) }
          : e
      );
      toast.success('Event updated!');
    } else {
      const newEvent: Event = {
        id: `evt_${Date.now()}`,
        ...form,
        capacity: parseInt(form.capacity),
        registeredCount: 0,
        organizer: 'Admin',
      };
      updatedEvents = [...updatedEvents, newEvent];
      toast.success(form.status === 'active' ? 'Event published!' : 'Event saved as draft');
    }

    setEvents(updatedEvents);
    setShowModal(false);
    setEditingEvent(null);
    setForm(emptyForm);
  };

  const handleRoleChange = (memberId: string, newRole: UserRole) => {
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
    toast.success('Role updated successfully');
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          <span className="gradient-text">Admin</span> Dashboard
        </h1>
        <p className="text-sm text-white/50 mt-1">Flourishing Hub · IIT Bombay Wellness Center</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Members" value={members.length} icon={Users} color="purple" />
        <StatCard title="Active Event" value={activeEvent ? '1' : '0'} subtitle={activeEvent?.title ?? 'None'} icon={Activity} color="teal" />
        <StatCard title="Total Events" value={events.length} icon={Calendar} color="yellow" />
        <StatCard title="Volunteers" value={totalVolunteers} icon={Users} color="blue" />
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'text-white border-b-2 border-primary bg-primary/5'
                  : 'text-white/50 hover:text-white/80 border-b-2 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {activeEvent && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Currently Active Event</span>
                  </div>
                  <p className="text-base font-semibold text-white">{activeEvent.title}</p>
                  <p className="text-sm text-white/50 mt-0.5">
                    {formatDate(activeEvent.date)} · {formatTime(activeEvent.time)} · {activeEvent.venue}
                  </p>
                  <p className="text-xs text-white/40 mt-1">{activeEvent.registeredCount} / {activeEvent.capacity} registered</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-base">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 truncate">{item.action}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4" id="events">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">All Events</h3>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={openCreate}
                  className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" /> Create Event
                </motion.button>
              </div>

              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        event.status === 'active' ? 'bg-emerald-400' :
                        event.status === 'draft' ? 'bg-yellow-400' : 'bg-gray-500'
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{event.title}</p>
                          <span className={statusColors[event.status]}>{event.status}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            event.mode === 'Online'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                          }`}>
                            {event.mode === 'Online' ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                            {event.mode}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">
                          {formatDate(event.date)} · {formatTime(event.time)} · {event.venue}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          {event.registeredCount} / {event.capacity} registered
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEdit(event)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div id="members">
              <h3 className="text-sm font-semibold text-white mb-4">Member Directory</h3>
              <DataTable
                data={members.map((m) => ({
                  ...m,
                  yearDisplay: m.year ? `Year ${m.year}` : '—',
                  batchDisplay: m.batch ?? '—',
                  idDisplay: m.rollNo ?? m.empId ?? '—',
                })) as unknown as Record<string, unknown>[]}
                columns={[
                  { key: 'name', label: 'Name', sortable: true },
                  { key: 'idDisplay', label: 'ID' },
                  { key: 'department', label: 'Department', sortable: true },
                  { key: 'programme', label: 'Programme', sortable: true },
                  { key: 'yearDisplay', label: 'Year' },
                  {
                    key: 'role', label: 'Role',
                    render: (row) => {
                      const r = (row as unknown as MemberDirectory & { yearDisplay: string; batchDisplay: string; idDisplay: string });
                      return (
                        <span className={
                          r.role === 'admin' ? 'badge-red' :
                          r.role === 'instructor' ? 'badge-purple' :
                          r.role === 'volunteer' ? 'badge-green' :
                          r.role === 'associate-instructor' ? 'badge-yellow' : 'badge-purple'
                        }>
                          {r.role}
                        </span>
                      );
                    },
                  },
                ]}
                searchKeys={['name', 'department', 'programme'] as never[]}
                searchPlaceholder="Search members..."
                emptyMessage="No members found"
              />
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div id="roles">
              <h3 className="text-sm font-semibold text-white mb-4">Dynamic Role Management</h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="text-sm font-medium text-white">{member.name}</p>
                      <p className="text-xs text-white/40">{member.email}</p>
                    </div>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                      className="input-dark px-3 py-1.5 rounded-lg text-xs min-w-[160px]"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div id="settings" className="space-y-4">
              <h3 className="text-sm font-semibold text-white mb-4">Platform Settings</h3>
              {[
                { label: 'Allow self-registration', description: 'Students can register for events themselves' },
                { label: 'Email notifications', description: 'Send reminders via email' },
                { label: 'Volunteer opt-in', description: 'Allow volunteers to self-select events' },
              ].map(({ label, description }) => (
                <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{description}</p>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-primary/30 flex items-center px-1 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-primary shadow" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ background: '#1A1A2E' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-base font-semibold text-white">
                  {editingEvent ? 'Edit Event' : 'Create Event'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Warning Banner */}
                {form.status === 'active' && activeEvent && activeEvent.id !== editingEvent?.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
                  >
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-yellow-400">Active Event Conflict</p>
                      <p className="text-xs text-yellow-400/80 mt-0.5">
                        ⚠️ <strong>{activeEvent.title}</strong> is currently active. Publishing this will archive it.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Event Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Wellness Wednesday"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Event description..."
                    rows={3}
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Time *</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Venue *</label>
                  <input
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g. LT 101, Lecture Complex"
                    className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Mode</label>
                    <div className="flex gap-2">
                      {(['Online', 'Offline'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForm({ ...form, mode: m })}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            form.mode === m
                              ? m === 'Online'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                : 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                              : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {m === 'Online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Capacity *</label>
                    <input
                      type="number"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      placeholder="e.g. 60"
                      min="1"
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Status</label>
                  <div className="flex gap-2">
                    {([
                      { val: 'draft' as EventStatus, label: 'Draft', cls: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
                      { val: 'active' as EventStatus, label: 'Publish (Active)', cls: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
                      { val: 'archived' as EventStatus, label: 'Archive', cls: 'border-gray-500/40 text-gray-400 bg-gray-500/10' },
                    ]).map(({ val, label, cls }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm({ ...form, status: val })}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          form.status === val ? cls : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {form.status === val && <Check className="w-3 h-3" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold"
                >
                  {form.status === 'active' ? 'Publish Event' : 'Save Event'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
