'use client';

export default function SettingsTab() {
  return (
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
  );
}
