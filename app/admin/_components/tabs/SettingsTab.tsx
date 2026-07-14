'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import WipeEventsAndCoursesModal from '../modals/WipeEventsAndCoursesModal';

export default function SettingsTab() {
  const [showWipeModal, setShowWipeModal] = useState(false);

  return (
    <div id="settings" className="space-y-8">
      <div className="space-y-4">
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

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Delete or archive events &amp; courses</p>
              <p className="text-xs text-white/40 mt-0.5">
                Choose Events and/or Courses, then either permanently delete them (with their
                registrations/attendance/quiz data) or archive them (reversible, just hidden from active
                lists). Student and staff accounts are never affected.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWipeModal(true)}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Manage
          </button>
        </div>
      </div>

      <WipeEventsAndCoursesModal
        open={showWipeModal}
        onClose={() => setShowWipeModal(false)}
        onDeleted={() => toast.success('Refresh the page to see the cleared dashboard')}
      />
    </div>
  );
}
