'use client';

import { toFirstName } from '@/lib/staffName';

interface StaffPickerProps {
  label: string;
  accounts: any[];
  accountId: string;
  typedName: string;
  onChange: (accountId: string, typedName: string) => void;
}

// Pick a staff account, or — for a facilitator with no account — type their
// full name. The two are exclusive: choosing an account clears the typed name.
// Only the first name is shown across the site; the full name is kept so two
// people sharing a first name can still be told apart.
export default function StaffPicker({ label, accounts, accountId, typedName, onChange }: StaffPickerProps) {
  const firstName = toFirstName(typedName);
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/60 block">{label}</label>
      {accounts.length > 0 && (
        <select
          value={accountId}
          onChange={(e) => onChange(e.target.value, e.target.value ? '' : typedName)}
          className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
        >
          <option value="">— No account / type name below —</option>
          {accounts.map((m: any) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}
      {!accountId && (
        <div>
          <input
            value={typedName}
            onChange={(e) => onChange('', e.target.value)}
            placeholder={`${label} full name (first + last), if no account`}
            className="input-dark w-full px-4 py-2.5 rounded-xl text-sm"
          />
          {firstName && (
            <p className="text-[10px] text-white/40 mt-1">Shown on the site as: {firstName}</p>
          )}
        </div>
      )}
    </div>
  );
}
