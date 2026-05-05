/**
 * Safe date utilities to handle timezone issues
 * Prevents LIVE event logic from breaking due to timezone mismatches
 */

export function isEventLive(eventStartAt: string, durationHours: number = 2): boolean {
  const eventStart = new Date(eventStartAt);
  const eventEnd = new Date(eventStart.getTime() + durationHours * 60 * 60 * 1000);
  const now = new Date();
  
  // Use ISO strings for consistent timezone-safe comparison
  const nowISO = now.toISOString();
  const startISO = eventStart.toISOString();
  const endISO = eventEnd.toISOString();
  
  return nowISO >= startISO && nowISO <= endISO;
}

export function isEventUpcoming(eventStartAt: string): boolean {
  const eventStart = new Date(eventStartAt);
  const now = new Date();
  
  // Use ISO strings for consistent timezone-safe comparison
  return now.toISOString() < eventStart.toISOString();
}

export function isEventPast(eventStartAt: string): boolean {
  const eventStart = new Date(eventStartAt);
  const now = new Date();
  
  // Use ISO strings for consistent timezone-safe comparison
  return now.toISOString() > eventStart.toISOString();
}