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

export function isEventPast(eventStartAt: string, eventEndAt?: string | null): boolean {
  const endTime = eventEndAt
    ? new Date(eventEndAt)
    : new Date(new Date(eventStartAt).getTime() + 2 * 60 * 60 * 1000);
  return new Date() > endTime;
}