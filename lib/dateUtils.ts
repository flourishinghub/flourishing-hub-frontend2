/**
 * Safe date utilities to handle timezone issues
 * Prevents LIVE event logic from breaking due to timezone mismatches
 */

// Formats a Date using its LOCAL calendar day (not UTC), so it matches how
// date-fns calendar widgets (which build local-midnight Date objects) key their days.
// Using `.toISOString()` here would shift the date backwards by one day for any
// timezone ahead of UTC (e.g. IST) whenever the time component isn't UTC midnight.
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isEventLive(eventStartAt: string, eventEndAt?: string | null, durationHours: number = 2): boolean {
  const eventStart = new Date(eventStartAt);
  const eventEnd = eventEndAt
    ? new Date(eventEndAt)
    : new Date(eventStart.getTime() + durationHours * 60 * 60 * 1000);
  const now = new Date();
  return now >= eventStart && now <= eventEnd;
}

export function isEventUpcoming(eventStartAt: string): boolean {
  return new Date() < new Date(eventStartAt);
}

// Registration is open before start and up to `graceMins` after the event starts.
export function isRegistrationOpen(eventStartAt: string, graceMins = 15): boolean {
  const deadline = new Date(new Date(eventStartAt).getTime() + graceMins * 60 * 1000);
  return new Date() <= deadline;
}

export function isEventPast(eventStartAt: string, eventEndAt?: string | null): boolean {
  const endTime = eventEndAt
    ? new Date(eventEndAt)
    : new Date(new Date(eventStartAt).getTime() + 2 * 60 * 60 * 1000);
  return new Date() > endTime;
}

// Returns true from startAt until endAt + 45-min grace window
export function isEventLiveOrGrace(eventStartAt: string, eventEndAt?: string | null, graceMins = 45, durationHours = 2): boolean {
  const eventStart = new Date(eventStartAt);
  const eventEnd = eventEndAt
    ? new Date(eventEndAt)
    : new Date(eventStart.getTime() + durationHours * 60 * 60 * 1000);
  const graceEnd = new Date(eventEnd.getTime() + graceMins * 60 * 1000);
  const now = new Date();
  return now >= eventStart && now <= graceEnd;
}

// Locks the quiz link until the halfway point of the session — true starting
// at eventStartAt + (eventEndAt - eventStartAt) / 2. A fixed "N minutes
// before end" gate breaks for short sessions (e.g. a 10-min session would
// unlock before it even started), so the gate is a fraction of the actual
// duration instead. Returns true (i.e. does not lock) when either end is
// unknown, since there's no window to gate against.
export function isPastEventMidpoint(eventStartAt?: string | null, eventEndAt?: string | null): boolean {
  if (!eventStartAt || !eventEndAt) return true;
  const start = new Date(eventStartAt).getTime();
  const end = new Date(eventEndAt).getTime();
  const midpoint = start + (end - start) / 2;
  return Date.now() >= midpoint;
}

// Returns true only during the 45-min window after endAt
export function isGracePeriodActive(eventEndAt?: string | null, graceMins = 45): boolean {
  if (!eventEndAt) return false;
  const eventEnd = new Date(eventEndAt);
  const graceEnd = new Date(eventEnd.getTime() + graceMins * 60 * 1000);
  const now = new Date();
  return now > eventEnd && now <= graceEnd;
}

// Seconds remaining in the grace window (0 if expired)
export function getGraceSecondsRemaining(eventEndAt?: string | null, graceMins = 45): number {
  if (!eventEndAt) return 0;
  const graceEnd = new Date(new Date(eventEndAt).getTime() + graceMins * 60 * 1000);
  return Math.max(0, Math.floor((graceEnd.getTime() - Date.now()) / 1000));
}