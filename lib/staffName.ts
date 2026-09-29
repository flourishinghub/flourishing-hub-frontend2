// Facilitators are shown by first name only (mirrors the backend's
// utils/staffName.js). Analytics rows already arrive with the backend's
// resolved display name; this is for pages that read raw names themselves.

const HONORIFICS = new Set(['dr', 'prof', 'mr', 'mrs', 'ms', 'miss', 'shri', 'smt', 'sri']);

export function toFirstName(name?: string | null): string | null {
  if (!name) return null;
  const firsts = name
    .split(/\s*(?:,|&|\band\b)\s*/i)
    .map((person) =>
      person
        .trim()
        .split(/\s+/)
        .map((w) => w.replace(/[.,]/g, ''))
        .find((w) => w && !HONORIFICS.has(w.toLowerCase()))
    )
    .filter((w): w is string => Boolean(w))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return firsts.length ? firsts.join(', ') : null;
}

// An assigned account wins over the typed name for staff without an account.
export function staffFirstName(event: any, role: 'INSTRUCTOR' | 'ASSOCIATE_INSTRUCTOR'): string | null {
  const accountName = event?.assignments?.find((a: any) => a.role === role)?.user?.name;
  const typedName = role === 'INSTRUCTOR' ? event?.instructorName : event?.associateInstructorName;
  return toFirstName(accountName || typedName);
}
