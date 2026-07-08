/**
 * Reusable registration filtering logic
 * Eliminates duplicate code across dashboard and events page
 */

export function getActiveRegistrations(registrations: any[]) {
  return registrations.filter(reg => 
    reg.status === 'REGISTERED' && reg.event && reg.eventId
  );
}

export function getCompletedRegistrations(registrations: any[]) {
  return registrations.filter(reg =>
    reg.status === 'ATTENDED' && reg.event && reg.eventId
  );
}

export function getRegistrationMetrics(registrations: any[]) {
  const active = getActiveRegistrations(registrations);
  const completed = getCompletedRegistrations(registrations);
  
  return {
    active,
    completed,
    totalParticipations: active.length + completed.length,
    activeCount: active.length,
    completedCount: completed.length
  };
}

// "Registered" here means "still shows a Registered/checked-in badge for this
// event" — includes ATTENDED, unlike getActiveRegistrations (which is
// REGISTERED-only, for the separate active-vs-completed stats split). Keeping
// ATTENDED out of this list would make a checked-in student's badge/filter
// state disappear from the dashboard and events list while the event detail
// page (which checks REGISTERED || ATTENDED) still shows them as registered.
export function getRegisteredEventIds(registrations: any[]) {
  return registrations
    .filter(reg => (reg.status === 'REGISTERED' || reg.status === 'ATTENDED') && reg.eventId)
    .map(reg => reg.eventId);
}