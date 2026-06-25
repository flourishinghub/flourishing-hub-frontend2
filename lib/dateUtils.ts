/**
 * Safe date utilities to handle timezone issues
 * Prevents LIVE event logic from breaking due to timezone mismatches
 */

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

// Returns true from startAt until endAt + 30-min grace window
export function isEventLiveOrGrace(eventStartAt: string, eventEndAt?: string | null, graceMins = 30, durationHours = 2): boolean {
  const eventStart = new Date(eventStartAt);
  const eventEnd = eventEndAt
    ? new Date(eventEndAt)
    : new Date(eventStart.getTime() + durationHours * 60 * 60 * 1000);
  const graceEnd = new Date(eventEnd.getTime() + graceMins * 60 * 1000);
  const now = new Date();
  return now >= eventStart && now <= graceEnd;
}

// Returns true only during the 30-min window after endAt
export function isGracePeriodActive(eventEndAt?: string | null, graceMins = 30): boolean {
  if (!eventEndAt) return false;
  const eventEnd = new Date(eventEndAt);
  const graceEnd = new Date(eventEnd.getTime() + graceMins * 60 * 1000);
  const now = new Date();
  return now > eventEnd && now <= graceEnd;
}

// Seconds remaining in the grace window (0 if expired)
export function getGraceSecondsRemaining(eventEndAt?: string | null, graceMins = 30): number {
  if (!eventEndAt) return 0;
  const graceEnd = new Date(new Date(eventEndAt).getTime() + graceMins * 60 * 1000);
  return Math.max(0, Math.floor((graceEnd.getTime() - Date.now()) / 1000));
}